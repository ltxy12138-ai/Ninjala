import Link from "next/link";

import {
  attackWorldBossAction,
  challengeBossAction,
  claimWorldBossRewardAction,
} from "@/app/actions/boss";
import { BossBattleModal } from "@/components/game/BossBattleModal";
import { ActionModal } from "@/components/game/ActionModal";
import { PlayerSummary } from "@/components/game/PlayerSummary";
import { MobileShell } from "@/components/layout/MobileShell";
import { getMaterialName } from "@/data/materials";
import { getRegionName } from "@/data/regions";
import { getWorldBossDescription, getWorldBossName } from "@/data/world-bosses";
import {
  calculateBossWinChance,
  deserializeBossBattleSummary,
  formatChallengeDay,
  getBossById,
} from "@/lib/game/boss";
import { getDb } from "@/lib/db";
import {
  getHighestUnlockedRegionId,
  normalizeUnlockedRegionIds,
} from "@/lib/game/progression";
import { getRegionById } from "@/lib/game/regions";
import { formatWorldBossDay, getWorldBossForDay } from "@/lib/game/world-boss";
import { formatUiNumber, getLocale } from "@/lib/i18n";
import { requireCurrentPlayer } from "@/lib/player";

type BossPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type BossTab = "main" | "world";

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

function normalizeBossTab(value: string | null): BossTab {
  return value === "world" ? "world" : "main";
}

function buildBossHref(tab: BossTab) {
  return `/boss?tab=${tab}`;
}

function getBossTabLabel(tab: BossTab, locale: "zh" | "en") {
  if (tab === "world") {
    return locale === "zh" ? "世界 Boss" : "World Boss";
  }

  return locale === "zh" ? "主线 Boss" : "Main Boss";
}

function getBossErrorMessage(code: string | null, locale: "zh" | "en") {
  switch (code) {
    case "DAILY_LIMIT":
      return locale === "zh"
        ? "今天的 Boss 挑战次数已经用完了。"
        : "You have used all boss attempts for today.";
    case "POWER_GATE":
      return locale === "zh"
        ? "当前战力还没达到下一阶段的挑战标准。"
        : "Your power has not reached the next-stage challenge gate yet.";
    case "REGION_NOT_UNLOCKED":
      return locale === "zh"
        ? "当前还没有可挑战的已解锁 Boss。"
        : "There is no unlocked boss available yet.";
    case "BOSS_NOT_FOUND":
      return locale === "zh"
        ? "当前区域的 Boss 数据缺失。"
        : "The current region boss could not be found.";
    case "PLAYER_NOT_FOUND":
      return locale === "zh"
        ? "玩家存档读取失败。"
        : "Player save data could not be loaded.";
    default:
      return locale === "zh"
        ? "Boss 挑战发生了问题，请稍后重试。"
        : "Something went wrong during the boss challenge.";
  }
}

function getWorldBossErrorMessage(code: string | null, locale: "zh" | "en") {
  switch (code) {
    case "ATTACK_LIMIT":
      return locale === "zh"
        ? "今天对世界 Boss 的出手次数已经用完了。"
        : "You have used all world boss attacks for today.";
    case "BOSS_DEFEATED":
      return locale === "zh"
        ? "今天的世界 Boss 已经被全服击败了。"
        : "Today's world boss has already been defeated.";
    case "NOT_PARTICIPANT":
      return locale === "zh"
        ? "你今天还没有参与世界 Boss，暂时不能领奖。"
        : "You have not participated in today's world boss yet.";
    case "BOSS_NOT_DEFEATED":
      return locale === "zh"
        ? "世界 Boss 还没倒下，奖励还不能领取。"
        : "The world boss is not defeated yet, so rewards cannot be claimed.";
    case "REWARD_ALREADY_CLAIMED":
      return locale === "zh"
        ? "今天的世界 Boss 奖励已经领过了。"
        : "You have already claimed today's world boss reward.";
    case "PLAYER_NOT_FOUND":
      return locale === "zh"
        ? "玩家存档读取失败。"
        : "Player save data could not be loaded.";
    default:
      return locale === "zh"
        ? "世界 Boss 操作发生了问题，请稍后重试。"
        : "Something went wrong during the world boss action.";
  }
}

