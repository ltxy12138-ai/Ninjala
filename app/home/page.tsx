import Link from "next/link";

import { claimDailyTaskRewardAction } from "@/app/actions/daily-tasks";
import { PlayerSummary } from "@/components/game/PlayerSummary";
import { MobileShell } from "@/components/layout/MobileShell";
import { getMaterialName } from "@/data/materials";
import { getRegionName } from "@/data/regions";
import { getDb } from "@/lib/db";
import {
  getDailyTaskProgress,
  syncDailyTaskProgress,
} from "@/lib/game/daily-tasks";
import { getRegionById } from "@/lib/game/regions";
import { formatWorldBossDay } from "@/lib/game/world-boss";
import { getLocale } from "@/lib/i18n";
import { requireCurrentPlayer } from "@/lib/player";
import { getDailyTaskDescription, getDailyTaskTitle } from "@/data/daily-tasks";
import { dailyTaskDefinitions } from "@/data/daily-tasks";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type HomeTab = "overview" | "daily" | "routes" | "status";

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
    case "daily":
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

function relativeTime(date: Date, locale: "zh" | "en") {
  const now = Date.now();
  const diff = Math.max(0, now - date.getTime());
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return locale === "zh" ? "刚刚" : "just now";
  }

  if (minutes < 60) {
    return locale === "zh"
      ? `${minutes} 分钟前`
      : `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return locale === "zh"
      ? `${hours} 小时前`
      : `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  return locale === "zh"
    ? `${days} 天前`
    : `${days}d ago`;
}

