import Link from "next/link";

import { sendBlessingAction } from "@/app/actions/social";
import { MobileShell } from "@/components/layout/MobileShell";
import { getRegionName } from "@/data/regions";
import { getDb } from "@/lib/db";
import {
  getHighestUnlockedRegionId,
  normalizeUnlockedRegionIds,
} from "@/lib/game/progression";
import { getRegionById } from "@/lib/game/regions";
import { formatWorldBossDay } from "@/lib/game/world-boss";
import { formatUiNumber, getLocale } from "@/lib/i18n";
import { requireCurrentPlayer } from "@/lib/player";

type RankingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type RankingsTab = "ladder" | "blessing";

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

function normalizeRankingsTab(value: string | null): RankingsTab {
  return value === "blessing" ? "blessing" : "ladder";
}

function buildRankingsHref(tab: RankingsTab, page: number) {
  const searchParams = new URLSearchParams();
  searchParams.set("tab", tab);
  searchParams.set("page", String(page));

  return `/rankings?${searchParams.toString()}`;
}

function getBlessingMessage(
  status: string | null,
  error: string | null,
  target: string | null,
  locale: "zh" | "en",
) {
  if (status === "success") {
    return locale === "zh"
      ? `今日祝福已经送出，${target ?? "好友"} 会立刻收到额外金币和经验。`
      : `Today's blessing has been sent, and ${target ?? "your friend"} immediately received extra gold and exp.`;
  }

  switch (error) {
    case "SELF_TARGET":
      return locale === "zh"
        ? "不能给自己送祝福。"
        : "You cannot bless yourself.";
    case "DAILY_LIMIT":
      return locale === "zh"
        ? "今天已经送过一次祝福了。"
        : "You have already sent a blessing today.";
    case "TARGET_NOT_FOUND":
      return locale === "zh"
        ? "目标好友不存在。"
        : "That target player could not be found.";
    default:
      return locale === "zh"
        ? "祝福发送失败，请稍后重试。"
        : "Blessing failed to send. Please try again later.";
  }
}

function getTabLabel(tab: RankingsTab, locale: "zh" | "en") {
  return tab === "blessing"
    ? locale === "zh"
      ? "今日祝福"
      : "Blessing"
    : locale === "zh"
      ? "战力榜"
      : "Ladder";
}