function getChallengeStateLabel(
  state: "locked" | "ready" | "cleared",
  locale: "zh" | "en",
) {
  switch (state) {
    case "locked":
      return locale === "zh" ? "未达挑战标准" : "Gate Locked";
    case "ready":
      return locale === "zh" ? "已达挑战标准" : "Gate Ready";
    default:
      return locale === "zh" ? "已解锁当前终点" : "Route Cleared";
  }
}

export default async function BossPage({ searchParams }: BossPageProps) {
  const [{ player, user }, locale, params] = await Promise.all([
    requireCurrentPlayer(),
    getLocale(),
    searchParams,
  ]);
  const db = getDb();
  const bossPlayer = await db.player.findUnique({
    where: { id: player.id },
    select: {
      id: true,
      level: true,
      exp: true,
      gold: true,
      power: true,
      currentRegionId: true,
      unlockedRegions: {
        select: {
          regionId: true,
        },
      },
      bossProgresses: {
        select: {
          bossId: true,
          challengeDay: true,
          challengesUsed: true,
          clearCount: true,
          firstClearedAt: true,
        },
      },
    },
  });

  if (!bossPlayer) {
    throw new Error("Player snapshot missing.");
  }

  const selectedTab = normalizeBossTab(readSearchParam(params, "tab"));
  const currentRegion = getRegionById(bossPlayer.currentRegionId);
  const unlockedRegionIds = normalizeUnlockedRegionIds(
    bossPlayer.unlockedRegions.map((row) => row.regionId),
    bossPlayer.currentRegionId,
  );
  const highestUnlockedRegionId = getHighestUnlockedRegionId(
    unlockedRegionIds,
    bossPlayer.currentRegionId,
  );
  const highestUnlockedRegion = getRegionById(highestUnlockedRegionId);
  const boss = highestUnlockedRegion ? getBossById(highestUnlockedRegion.bossId) : null;
  const nextUnlockRegion = highestUnlockedRegion?.unlocksRegionId
    ? getRegionById(highestUnlockedRegion.unlocksRegionId)
    : null;
  const challengeGateMet =
    !nextUnlockRegion || bossPlayer.power >= nextUnlockRegion.recommendedPower;
  const challengeState: "locked" | "ready" | "cleared" = nextUnlockRegion
    ? challengeGateMet
      ? "ready"
      : "locked"
    : "cleared";
  const today = formatChallengeDay(new Date());
  const progress = boss
    ? bossPlayer.bossProgresses.find((entry) => entry.bossId === boss.id) ?? null
    : null;
  const challengesUsed = bossPlayer.bossProgresses
    .filter((entry) => entry.challengeDay === today)
    .reduce((sum, entry) => sum + entry.challengesUsed, 0);
  const remainingChallenges = boss
    ? Math.max(0, boss.dailyChallengeLimit - challengesUsed)
    : 0;
  const winChance = boss
    ? Math.round(calculateBossWinChance(bossPlayer.power, boss.power) * 100)
    : 0;

  const result = readSearchParam(params, "result");
  const error = readSearchParam(params, "error");
  const battleSummary = deserializeBossBattleSummary(readSearchParam(params, "battle"));

  const worldBossDay = formatWorldBossDay(new Date());
  const worldBoss = getWorldBossForDay(worldBossDay);
  const worldBossState = await db.worldBossState.findUnique({
    where: { cycleDay: worldBossDay },
  });
  const worldBossEvents = worldBossState
    ? await db.worldBossAttackLog.findMany({
        where: {
          worldBossStateId: worldBossState.id,
          cycleDay: worldBossDay,
        },
        orderBy: {
          createdAt: "asc",
        },
      })
    : [];
  const worldBossLastHitPlayer =
    worldBossState?.lastHitPlayerId
      ? await db.player.findUnique({
          where: { id: worldBossState.lastHitPlayerId },
          select: { name: true },
        })
      : null;
  const worldBossAttackEvents = worldBossEvents.filter(
    (event) => event.eventType === "ATTACK",
  );
  const worldBossClaimEvents = worldBossEvents.filter(
    (event) => event.eventType === "REWARD_CLAIM",
  );
  const playerWorldBossAttacks = worldBossAttackEvents.filter(
    (event) => event.playerId === bossPlayer.id,
  );
  const worldBossAttacksUsed = playerWorldBossAttacks.length;
  const worldBossRemainingAttacks = Math.max(
    0,
    worldBoss.dailyAttackLimit - worldBossAttacksUsed,
  );
  const worldBossParticipated = worldBossAttacksUsed > 0;
  const worldBossRewardClaimed = worldBossClaimEvents.some(
    (event) => event.playerId === bossPlayer.id,
  );
  const worldBossDamageDone = playerWorldBossAttacks.reduce(
    (sum, event) => sum + event.damage,
    0,
  );
  const worldBossParticipants = new Set(
    worldBossAttackEvents.map((event) => event.playerId),
  ).size;
  const worldBossCurrentHp = worldBossState?.currentHp ?? worldBoss.maxHp;
  const worldBossStatus = worldBossState?.status ?? "ACTIVE";
  const worldBossPercent = Math.max(
    0,
    Math.min(100, Math.round((worldBossCurrentHp / worldBoss.maxHp) * 100)),
  );
  const worldAction = readSearchParam(params, "worldAction");
  const worldStatus = readSearchParam(params, "worldStatus");
  const worldError = readSearchParam(params, "worldError");
  const worldDamage = Number(readSearchParam(params, "worldDamage") ?? "0");
  const worldRemainingHp = Number(
    readSearchParam(params, "worldRemainingHp") ?? String(worldBossCurrentHp),
  );
  const worldFinal = readSearchParam(params, "worldFinal") === "1";

  return (
    <MobileShell
      title={locale === "zh" ? "Boss 挑战" : "Boss Challenge"}
      subtitle={
        selectedTab === "main"
          ? locale === "zh"
            ? "守门 Boss 决定主线推进，先看门槛，再挑最稳的时机出手。"
            : "Gatekeeper bosses control story progress, so check the threshold before committing."
          : locale === "zh"
            ? "全服目标都在这里，出手和领奖也都在这里完成。"
            : "The shared target lives here, along with its attacks and reward claims."
      }
    >
      <PlayerSummary
        nickname={user.nickname}
        level={bossPlayer.level}
        exp={bossPlayer.exp}
        gold={bossPlayer.gold}
        power={bossPlayer.power}
        currentRegionId={
          currentRegion ? getRegionName(currentRegion, locale) : bossPlayer.currentRegionId
        }
        locale={locale}
      />

      <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
        <div className="grid grid-cols-2 gap-2">
          {(["main", "world"] as BossTab[]).map((tab) => {
            const isActive = selectedTab === tab;

            return (
              <Link
                key={tab}
                href={buildBossHref(tab)}
                className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#204b36] text-white"
                    : "bg-[#eef3ee] text-[#4f6d59] hover:bg-[#e4ece4]"
                }`}
              >
                {getBossTabLabel(tab, locale)}
              </Link>
            );
          })}
        </div>
      </section>

      {(result === "win" || result === "lose") && battleSummary ? (
        <BossBattleModal
          key={`${battleSummary.bossName}-${result}-${battleSummary.playerEndHp}-${battleSummary.bossEndHp}`}
          summary={battleSummary}
          closeHref={buildBossHref("main")}
          closeLabel={locale === "zh" ? "关闭" : "Close"}
          locale={locale}
        />
      ) : null}

      {selectedTab === "main" && result === "error" && error ? (
        <section className="rounded-[24px] border border-[#f2d5d0] bg-[#fff3f1] p-5 shadow-[0_16px_40px_rgba(24,58,42,0.06)]">
          <h2 className="text-lg font-semibold text-[#8c372b]">
            {locale === "zh" ? "挑战被拦截" : "Challenge Blocked"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#9b4b3f]">
            {getBossErrorMessage(error, locale)}
          </p>
        </section>
      ) : null}

      {selectedTab === "world" && worldStatus === "error" && worldError ? (
        <section className="rounded-[24px] border border-[#f2d5d0] bg-[#fff3f1] p-5 shadow-[0_16px_40px_rgba(24,58,42,0.06)]">
          <h2 className="text-lg font-semibold text-[#8c372b]">
            {locale === "zh" ? "世界 Boss 被拦截" : "World Boss Blocked"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#9b4b3f]">
            {getWorldBossErrorMessage(worldError, locale)}
          </p>
        </section>
      ) : null}

      {worldAction === "attack" && worldStatus === "success" ? (
        <ActionModal
          title={locale === "zh" ? "世界 Boss 出手完成" : "Attack Resolved"}
          closeHref={buildBossHref("world")}
          closeLabel={locale === "zh" ? "关闭" : "Close"}
        >
          <p>
            {locale === "zh"
              ? `本次造成 ${formatUiNumber(worldDamage, locale)} 点伤害，剩余生命 ${formatUiNumber(worldRemainingHp, locale)}。`
              : `You dealt ${formatUiNumber(worldDamage, locale)} damage and left ${formatUiNumber(worldRemainingHp, locale)} HP.`}
          </p>
          <p>
            {worldFinal
              ? locale === "zh"
                ? "你打出了最后一击，全服可以开始领取参与奖励。"
                : "You landed the final blow. Participation rewards are now claimable."
              : locale === "zh"
                ? "世界 Boss 还没倒下，今天还有人可以继续补刀。"
                : "The world boss is still standing and others can continue attacking today."}
          </p>
        </ActionModal>
      ) : null}

      {worldAction === "claim" && worldStatus === "success" ? (
        <ActionModal
          title={locale === "zh" ? "奖励已领取" : "Rewards Claimed"}
          closeHref={buildBossHref("world")}
          closeLabel={locale === "zh" ? "关闭" : "Close"}
        >
          <p>
            {locale === "zh"
              ? `你领取了 ${formatUiNumber(worldBoss.rewardGold, locale)} 金币、${formatUiNumber(worldBoss.rewardExp, locale)} 经验和世界 Boss 材料。`
              : `You claimed ${formatUiNumber(worldBoss.rewardGold, locale)} gold, ${formatUiNumber(worldBoss.rewardExp, locale)} exp, and world boss materials.`}
          </p>
        </ActionModal>
      ) : null}

      {selectedTab === "main" ? (
        boss && highestUnlockedRegion ? (
          <>
            <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#72906f]">
                    {locale === "zh" ? "当前解锁 Boss" : "Current Route Boss"}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-[#183a2a]">
                    {boss.name[locale]}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#55715f]">
                    {boss.description[locale]}
                  </p>
                </div>

                <div
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                    challengeState === "locked"
                      ? "bg-[#fff1ea] text-[#9a5d4d]"
                      : challengeState === "ready"
                        ? "bg-[#e7f2e5] text-[#315b43]"
                        : "bg-[#eef3ee] text-[#4f6d59]"
                  }`}
                >
                  {getChallengeStateLabel(challengeState, locale)}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[#355645]">
                <div className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                    {locale === "zh" ? "Boss 战力" : "Boss Power"}
                  </p>
                  <p className="mt-1 font-mono text-base">
                    {formatUiNumber(boss.power, locale)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                    {locale === "zh" ? "胜率估算" : "Win Chance"}
                  </p>
                  <p className="mt-1 font-mono text-base">{winChance}%</p>
                </div>
                <div className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                    {locale === "zh" ? "每日次数" : "Daily Limit"}
                  </p>
                  <p className="mt-1 font-mono text-base">
                    {boss.dailyChallengeLimit}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                    {locale === "zh" ? "剩余次数" : "Attempts Left"}
                  </p>
                  <p className="mt-1 font-mono text-base">{remainingChallenges}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3 text-sm leading-6 text-[#55715f]">
                {nextUnlockRegion ? (
                  <>
                    <p>
                      {locale === "zh"
                        ? `解锁目标：${getRegionName(nextUnlockRegion, locale)}`
                        : `Unlock target: ${getRegionName(nextUnlockRegion, locale)}`}
                    </p>
                    <p>
                      {locale === "zh"
                        ? `挑战门槛：战力 ${formatUiNumber(nextUnlockRegion.recommendedPower, locale)}`
                        : `Challenge gate: ${formatUiNumber(nextUnlockRegion.recommendedPower, locale)} power`}
                    </p>
                    <p>
                      {challengeGateMet
                        ? locale === "zh"
                          ? "你已经达到挑战标准，接下来只差真正击败守门 Boss。"
                          : "You have met the challenge gate. Now you still need the actual clear."
                        : locale === "zh"
                          ? "当前练度还不够，先继续刷装和提升战力再来挑战。"
                          : "Your build is not ready yet. Farm more power before attempting the gate."}
                    </p>
                  </>
                ) : (
                  <p>
                    {locale === "zh"
                      ? "这已经是当前版本主线最深处，没有新的区域需要解锁。"
                      : "This is the deepest main-route area in the current build."}
                  </p>
                )}
              </div>

              <p className="mt-4 text-sm leading-6 text-[#55715f]">
                {locale === "zh"
                  ? `累计通关 ${progress?.clearCount ?? 0} 次。`
                  : `Cleared ${progress?.clearCount ?? 0} total times.`}
              </p>

              <form action={challengeBossAction} className="mt-4">
                <button
                  type="submit"
                  disabled={remainingChallenges <= 0 || !challengeGateMet}
                  className="min-h-11 w-full rounded-2xl bg-[#204b36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#183a2a] disabled:cursor-not-allowed disabled:bg-[#89a898]"
                >
                  {remainingChallenges <= 0
                    ? locale === "zh"
                      ? "今日次数已用完"
                      : "No attempts left today"
                    : !challengeGateMet
                      ? locale === "zh"
                        ? "战力未达挑战标准"
                        : "Power below challenge gate"
                      : locale === "zh"
                        ? "挑战 Boss"
                        : "Challenge Boss"}
                </button>
              </form>
            </section>

            <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
              <h2 className="text-lg font-semibold text-[#183a2a]">
                {locale === "zh" ? "首胜奖励" : "Clear Rewards"}
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[#355645]">
                <div className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                    {locale === "zh" ? "金币" : "Gold"}
                  </p>
                  <p className="mt-1 font-mono text-base">
                    {formatUiNumber(boss.rewardGold, locale)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                    {locale === "zh" ? "经验" : "Exp"}
                  </p>
                  <p className="mt-1 font-mono text-base">
                    {formatUiNumber(boss.rewardExp, locale)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#55715f]">
                {locale === "zh" ? "材料奖励：" : "Material rewards: "}
                {boss.rewardMaterials
                  .map(
                    (material) =>
                      `${getMaterialName(material.materialId, locale)} x${material.amount}`,
                  )
                  .join(locale === "zh" ? "、" : ", ")}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#55715f]">
                {locale === "zh"
                  ? `额外装备掉落：${boss.rewardItemCount} 件。`
                  : `Bonus gear drops: ${boss.rewardItemCount}.`}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#55715f]">
                {nextUnlockRegion
                  ? locale === "zh"
                    ? `首胜可解锁：${getRegionName(nextUnlockRegion, locale)}。`
                    : `First clear unlocks: ${getRegionName(nextUnlockRegion, locale)}.`
                  : locale === "zh"
                    ? "这已经是当前版本的最终区域。"
                    : "This is the last region in the current build."}
              </p>
            </section>
          </>
        ) : (
          <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
            <h2 className="text-lg font-semibold text-[#183a2a]">
              {locale === "zh" ? "Boss 数据未就绪" : "Boss Data Missing"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#55715f]">
              {locale === "zh"
                ? "当前还没有找到与你进度匹配的 Boss。"
                : "No boss could be found for your current progression."}
            </p>
          </section>
        )
      ) : (
        <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#72906f]">
                {locale === "zh" ? "全服世界 Boss" : "Shared World Boss"}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[#183a2a]">
                {getWorldBossName(worldBoss, locale)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#55715f]">
                {getWorldBossDescription(worldBoss, locale)}
              </p>
            </div>

            <div className="rounded-full bg-[#e7f2e5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#315b43]">
              {worldBossStatus === "DEFEATED"
                ? locale === "zh"
                  ? "已击败"
                  : "Defeated"
                : locale === "zh"
                  ? "进行中"
                  : "Active"}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-[#355645]">
              <p>{locale === "zh" ? "共享生命" : "Shared HP"}</p>
              <p className="font-mono">
                {formatUiNumber(worldBossCurrentHp, locale)} /{" "}
                {formatUiNumber(worldBoss.maxHp, locale)}
              </p>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e6eee5]">
              <div
                className="h-full rounded-full bg-[#204b36] transition-all"
                style={{ width: `${worldBossPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[#355645]">
            <div className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                {locale === "zh" ? "今日次数" : "Daily Limit"}
              </p>
              <p className="mt-1 font-mono text-base">{worldBoss.dailyAttackLimit}</p>
            </div>
            <div className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                {locale === "zh" ? "剩余出手" : "Attacks Left"}
              </p>
              <p className="mt-1 font-mono text-base">{worldBossRemainingAttacks}</p>
            </div>
            <div className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                {locale === "zh" ? "你的总伤害" : "Your Damage"}
              </p>
              <p className="mt-1 font-mono text-base">
                {formatUiNumber(worldBossDamageDone, locale)}
              </p>
            </div>
            <div className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                {locale === "zh" ? "参与人数" : "Participants"}
              </p>
              <p className="mt-1 font-mono text-base">{worldBossParticipants}</p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-[#55715f]">
            {locale === "zh"
              ? `参与奖励：${formatUiNumber(worldBoss.rewardGold, locale)} 金币、${formatUiNumber(worldBoss.rewardExp, locale)} 经验，外加 ${worldBoss.rewardMaterials
                  .map(
                    (material) =>
                      `${getMaterialName(material.materialId, locale)} x${material.amount}`,
                  )
                  .join("、")}。`
              : `Participation rewards: ${formatUiNumber(worldBoss.rewardGold, locale)} gold, ${formatUiNumber(worldBoss.rewardExp, locale)} exp, plus ${worldBoss.rewardMaterials
                  .map(
                    (material) =>
                      `${getMaterialName(material.materialId, locale)} x${material.amount}`,
                  )
                  .join(", ")}.`}
          </p>

          <p className="mt-2 text-sm leading-6 text-[#55715f]">
            {worldBossLastHitPlayer?.name
              ? locale === "zh"
                ? `最后一击：${worldBossLastHitPlayer.name}`
                : `Final blow: ${worldBossLastHitPlayer.name}`
              : locale === "zh"
                ? "还没有人完成最后一击。"
                : "No final blow has been recorded yet."}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <form action={attackWorldBossAction}>
              <button
                type="submit"
                disabled={worldBossStatus === "DEFEATED" || worldBossRemainingAttacks <= 0}
                className="min-h-11 w-full rounded-2xl bg-[#7a4f1f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#633f18] disabled:cursor-not-allowed disabled:bg-[#baa188]"
              >
                {worldBossStatus === "DEFEATED"
                  ? locale === "zh"
                    ? "今天已经击败"
                    : "Already defeated today"
                  : worldBossRemainingAttacks > 0
                    ? locale === "zh"
                      ? "出手挑战"
                      : "Attack Now"
                    : locale === "zh"
                      ? "今日次数已用完"
                      : "No attacks left today"}
              </button>
            </form>

            <form action={claimWorldBossRewardAction}>
              <button
                type="submit"
                disabled={
                  worldBossStatus !== "DEFEATED" ||
                  !worldBossParticipated ||
                  worldBossRewardClaimed
                }
                className="min-h-11 w-full rounded-2xl bg-[#204b36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#183a2a] disabled:cursor-not-allowed disabled:bg-[#89a898]"
              >
                {worldBossRewardClaimed
                  ? locale === "zh"
                    ? "奖励已领取"
                    : "Reward Claimed"
                  : worldBossStatus === "DEFEATED" && worldBossParticipated
                    ? locale === "zh"
                      ? "领取参与奖励"
                      : "Claim Rewards"
                    : locale === "zh"
                      ? "等待击败后领取"
                      : "Defeat boss to claim"}
              </button>
            </form>
          </div>
        </section>
      )}
    </MobileShell>
  );
}
