import Link from "next/link";

import {
  craftMaterialAction,
  dismantleItemAction,
  forgeItemAction,
  reforgeItemAction,
} from "@/app/actions/crafting";
import {
  enhanceItemAction,
  equipBestItemsAction,
  equipItemAction,
} from "@/app/actions/equipment";
import { ItemCard } from "@/components/game/ItemCard";
import { MobileShell } from "@/components/layout/MobileShell";
import { getMaterialDescription, getMaterialName } from "@/data/materials";
import { getDb } from "@/lib/db";
import {
  canAffordIngredients,
  canAffordRecipe,
  getDismantlePreview,
  getForgePreviewsForUnlockedRegions,
  getRecipeDescription,
  getRecipeTitle,
  getReforgePreview,
  materialRecipeDefinitions,
} from "@/lib/game/crafting";
import { getFirstFreeEquipSlotIndex, getSlotCapacity, isItemEquipped } from "@/lib/game/equipment";
import { getEnhancementPreview } from "@/lib/game/enhancement";
import { getEquipmentMechanicsSummary } from "@/lib/game/loot";
import { normalizeUnlockedRegionIds } from "@/lib/game/progression";
import { getLocale } from "@/lib/i18n";
import {
  formatSlotLabel,
  statKeys,
  type EquipmentStats,
  type ItemRarity,
  type ItemSlot,
} from "@/lib/game/types";
import { requireCurrentPlayer } from "@/lib/player";

type InventoryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type InventoryTab = "bag" | "enhance" | "forge" | "craft" | "materials";

function readSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizeInventoryTab(value: string | null): InventoryTab {
  switch (value) {
    case "enhance":
    case "forge":
    case "craft":
    case "materials":
      return value;
    default:
      return "bag";
  }
}

function getInventoryMessage(
  operation: "equip" | "enhance" | "craft" | "dismantle" | "forge" | "reforge",
  detail: string | null,
  locale: "zh" | "en",
) {
  if (operation === "enhance") {
    switch (detail) {
      case "enhanced":
        return locale === "zh"
          ? "强化成功，材料和金币已经结算，战力已同步刷新。"
          : "Enhancement succeeded, costs were paid, and power has been refreshed.";
      case "max_level":
        return locale === "zh"
          ? "这件装备已经强化到当前上限。"
          : "This item has already reached its current enhancement cap.";
      case "insufficient_gold":
        return locale === "zh"
          ? "金币不足，暂时无法强化。"
          : "You do not have enough gold to enhance this item.";
      case "insufficient_material":
        return locale === "zh"
          ? "强化材料不足，先去挂机或挑战 Boss 再回来。"
          : "You do not have enough upgrade materials yet.";
      case "missing_item":
        return locale === "zh"
          ? "背包里找不到这件装备。"
          : "That item could not be found in your inventory.";
      default:
        return locale === "zh" ? "强化结果已更新。" : "Enhancement state updated.";
    }
  }

  if (operation === "craft") {
    switch (detail) {
      case "crafted":
        return locale === "zh"
          ? "材料已经合成完成，仓库和日志都已更新。"
          : "Materials were crafted successfully and the stash has been updated.";
      case "insufficient_material":
        return locale === "zh"
          ? "材料不够，暂时无法合成。"
          : "You do not have enough materials to craft this recipe.";
      case "missing_recipe":
        return locale === "zh"
          ? "这条合成配方不存在。"
          : "That recipe could not be found.";
      default:
        return locale === "zh" ? "合成结果已更新。" : "Crafting state updated.";
    }
  }

  if (operation === "dismantle") {
    switch (detail) {
      case "dismantled":
        return locale === "zh"
          ? "装备已经分解，材料已回收到仓库。"
          : "Item dismantled and materials were returned to your stash.";
      case "equipped_item":
        return locale === "zh"
          ? "已装备的物品不能直接分解，先卸下再处理。"
          : "Equipped items cannot be dismantled until they are unequipped.";
      case "missing_item":
        return locale === "zh"
          ? "背包里找不到这件装备。"
          : "That item could not be found in your inventory.";
      default:
        return locale === "zh" ? "分解结果已更新。" : "Dismantle state updated.";
    }
  }

  if (operation === "forge") {
    switch (detail) {
      case "forged":
        return locale === "zh"
          ? "定向锻造完成，新装备已经放进背包。"
          : "Targeted forging completed and the new item was added to your inventory.";
      case "insufficient_gold":
        return locale === "zh"
          ? "金币不足，暂时无法锻造。"
          : "You do not have enough gold to forge this item.";
      case "insufficient_material":
        return locale === "zh"
          ? "锻造材料不够，先去刷区域资源再回来。"
          : "You do not have enough materials to forge this item yet.";
      case "invalid_slot":
        return locale === "zh"
          ? "这个锻造槽位无效。"
          : "That forge slot is invalid.";
      case "missing_region":
        return locale === "zh"
          ? "当前找不到可用的区域工坊配置。"
          : "No valid region workshop configuration was found.";
      default:
        return locale === "zh" ? "锻造结果已更新。" : "Forge state updated.";
    }
  }

  if (operation === "reforge") {
    switch (detail) {
      case "reforged":
        return locale === "zh"
          ? "装备已经重铸，词缀和数值已重洗，强化等级会保留。"
          : "Item reforged, affixes and stats rerolled while enhancement level stayed intact.";
      case "insufficient_gold":
        return locale === "zh"
          ? "金币不足，暂时无法重铸。"
          : "You do not have enough gold to reforge this item.";
      case "insufficient_material":
        return locale === "zh"
          ? "重铸材料不够，先去刷区域资源再回来。"
          : "You do not have enough materials to reforge this item.";
      case "missing_item":
        return locale === "zh"
          ? "背包里找不到这件装备。"
          : "That item could not be found in your inventory.";
      case "missing_region":
        return locale === "zh"
          ? "这件装备缺少来源区域，暂时无法重铸。"
          : "This item is missing a valid source region and cannot be reforged.";
      default:
        return locale === "zh" ? "重铸结果已更新。" : "Reforge state updated.";
    }
  }

  switch (detail) {
    case "equipped":
      return locale === "zh"
        ? "装备已穿戴，战力已刷新。"
        : "Item equipped and power refreshed.";
    case "best":
      return locale === "zh"
        ? "已经为每个槽位穿上当前最优装备。"
        : "Best available gear equipped for every slot.";
    case "missing_item":
      return locale === "zh"
        ? "背包里找不到这件装备。"
        : "That item could not be found in your inventory.";
    default:
      return locale === "zh" ? "背包已更新。" : "Inventory updated.";
  }
}

