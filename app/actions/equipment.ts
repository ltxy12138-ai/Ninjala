"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import {
  applyEnhancementStats,
  buildEnhancementLogMessage,
  getEnhancementPreview,
} from "@/lib/game/enhancement";
import {
  calculatePowerFromEquippedItems,
  chooseBestItemsBySlot,
  getFirstFreeEquipSlotIndex,
  getSlotCapacity,
} from "@/lib/game/equipment";
import { normalizeStoredItemSlot } from "@/lib/game/item-slot";
import { getLocale } from "@/lib/i18n";
import { itemSlots, type ItemSlot } from "@/lib/game/types";
import { requireCurrentPlayer } from "@/lib/player";

type EquipmentItemSnapshot = {
  id: string;
  playerId: string;
  baseItemId: string;
  name: string;
  sourceRegionId: string;
  slot: string;
  rarity: string;
  enhancementLevel: number;
  equippedAt: Date | null;
  equipSlotIndex: number | null;
  attack: number;
  defense: number;
  hp: number;
  luck: number;
  crit: number;
  goldBonus: number;
  expBonus: number;
  dropBonus: number;
};

function buildRedirectUrl(basePath: string, values: Record<string, string>) {
  const searchParams = new URLSearchParams(values);
  const query = searchParams.toString();

  return query ? `${basePath}?${query}` : basePath;
}

function revalidateGamePages() {
  revalidatePath("/home");
  revalidatePath("/inventory");
  revalidatePath("/characters");
  revalidatePath("/boss");
  revalidatePath("/rankings");
  revalidatePath("/logs");
}

function toEquipmentSnapshot(items: EquipmentItemSnapshot[]) {
  return items.map((item) => ({
    ...item,
    slot: normalizeStoredItemSlot(item.slot, item.baseItemId),
    rarity: item.rarity as "common" | "rare" | "epic" | "legendary",
  }));
}

async function recalculateAndPersistPower(
  tx: Prisma.TransactionClient,
  playerId: string,
  items: EquipmentItemSnapshot[],
) {
  const powerResult = calculatePowerFromEquippedItems(toEquipmentSnapshot(items));

  await tx.player.update({
    where: { id: playerId },
    data: {
      power: powerResult.power,
    },
  });
}

