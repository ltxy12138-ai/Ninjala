"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { BossBattleSummary } from "@/lib/game/boss";

type BossBattleModalProps = {
  summary: BossBattleSummary;
  closeHref: string;
  closeLabel: string;
  locale: "zh" | "en";
};

function getTurnTone(actor: "system" | "player" | "boss", emphasis?: string) {
  if (emphasis === "crit") {
    return "border-[#d6c179] bg-[#fff9e7] text-[#795c12]";
  }

  if (emphasis === "reward" || emphasis === "unlock") {
    return "border-[#cfe5cf] bg-[#edf8ed] text-[#315b43]";
  }

  if (emphasis === "danger" || actor === "boss") {
    return "border-[#f1ddd5] bg-[#fff4f1] text-[#8b4338]";
  }

  if (actor === "player") {
    return "border-[#d6e7d4] bg-[#f4fbf3] text-[#315b43]";
  }

  return "border-[#e1ece0] bg-[#f8fbf7] text-[#55715f]";
}

function getHpPercent(current: number, start: number) {
  if (start <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((current / start) * 100)));
}

export function BossBattleModal({
  summary,
  closeHref,
  closeLabel,
  locale,
}: BossBattleModalProps) {
  const [visibleTurns, setVisibleTurns] = useState(1);

  useEffect(() => {
    if (summary.battleTurns.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setVisibleTurns((current) => {
        if (current >= summary.battleTurns.length) {
          window.clearInterval(timer);

          return current;
        }

        return current + 1;
      });
    }, 650);

    return () => window.clearInterval(timer);
  }, [summary.battleTurns.length]);

  const activeTurn =
    summary.battleTurns[Math.min(visibleTurns - 1, summary.battleTurns.length - 1)] ?? null;
  const currentPlayerHp = activeTurn?.playerHp ?? summary.playerStartHp;
  const currentBossHp = activeTurn?.bossHp ?? summary.bossStartHp;
  const playbackFinished = visibleTurns >= summary.battleTurns.length;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-end justify-center bg-[#16351f]/24 p-4 sm:items-center">
      <div className="pointer-events-auto w-full max-w-2xl rounded-[28px] border border-[#d9e7d8] bg-white p-5 shadow-[0_22px_70px_rgba(24,58,42,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#183a2a]">
              {summary.didWin
                ? locale === "zh"
                  ? "挑战成功"
                  : "Victory"
                : locale === "zh"
                  ? "挑战失败"
                  : "Defeat"}
            </h2>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
              {playbackFinished
                ? locale === "zh"
                  ? "回放完成"
                  : "Replay Complete"
                : locale === "zh"
                  ? "战斗演出中"
                  : "Battle Replay"}
            </p>
          </div>

          <Link
            href={closeHref}
            scroll={false}
            className="rounded-full bg-[#eef3ee] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#4f6d59] transition hover:bg-[#e2ebe1]"
          >
            {closeLabel}
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <article className="rounded-[24px] border border-[#d9e7d8] bg-[#f8fbf7] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                  {locale === "zh" ? "己方" : "You"}
                </p>
                <h3 className="mt-1 text-base font-semibold text-[#183a2a]">
                  {summary.playerName}
                </h3>
                <p className="mt-1 text-sm text-[#55715f]">{summary.playerStyle}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                  {locale === "zh" ? "战力" : "Power"}
                </p>
                <p className="mt-1 font-mono text-base text-[#1f4936]">
                  {summary.playerPower}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-[#355645]">
                <p>HP</p>
                <p className="font-mono">
                  {currentPlayerHp} / {summary.playerStartHp}
                </p>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#dce9dc]">
                <div
                  className="h-full rounded-full bg-[#2f6a49] transition-all duration-500"
                  style={{
                    width: `${getHpPercent(currentPlayerHp, summary.playerStartHp)}%`,
                  }}
                />
              </div>
            </div>
          </article>

          <article className="rounded-[24px] border border-[#ead8d0] bg-[#fff8f6] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[#9d6b5a]">
                  {locale === "zh" ? "敌方" : "Enemy"}
                </p>
                <h3 className="mt-1 text-base font-semibold text-[#4e2f28]">
                  {summary.bossName}
                </h3>
                <p className="mt-1 text-sm text-[#7a564b]">{summary.bossStyle}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.14em] text-[#9d6b5a]">
                  {locale === "zh" ? "战力" : "Power"}
                </p>
                <p className="mt-1 font-mono text-base text-[#6f4137]">
                  {summary.bossPower}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-[#7a564b]">
                <p>HP</p>
                <p className="font-mono">
                  {currentBossHp} / {summary.bossStartHp}
                </p>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#f0dfd8]">
                <div
                  className="h-full rounded-full bg-[#a45c4d] transition-all duration-500"
                  style={{
                    width: `${getHpPercent(currentBossHp, summary.bossStartHp)}%`,
                  }}
                />
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-[#8a5e53]">
              {locale === "zh" ? "战场：" : "Region: "}
              {summary.regionName}
              {summary.unlockTargetName
                ? locale === "zh"
                  ? ` · 解锁目标 ${summary.unlockTargetName}`
                  : ` · Unlock target ${summary.unlockTargetName}`
                : ""}
            </p>
          </article>
        </div>

        <div className="mt-4 rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#4f6d59]">
              {locale === "zh" ? "战斗过程" : "Battle Log"}
            </h3>
            <p className="text-xs text-[#6c8a72]">
              {visibleTurns}/{summary.battleTurns.length}
            </p>
          </div>

          <div className="mt-3 space-y-2">
            {summary.battleTurns.slice(0, visibleTurns).map((turn, index) => (
              <article
                key={`${turn.actor}-${index}`}
                className={`rounded-2xl border px-4 py-3 text-sm leading-6 transition ${getTurnTone(turn.actor, turn.emphasis)}`}
              >
                <p>{turn.message}</p>
              </article>
            ))}
          </div>
        </div>

        {playbackFinished ? (
          <div className="mt-4 rounded-[24px] border border-[#d9e7d8] bg-[#f8fbf7] p-4 text-sm leading-6 text-[#55715f]">
            {summary.didWin ? (
              <>
                <p>
                  {locale === "zh"
                    ? `奖励：${summary.rewardSummary.gold} 金币、${summary.rewardSummary.exp} 经验。`
                    : `Rewards: ${summary.rewardSummary.gold} gold and ${summary.rewardSummary.exp} exp.`}
                </p>
                <p>
                  {locale === "zh" ? "材料：" : "Materials: "}
                  {summary.rewardSummary.materials.length > 0
                    ? summary.rewardSummary.materials.join(locale === "zh" ? "、" : ", ")
                    : locale === "zh"
                      ? "无"
                      : "none"}
                </p>
                <p>
                  {locale === "zh" ? "装备：" : "Gear: "}
                  {summary.rewardSummary.items.length > 0
                    ? summary.rewardSummary.items.join(locale === "zh" ? "、" : ", ")
                    : locale === "zh"
                      ? "无"
                      : "none"}
                </p>
                {summary.rewardSummary.unlockText ? (
                  <p className="font-semibold text-[#315b43]">
                    {summary.rewardSummary.unlockText}
                  </p>
                ) : null}
              </>
            ) : (
              <p>
                {locale === "zh"
                  ? "这次没有突破守门战，继续提升装备和战力后再回来挑战。"
                  : "You did not break through this gatekeeper fight. Build stronger gear and return later."}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