function buildInventoryHref(
  tab: InventoryTab,
  page: number,
  selected: string | null,
) {
  const searchParams = new URLSearchParams();
  searchParams.set("tab", tab);
  searchParams.set("page", String(page));

  if (selected) {
    searchParams.set("selected", selected);
  }

  return `/inventory?${searchParams.toString()}`;
}

function getInventorySubtitle(tab: InventoryTab, locale: "zh" | "en") {
  switch (tab) {
    case "enhance":
      return locale === "zh"
        ? "分页格子背包，专门处理强化和重铸。"
        : "Paged gear grid focused on enhancement and reforging.";
    case "forge":
      return locale === "zh"
        ? "只看定向锻造，避免把工坊信息和背包混在一起。"
        : "A dedicated forge tab so workshop actions are separate from the bag.";
    case "craft":
      return locale === "zh"
        ? "只看材料合成配方。"
        : "A dedicated tab for material crafting recipes.";
    case "materials":
      return locale === "zh"
        ? "只看材料库存，不再和装备列表混在一起。"
        : "A dedicated materials tab instead of mixing stash and gear.";
    default:
      return locale === "zh"
        ? "分页格子背包，点击格子查看装备详情。"
        : "A paged grid inventory. Tap a slot to inspect gear details.";
  }
}

function getTabLabel(tab: InventoryTab, locale: "zh" | "en") {
  switch (tab) {
    case "enhance":
      return locale === "zh" ? "强化" : "Enhance";
    case "forge":
      return locale === "zh" ? "锻造" : "Forge";
    case "craft":
      return locale === "zh" ? "合成" : "Craft";
    case "materials":
      return locale === "zh" ? "材料" : "Materials";
    default:
      return locale === "zh" ? "背包" : "Bag";
  }
}

