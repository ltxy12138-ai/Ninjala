import Link from "next/link";

import { PlayerSummary } from "@/components/game/PlayerSummary";
import { MobileShell } from "@/components/layout/MobileShell";
import { getRegionName } from "@/data/regions";
import { getRegionById } from "@/lib/game/regions";
import { getLocale } from "@/lib/i18n";
import { requireCurrentPlayer } from "@/lib/player";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type HomeTab = "overview" | "routes" | "status";

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

function normalizeHomeTab(value: string | null): HomeTab {
  switch (value) {
    case "routes":
    case "status":
      return value;
    default:
      return "overview";
  }
}

function buildHomeHref(tab: HomeTab) {
  return `/home?tab=${tab}`;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const [{ player, user }, locale, params] = await Promise.all([
    requireCurrentPlayer(),
    getLocale(),
    searchParams,
  ]);
  const currentRegion = getRegionById(player.currentRegionId);
  const selectedTab = normalizeHomeTab(readSearchParam(params, "tab"));

  return (
    <MobileShell
      title={locale === "zh" ? "村口营地" : "Village Camp"}
      subtitle={
        locale === "zh"
          ? "先看今天的收益和路向，再决定下一步去哪。"
          : "Check your current momentum here before choosing the next stop."
      }
    >
      <PlayerSummary
        nickname={user.nickname}
        level={player.level}
        exp={player.exp}
        gold={player.gold}
        power={player.power}
        currentRegionId={
          currentRegion ? getRegionName(currentRegion, locale) : player.currentRegionId
        }
        locale={locale}
      />

      <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: "overview", zh: "总览", en: "Overview" },
            { id: "routes", zh: "去哪里", en: "Routes" },
            { id: "status", zh: "状态", en: "Status" },
          ] as const).map((tab) => {
            const isActive = selectedTab === tab.id;

            return (
              <Link
                key={tab.id}
                href={buildHomeHref(tab.id)}
                className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#204b36] text-white"
                    : "bg-[#eef3ee] text-[#4f6d59] hover:bg-[#e4ece4]"
                }`}
              >
                {locale === "zh" ? tab.zh : tab.en}
              </Link>
            );
          })}
        </div>
      </section>

      {selectedTab === "overview" ? (
        <>
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                {locale === "zh" ? "当前挂机" : "Idle Area"}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#183a2a]">
                {currentRegion ? getRegionName(currentRegion, locale) : player.currentRegionId}
              </p>
            </div>
            <div className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                {locale === "zh" ? "当前目标" : "Current Goal"}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#183a2a]">
                {locale === "zh" ? "推进主线" : "Push Progress"}
              </p>
            </div>
          </section>

          <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
            <h2 className="text-lg font-semibold text-[#183a2a]">
              {locale === "zh" ? "营地提示" : "Camp Notes"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#55715f]">
              {locale === "zh"
                ? "主线越往后越吃练度，先稳住挂机收益，再根据掉落方向调整装备和词缀，回头挑战守门 Boss 会更轻松。"
                : "Later regions demand stronger builds, so it is better to stabilize idle rewards first, tune gear and affixes around your drops, and then return for the gatekeeper boss."}
            </p>
          </section>

          <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
            <h2 className="text-lg font-semibold text-[#183a2a]">
              {locale === "zh" ? "现在最适合做什么" : "Best Next Move"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#55715f]">
              {locale === "zh"
                ? "先去挂机页看是否能领取收益，再去背包做强化或重铸，最后回 Boss 和排行看战力变化。"
                : "Check idle rewards first, then upgrade or reforge in inventory, and finish by reviewing bosses or rankings."}
            </p>
          </section>
        </>
      ) : null}

      {selectedTab === "routes" ? (
        <section className="grid grid-cols-2 gap-3">
          {[
            {
              href: "/idle?tab=overview",
              titleZh: "挂机",
              titleEn: "Idle",
              bodyZh: "领取收益、切换区域、看材料。",
              bodyEn: "Claim rewards, switch regions, review materials.",
            },
            {
              href: "/inventory?tab=bag&page=1",
              titleZh: "背包",
              titleEn: "Inventory",
              bodyZh: "看格子背包，处理强化、锻造和分解。",
              bodyEn: "Open the grid backpack for upgrades, forging, and dismantling.",
            },
            {
              href: "/characters?tab=gear",
              titleZh: "角色",
              titleEn: "Character",
              bodyZh: "看面板和当前穿戴槽位。",
              bodyEn: "Review stats and equipped slots.",
            },
            {
              href: "/boss?tab=main",
              titleZh: "Boss",
              titleEn: "Boss",
              bodyZh: "主线推进或打世界 Boss。",
              bodyEn: "Push progression or attack the world boss.",
            },
            {
              href: "/rankings?tab=ladder&page=1",
              titleZh: "排行",
              titleEn: "Rankings",
              bodyZh: "看战力榜或送今日祝福。",
              bodyEn: "Check the ladder or send today's blessing.",
            },
            {
              href: "/logs?view=timeline&scope=all&category=all&page=1",
              titleZh: "日志",
              titleEn: "Logs",
              bodyZh: "按时间线或奖励视图回看记录。",
              bodyEn: "Review events by timeline or reward view.",
            },
          ].map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)] transition hover:bg-[#f8fbf7]"
            >
              <h2 className="text-base font-semibold text-[#183a2a]">
                {locale === "zh" ? route.titleZh : route.titleEn}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#55715f]">
                {locale === "zh" ? route.bodyZh : route.bodyEn}
              </p>
            </Link>
          ))}
        </section>
      ) : null}

      {selectedTab === "status" ? (
        <>
          <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
            <h2 className="text-lg font-semibold text-[#183a2a]">
              {locale === "zh" ? "主线提醒" : "Route Notes"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#55715f]">
              {locale === "zh"
                ? "如果主线卡住，优先回挂机、背包和角色页检查收益、强化与词缀搭配，再决定是否继续冲击下一个区域。"
                : "If progression stalls, check idle income, upgrades, and affix choices before forcing the next area."}
            </p>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                {locale === "zh" ? "主线路线" : "Main Route"}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#183a2a]">
                {locale === "zh" ? "10 个主线区域" : "10 Main Regions"}
              </p>
            </div>
            <div className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                {locale === "zh" ? "守门强度" : "Gate Pressure"}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#183a2a]">
                {locale === "zh" ? "后段更吃练度" : "Later Gates Hit Harder"}
              </p>
            </div>
          </section>
        </>
      ) : null}
    </MobileShell>
  );
}
