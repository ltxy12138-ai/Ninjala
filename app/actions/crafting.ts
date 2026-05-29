"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { getMaterialName } from "@/data/materials";
import {
  buildBulkDismantleLogMessage,
  buildCraftLogMessage,
  buildDismantleLogMessage,
  buildForgeLogMessage,
  buildReforgeLogMessage,
  canAffordIngredients,
  getBulkDismantlePreview,
  getDismantlePreview,
  getForgePreview,
  getMaterialRecipeById,
  getReforgePreview,
} from "@/lib/game/crafting";
import { calculatePowerFromEquippedItems } from "@/lib/game/equipment";
import { applyEnhancementLevels } from "@/lib/game/enhancement";
import { normalizeStoredItemSlot } from "@/lib/game/item-slot";
import {
  generateEquipmentDropForSlot,
  generateReforgedEquipment,
  rollRarity,
} from "@/lib/game/loot";
import {
  getHighestUnlockedRegionId,
  normalizeUnlockedRegionIds,
} from "@/lib/game/progression";
import { getRegionById } from "@/lib/game/regions";
import { getLocale } from "@/lib/i18n";
import { itemSlots, type ItemRarity, type ItemSlot } from "@/lib/game/types";
import { requireCurrentPlayer } from "@/lib/player";

type ItemSnapshot = {
  id: string;
  playerId: string;
  baseItemId: string;
  sourceRegionId: string;
  name: string;
  slot: string;
  rarity: string;
  enhancementLevel: number;
  attack: number;
  defense: number;
  hp: number;
  luck: number;
  crit: number;
  goldBonus: number;
  expBonus: number;
  dropBonus: number;
  equippedAt: Date | null;
  equipSlotIndex: number | null;
};

function buildInventoryRedirectUrl(
  values: Record<string, string | number | null | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();

  return query ? `/inventory?${query}` : "/inventory";
}

function getInventoryContextFromFormData(formData: FormData) {
  return {
    tab: String(formData.get("tab") ?? ""),
    page: String(formData.get("page") ?? ""),
    selected: String(formData.get("selected") ?? ""),
  };
}

function revalidateInventoryPages() {
  revalidatePath("/inventory");
  revalidatePath("/characters");
  revalidatePath("/logs");
  revalidatePath("/boss");
  revalidatePath("/rankings");
}

function toEquippedSnapshot(items: ItemSnapshot[]) {
  return items.map((item) => ({
    ...item,
    slot: normalizeStoredItemSlot(item.slot, item.baseItemId),
  }));
}

async function recalculatePower(
  tx: Prisma.TransactionClient,
  playerId: string,
  items: ItemSnapshot[],
) {
  const powerResult = calculatePowerFromEquippedItems(
    toEquippedSnapshot(items),
  );

  await tx.player.update({
    where: { id: playerId },
    data: {
      power: powerResult.power,
    },
  });
}

export async function craftMaterialAction(formData: FormData) {
  const [{ player }, locale] = await Promise.all([
    requireCurrentPlayer(),
    getLocale(),
  ]);
  const context = getInventoryContextFromFormData(formData);
  const recipeId = String(formData.get("recipeId") ?? "");
  const db = getDb();

  const result = await db.$transaction(async (tx) => {
    const recipe = getMaterialRecipeById(recipeId);

    if (!recipe) {
      return { ok: false as const, reason: "missing_recipe" };
    }

    const stacks = await tx.materialStack.findMany({
      where: { playerId: player.id },
    });
    const amounts = new Map(
      stacks.map((stack) => [stack.materialId, stack.amount]),
    );
    const canCraft = recipe.ingredients.every(
      (ingredient) =>
        (amounts.get(ingredient.materialId) ?? 0) >= ingredient.amount,
    );

    if (!canCraft) {
      return { ok: false as const, reason: "insufficient_material" };
    }

    for (const ingredient of recipe.ingredients) {
      await tx.materialStack.update({
        where: {
          playerId_materialId: {
            playerId: player.id,
            materialId: ingredient.materialId,
          },
        },
        data: {
          amount: {
            decrement: ingredient.amount,
          },
        },
      });
    }

    await tx.materialStack.upsert({
      where: {
        playerId_materialId: {
          playerId: player.id,
          materialId: recipe.output.materialId,
        },
      },
      update: {
        amount: {
          increment: recipe.output.amount,
        },
      },
      create: {
        playerId: player.id,
        materialId: recipe.output.materialId,
        amount: recipe.output.amount,
      },
    });

    await tx.gameLog.create({
      data: {
        playerId: player.id,
        type: "MATERIAL_CRAFT",
        message: buildCraftLogMessage(recipe, locale),
        payload: JSON.stringify({
          materials: [recipe.output],
          ingredients: recipe.ingredients,
          output: recipe.output,
        }),
      },
    });

    return { ok: true as const, reason: "crafted" };
  });

  revalidateInventoryPages();

  redirect(
    buildInventoryRedirectUrl({
      ...context,
      craft: result.ok ? "success" : "error",
      detail: result.reason,
    }),
  );
}