function getStatLabel(statKey: (typeof statKeys)[number], locale: "zh" | "en") {
  const labels = {
    zh: {
      attack: "攻击",
      defense: "防御",
      hp: "生命",
      luck: "幸运",
      crit: "暴击",
      goldBonus: "金币%",
      expBonus: "经验%",
      dropBonus: "掉落%",
    },
    en: {
      attack: "ATK",
      defense: "DEF",
      hp: "HP",
      luck: "LUK",
      crit: "CRIT",
      goldBonus: "GOLD%",
      expBonus: "EXP%",
      dropBonus: "DROP%",
    },
  } as const;

  return labels[locale][statKey];
}

function getAccessorySlotLabel(index: number, locale: "zh" | "en") {
  if (locale === "zh") {
    return index === 0 ? "饰品 A" : "饰品 B";
  }

  return index === 0 ? "Accessory A" : "Accessory B";
}

export default async function InventoryPage({
  searchParams,
}: InventoryPageProps) {
  const [{ player }, params, locale] = await Promise.all([
    requireCurrentPlayer(),
    searchParams,
    getLocale(),
  ]);
  const db = getDb();
  const [items, materials, unlockedRows] = await Promise.all([
    db.itemInstance.findMany({
      where: { playerId: player.id },
      orderBy: [
        { equippedAt: "desc" },
        { equipSlotIndex: "asc" },
        { enhancementLevel: "desc" },
        { createdAt: "desc" },
      ],
    }),
    db.materialStack.findMany({
      where: { playerId: player.id },
      orderBy: [{ amount: "desc" }, { materialId: "asc" }],
    }),
    db.playerUnlockedRegion.findMany({
      where: { playerId: player.id },
      select: { regionId: true },
    }),
  ]);

  const equipStatus = readSearchParam(params, "equip");
  const enhanceStatus = readSearchParam(params, "enhance");
  const craftStatus = readSearchParam(params, "craft");
  const dismantleStatus = readSearchParam(params, "dismantle");
  const forgeStatus = readSearchParam(params, "forge");
  const reforgeStatus = readSearchParam(params, "reforge");
  const detail = readSearchParam(params, "detail");
  const selectedTab = normalizeInventoryTab(readSearchParam(params, "tab"));
  const currentPage = Math.max(1, Number(readSearchParam(params, "page") ?? "1"));
  const selectedItemId = readSearchParam(params, "selected");
  const operation = reforgeStatus
    ? "reforge"
    : forgeStatus
      ? "forge"
      : dismantleStatus
        ? "dismantle"
        : craftStatus
          ? "craft"
          : enhanceStatus
            ? "enhance"
            : "equip";
  const status =
    reforgeStatus ??
    forgeStatus ??
    dismantleStatus ??
    craftStatus ??
    enhanceStatus ??
    equipStatus;
  const materialAmounts = new Map(
    materials.map((stack) => [stack.materialId, stack.amount]),
  );
  const unlockedRegionIds = normalizeUnlockedRegionIds(
    unlockedRows.map((row) => row.regionId),
    player.currentRegionId,
  );
  const forgePreviews = getForgePreviewsForUnlockedRegions(
    unlockedRegionIds,
    player.currentRegionId,
    locale,
  );

  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const normalizedPage = Math.min(currentPage, totalPages);
  const pageItems = items.slice(
    (normalizedPage - 1) * pageSize,
    normalizedPage * pageSize,
  );
  const emptySlotCount = Math.max(0, pageSize - pageItems.length);
  const selectedItem =
    pageItems.find((item) => item.id === selectedItemId) ??
    pageItems[0] ??
    null;
  const selectedHref = buildInventoryHref(
    selectedTab,
    normalizedPage,
    selectedItem?.id ?? null,
  );

  return (
    <MobileShell
      title={locale === "zh" ? "背包" : "Inventory"}
      subtitle={getInventorySubtitle(selectedTab, locale)}
    >
      {status ? (
        <section
          className={`rounded-[24px] border p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)] ${
            status === "success"
              ? "border-[#cfe5cf] bg-[#edf8ed] text-[#1f4936]"
              : "border-[#f2d5d0] bg-[#fff3f1] text-[#8c372b]"
          }`}
        >
          <h2 className="text-lg font-semibold">
            {status === "success"
              ? locale === "zh"
                ? operation === "enhance"
                  ? "强化完成"
                  : operation === "craft"
                    ? "合成完成"
                    : operation === "dismantle"
                      ? "分解完成"
                      : operation === "forge"
                        ? "锻造完成"
                        : operation === "reforge"
                          ? "重铸完成"
                          : "装备已更新"
                : operation === "enhance"
                  ? "Enhancement Complete"
                  : operation === "craft"
                    ? "Craft Complete"
                    : operation === "dismantle"
                      ? "Dismantle Complete"
                      : operation === "forge"
                        ? "Forge Complete"
                        : operation === "reforge"
                          ? "Reforge Complete"
                          : "Equipment Updated"
              : locale === "zh"
                ? "操作被拦截"
                : "Action Blocked"}
          </h2>
          <p className="mt-2 text-sm leading-6">
            {getInventoryMessage(operation, detail, locale)}
          </p>
        </section>
      ) : null}

      <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
        <div className="flex flex-wrap gap-2">
          {(["bag", "enhance", "forge", "craft", "materials"] as InventoryTab[]).map(
            (tab) => {
              const isActive = selectedTab === tab;

              return (
                <Link
                  key={tab}
                  href={buildInventoryHref(tab, 1, null)}
                  className={`inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#204b36] text-white"
                      : "bg-[#eef3ee] text-[#4f6d59] hover:bg-[#e4ece4]"
                  }`}
                >
                  {getTabLabel(tab, locale)}
                </Link>
              );
            },
          )}
        </div>
      </section>

      {(selectedTab === "bag" || selectedTab === "enhance") && (
        <>
          <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#183a2a]">
                  {locale === "zh" ? "分页背包" : "Paged Inventory"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#55715f]">
                  {locale === "zh"
                    ? `第 ${normalizedPage} / ${totalPages} 页，共 ${items.length} 件装备。`
                    : `Page ${normalizedPage} / ${totalPages}, ${items.length} items total.`}
                </p>
              </div>

              <form action={equipBestItemsAction}>
                <input type="hidden" name="redirectTo" value={selectedHref} />
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-2xl bg-[#204b36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#183a2a]"
                >
                  {locale === "zh" ? "一键最优" : "Equip Best"}
                </button>
              </form>
            </div>

            {pageItems.length > 0 ? (
              <div className="mt-4">
                <div className="grid grid-cols-4 gap-2">
                  {pageItems.map((item) => {
                    const isSelected = selectedItem?.id === item.id;

                    return (
                      <Link
                        key={item.id}
                        href={buildInventoryHref(selectedTab, normalizedPage, item.id)}
                        className={`flex aspect-square flex-col justify-between rounded-2xl border p-2 transition ${
                          isSelected
                            ? "border-[#204b36] bg-[#edf8ed]"
                            : "border-[#dfeadf] bg-[#f8fbf7] hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                              item.rarity === "legendary"
                                ? "bg-[#fff1db] text-[#a55b18]"
                                : item.rarity === "epic"
                                  ? "bg-[#f8ebff] text-[#7a4594]"
                                  : item.rarity === "rare"
                                    ? "bg-[#e8f1ff] text-[#385c8c]"
                                    : "bg-[#eef3ee] text-[#51705c]"
                            }`}
                          >
                            {locale === "zh"
                              ? formatSlotLabel(item.slot as ItemSlot, locale).slice(0, 2)
                              : formatSlotLabel(item.slot as ItemSlot, locale).slice(0, 3)}
                          </span>
                          {item.equippedAt ? (
                            <span className="rounded-full bg-[#d9ecd8] px-2 py-1 text-[10px] font-semibold text-[#315b43]">
                              {item.slot === "accessory" && item.equipSlotIndex !== null
                                ? item.equipSlotIndex === 0
                                  ? "A"
                                  : "B"
                                : locale === "zh"
                                  ? "装"
                                  : "EQ"}
                            </span>
                          ) : null}
                        </div>

                        <div>
                          <p className="line-clamp-2 text-[11px] font-semibold leading-4 text-[#183a2a]">
                            {item.name}
                          </p>
                          <p className="mt-1 text-[10px] text-[#55715f]">
                            +{item.enhancementLevel}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                  {Array.from({ length: emptySlotCount }).map((_, index) => (
                    <div
                      key={`empty-slot-${index}`}
                      className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-[#d7e4d7] bg-[#f7faf7] text-[11px] font-medium text-[#9aaea0]"
                    >
                      {locale === "zh" ? "空位" : "Empty"}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <Link
                    href={buildInventoryHref(
                      selectedTab,
                      Math.max(1, normalizedPage - 1),
                      null,
                    )}
                    className={`inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-semibold ${
                      normalizedPage > 1
                        ? "bg-[#eef3ee] text-[#4f6d59]"
                        : "pointer-events-none bg-[#f4f7f4] text-[#a0b0a5]"
                    }`}
                  >
                    {locale === "zh" ? "上一页" : "Prev"}
                  </Link>
                  <p className="text-sm font-medium text-[#55715f]">
                    {locale === "zh"
                      ? `${normalizedPage} / ${totalPages}`
                      : `${normalizedPage} / ${totalPages}`}
                  </p>
                  <Link
                    href={buildInventoryHref(
                      selectedTab,
                      Math.min(totalPages, normalizedPage + 1),
                      null,
                    )}
                    className={`inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-semibold ${
                      normalizedPage < totalPages
                        ? "bg-[#eef3ee] text-[#4f6d59]"
                        : "pointer-events-none bg-[#f4f7f4] text-[#a0b0a5]"
                    }`}
                  >
                    {locale === "zh" ? "下一页" : "Next"}
                  </Link>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[#55715f]">
                {locale === "zh"
                  ? "这一页还没有装备。"
                  : "There is no gear on this page yet."}
              </p>
            )}
          </section>

          {selectedItem ? (
            (() => {
              const preview = getEnhancementPreview({
                ...selectedItem,
                rarity: selectedItem.rarity as ItemRarity,
              });
              const dismantlePreview = getDismantlePreview({
                id: selectedItem.id,
                name: selectedItem.name,
                sourceRegionId: selectedItem.sourceRegionId,
                rarity: selectedItem.rarity as ItemRarity,
                enhancementLevel: selectedItem.enhancementLevel,
              });
              const reforgePreview = getReforgePreview({
                id: selectedItem.id,
                name: selectedItem.name,
                sourceRegionId: selectedItem.sourceRegionId,
                rarity: selectedItem.rarity as ItemRarity,
                enhancementLevel: selectedItem.enhancementLevel,
              });
              const ownedMaterialAmount = materialAmounts.get(preview.materialId) ?? 0;
              const canEnhance =
                !preview.isMaxLevel &&
                player.gold >= preview.goldCost &&
                ownedMaterialAmount >= preview.materialCost;
              const canReforge =
                player.gold >= reforgePreview.goldCost &&
                canAffordIngredients(reforgePreview.ingredients, materialAmounts);
              const affixIds = JSON.parse(selectedItem.affixIds) as string[];
              const mechanics = getEquipmentMechanicsSummary(
                {
                  baseItemId: selectedItem.baseItemId,
                  rarity: selectedItem.rarity as ItemRarity,
                  affixIds,
                  sourceRegionId: selectedItem.sourceRegionId,
                },
                locale,
              );
              const equippedAccessories = items.filter(
                (item) => item.slot === "accessory" && isItemEquipped(item),
              );
              const freeAccessoryIndex =
                selectedItem.slot === "accessory"
                  ? getFirstFreeEquipSlotIndex(
                      items.map((item) => ({
                        ...item,
                        slot: item.slot as ItemSlot,
                      })),
                      "accessory",
                    )
                  : null;
              const accessoryIndexes =
                selectedItem.slot === "accessory"
                  ? Array.from({ length: getSlotCapacity("accessory") }, (_, index) => index)
                  : [];

              return (
                <ItemCard
                  name={selectedItem.name}
                  slot={selectedItem.slot as ItemSlot}
                  rarity={selectedItem.rarity as ItemRarity}
                  enhancementLevel={selectedItem.enhancementLevel}
                  isEquipped={Boolean(selectedItem.equippedAt)}
                  stats={selectedItem as Partial<EquipmentStats>}
                  locale={locale}
                  mechanics={{
                    ...mechanics,
                    baseStatLabels: mechanics.baseStatKeys.map((statKey) =>
                      getStatLabel(statKey, locale),
                    ),
                    affixStatLabels: mechanics.affixStatKeys.map((statKey) =>
                      getStatLabel(statKey, locale),
                    ),
                    equippedSlotLabel:
                      selectedItem.slot === "accessory" && selectedItem.equipSlotIndex !== null
                        ? getAccessorySlotLabel(selectedItem.equipSlotIndex, locale)
                        : selectedItem.equippedAt
                          ? formatSlotLabel(selectedItem.slot as ItemSlot, locale)
                          : null,
                  }}
                  footer={
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3 text-sm text-[#355645]">
                        <p>
                          {locale === "zh"
                            ? `当前槽位：${formatSlotLabel(selectedItem.slot as ItemSlot, locale)}`
                            : `Slot: ${formatSlotLabel(selectedItem.slot as ItemSlot, locale)}`}
                        </p>
                        <p className="mt-1">
                          {preview.isMaxLevel
                            ? locale === "zh"
                              ? `已满级（上限 +${preview.maxLevel}）`
                              : `Maxed out (+${preview.maxLevel})`
                            : locale === "zh"
                              ? `下一级消耗：${preview.goldCost} 金币，${getMaterialName(preview.materialId, locale)} x${preview.materialCost}`
                              : `Next level costs ${preview.goldCost} gold and ${getMaterialName(preview.materialId, locale)} x${preview.materialCost}`}
                        </p>
                        <p className="mt-1">
                          {locale === "zh"
                            ? `重铸消耗：${reforgePreview.ingredients
                                .map(
                                  (ingredient) =>
                                    `${getMaterialName(ingredient.materialId, locale)} x${ingredient.amount}`,
                                )
                                .join(", ")}，${reforgePreview.goldCost} 金币`
                            : `Reforge costs ${reforgePreview.ingredients
                                .map(
                                  (ingredient) =>
                                    `${getMaterialName(ingredient.materialId, locale)} x${ingredient.amount}`,
                                )
                                .join(", ")} and ${reforgePreview.goldCost} gold`}
                        </p>
                        {selectedTab === "bag" ? (
                          <p className="mt-1">
                            {locale === "zh"
                              ? `分解回收：${getMaterialName(dismantlePreview.materialId, locale)} x${dismantlePreview.amount}`
                              : `Dismantle return: ${getMaterialName(dismantlePreview.materialId, locale)} x${dismantlePreview.amount}`}
                          </p>
                        ) : null}
                        {!preview.isMaxLevel ? (
                          <p className="mt-1 text-xs text-[#55715f]">
                            {locale === "zh"
                              ? `当前持有：${getMaterialName(preview.materialId, locale)} x${ownedMaterialAmount}`
                              : `Owned: ${getMaterialName(preview.materialId, locale)} x${ownedMaterialAmount}`}
                          </p>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {selectedTab === "enhance" ? (
                          <>
                            <form action={enhanceItemAction}>
                              <input type="hidden" name="itemId" value={selectedItem.id} />
                              <input type="hidden" name="redirectTo" value={selectedHref} />
                              <button
                                type="submit"
                                disabled={!canEnhance}
                                className="inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-2xl bg-[#2b5a3f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#204b36] disabled:cursor-not-allowed disabled:bg-[#9ab2a0]"
                              >
                                {preview.isMaxLevel
                                  ? locale === "zh"
                                    ? "已满级"
                                    : "Max Level"
                                  : locale === "zh"
                                    ? "强化 +1"
                                    : "Enhance +1"}
                              </button>
                            </form>

                            <form action={reforgeItemAction}>
                              <input type="hidden" name="itemId" value={selectedItem.id} />
                              <input type="hidden" name="tab" value={selectedTab} />
                              <input type="hidden" name="page" value={normalizedPage} />
                              <input type="hidden" name="selected" value={selectedItem.id} />
                              <button
                                type="submit"
                                disabled={!canReforge}
                                className="inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-2xl bg-[#445d7a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#344b66] disabled:cursor-not-allowed disabled:bg-[#9ca8b5]"
                              >
                                {locale === "zh" ? "重铸词缀" : "Reforge Affixes"}
                              </button>
                            </form>
                          </>
                        ) : (
                          <>
                            {selectedItem.equippedAt ? (
                              <div className="flex min-h-11 items-center justify-center rounded-2xl bg-[#eef3ee] px-4 py-3 text-sm font-semibold text-[#51705c]">
                                {selectedItem.slot === "accessory" &&
                                selectedItem.equipSlotIndex !== null
                                  ? locale === "zh"
                                    ? `已装备在 ${getAccessorySlotLabel(selectedItem.equipSlotIndex, locale)}`
                                    : `Equipped in ${getAccessorySlotLabel(selectedItem.equipSlotIndex, locale)}`
                                  : locale === "zh"
                                    ? "已装备"
                                    : "Equipped"}
                              </div>
                            ) : selectedItem.slot === "accessory" ? (
                              <div className="grid grid-cols-2 gap-2">
                                {accessoryIndexes.map((slotIndex) => {
                                  const occupiedBy = equippedAccessories.find(
                                    (item) => item.equipSlotIndex === slotIndex,
                                  );
                                  const isFree = freeAccessoryIndex === slotIndex;

                                  return (
                                    <form key={slotIndex} action={equipItemAction}>
                                      <input type="hidden" name="itemId" value={selectedItem.id} />
                                      <input type="hidden" name="equipSlotIndex" value={slotIndex} />
                                      <input type="hidden" name="redirectTo" value={selectedHref} />
                                      <button
                                        type="submit"
                                        className="inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-2xl bg-[#204b36] px-3 py-3 text-sm font-semibold text-white transition hover:bg-[#183a2a]"
                                      >
                                        {isFree
                                          ? locale === "zh"
                                            ? `装备到 ${getAccessorySlotLabel(slotIndex, locale)}`
                                            : `Equip ${getAccessorySlotLabel(slotIndex, locale)}`
                                          : locale === "zh"
                                            ? `替换 ${getAccessorySlotLabel(slotIndex, locale)}`
                                            : `Replace ${getAccessorySlotLabel(slotIndex, locale)}`}
                                      </button>
                                      {occupiedBy ? (
                                        <p className="mt-1 line-clamp-1 text-center text-[11px] text-[#55715f]">
                                          {occupiedBy.name}
                                        </p>
                                      ) : null}
                                    </form>
                                  );
                                })}
                              </div>
                            ) : (
                              <form action={equipItemAction}>
                                <input type="hidden" name="itemId" value={selectedItem.id} />
                                <input type="hidden" name="redirectTo" value={selectedHref} />
                                <button
                                  type="submit"
                                  className="inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-2xl bg-[#204b36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#183a2a]"
                                >
                                  {locale === "zh" ? "穿戴" : "Equip"}
                                </button>
                              </form>
                            )}

                            {!selectedItem.equippedAt ? (
                              <form action={dismantleItemAction}>
                                <input type="hidden" name="itemId" value={selectedItem.id} />
                                <input type="hidden" name="tab" value={selectedTab} />
                                <input type="hidden" name="page" value={normalizedPage} />
                                <input type="hidden" name="selected" value={selectedItem.id} />
                                <button
                                  type="submit"
                                  className="inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-2xl bg-[#efe6df] px-4 py-3 text-sm font-semibold text-[#7a4b2a] transition hover:bg-[#e7dacd]"
                                >
                                  {locale === "zh" ? "分解回收" : "Dismantle"}
                                </button>
                              </form>
                            ) : (
                              <div className="flex min-h-11 items-center justify-center rounded-2xl bg-[#eef3ee] px-4 py-3 text-sm font-semibold text-[#51705c]">
                                {locale === "zh" ? "已锁定" : "Locked"}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  }
                />
              );
            })()
          ) : (
            <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
              <h2 className="text-lg font-semibold text-[#183a2a]">
                {locale === "zh" ? "还没有装备" : "No Gear Yet"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#55715f]">
                {locale === "zh"
                  ? "先去领取挂机收益，背包里就会开始掉落装备。"
                  : "Claim idle rewards to start filling your inventory with equipment drops."}
              </p>
            </section>
          )}
        </>
      )}

      {selectedTab === "forge" && (
        <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
          <h2 className="text-lg font-semibold text-[#183a2a]">
            {locale === "zh" ? "定向锻造台" : "Target Forge"}
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {forgePreviews.map((preview) => {
              const canForge =
                player.gold >= preview.goldCost &&
                canAffordIngredients(preview.ingredients, materialAmounts);

              return (
                <article
                  key={preview.slot}
                  className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#183a2a]">
                        {locale === "zh"
                          ? `${formatSlotLabel(preview.slot, locale)}锻造`
                          : `${formatSlotLabel(preview.slot, locale)} Forge`}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-[#55715f]">
                        {locale === "zh"
                          ? `按照 ${preview.regionName} 的掉落表定向产出这个槽位。`
                          : `Generate a targeted ${formatSlotLabel(preview.slot, locale)} item from the ${preview.regionName} drop table.`}
                      </p>
                      <p className="mt-2 text-sm text-[#355645]">
                        {locale === "zh" ? "消耗：" : "Costs: "}
                        {preview.ingredients
                          .map(
                            (ingredient) =>
                              `${getMaterialName(ingredient.materialId, locale)} x${ingredient.amount}`,
                          )
                          .join(", ")}
                        {locale === "zh" ? `，${preview.goldCost} 金币` : `, ${preview.goldCost} gold`}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#55715f]">
                        {locale === "zh"
                          ? "锻造出的装备会直接进入背包格子页。"
                          : "Forged equipment goes directly into the paged inventory grid."}
                      </p>
                    </div>

                    <form action={forgeItemAction}>
                      <input type="hidden" name="slot" value={preview.slot} />
                      <input type="hidden" name="tab" value={selectedTab} />
                      <button
                        type="submit"
                        disabled={!canForge}
                        className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-2xl bg-[#8d5a20] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#744818] disabled:cursor-not-allowed disabled:bg-[#bea180]"
                      >
                        {locale === "zh" ? "锻造" : "Forge"}
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {selectedTab === "craft" && (
        <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
          <h2 className="text-lg font-semibold text-[#183a2a]">
            {locale === "zh" ? "材料合成台" : "Refinery"}
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {materialRecipeDefinitions.map((recipe) => {
              const canCraft = canAffordRecipe(recipe, materialAmounts);

              return (
                <article
                  key={recipe.id}
                  className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#183a2a]">
                        {getRecipeTitle(recipe, locale)}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-[#55715f]">
                        {getRecipeDescription(recipe, locale)}
                      </p>
                      <p className="mt-2 text-sm text-[#355645]">
                        {locale === "zh" ? "消耗：" : "Costs: "}
                        {recipe.ingredients
                          .map(
                            (ingredient) =>
                              `${getMaterialName(ingredient.materialId, locale)} x${ingredient.amount}`,
                          )
                          .join(", ")}
                      </p>
                      <p className="mt-1 text-sm text-[#355645]">
                        {locale === "zh" ? "产出：" : "Output: "}
                        {getMaterialName(recipe.output.materialId, locale)} x
                        {recipe.output.amount}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#55715f]">
                        {locale === "zh"
                          ? "合成后会停留在这个标签页，方便连续处理材料。"
                          : "Crafting keeps you on this tab so you can process materials continuously."}
                      </p>
                    </div>

                    <form action={craftMaterialAction}>
                      <input type="hidden" name="recipeId" value={recipe.id} />
                      <input type="hidden" name="tab" value={selectedTab} />
                      <button
                        type="submit"
                        disabled={!canCraft}
                        className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-2xl bg-[#2b5a3f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#204b36] disabled:cursor-not-allowed disabled:bg-[#9ab2a0]"
                      >
                        {locale === "zh" ? "合成" : "Craft"}
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {selectedTab === "materials" && (
        <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
          <h2 className="text-lg font-semibold text-[#183a2a]">
            {locale === "zh" ? "材料库存" : "Materials"}
          </h2>
          {materials.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {materials.map((stack) => (
                <div
                  key={stack.materialId}
                  className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-[#183a2a]">
                    {getMaterialName(stack.materialId, locale)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#55715f]">
                    {getMaterialDescription(stack.materialId, locale)}
                  </p>
                  <p className="mt-2 font-mono text-base text-[#1f4936]">
                    x{stack.amount}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[#55715f]">
              {locale === "zh" ? "还没有存下来的材料。" : "No stored materials yet."}
            </p>
          )}
        </section>
      )}
    </MobileShell>
  );
}
