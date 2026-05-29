import { formatUiNumber, type Locale } from "@/lib/i18n";
import { getExpProgressWithinLevel } from "@/lib/game/leveling";

type PlayerSummaryProps = {
  nickname: string;
  level: number;
  exp: number;
  gold: number;
  power: number;
  currentRegionId: string;
  locale: Locale;
};

export function PlayerSummary({
  nickname,
  level,
  exp,
  gold,
  power,
  currentRegionId,
  locale,
}: PlayerSummaryProps) {
  const expProgress = getExpProgressWithinLevel(exp);
  const stats = [
    { label: locale === "zh" ? "等级" : "Level", value: `Lv.${level}` },
    {
      label: locale === "zh" ? "经验" : "Exp",
      value: expProgress.isMaxLevel
        ? locale === "zh"
          ? "已满级"
          : "Max"
        : `${formatUiNumber(expProgress.progressXp, locale)}/${formatUiNumber(
            expProgress.neededXp,
            locale,
          )}`,
    },
    { label: locale === "zh" ? "金币" : "Gold", value: formatUiNumber(gold, locale) },
    { label: locale === "zh" ? "战力" : "Power", value: formatUiNumber(power, locale) },
  ];

  return (
    <section className="rounded-[28px] bg-[#1f4936] p-5 text-white shadow-[0_20px_60px_rgba(31,73,54,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/70">
            {locale === "zh" ? "当前玩家" : "Current Player"}
          </p>
          <h2 className="mt-1 text-2xl font-semibold">{nickname}</h2>
          <p className="mt-2 text-sm text-white/80">
            {locale === "zh" ? "挂机区域：" : "Idle Region: "}
            {currentRegionId}
          </p>
        </div>

        <div className="rounded-full bg-white/12 px-3 py-2 text-right text-xs text-white/85">
          {locale === "zh" ? "内测服" : "Private Test"}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3"
          >
            <p className="text-xs text-white/65">{stat.label}</p>
            <p className="mt-1 font-mono text-lg font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