export async function forgeItemAction(formData: FormData) {
  const [{ player }, locale] = await Promise.all([
    requireCurrentPlayer(),
    getLocale(),
  ]);
  const context = getInventoryContextFromFormData(formData);
  const slot = String(formData.get("slot") ?? "") as ItemSlot;
  const db = getDb();

  if (!itemSlots.includes(slot)) {
    redirect(
      buildInventoryRedirectUrl({
        ...context,
        forge: "error",
        detail: "invalid_slot",
      }),
    );
  }

  const result = await db.$transaction(async (tx) => {
    const dbPlayer = await tx.player.findUnique({
      where: { id: player.id },
      select: {
        id: true,
        gold: true,
        currentRegionId: true,
        unlockedRegions: {
          select: {
            regionId: true,
          },
        },
      },
    });

    if (!dbPlayer) {
      return { ok: false as const, reason: "missing_player" };
    }

    const unlockedRegionIds = normalizeUnlockedRegionIds(
      dbPlayer.unlockedRegions.map((row) => row.regionId),
      dbPlayer.currentRegionId,
    );
    const highestUnlockedRegionId = getHighestUnlockedRegionId(
      unlockedRegionIds,
      dbPlayer.currentRegionId,
    );
    const region = getRegionById(highestUnlockedRegionId);

    if (!region) {
      return { ok: false as const, reason: "missing_region" };
    }

    const preview = getForgePreview(region, slot, locale);

    if (dbPlayer.gold < preview.goldCost) {
      return { ok: false as const, reason: "insufficient_gold" };
    }

    const stacks = await tx.materialStack.findMany({
      where: { playerId: player.id },
    });
    const amounts = new Map(
      stacks.map((stack) => [stack.materialId, stack.amount]),
    );

    if (!canAffordIngredients(preview.ingredients, amounts)) {
      return { ok: false as const, reason: "insufficient_material" };
    }

    for (const ingredient of preview.ingredients) {
      await tx.materialStack.update({
        where: {
          playerId_materialId: {
            playerId: player.id,
            materialId: ingredient.materialId,
          },
        },
        data: {
          amount: {
            decrement: ingredient.amount,
          },
        },
      });
    }

    // Forge rarity: 90% common, 8% rare, 1.5% epic, 0.5% legendary
    const forgeRarityWeights: Record<ItemRarity, number> = {
      common: 90,
      rare: 8,
      epic: 1.5,
      legendary: 0.5,
    };
    let forgedRarity = rollRarity(forgeRarityWeights, Math.random);

    // 5% extra affix chance — upgrade rarity one tier
    const rarityOrder: ItemRarity[] = ["common", "rare", "epic", "legendary"];
    if (Math.random() < 0.05) {
      const currentIndex = rarityOrder.indexOf(forgedRarity);
      if (currentIndex < rarityOrder.length - 1) {
        forgedRarity = rarityOrder[currentIndex + 1];
      }
    }

    const forgedItem = generateEquipmentDropForSlot(
      region.dropTableId,
      slot,
      Math.random,
      locale,
      {},
      { forcedRarity: forgedRarity },
    );

    await tx.player.update({
      where: { id: player.id },
      data: {
        gold: {
          decrement: preview.goldCost,
        },
      },
    });

    await tx.itemInstance.create({
      data: {
        playerId: player.id,
        baseItemId: forgedItem.baseItemId,
        sourceRegionId: region.id,
        name: forgedItem.name,
        slot: forgedItem.slot,
        rarity: forgedItem.rarity,
        enhancementLevel: 0,
        attack: forgedItem.stats.attack,
        defense: forgedItem.stats.defense,
        hp: forgedItem.stats.hp,
        luck: forgedItem.stats.luck,
        crit: forgedItem.stats.crit,
        goldBonus: forgedItem.stats.goldBonus,
        expBonus: forgedItem.stats.expBonus,
        dropBonus: forgedItem.stats.dropBonus,
        affixIds: JSON.stringify(forgedItem.affixIds),
        affixStats: JSON.stringify(forgedItem.affixStats),
      },
    });

    await tx.gameLog.create({
      data: {
        playerId: player.id,
        type: "EQUIPMENT_FORGE",
        message: buildForgeLogMessage(forgedItem.name, preview, locale),
        payload: JSON.stringify({
          materials: [],
          items: [
            {
              name: forgedItem.name,
              slot: forgedItem.slot,
              rarity: forgedItem.rarity,
            },
          ],
          regionId: region.id,
          regionName: preview.regionName,
          goldCost: preview.goldCost,
          ingredients: preview.ingredients,
        }),
      },
    });

    return {
      ok: true as const,
      reason: "forged",
    };
  });

  revalidateInventoryPages();

  redirect(
    buildInventoryRedirectUrl({
      ...context,
      forge: result.ok ? "success" : "error",
      detail: result.reason,
    }),
  );
}

