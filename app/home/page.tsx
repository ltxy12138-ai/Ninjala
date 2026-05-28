import Link from "next/link";

import { PlayerSummary } from "@/components/game/PlayerSummary";
import { MobileShell } from "@/components/layout/MobileShell";
import { getRegionName } from "@/data/regions";
import { canAccessAdminTools } from "@/lib/admin";
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
  const adminToolsEnabled = canAccessAdminTools(user.inviteCode?.code);

  return (
    <MobileShell
      title={locale === "zh" ? "村口营地" : "Village Camp"}
      subtitle={
        locale === "zh"
          ? "首页也统一成短分区布局，先看总览，再决定去哪里。"
          : "Home now matches the compact tabbed layout used across the rest of the app."
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
                {locale === "zh" ? "当前重点" : "Current Focus"}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#183a2a]">
                {locale === "zh" ? "封测硬化" : "Closed-Test Hardening"}
              </p>
            </div>
          </section>

          <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
            <h2 className="text-lg font-semibold text-[#183a2a]">
              {locale === "zh" ? "当前进度" : "Current Status"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#55715f]">
              {locale === "zh"
                ? "账号密码登录、一次性邀请码注册、存档、挂机、掉落、分页背包、双饰品位、角色装备页、Boss、区域解锁，以及强化、分解、锻造、重铸、世界 Boss、好友祝福都已经接通；等级也改成了基于总经验的非线性公式成长，理论上限 3000 级。goldBonus、expBonus、dropBonus、crit 和 luck 现在都是真实生效属性，装备详情也会解释基础装备、词缀和来源区域。Phase 8 的模拟脚本和部署 runbook 已补上，同页操作和奖励弹窗关闭都会尽量保持滚动位置，而且不会持续抖动；测试环境也有了方便版管理台，但只对 PENGUIN-LI 账号开放。"
                : "Account-password login, one-time invite registration, saves, idle rewards, drops, a paged inventory, dual accessory slots, character gear views, bosses, region unlocks, enhancement, dismantling, forging, reforging, world boss, and blessings are all connected; leveling now follows a nonlinear total-exp curve with a theoretical cap of 3000. goldBonus, expBonus, dropBonus, crit, and luck now affect real rewards or combat outcomes, and gear details explain base items, affixes, and source regions. Phase 8 simulation scripts plus the deployment runbook are in place, same-page actions plus reward-modal closes preserve scroll position without ongoing scroll jitter, and the test environment now has a convenient admin console limited to the PENGUIN-LI account."}
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
          {adminToolsEnabled ? (
            <Link
              href="/admin"
              className="rounded-[24px] border border-[#d7ddd7] bg-[#f9fbf8] p-4 shadow-[0_16px_40px_rgba(24,58,42,0.05)] transition hover:bg-[#f2f7f2]"
            >
              <h2 className="text-base font-semibold text-[#183a2a]">
                {locale === "zh" ? "测试管理台" : "Test Admin"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#55715f]">
                {locale === "zh"
                  ? "重置玩家、补资源、清空测试数据。"
                  : "Reset players, grant resources, and clear test data."}
              </p>
            </Link>
          ) : null}
        </section>
      ) : null}

      {selectedTab === "status" ? (
        <>
          <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
            <h2 className="text-lg font-semibold text-[#183a2a]">
              {locale === "zh" ? "正在扩展" : "Expanding Next"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#55715f]">
              {locale === "zh"
                ? "封测硬化已经开始，当前模拟脚本和经济 sweep 已经接上，第一轮明显的推进过快和金币膨胀 warning 也已经压下来了。"
                : "Closed-test hardening is underway, the simulation suite is connected, and the first obvious progression-speed and gold-inflation warnings have been pushed down."}
            </p>
          </section>

          {adminToolsEnabled ? (
            <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
              <h2 className="text-lg font-semibold text-[#183a2a]">
                {locale === "zh" ? "测试工具" : "Test Tools"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#55715f]">
                {locale === "zh"
                  ? "当前环境已开放 /admin，可以直接重置玩家、补金币材料，或清空整个测试服。"
                  : "This environment exposes /admin so you can reset players, grant resources, or clear the whole test server."}
              </p>
            </section>
          ) : null}

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                {locale === "zh" ? "界面状态" : "UI Status"}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#183a2a]">
                {locale === "zh" ? "主页面统一完成" : "Core Pages Unified"}
              </p>
            </div>
            <div className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                {locale === "zh" ? "下一阶段" : "Next Phase"}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#183a2a]">
                {locale === "zh" ? "封测硬化" : "Closed-Test Hardening"}
              </p>
            </div>
          </section>
        </>
      ) : null}
    </MobileShell>
  );
}