export default async function RankingsPage({
  searchParams,
}: RankingsPageProps) {
  const [{ player }, locale, params] = await Promise.all([
    requireCurrentPlayer(),
    getLocale(),
    searchParams,
  ]);
  const currentPlayerId = player.id;
  const db = getDb();
  const players = await db.player.findMany({
    include: {
      user: true,
      unlockedRegions: {
        select: {
          regionId: true,
        },
      },
    },
    orderBy: [{ power: "desc" }, { level: "desc" }, { createdAt: "asc" }],
    take: 20,
  });
  const blessDay = formatWorldBossDay(new Date());
  const sentBlessingToday = await db.blessing.findUnique({
    where: {
      playerId_dayKey: {
        playerId: player.id,
        dayKey: blessDay,
      },
    },
    include: {
      target: {
        include: {
          user: true,
        },
      },
    },
  });
  const blessStatus = readSearchParam(params, "bless");
  const blessError = readSearchParam(params, "error");
  const blessTarget = readSearchParam(params, "target");
  const selectedTab = normalizeRankingsTab(readSearchParam(params, "tab"));
  const currentPage = Math.max(1, Number(readSearchParam(params, "page") ?? "1"));
  const pageSize = selectedTab === "blessing" ? 6 : 8;
  const totalPages = Math.max(1, Math.ceil(players.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const visiblePlayers = players.slice((page - 1) * pageSize, page * pageSize);
  const currentPlayerRank =
    players.findIndex((candidate) => candidate.id === currentPlayerId) + 1;
  const topPower = players[0]?.power ?? 0;

  return (
    <MobileShell
      title={locale === "zh" ? "好友排行" : "Rankings"}
      subtitle={
        locale === "zh"
          ? "榜单和祝福拆开了，不用在同一页里反复往下翻。"
          : "The ladder and blessing flows are now separated into tabs."
      }
    >
      {blessStatus ? (
        <section
          className={`rounded-[24px] border p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)] ${
            blessStatus === "success"
              ? "border-[#cfe5cf] bg-[#edf8ed] text-[#1f4936]"
              : "border-[#f2d5d0] bg-[#fff3f1] text-[#8c372b]"
          }`}
        >
          <h2 className="text-lg font-semibold">
            {blessStatus === "success"
              ? locale === "zh"
                ? "祝福已送出"
                : "Blessing Sent"
              : locale === "zh"
                ? "祝福被拦截"
                : "Blessing Blocked"}
          </h2>
          <p className="mt-2 text-sm leading-6">
            {getBlessingMessage(blessStatus, blessError, blessTarget, locale)}
          </p>
        </section>
      ) : null}

      <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
        <div className="grid grid-cols-2 gap-2">
          {(["ladder", "blessing"] as RankingsTab[]).map((tab) => {
            const isActive = selectedTab === tab;

            return (
              <Link
                key={tab}
                href={buildRankingsHref(tab, 1)}
                className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#204b36] text-white"
                    : "bg-[#eef3ee] text-[#4f6d59] hover:bg-[#e4ece4]"
                }`}
              >
                {getTabLabel(tab, locale)}
              </Link>
            );
          })}
        </div>
      </section>

      {selectedTab === "ladder" ? (
        <>
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-[24px] border border-[#d9e7d8] bg-white/95 px-4 py-3 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                {locale === "zh" ? "你的名次" : "Your Rank"}
              </p>
              <p className="mt-1 font-mono text-lg text-[#1f4936]">
                #{currentPlayerRank}
              </p>
            </div>
            <div className="rounded-[24px] border border-[#d9e7d8] bg-white/95 px-4 py-3 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                {locale === "zh" ? "榜首战力" : "Top Power"}
              </p>
              <p className="mt-1 font-mono text-lg text-[#1f4936]">
                {formatUiNumber(topPower, locale)}
              </p>
            </div>
          </section>

          <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
            <div className="flex flex-col gap-3">
              {visiblePlayers.map((candidate, index) => {
                const absoluteRank = (page - 1) * pageSize + index + 1;
                const highestUnlockedRegionId = getHighestUnlockedRegionId(
                  normalizeUnlockedRegionIds(
                    candidate.unlockedRegions.map((row) => row.regionId),
                    candidate.currentRegionId,
                  ),
                  candidate.currentRegionId,
                );
                const highestUnlockedRegion = getRegionById(highestUnlockedRegionId);

                return (
                  <article
                    key={candidate.id}
                    className={`rounded-2xl border px-4 py-3 ${
                      candidate.id === currentPlayerId
                        ? "border-[#9dc7a3] bg-[#f1fbf0]"
                        : "border-[#e1ece0] bg-[#f8fbf7]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#eef3ee] px-2.5 py-1 text-[11px] font-semibold text-[#51705c]">
                            {locale === "zh" ? `第 ${absoluteRank} 名` : `Rank #${absoluteRank}`}
                          </span>
                          {candidate.id === currentPlayerId ? (
                            <span className="rounded-full bg-[#dff0de] px-2.5 py-1 text-[11px] font-semibold text-[#315b43]">
                              {locale === "zh" ? "你" : "You"}
                            </span>
                          ) : null}
                        </div>
                        <h2 className="mt-2 text-sm font-semibold text-[#183a2a]">
                          {candidate.user.nickname}
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-[#55715f]">
                          {locale === "zh" ? "最高进度：" : "Top Progress: "}
                          {highestUnlockedRegion
                            ? getRegionName(highestUnlockedRegion, locale)
                            : highestUnlockedRegionId}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-mono text-lg font-semibold text-[#1f4936]">
                          {formatUiNumber(candidate.power, locale)}
                        </p>
                        <p className="text-[11px] text-[#6c8a72]">
                          {locale === "zh" ? `Lv.${candidate.level}` : `Lv.${candidate.level}`}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
            <h2 className="text-lg font-semibold text-[#183a2a]">
              {locale === "zh" ? "今日祝福" : "Today's Blessing"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#55715f]">
              {sentBlessingToday
                ? locale === "zh"
                  ? `今天你已经把祝福送给了 ${sentBlessingToday.target.user.nickname}。`
                  : `You already sent today's blessing to ${sentBlessingToday.target.user.nickname}.`
                : locale === "zh"
                  ? "你今天还可以给 1 位好友送出祝福，对方会立刻得到额外金币和经验。"
                  : "You can still send one blessing today, instantly granting a friend extra gold and exp."}
            </p>
          </section>

          <section className="grid gap-3">
            {visiblePlayers.map((candidate, index) => {
              const absoluteRank = (page - 1) * pageSize + index + 1;
              const currentRegion = getRegionById(candidate.currentRegionId);

              return (
                <article
                  key={candidate.id}
                  className={`rounded-[24px] border p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)] ${
                    candidate.id === currentPlayerId
                      ? "border-[#9dc7a3] bg-[#f1fbf0]"
                      : "border-[#d9e7d8] bg-white/95"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#eef3ee] px-2.5 py-1 text-[11px] font-semibold text-[#51705c]">
                          {locale === "zh" ? `第 ${absoluteRank} 名` : `Rank #${absoluteRank}`}
                        </span>
                      </div>
                      <h2 className="mt-2 text-sm font-semibold text-[#183a2a]">
                        {candidate.user.nickname}
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-[#55715f]">
                        {locale === "zh" ? "挂机区域：" : "Idle Area: "}
                        {currentRegion
                          ? getRegionName(currentRegion, locale)
                          : candidate.currentRegionId}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-mono text-base font-semibold text-[#1f4936]">
                        {formatUiNumber(candidate.power, locale)}
                      </p>
                      <p className="text-[11px] text-[#6c8a72]">
                        {locale === "zh" ? "战力" : "Power"}
                      </p>
                    </div>
                  </div>

                  {candidate.id !== currentPlayerId ? (
                    <form action={sendBlessingAction} className="mt-3">
                      <input type="hidden" name="targetPlayerId" value={candidate.id} />
                      <input type="hidden" name="tab" value={selectedTab} />
                      <input type="hidden" name="page" value={page} />
                      <button
                        type="submit"
                        disabled={Boolean(sentBlessingToday)}
                        className="min-h-11 w-full rounded-2xl bg-[#204b36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#183a2a] disabled:cursor-not-allowed disabled:bg-[#89a898]"
                      >
                        {sentBlessingToday
                          ? locale === "zh"
                            ? "今日已送出"
                            : "Already Sent Today"
                          : locale === "zh"
                            ? "送出祝福"
                            : "Send Blessing"}
                      </button>
                    </form>
                  ) : (
                    <div className="mt-3 flex min-h-11 items-center justify-center rounded-2xl bg-[#eef3ee] px-4 py-3 text-sm font-semibold text-[#51705c]">
                      {locale === "zh" ? "这是你自己" : "This is you"}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        </>
      )}

      <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={buildRankingsHref(selectedTab, Math.max(1, page - 1))}
            className={`inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-semibold ${
              page > 1
                ? "bg-[#eef3ee] text-[#4f6d59]"
                : "pointer-events-none bg-[#f4f7f4] text-[#a0b0a5]"
            }`}
          >
            {locale === "zh" ? "上一页" : "Prev"}
          </Link>
          <p className="text-sm font-medium text-[#55715f]">
            {locale === "zh"
              ? `第 ${page} / ${totalPages} 页`
              : `Page ${page} / ${totalPages}`}
          </p>
          <Link
            href={buildRankingsHref(selectedTab, Math.min(totalPages, page + 1))}
            className={`inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-semibold ${
              page < totalPages
                ? "bg-[#eef3ee] text-[#4f6d59]"
                : "pointer-events-none bg-[#f4f7f4] text-[#a0b0a5]"
            }`}
          >
            {locale === "zh" ? "下一页" : "Next"}
          </Link>
        </div>
      </section>
    </MobileShell>
  );
}