export async function reforgeItemAction(formData: FormData) {
  const [{ player }, locale] = await Promise.all([
    requireCurrentPlayer(),
    getLocale(),
  ]);
  const context = getInventoryContextFromFormData(formData);
  const itemId = String(formData.get("itemId") ?? "");
  const db = getDb();

  const result = await db.$transaction(async (tx) => {
    const dbPlayer = await tx.player.findUnique({
      where: { id: player.id },
      select: {
        id: true,
        gold: true,
      },
    });

    if (!dbPlayer) {
      return { ok: false as const, reason: "missing_player" };
    }

    const items = await tx.itemInstance.findMany({
      where: { playerId: player.id },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    const targetItem = items.find((item) => item.id === itemId);

    if (!targetItem) {
      return { ok: false as const, reason: "missing_item" };
    }

    const region = getRegionById(targetItem.sourceRegionId);

    if (!region) {
      return { ok: false as const, reason: "missing_region" };
    }

    const preview = getReforgePreview({
      id: targetItem.id,
      name: targetItem.name,
      sourceRegionId: targetItem.sourceRegionId,
      rarity: targetItem.rarity as "common" | "rare" | "epic" | "legendary",
      enhancementLevel: targetItem.enhancementLevel,
    });

    if (dbPlayer.gold < preview.goldCost) {
      return { ok: false as const, reason: "insufficient_gold" };
    }

    const stacks = await tx.materialStack.findMany({
      where: { playerId: player.id },
    });
    const amounts = new Map(
      stacks.map((stack) => [stack.materialId, stack.amount]),
    );

    if (!canAffordIngredients(preview.ingredients, amounts)) {
      return { ok: false as const, reason: "insufficient_material" };
    }

    for (const ingredient of preview.ingredients) {
      await tx.materialStack.update({
        where: {
          playerId_materialId: {
            playerId: player.id,
            materialId: ingredient.materialId,
          },
        },
        data: {
          amount: {
            decrement: ingredient.amount,
          },
        },
      });
    }

    await tx.player.update({
      where: { id: player.id },
      data: {
        gold: {
          decrement: preview.goldCost,
        },
      },
    });

    const reforged = generateReforgedEquipment(
      {
        dropTableId: region.dropTableId,
        baseItemId: targetItem.baseItemId,
        rarity: targetItem.rarity as "common" | "rare" | "epic" | "legendary",
      },
      Math.random,
      locale,
    );
    const nextStats = applyEnhancementLevels(
      reforged.stats,
      targetItem.enhancementLevel,
    );

    await tx.itemInstance.update({
      where: { id: targetItem.id },
      data: {
        name: reforged.name,
        attack: nextStats.attack,
        defense: nextStats.defense,
        hp: nextStats.hp,
        luck: nextStats.luck,
        crit: nextStats.crit,
        goldBonus: nextStats.goldBonus,
        expBonus: nextStats.expBonus,
        dropBonus: nextStats.dropBonus,
        affixIds: JSON.stringify(reforged.affixIds),
        affixStats: JSON.stringify(reforged.affixStats),
      },
    });

    const nextItems = items.map((item) =>
      item.id === targetItem.id
        ? {
            ...item,
            name: reforged.name,
            attack: nextStats.attack,
            defense: nextStats.defense,
            hp: nextStats.hp,
            luck: nextStats.luck,
            crit: nextStats.crit,
            goldBonus: nextStats.goldBonus,
            expBonus: nextStats.expBonus,
            dropBonus: nextStats.dropBonus,
          }
        : item,
    );

    await recalculatePower(tx, player.id, nextItems);

    await tx.gameLog.create({
      data: {
        playerId: player.id,
        type: "EQUIPMENT_REFORGE",
        message: buildReforgeLogMessage(reforged.name, locale),
        payload: JSON.stringify({
          materials: preview.ingredients,
          items: [
            {
              name: reforged.name,
              slot: reforged.slot,
              rarity: reforged.rarity,
            },
          ],
          goldCost: preview.goldCost,
          ingredients: preview.ingredients,
        }),
      },
    });

    return { ok: true as const, reason: "reforged" };
  });

  revalidateInventoryPages();

  redirect(
    buildInventoryRedirectUrl({
      ...context,
      reforge: result.ok ? "success" : "error",
      detail: result.reason,
    }),
  );
}

export async function dismantleItemAction(formData: FormData) {
  const [{ player }, locale] = await Promise.all([
    requireCurrentPlayer(),
    getLocale(),
  ]);
  const context = getInventoryContextFromFormData(formData);
  const itemId = String(formData.get("itemId") ?? "");
  const db = getDb();

  const result = await db.$transaction(async (tx) => {
    const item = await tx.itemInstance.findUnique({
      where: { id: itemId },
    });

    if (!item || item.playerId !== player.id) {
      return { ok: false as const, reason: "missing_item" };
    }

    if (item.isLocked) {
      return { ok: false as const, reason: "locked_item" };
    }

    if (item.equippedAt) {
      return { ok: false as const, reason: "equipped_item" };
    }

    const preview = getDismantlePreview({
      id: item.id,
      name: item.name,
      sourceRegionId: item.sourceRegionId,
      rarity: item.rarity as "common" | "rare" | "epic" | "legendary",
      enhancementLevel: item.enhancementLevel,
    });

    await tx.itemInstance.delete({
      where: { id: item.id },
    });

    await tx.materialStack.upsert({
      where: {
        playerId_materialId: {
          playerId: player.id,
          materialId: preview.materialId,
        },
      },
      update: {
        amount: {
          increment: preview.amount,
        },
      },
      create: {
        playerId: player.id,
        materialId: preview.materialId,
        amount: preview.amount,
      },
    });

    await tx.gameLog.create({
      data: {
        playerId: player.id,
        type: "ITEM_DISMANTLE",
        message: buildDismantleLogMessage(
          {
            id: item.id,
            name: item.name,
            sourceRegionId: item.sourceRegionId,
            rarity: item.rarity as "common" | "rare" | "epic" | "legendary",
            enhancementLevel: item.enhancementLevel,
          },
          preview,
          locale,
        ),
        payload: JSON.stringify({
          materials: [
            {
              materialId: preview.materialId,
              amount: preview.amount,
            },
          ],
          itemId: item.id,
          itemName: item.name,
          materialId: preview.materialId,
          materialAmount: preview.amount,
        }),
      },
    });

    return { ok: true as const, reason: "dismantled" };
  });

  revalidateInventoryPages();

  redirect(
    buildInventoryRedirectUrl({
      ...context,
      dismantle: result.ok ? "success" : "error",
      detail: result.reason,
    }),
  );
}

export async function dismantleSelectedItemsAction(formData: FormData) {
  const [{ player }, locale] = await Promise.all([
    requireCurrentPlayer(),
    getLocale(),
  ]);
  const context = getInventoryContextFromFormData(formData);
  const itemIdsRaw = String(formData.get("itemIds") ?? "[]");
  const db = getDb();

  let itemIds: string[] = [];

  try {
    const parsed = JSON.parse(itemIdsRaw) as unknown;
    itemIds = Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    itemIds = [];
  }

  const result = await db.$transaction(async (tx) => {
    const items = await tx.itemInstance.findMany({
      where: {
        playerId: player.id,
        id: {
          in: itemIds,
        },
      },
    });
    const dismantleableItems = items.filter((item) => !item.equippedAt && !item.isLocked);

    if (dismantleableItems.length === 0) {
      return { ok: false as const, reason: "no_items" };
    }

    const preview = getBulkDismantlePreview(
      dismantleableItems.map((item) => ({
        id: item.id,
        name: item.name,
        sourceRegionId: item.sourceRegionId,
        rarity: item.rarity as "common" | "rare" | "epic" | "legendary",
        enhancementLevel: item.enhancementLevel,
      })),
    );

    await tx.itemInstance.deleteMany({
      where: {
        playerId: player.id,
        id: {
          in: dismantleableItems.map((item) => item.id),
        },
      },
    });

    for (const material of preview.materials) {
      await tx.materialStack.upsert({
        where: {
          playerId_materialId: {
            playerId: player.id,
            materialId: material.materialId,
          },
        },
        update: {
          amount: {
            increment: material.amount,
          },
        },
        create: {
          playerId: player.id,
          materialId: material.materialId,
          amount: material.amount,
        },
      });
    }

    await tx.gameLog.create({
      data: {
        playerId: player.id,
        type: "ITEM_DISMANTLE",
        message: buildBulkDismantleLogMessage(preview, locale),
        payload: JSON.stringify({
          materials: preview.materials,
          itemIds: dismantleableItems.map((item) => item.id),
          itemNames: dismantleableItems.map((item) => item.name),
          itemCount: preview.itemCount,
        }),
      },
    });

    return { ok: true as const, reason: "bulk_dismantled" };
  });

  revalidateInventoryPages();

  redirect(
    buildInventoryRedirectUrl({
      ...context,
      dismantle: result.ok ? "success" : "error",
      detail: result.reason,
    }),
  );
}

export async function dismantleAllItemsAction(formData: FormData) {
  const [{ player }, locale] = await Promise.all([
    requireCurrentPlayer(),
    getLocale(),
  ]);
  const context = getInventoryContextFromFormData(formData);
  const db = getDb();

  const result = await db.$transaction(async (tx) => {
    const items = await tx.itemInstance.findMany({
      where: {
        playerId: player.id,
        equippedAt: null,
        isLocked: false,
      },
    });

    if (items.length === 0) {
      return { ok: false as const, reason: "no_items" };
    }

    const preview = getBulkDismantlePreview(
      items.map((item) => ({
        id: item.id,
        name: item.name,
        sourceRegionId: item.sourceRegionId,
        rarity: item.rarity as "common" | "rare" | "epic" | "legendary",
        enhancementLevel: item.enhancementLevel,
      })),
    );

    await tx.itemInstance.deleteMany({
      where: {
        playerId: player.id,
        id: { in: items.map((item) => item.id) },
      },
    });

    for (const material of preview.materials) {
      await tx.materialStack.upsert({
        where: {
          playerId_materialId: {
            playerId: player.id,
            materialId: material.materialId,
          },
        },
        create: {
          playerId: player.id,
          materialId: material.materialId,
          amount: material.amount,
        },
        update: {
          amount: { increment: material.amount },
        },
      });
    }

    await tx.gameLog.create({
      data: {
        playerId: player.id,
        type: "ITEM_DISMANTLE",
        message:
          locale === "zh"
            ? `一键分解了 ${items.length} 件装备，回收了 ${preview.materials.map((m) => `${getMaterialName(m.materialId, locale)} x${m.amount}`).join("、")}。`
            : `Bulk dismantled ${items.length} items, recovering ${preview.materials.map((m) => `${getMaterialName(m.materialId, locale)} x${m.amount}`).join(", ")}.`,
        payload: JSON.stringify({
          materials: preview.materials,
          items: items.map((item) => ({
            name: item.name,
            slot: item.slot,
            rarity: item.rarity,
          })),
        }),
      },
    });

    return { ok: true as const, reason: "bulk_dismantled", count: items.length };
  });

  revalidateInventoryPages();

  redirect(
    buildInventoryRedirectUrl({
      ...context,
      dismantle: result.ok ? "success" : "error",
      detail: result.reason,
      count: result.ok ? (result as any).count : undefined,
    }),
  );
}
