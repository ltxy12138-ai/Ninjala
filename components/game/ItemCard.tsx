import type { ReactNode } from "react";

import type { Locale } from "@/lib/i18n";
import {
  formatRarityLabel,
  formatSlotLabel,
  statKeys,
  type EquipmentStats,
  type ItemRarity,
  type ItemSlot,
} from "@/lib/game/types";

type ItemCardProps = {
  name: string;
  slot: ItemSlot;
  rarity: ItemRarity;
  stats: Partial<EquipmentStats>;
  enhancementLevel?: number;
  isEquipped?: boolean;
  footer?: ReactNode;
  locale: Locale;
  compact?: boolean;
  mechanics?: {
    baseItemName: string;
    familyName: string;
    affixNames: string[];
    affixLines: Array<{
      name: string;
      stats: Array<{
        statKey: (typeof statKeys)[number];
        label: string;
        value: number;
      }>;
    }>;
    sourceRegionName: string;
    affixCount: number;
    expectedAffixCount: number;
    baseStatLines: Array<{
      statKey: (typeof statKeys)[number];
      label: string;
      value: number;
    }>;
    affixStatLabels: string[];
    equippedSlotLabel?: string | null;
  };
};

const rarityStyles: Record<ItemRarity, string> = {
  common: "bg-[#eef3ee] text-[#51705c]",
  rare: "bg-[#e8f1ff] text-[#385c8c]",
  epic: "bg-[#f8ebff] text-[#7a4594]",
  legendary: "bg-[#fff1db] text-[#a55b18]",
};

const statLabels = {
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
} satisfies Record<Locale, Record<(typeof statKeys)[number], string>>;

export function ItemCard({
  name,
  slot,
  rarity,
  stats,
  enhancementLevel = 0,
  isEquipped = false,
  footer,
  locale,
  compact = false,
  mechanics,
}: ItemCardProps) {
  const visibleStats = statKeys.filter((statKey) => (stats[statKey] ?? 0) > 0);

  return (
    <article
      className={`rounded-[24px] border border-[#d9e7d8] bg-white/95 shadow-[0_16px_40px_rgba(24,58,42,0.08)] ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={`font-semibold text-[#183a2a] ${compact ? "text-sm leading-5" : "text-base"}`}>
            {name}
          </h2>
          <p className={`text-[#55715f] ${compact ? "mt-1 text-xs" : "mt-2 text-sm"}`}>
            {formatSlotLabel(slot, locale)}
          </p>
        </div>

        <div className={`flex flex-col items-end ${compact ? "gap-1.5" : "gap-2"}`}>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${rarityStyles[rarity]}`}
          >
            {formatRarityLabel(rarity, locale)}
          </span>
          <span className="rounded-full bg-[#eef3ee] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#355645]">
            {locale === "zh" ? `强化 +${enhancementLevel}` : `+${enhancementLevel}`}
          </span>
          {isEquipped ? (
            <span className="rounded-full bg-[#e1f0e0] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#315b43]">
              {locale === "zh" ? "已装备" : "Equipped"}
            </span>
          ) : null}
        </div>
      </div>

      <div className={`flex flex-wrap gap-2 ${compact ? "mt-3" : "mt-4"}`}>
        {visibleStats.map((statKey) => (
          <span
            key={statKey}
            className={`rounded-full border border-[#dfeadf] bg-[#f8fbf7] font-medium text-[#355645] ${
              compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1 text-xs"
            }`}
          >
            {statLabels[locale][statKey]} +{stats[statKey]}
          </span>
        ))}
      </div>

      {mechanics ? (
        <div className={`${compact ? "mt-3 space-y-2.5" : "mt-4 space-y-3"}`}>
          <div className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3 text-sm text-[#355645]">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#51705c]">
                {locale === "zh" ? `基础：${mechanics.baseItemName}` : `Base: ${mechanics.baseItemName}`}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#51705c]">
                {locale === "zh"
                  ? `词缀 ${mechanics.affixCount}/${mechanics.expectedAffixCount}`
                  : `Affixes ${mechanics.affixCount}/${mechanics.expectedAffixCount}`}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#51705c]">
                {locale === "zh"
                  ? `来源：${mechanics.sourceRegionName}`
                  : `Source: ${mechanics.sourceRegionName}`}
              </span>
              {mechanics.equippedSlotLabel ? (
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#51705c]">
                  {locale === "zh"
                    ? `已穿戴在 ${mechanics.equippedSlotLabel}`
                    : `Equipped in ${mechanics.equippedSlotLabel}`}
                </span>
              ) : null}
            </div>

            <div className="mt-3 space-y-2">
              <div className="rounded-2xl bg-white px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6c8a72]">
                  {locale === "zh" ? "装备谱系" : "Lineage"}
                </p>
                <p className="mt-1 text-sm leading-6 text-[#355645]">
                  {locale === "zh"
                    ? `${mechanics.baseItemName} · ${mechanics.familyName}`
                    : `${mechanics.baseItemName} · ${mechanics.familyName}`}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6c8a72]">
                  {locale === "zh" ? "词缀" : "Affixes"}
                </p>
                {mechanics.affixLines.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {mechanics.affixLines.map((affix) => (
                      <div key={affix.name} className="rounded-2xl bg-white px-3 py-3">
                        <p className="text-sm font-semibold text-[#355645]">{affix.name}</p>
                        {affix.stats.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {affix.stats.map((statLine) => (
                              <span
                                key={`${affix.name}-${statLine.statKey}`}
                                className="rounded-full border border-[#dfeadf] bg-[#f8fbf7] px-2.5 py-1 text-[11px] font-medium text-[#355645]"
                              >
                                {statLine.label} +{statLine.value}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm leading-6 text-[#355645]">
                    {locale === "zh"
                      ? "普通品质，没有额外词缀。"
                      : "Common quality, with no extra affixes."}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 text-xs text-[#55715f] sm:grid-cols-2">
                <div className="rounded-2xl bg-white px-3 py-2">
                  <p className="font-semibold text-[#355645]">
                    {locale === "zh" ? "基础项" : "Base Stats"}
                  </p>
                  {mechanics.baseStatLines.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {mechanics.baseStatLines.map((line) => (
                        <span
                          key={`base-${line.statKey}`}
                          className="rounded-full border border-[#dfeadf] bg-[#f8fbf7] px-2.5 py-1 text-[11px] font-medium text-[#355645]"
                        >
                          {line.label} +{line.value}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 leading-5">{locale === "zh" ? "无" : "None"}</p>
                  )}
                </div>
                <div className="rounded-2xl bg-white px-3 py-2">
                  <p className="font-semibold text-[#355645]">
                    {locale === "zh" ? "词缀项" : "Affix Stats"}
                  </p>
                  <p className="mt-1 leading-5">
                    {mechanics.affixStatLabels.length > 0
                      ? mechanics.affixStatLabels.join(locale === "zh" ? "、" : ", ")
                      : locale === "zh"
                        ? "无"
                        : "None"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {footer ? <div className={compact ? "mt-3" : "mt-4"}>{footer}</div> : null}
    </article>
  );
}