function getTaskStatusMessage(
  status: string | null,
  error: string | null,
  locale: "zh" | "en",
) {
  if (status === "claimed") {
    return locale === "zh"
      ? "奖励已存入角色，金币和经验已到账。"
      : "Reward has been granted. Gold and exp were added to your character.";
  }

  switch (error) {
    case "NOT_COMPLETED":
      return locale === "zh"
        ? "这个任务还没完成，继续加油。"
        : "This task is not yet complete.";
    case "ALREADY_CLAIMED":
      return locale === "zh"
        ? "这个任务的奖励已经领取过了。"
        : "This task reward has already been claimed.";
    default:
      return locale === "zh"
        ? "任务状态已更新。"
        : "Task state updated.";
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const [{ player, user }, locale, params] = await Promise.all([
    requireCurrentPlayer(),
    getLocale(),
    searchParams,
  ]);
  const currentRegion = getRegionById(player.currentRegionId);
  const selectedTab = normalizeHomeTab(readSearchParam(params, "tab"));
  const taskStatus = readSearchParam(params, "task");
  const taskError = readSearchParam(params, "error");

  const dayKey = formatWorldBossDay(new Date());
  const db = getDb();
  const [taskProgresses, globalLogs] = await Promise.all([
    (async () => {
      const repository = {
        async countGameLogsByType(
          playerId: string,
          logType: string,
          dayKey: string,
        ) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (db as any).gameLog.count({
            where: {
              playerId,
              type: logType,
              createdAt: {
                gte: new Date(`${dayKey}T00:00:00.000Z`),
                lt: new Date(
                  new Date(`${dayKey}T00:00:00.000Z`).getTime() + 86400000,
                ),
              },
            },
          }) as Promise<number>;
        },
        async getPlayerDailyTaskRecords(playerId: string, dayKey: string) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const records = await (db as any).playerDailyTask.findMany({
            where: { playerId, dayKey },
            select: {
              taskId: true,
              progress: true,
              completed: true,
              rewardClaimed: true,
            },
          });
          return records as Array<{
            taskId: string;
            progress: number;
            completed: boolean;
            rewardClaimed: boolean;
          }>;
        },
        async upsertDailyTaskProgress(input: {
          playerId: string;
          taskId: string;
          dayKey: string;
          progress: number;
          completed: boolean;
        }) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (db as any).playerDailyTask.upsert({
            where: {
              playerId_taskId_dayKey: {
                playerId: input.playerId,
                taskId: input.taskId,
                dayKey: input.dayKey,
              },
            },
            update: {
              progress: input.progress,
              completed: input.completed,
            },
            create: {
              playerId: input.playerId,
              taskId: input.taskId,
              dayKey: input.dayKey,
              progress: input.progress,
              completed: input.completed,
            },
          });
        },
        async claimReward() {
          return { status: "not_completed" as const };
        },
      };

      await syncDailyTaskProgress(repository, player.id, dayKey);

      return getDailyTaskProgress(repository, player.id, dayKey);
    })(),
    db.gameLog.findMany({
      where: { playerId: null },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

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
        <div className="grid grid-cols-4 gap-2">
          {([
            { id: "overview", zh: "总览", en: "Overview" },
            { id: "daily", zh: "日常", en: "Daily" },
            { id: "routes", zh: "去哪里", en: "Routes" },
            { id: "status", zh: "状态", en: "Status" },
          ] as const).map((tab) => {
            const isActive = selectedTab === tab.id;

            return (
              <Link
                key={tab.id}
                href={buildHomeHref(tab.id)}
                className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-2xl px-2 py-3 text-xs font-semibold transition ${
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

      {selectedTab === "daily" ? (
        <>
          {(taskStatus || taskError) ? (
            <section
              className={`rounded-[24px] border p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)] ${
                taskStatus === "claimed"
                  ? "border-[#cfe5cf] bg-[#edf8ed] text-[#1f4936]"
                  : "border-[#f2d5d0] bg-[#fff3f1] text-[#8c372b]"
              }`}
            >
              <h2 className="text-lg font-semibold">
                {taskStatus === "claimed"
                  ? locale === "zh"
                    ? "领取成功"
                    : "Claimed"
                  : locale === "zh"
                    ? "操作被拦截"
                    : "Action Blocked"}
              </h2>
              <p className="mt-2 text-sm leading-6">
                {getTaskStatusMessage(taskStatus, taskError, locale)}
              </p>
            </section>
          ) : null}

          <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-[#183a2a]">
                {locale === "zh" ? "每日任务" : "Daily Tasks"}
              </h2>
              <p className="text-xs font-medium text-[#6c8a72]">
                {taskProgresses.filter((t) => t.rewardClaimed).length}/
                {taskProgresses.length}
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {taskProgresses.map((progress) => {
                const task = dailyTaskDefinitions.find(
                  (t) => t.id === progress.taskId,
                );

                if (!task) {
                  return null;
                }

                const pct = Math.min(
                  100,
                  Math.round((progress.current / progress.target) * 100),
                );

                return (
                  <article
                    key={progress.taskId}
                    className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <h3 className="text-sm font-semibold text-[#183a2a]">
                          {getDailyTaskTitle(task, locale)}
                        </h3>
                        <p className="text-xs leading-5 text-[#55715f]">
                          {getDailyTaskDescription(task, locale)}
                        </p>
                        <p className="text-xs text-[#6c8a72]">
                          {locale === "zh" ? "奖励：" : "Reward: "}
                          {task.reward.gold}
                          {locale === "zh" ? " 金币" : " gold"}
                          {" · "}
                          {task.reward.exp}
                          {locale === "zh" ? " 经验" : " exp"}
                          {task.reward.materials
                            ? task.reward.materials
                                .map(
                                  (m) =>
                                    ` · ${getMaterialName(m.materialId, locale)} x${m.amount}`,
                                )
                                .join("")
                            : ""}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="text-xs font-semibold text-[#355645]">
                          {progress.current}/{progress.target}
                        </p>

                        {progress.rewardClaimed ? (
                          <span className="inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-2xl bg-[#d6e7d4] px-3 py-2 text-xs font-semibold text-[#315b43]">
                            {locale === "zh" ? "已领取" : "Claimed"}
                          </span>
                        ) : progress.completed ? (
                          <form action={claimDailyTaskRewardAction}>
                            <input
                              type="hidden"
                              name="taskId"
                              value={progress.taskId}
                            />
                            <input type="hidden" name="tab" value="daily" />
                            <button
                              type="submit"
                              className="inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-2xl bg-[#204b36] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#183a2a]"
                            >
                              {locale === "zh" ? "领取" : "Claim"}
                            </button>
                          </form>
                        ) : (
                          <span className="inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-2xl bg-[#eef3ee] px-3 py-2 text-xs font-semibold text-[#6c8a72]">
                            {locale === "zh" ? "进行中" : "In Progress"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dce9dc]">
                      <div
                        className="h-full rounded-full bg-[#2f6a49] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
            <h2 className="text-lg font-semibold text-[#183a2a]">
              {locale === "zh" ? "村口消息" : "Village News"}
            </h2>

            {globalLogs.length > 0 ? (
              <div className="mt-4 flex flex-col gap-2">
                {globalLogs.map((log) => (
                  <article
                    key={log.id}
                    className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3"
                  >
                    <p className="text-sm leading-6 text-[#355645]">
                      {log.message}
                    </p>
                    <p className="mt-1 text-xs text-[#6c8a72]">
                      {relativeTime(log.createdAt, locale)}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[#55715f]">
                {locale === "zh"
                  ? "村子里暂时没有新消息，去挂机或打 Boss 把动静搞大一点。"
                  : "The village is quiet for now. Go claim idle rewards or challenge a boss to stir things up."}
              </p>
            )}
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