export async function equipItemAction(formData: FormData) {
  const { player } = await requireCurrentPlayer();
  const itemId = String(formData.get("itemId") ?? "");
  const requestedSlotIndexRaw = String(formData.get("equipSlotIndex") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/inventory");
  const db = getDb();

  const result = await db.$transaction(async (tx) => {
    const items = await tx.itemInstance.findMany({
      where: { playerId: player.id },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    const targetItem = items.find((item) => item.id === itemId);

    if (!targetItem) {
      return { ok: false as const, reason: "missing_item" };
    }

    const equippedAt = new Date();
    const requestedSlotIndex =
      requestedSlotIndexRaw === "" ? null : Number(requestedSlotIndexRaw);
    const requestedItemSlot = normalizeStoredItemSlot(
      targetItem.slot,
      targetItem.baseItemId,
    );

    if (
      requestedSlotIndex !== null &&
      (!Number.isInteger(requestedSlotIndex) ||
        requestedSlotIndex < 0 ||
        requestedSlotIndex >= getSlotCapacity(requestedItemSlot))
    ) {
      return { ok: false as const, reason: "invalid_slot_index" };
    }

    const normalizedItems = toEquipmentSnapshot(items);
    const normalizedTargetItem = normalizedItems.find((item) => item.id === itemId);

    if (!normalizedTargetItem) {
      return { ok: false as const, reason: "missing_item" };
    }

    const targetSlot = normalizedTargetItem.slot as ItemSlot;
    const targetSlotIndex =
      targetSlot === "ring"
        ? requestedSlotIndex ??
          getFirstFreeEquipSlotIndex(normalizedItems, targetSlot) ??
          0
        : 0;
    const conflictingIds = normalizedItems
      .filter((item) =>
        targetSlot === "ring"
          ? item.slot === targetSlot && item.equipSlotIndex === targetSlotIndex
          : item.slot === targetSlot,
      )
      .map((item) => item.id);

    if (conflictingIds.length > 0) {
      await tx.itemInstance.updateMany({
        where: {
          playerId: player.id,
          id: { in: conflictingIds },
        },
        data: {
          equippedAt: null,
          equipSlotIndex: null,
        },
      });
    }

    await tx.itemInstance.update({
      where: { id: targetItem.id },
      data: {
        equippedAt,
        equipSlotIndex: targetSlotIndex,
      },
    });

    const nextItems = items.map((item) => {
      if (item.id === targetItem.id) {
        return {
          ...item,
          equippedAt,
          equipSlotIndex: targetSlotIndex,
        };
      }

      const normalizedItemSlot = normalizeStoredItemSlot(item.slot, item.baseItemId);

      if (targetSlot !== "ring" && normalizedItemSlot === targetSlot) {
        return { ...item, equippedAt: null, equipSlotIndex: null };
      }

      if (
        targetSlot === "ring" &&
        normalizedItemSlot === targetSlot &&
        item.equipSlotIndex === targetSlotIndex
      ) {
        return { ...item, equippedAt: null, equipSlotIndex: null };
      }

      return item;
    });

    await recalculateAndPersistPower(tx, player.id, nextItems);

    return { ok: true as const };
  });

  revalidateGamePages();

  redirect(
    buildRedirectUrl(redirectTo, {
      equip: result.ok ? "success" : "error",
      detail: result.ok ? "equipped" : result.reason,
    }),
  );
}

export async function unequipItemAction(formData: FormData) {
  const { player } = await requireCurrentPlayer();
  const itemId = String(formData.get("itemId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/characters");
  const db = getDb();

  const result = await db.$transaction(async (tx) => {
    const items = await tx.itemInstance.findMany({
      where: { playerId: player.id },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    const targetItem = items.find((item) => item.id === itemId);

    if (!targetItem) {
      return { ok: false as const, reason: "missing_item" };
    }

    await tx.itemInstance.update({
      where: { id: targetItem.id },
      data: {
        equippedAt: null,
        equipSlotIndex: null,
      },
    });

    const nextItems = items.map((item) =>
      item.id === targetItem.id
        ? { ...item, equippedAt: null, equipSlotIndex: null }
        : item,
    );

    await recalculateAndPersistPower(tx, player.id, nextItems);

    return { ok: true as const };
  });

  revalidateGamePages();

  redirect(
    buildRedirectUrl(redirectTo, {
      equip: result.ok ? "success" : "error",
      detail: result.ok ? "unequipped" : result.reason,
    }),
  );
}

export async function toggleItemLockAction(formData: FormData) {
  const { player } = await requireCurrentPlayer();
  const itemId = String(formData.get("itemId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/inventory");
  const db = getDb();

  const result = await db.$transaction(async (tx) => {
    const item = await tx.itemInstance.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        playerId: true,
        isLocked: true,
      },
    });

    if (!item || item.playerId !== player.id) {
      return { ok: false as const, reason: "missing_item" };
    }

    await tx.itemInstance.update({
      where: { id: item.id },
      data: {
        isLocked: !item.isLocked,
      },
    });

    return {
      ok: true as const,
      reason: item.isLocked ? "unlocked" : "locked",
    };
  });

  revalidateGamePages();

  redirect(
    buildRedirectUrl(redirectTo, {
      equip: result.ok ? "success" : "error",
      detail: result.reason,
    }),
  );
}

export async function equipBestItemsAction(formData: FormData) {
  const { player } = await requireCurrentPlayer();
  const redirectTo = String(formData.get("redirectTo") ?? "/inventory");
  const db = getDb();

  await db.$transaction(async (tx) => {
    const items = await tx.itemInstance.findMany({
      where: { playerId: player.id },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    const bestItems = chooseBestItemsBySlot(toEquipmentSnapshot(items));
    const selectedAssignments = itemSlots.flatMap((slot) =>
      (bestItems.get(slot) ?? []).map((item, index) => ({
        id: item.id,
        equipSlotIndex: slot === "ring" ? index : 0,
      })),
    );
    const selectedIds = selectedAssignments.map((entry) => entry.id);
    const equippedAt = new Date();

    await tx.itemInstance.updateMany({
      where: {
        playerId: player.id,
      },
      data: {
        equippedAt: null,
        equipSlotIndex: null,
      },
    });

    for (const selected of selectedAssignments) {
      await tx.itemInstance.update({
        where: {
          id: selected.id,
        },
        data: {
          equippedAt,
          equipSlotIndex: selected.equipSlotIndex,
        },
      });
    }

    const nextItems = items.map((item) => ({
      ...item,
      equippedAt: selectedIds.includes(item.id) ? equippedAt : null,
      equipSlotIndex:
        selectedAssignments.find((selected) => selected.id === item.id)
          ?.equipSlotIndex ?? null,
    }));

    await recalculateAndPersistPower(tx, player.id, nextItems);
  });

  revalidateGamePages();

  redirect(
    buildRedirectUrl(redirectTo, {
      equip: "success",
      detail: "best",
    }),
  );
}

export async function enhanceItemAction(formData: FormData) {
  const [{ player }, locale] = await Promise.all([
    requireCurrentPlayer(),
    getLocale(),
  ]);
  const itemId = String(formData.get("itemId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/inventory");
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

    const preview = getEnhancementPreview({
      ...targetItem,
      rarity: targetItem.rarity as "common" | "rare" | "epic" | "legendary",
    });

    if (preview.isMaxLevel) {
      return { ok: false as const, reason: "max_level" };
    }

    if (dbPlayer.gold < preview.goldCost) {
      return { ok: false as const, reason: "insufficient_gold" };
    }

    const materialStack = await tx.materialStack.findUnique({
      where: {
        playerId_materialId: {
          playerId: player.id,
          materialId: preview.materialId,
        },
      },
    });

    if ((materialStack?.amount ?? 0) < preview.materialCost) {
      return { ok: false as const, reason: "insufficient_material" };
    }

    const nextStats = applyEnhancementStats(targetItem);
    const nextEnhancementLevel = targetItem.enhancementLevel + 1;

    await tx.materialStack.update({
      where: {
        playerId_materialId: {
          playerId: player.id,
          materialId: preview.materialId,
        },
      },
      data: {
        amount: {
          decrement: preview.materialCost,
        },
      },
    });

    await tx.itemInstance.update({
      where: { id: targetItem.id },
      data: {
        enhancementLevel: nextEnhancementLevel,
        attack: nextStats.attack,
        defense: nextStats.defense,
        hp: nextStats.hp,
        luck: nextStats.luck,
        crit: nextStats.crit,
        goldBonus: nextStats.goldBonus,
        expBonus: nextStats.expBonus,
        dropBonus: nextStats.dropBonus,
      },
    });

    await tx.player.update({
      where: { id: player.id },
      data: {
        gold: {
          decrement: preview.goldCost,
        },
      },
    });

    const nextItems = items.map((item) =>
      item.id === targetItem.id
        ? {
            ...item,
            enhancementLevel: nextEnhancementLevel,
            ...nextStats,
          }
        : item,
    );

    await recalculateAndPersistPower(tx, player.id, nextItems);

    await tx.gameLog.create({
      data: {
        playerId: player.id,
        type: "EQUIPMENT_ENHANCE",
        message: buildEnhancementLogMessage(
          {
            ...targetItem,
            rarity: targetItem.rarity as "common" | "rare" | "epic" | "legendary",
          },
          preview,
          locale,
        ),
        payload: JSON.stringify({
          itemId: targetItem.id,
          itemName: targetItem.name,
          nextLevel: preview.nextLevel,
          goldCost: preview.goldCost,
          materialId: preview.materialId,
          materialCost: preview.materialCost,
        }),
      },
    });

    return { ok: true as const, reason: "enhanced" };
  });

  revalidateGamePages();

  redirect(
    buildRedirectUrl(redirectTo, {
      enhance: result.ok ? "success" : "error",
      detail: result.reason,
    }),
  );
}
