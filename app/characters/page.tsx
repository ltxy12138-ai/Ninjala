import Link from "next/link";

import { unequipItemAction } from "@/app/actions/equipment";
import { ItemCard } from "@/components/game/ItemCard";
import { MobileShell } from "@/components/layout/MobileShell";
import { getDb } from "@/lib/db";
import {
  calculatePowerFromEquippedItems,
  isItemEquipped,
  slotCapacities,
} from "@/lib/game/equipment";
import { normalizeStoredItemSlot } from "@/lib/game/item-slot";
import { getEquipmentMechanicsSummary } from "@/lib/game/loot";
import { formatUiNumber, getLocale } from "@/lib/i18n";
import {
  type EquipmentStats,
  type ItemRarity,
  type ItemSlot,
} from "@/lib/game/types";
import { requireCurrentPlayer } from "@/lib/player";

type CharactersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type CharacterTab = "stats" | "gear";
type GearSlotKey =
  | "weapon"
  | "helmet"
  | "armor"
  | "boots"
  | "bracer"
  | "amulet"
  | "ring_0"
  | "ring_1";

type GearSlotDefinition = {
  key: GearSlotKey;
  slot: ItemSlot;
  equipSlotIndex: number;
  labelZh: string;
  labelEn: string;
};

const gearSlots: GearSlotDefinition[] = [
  { key: "weapon", slot: "weapon", equipSlotIndex: 0, labelZh: "武器", labelEn: "Weapon" },
  { key: "helmet", slot: "helmet", equipSlotIndex: 0, labelZh: "头部", labelEn: "Helmet" },
  { key: "armor", slot: "armor", equipSlotIndex: 0, labelZh: "护甲", labelEn: "Armor" },
  { key: "boots", slot: "boots", equipSlotIndex: 0, labelZh: "靴子", labelEn: "Boots" },
  { key: "bracer", slot: "bracer", equipSlotIndex: 0, labelZh: "护腕", labelEn: "Bracer" },
  { key: "amulet", slot: "amulet", equipSlotIndex: 0, labelZh: "项链", labelEn: "Amulet" },
  { key: "ring_0", slot: "ring", equipSlotIndex: 0, labelZh: "戒指 A", labelEn: "Ring A" },
  { key: "ring_1", slot: "ring", equipSlotIndex: 1, labelZh: "戒指 B", labelEn: "Ring B" },
];

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

function normalizeCharacterTab(value: string | null): CharacterTab {
  return value === "gear" ? "gear" : "stats";
}

function normalizeGearSlotKey(value: string | null): GearSlotKey | null {
  return gearSlots.some((slot) => slot.key === value) ? (value as GearSlotKey) : null;
}

function buildCharactersHref(tab: CharacterTab, slot: GearSlotKey | null) {
  const searchParams = new URLSearchParams();
  searchParams.set("tab", tab);

  if (slot) {
    searchParams.set("slot", slot);
  }

  return `/characters?${searchParams.toString()}`;
}

function getSlotDisplayLabel(definition: GearSlotDefinition, locale: "zh" | "en") {
  return locale === "zh" ? definition.labelZh : definition.labelEn;
}

export default async function CharactersPage({
  searchParams,
}: CharactersPageProps) {
  const [{ player, user }, params, locale] = await Promise.all([
    requireCurrentPlayer(),
    searchParams,
    getLocale(),
  ]);
  const items = await getDb().itemInstance.findMany({
    where: { playerId: player.id },
    orderBy: [
      { equippedAt: "desc" },
      { equipSlotIndex: "asc" },
      { enhancementLevel: "desc" },
      { createdAt: "desc" },
    ],
  });
  const equippedItems = items.filter((item) => isItemEquipped(item));
  const powerResult = calculatePowerFromEquippedItems(
    equippedItems.map((item) => ({
      ...item,
      slot: normalizeStoredItemSlot(item.slot, item.baseItemId),
    })),
  );
  const detail = readSearchParam(params, "detail");
  const status = readSearchParam(params, "equip");
  const selectedTab = normalizeCharacterTab(readSearchParam(params, "tab"));
  const defaultSlot =
    gearSlots.find((slot) =>
      equippedItems.some(
        (item) =>
          normalizeStoredItemSlot(item.slot, item.baseItemId) === slot.slot &&
          (item.equipSlotIndex ?? 0) === slot.equipSlotIndex,
      ),
    )?.key ?? gearSlots[0].key;
  const selectedSlotKey =
    normalizeGearSlotKey(readSearchParam(params, "slot")) ?? defaultSlot;
  const selectedSlotDefinition =
    gearSlots.find((slot) => slot.key === selectedSlotKey) ?? gearSlots[0];
  const selectedItem =
    equippedItems.find(
      (item) =>
        normalizeStoredItemSlot(item.slot, item.baseItemId) === selectedSlotDefinition.slot &&
        (item.equipSlotIndex ?? 0) === selectedSlotDefinition.equipSlotIndex,
    ) ?? null;
  const selectedHref = buildCharactersHref(selectedTab, selectedSlotKey);
  const selectedItemAffixIds = selectedItem
    ? (JSON.parse(selectedItem.affixIds) as string[])
    : [];
  const selectedItemMechanics = selectedItem
    ? getEquipmentMechanicsSummary(
        {
          baseItemId: selectedItem.baseItemId,
          rarity: selectedItem.rarity as ItemRarity,
          affixIds: selectedItemAffixIds,
          sourceRegionId: selectedItem.sourceRegionId,
          stats: {
            attack: selectedItem.attack,
            defense: selectedItem.defense,
            hp: selectedItem.hp,
            luck: selectedItem.luck,
            crit: selectedItem.crit,
            goldBonus: selectedItem.goldBonus,
            expBonus: selectedItem.expBonus,
            dropBonus: selectedItem.dropBonus,
          },
          affixStats: JSON.parse(selectedItem.affixStats ?? "[]") as Partial<EquipmentStats>[],
        },
        locale,
      )
    : null;
  const totalEquipSlots = Object.values(slotCapacities).reduce(
    (sum, capacity) => sum + capacity,
    0,
  );

  return (
    <MobileShell
      title={locale === "zh" ? "角色" : "Character"}
      subtitle={
        locale === "zh"
          ? "查看角色面板、战力构成和当前穿戴。"
          : "Check your stats, power profile, and current gear."
      }
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
                ? "配装已变更"
                : "Loadout Changed"
              : locale === "zh"
                ? "操作被拦截"
                : "Action Blocked"}
          </h2>
          <p className="mt-2 text-sm leading-6">
            {detail === "unequipped"
              ? locale === "zh"
                ? "装备已卸下，战力已经重算。"
                : "Item unequipped and power recalculated."
              : detail === "missing_item"
                ? locale === "zh"
                  ? "找不到这件装备。"
                  : "That item could not be found."
                : locale === "zh"
                  ? "角色状态已更新。"
                  : "Character state updated."}
          </p>
        </section>
      ) : null}

      <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
        <div className="grid grid-cols-2 gap-2">
          {(["stats", "gear"] as CharacterTab[]).map((tab) => {
            const isActive = selectedTab === tab;

            return (
              <Link
                key={tab}
                href={buildCharactersHref(tab, selectedSlotKey)}
                className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#204b36] text-white"
                    : "bg-[#eef3ee] text-[#4f6d59] hover:bg-[#e4ece4]"
                }`}
              >
                {tab === "stats"
                  ? locale === "zh"
                    ? "角色面板"
                    : "Stats"
                  : locale === "zh"
                    ? "穿戴槽位"
                    : "Gear"}
              </Link>
            );
          })}
        </div>
      </section>

      {selectedTab === "stats" ? (
        <>
          <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
            <h2 className="text-lg font-semibold text-[#183a2a]">{user.nickname}</h2>
            <p className="mt-2 text-sm leading-6 text-[#55715f]">
              {locale === "zh"
                ? `Lv.${player.level}，当前总战力 ${formatUiNumber(player.power, locale)}，已穿戴 ${equippedItems.length} / ${totalEquipSlots} 个位置。`
                : `Level ${player.level}, ${formatUiNumber(player.power, locale)} total power, ${equippedItems.length} / ${totalEquipSlots} positions equipped.`}
            </p>
          </section>

          <section className="grid grid-cols-2 gap-3">
            {[
              { labelZh: "攻击", labelEn: "Attack", value: powerResult.totalStats.attack },
              { labelZh: "防御", labelEn: "Defense", value: powerResult.totalStats.defense },
              { labelZh: "生命", labelEn: "HP", value: powerResult.totalStats.hp },
              { labelZh: "幸运", labelEn: "Luck", value: powerResult.totalStats.luck },
              { labelZh: "暴击", labelEn: "Crit", value: powerResult.totalStats.crit },
              { labelZh: "金币%", labelEn: "Gold%", value: powerResult.totalStats.goldBonus },
              { labelZh: "经验%", labelEn: "Exp%", value: powerResult.totalStats.expBonus },
              { labelZh: "掉落%", labelEn: "Drop%", value: powerResult.totalStats.dropBonus },
            ].map((stat) => (
              <div
                key={stat.labelZh}
                className="rounded-[24px] border border-[#d9e7d8] bg-white/95 px-4 py-3 shadow-[0_16px_40px_rgba(24,58,42,0.08)]"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                  {locale === "zh" ? stat.labelZh : stat.labelEn}
                </p>
                <p className="mt-1 font-mono text-lg text-[#1f4936]">{stat.value}</p>
              </div>
            ))}
          </section>
        </>
      ) : (
        <>
          <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
            <div className="grid grid-cols-2 gap-2">
              {gearSlots.map((slot) => {
                const item = equippedItems.find(
                  (candidate) =>
                    normalizeStoredItemSlot(candidate.slot, candidate.baseItemId) === slot.slot &&
                    (candidate.equipSlotIndex ?? 0) === slot.equipSlotIndex,
                );
                const isActive = selectedSlotKey === slot.key;

                return (
                  <Link
                    key={slot.key}
                    href={buildCharactersHref(selectedTab, slot.key)}
                    className={`flex min-h-24 flex-col justify-between rounded-2xl border p-3 transition ${
                      isActive
                        ? "border-[#204b36] bg-[#edf8ed]"
                        : "border-[#dfeadf] bg-[#f8fbf7] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full bg-[#eef3ee] px-2.5 py-1 text-[11px] font-semibold text-[#51705c]">
                        {getSlotDisplayLabel(slot, locale)}
                      </span>
                      {item ? (
                        <span className="rounded-full bg-[#dff0de] px-2.5 py-1 text-[11px] font-semibold text-[#315b43]">
                          {locale === "zh" ? "已装" : "EQ"}
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <p className="line-clamp-2 text-sm font-semibold leading-5 text-[#183a2a]">
                        {item ? item.name : locale === "zh" ? "空槽位" : "Empty Slot"}
                      </p>
                      <p className="mt-1 text-xs text-[#55715f]">
                        {item
                          ? locale === "zh"
                            ? `强化 +${item.enhancementLevel}`
                            : `+${item.enhancementLevel}`
                          : locale === "zh"
                            ? "点击查看"
                            : "Tap to view"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {selectedItem ? (
            <ItemCard
              name={selectedItem.name}
              slot={normalizeStoredItemSlot(selectedItem.slot, selectedItem.baseItemId)}
              rarity={selectedItem.rarity as ItemRarity}
              enhancementLevel={selectedItem.enhancementLevel}
              isEquipped
              stats={selectedItem as Partial<EquipmentStats>}
              locale={locale}
              mechanics={{
                ...(selectedItemMechanics ?? {
                  baseItemName: "",
                  familyName: "",
                  affixNames: [],
                  affixLines: [],
                  sourceRegionName: "",
                  rarityLabel: "",
                  affixCount: 0,
                  expectedAffixCount: 0,
                  baseStatLines: [],
                  affixStatLabels: [],
                }),
                equippedSlotLabel: getSlotDisplayLabel(selectedSlotDefinition, locale),
              }}
              footer={
                <form action={unequipItemAction}>
                  <input type="hidden" name="itemId" value={selectedItem.id} />
                  <input type="hidden" name="redirectTo" value={selectedHref} />
                  <button
                    type="submit"
                    className="min-h-11 w-full rounded-2xl bg-[#eef3ee] px-4 py-3 text-sm font-semibold text-[#355645] transition hover:bg-[#dfe8df]"
                  >
                    {locale === "zh" ? "卸下" : "Unequip"}
                  </button>
                </form>
              }
            />
          ) : (
            <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
              <h2 className="text-lg font-semibold text-[#183a2a]">
                {getSlotDisplayLabel(selectedSlotDefinition, locale)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#55715f]">
                {locale === "zh"
                  ? "这个位置还没有装备，去背包里挑一件穿上吧。"
                  : "This position is empty. Pick something from the inventory to equip it."}
              </p>
            </section>
          )}
        </>
      )}
    </MobileShell>
  );
}
