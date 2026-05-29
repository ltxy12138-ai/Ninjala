import Link from "next/link";

import {
  changeIdleRegionAction,
  claimIdleRewardsAction,
} from "@/app/actions/idle";
import { ActionModal } from "@/components/game/ActionModal";
import { PlayerSummary } from "@/components/game/PlayerSummary";
import { SubmitButton } from "@/components/game/SubmitButton";
import { MobileShell } from "@/components/layout/MobileShell";
import { getMaterialDescription, getMaterialName } from "@/data/materials";
import { getRegionDescription, getRegionName } from "@/data/regions";
import { getDb } from "@/lib/db";
import {
  calculateIdleRewards,
  deserializeMaterials,
  formatMinutes,
} from "@/lib/game/idle";
import { normalizeUnlockedRegionIds } from "@/lib/game/progression";
import { listRegionsForPlayer } from "@/lib/game/regions";
import { getCurrentTimeMs } from "@/lib/time";
import { formatRarityLabel, type ItemRarity } from "@/lib/game/types";
import { formatUiDateTime, getLocale } from "@/lib/i18n";
import { requireCurrentPlayer } from "@/lib/player";

type IdlePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type IdleTab = "overview" | "regions" | "materials";

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

function normalizeIdleTab(value: string | null): IdleTab {
  switch (value) {
    case "regions":
    case "materials":
      return value;
    default:
      return "overview";
  }
}

function buildIdleHref(tab: IdleTab, regionView: string | null) {
  const searchParams = new URLSearchParams();
  searchParams.set("tab", tab);

  if (regionView) {
    searchParams.set("regionView", regionView);
  }

  return `/idle?${searchParams.toString()}`;
}

function getIdleErrorMessage(code: string | null, locale: "zh" | "en") {
  switch (code) {
    case "NOT_READY":
      return locale === "zh"
        ? "离线时间至少满 1 分钟后才能领取收益。"
        : "Rewards need at least 1 full minute of offline time before they can be claimed.";
    case "POWER_GATE":
      return locale === "zh"
        ? "这个区域还没有解锁，或者你的战力还不够。"
        : "This region is either locked or your power is still too low.";
    case "DUPLICATE_CLAIM":
      return locale === "zh"
        ? "这一段挂机收益已经领取过了，请刷新后再试。"
        : "That reward window was already claimed. Refresh and try again later.";
    case "REGION_NOT_FOUND":
      return locale === "zh"
        ? "选中的挂机区域不存在了。"
        : "The selected region no longer exists.";
    case "PLAYER_NOT_FOUND":
      return locale === "zh"
        ? "玩家存档读取失败。"
        : "Player save data could not be loaded.";
    default:
      return locale === "zh"
        ? code && code !== "UNKNOWN"
          ? `发生了一点问题，请稍后重试。错误代码：${code}`
          : "发生了一点问题，请稍后重试。"
        : code && code !== "UNKNOWN"
          ? `Something went wrong. Please try again. Error code: ${code}`
          : "Something went wrong. Please try again.";
  }
}

function getIdleErrorTitle(code: string | null, locale: "zh" | "en") {
  switch (code) {
    case "NOT_READY":
      return locale === "zh" ? "还没到领取时间" : "Not Ready Yet";
    case "DUPLICATE_CLAIM":
      return locale === "zh" ? "这段收益已经领过" : "Already Claimed";
    case "PLAYER_NOT_FOUND":
    case "REGION_NOT_FOUND":
      return locale === "zh" ? "存档读取失败" : "Save Read Failed";
    default:
      return locale === "zh" ? "操作被拦截" : "Action Blocked";
  }
}

function deserializeItemNames(serialized: string | null) {
  if (!serialized) {
    return [];
  }

  return serialized
    .split("|")
    .map((entry) => {
      const separatorIndex = entry.indexOf(":");

      if (separatorIndex === -1) {
        return null;
      }

      return {
        rarity: entry.slice(0, separatorIndex),
        name: entry.slice(separatorIndex + 1),
      };
    })
    .filter(
      (entry): entry is { rarity: string; name: string } => entry !== null,
    );
}

export default async function IdlePage({ searchParams }: IdlePageProps) {
  const [{ player, user }, params, locale] = await Promise.all([
    requireCurrentPlayer(),
    searchParams,
    getLocale(),
  ]);

  const db = getDb();
  const [materialStacks, unlockedRows] = await Promise.all([
    db.materialStack.findMany({
      where: { playerId: player.id },
      orderBy: [{ amount: "desc" }, { materialId: "asc" }],
    }),
    db.playerUnlockedRegion.findMany({
      where: { playerId: player.id },
      select: { regionId: true },
    }),
  ]);

  const unlockedRegionIds = normalizeUnlockedRegionIds(
    unlockedRows.map((row) => row.regionId),
    player.currentRegionId,
  );
  const regions = listRegionsForPlayer(
    player.power,
    unlockedRegionIds,
    player.currentRegionId,
  );
  const activeRegion = regions.find((region) => region.isActive) ?? regions[0];
  const selectedTab = normalizeIdleTab(readSearchParam(params, "tab"));
  const regionViewId = readSearchParam(params, "regionView");
  const selectedRegion =
    regions.find((region) => region.id === regionViewId) ?? activeRegion;
  const serverNowMs = getCurrentTimeMs();
  const preview = calculateIdleRewards(
    activeRegion,
    serverNowMs - player.lastClaimAt.getTime(),
  );

  const claimStatus = readSearchParam(params, "claim");
  const regionChangeStatus = readSearchParam(params, "regionChange");
  const errorCode = readSearchParam(params, "error");
  const claimedMaterials = deserializeMaterials(readSearchParam(params, "materials"));
  const claimedItems = deserializeItemNames(readSearchParam(params, "items"));
  const claimedMinutes = Number(readSearchParam(params, "minutes") ?? "0");
  const claimedGold = Number(readSearchParam(params, "gold") ?? "0");
  const claimedExp = Number(readSearchParam(params, "exp") ?? "0");
  const changedRegionId = readSearchParam(params, "region");
  const changedRegion = regions.find((region) => region.id === changedRegionId);
  const topMaterials = materialStacks.slice(0, 4);

  return (
    <MobileShell
      title={locale === "zh" ? "挂机区域" : "Idle Regions"}
      subtitle={
        locale === "zh"
          ? "先看这轮收益，再决定要不要换图继续刷。"
          : "Review this round of gains first, then decide whether to keep farming or switch routes."
      }
    >
      <PlayerSummary
        nickname={user.nickname}
        level={player.level}
        exp={player.exp}
        gold={player.gold}
        power={player.power}
        currentRegionId={getRegionName(activeRegion, locale)}
        locale={locale}
      />

      <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: "overview", zh: "总览", en: "Overview" },
            { id: "regions", zh: "区域", en: "Regions" },
            { id: "materials", zh: "材料", en: "Materials" },
          ] as const).map((tab) => {
            const isActive = selectedTab === tab.id;

            return (
              <Link
                key={tab.id}
                href={buildIdleHref(tab.id, selectedRegion.id)}
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

      {claimStatus === "success" ? (
        <ActionModal
          title={locale === "zh" ? "领取完成" : "Claim Complete"}
          closeHref={buildIdleHref(selectedTab, selectedRegion.id)}
          closeLabel={locale === "zh" ? "关闭" : "Close"}
        >
          <p>
            {locale === "zh"
              ? `本次累计 ${formatMinutes(claimedMinutes)}，获得 ${claimedGold} 金币和 ${claimedExp} 经验。`
              : `You collected ${formatMinutes(claimedMinutes)}, gained ${claimedGold} gold and ${claimedExp} exp.`}
          </p>
          <p>
            {locale === "zh" ? "材料：" : "Materials: "}
            {claimedMaterials.length > 0
              ? claimedMaterials
                  .map(
                    (material) =>
                      `${getMaterialName(material.materialId, locale)} x${material.amount}`,
                  )
                  .join(", ")
              : locale === "zh"
                ? "这次没有材料。"
                : "No materials this time."}
          </p>
          <p>
            {locale === "zh" ? "装备：" : "Gear: "}
            {claimedItems.length > 0
              ? claimedItems
                  .map(
                    (item) =>
                      `${item.name} (${formatRarityLabel(item.rarity as ItemRarity, locale)})`,
                  )
                  .join(", ")
              : locale === "zh"
                ? "这次没有装备掉落。"
                : "No equipment this time."}
          </p>
        </ActionModal>
      ) : null}

      {regionChangeStatus === "success" && changedRegion ? (
        <section className="rounded-[24px] border border-[#d7e6d5] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
          <h2 className="text-lg font-semibold text-[#183a2a]">
            {locale === "zh" ? "挂机区域已切换" : "Active Region Updated"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#55715f]">
            {locale === "zh"
              ? `你现在正在 ${getRegionName(changedRegion, locale)} 挂机。`
              : `You are now farming in ${getRegionName(changedRegion, locale)}.`}
          </p>
        </section>
      ) : null}

      {(claimStatus === "error" || regionChangeStatus === "error") && errorCode ? (
        <section className="rounded-[24px] border border-[#f2d5d0] bg-[#fff3f1] p-5 shadow-[0_16px_40px_rgba(24,58,42,0.06)]">
          <h2 className="text-lg font-semibold text-[#8c372b]">
            {getIdleErrorTitle(errorCode, locale)}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#9b4b3f]">
            {getIdleErrorMessage(errorCode, locale)}
          </p>
        </section>
      ) : null}

      {selectedTab === "overview" ? (
        <>
          <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#183a2a]">
                  {locale === "zh" ? "待领取收益" : "Ready to Claim"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#55715f]">
                  {locale === "zh" ? "当前区域：" : "Active area: "}
                  {getRegionName(activeRegion, locale)}
                </p>
                <p className="text-sm leading-6 text-[#55715f]">
                  {locale === "zh" ? "累计时长：" : "Stored time: "}
                  {formatMinutes(preview.claimableMinutes)}
                  {preview.claimableMinutes >= 12 * 60
                    ? locale === "zh"
                      ? "（已到 12 小时上限）"
                      : " (storage cap reached)"
                    : ""}
                </p>
              </div>

              <form action={claimIdleRewardsAction}>
                <input type="hidden" name="tab" value={selectedTab} />
                <input type="hidden" name="regionView" value={selectedRegion.id} />
                <SubmitButton
                  disabled={preview.claimableMinutes < 1}
                  idleLabel={locale === "zh" ? "领取收益" : "Claim Rewards"}
                  pendingLabel={locale === "zh" ? "正在领取..." : "Claiming..."}
                  className="min-h-11 rounded-2xl bg-[#204b36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#183a2a] disabled:cursor-not-allowed disabled:bg-[#89a898]"
                />
              </form>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[#355645]">
              <div className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                  {locale === "zh" ? "金币预览" : "Gold Preview"}
                </p>
                <p className="mt-1 font-mono text-base">+{preview.gold}</p>
              </div>
              <div className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                  {locale === "zh" ? "经验预览" : "Exp Preview"}
                </p>
                <p className="mt-1 font-mono text-base">+{preview.exp}</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#55715f]">
              {locale === "zh" ? "材料预览：" : "Materials: "}
              {preview.materials.length > 0
                ? preview.materials
                    .map(
                      (material) =>
                        `${getMaterialName(material.materialId, locale)} x${material.amount}`,
                    )
                    .join(", ")
                : locale === "zh"
                  ? "暂时还没有。"
                  : "No materials yet."}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#72906f]">
              {locale === "zh" ? "上次结算 " : "Last settled "}
              {formatUiDateTime(player.lastClaimAt, locale)}
            </p>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                {locale === "zh" ? "当前区域战力门槛" : "Power Gate"}
              </p>
              <p className="mt-1 font-mono text-lg text-[#1f4936]">
                {activeRegion.recommendedPower}
              </p>
            </div>
            <div className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                {locale === "zh" ? "每分钟收益" : "Per Minute"}
              </p>
              <p className="mt-1 font-mono text-lg text-[#1f4936]">
                {activeRegion.goldPerMinute}/{activeRegion.expPerMinute}
              </p>
            </div>
          </section>

          <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#183a2a]">
                  {getRegionName(selectedRegion, locale)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#55715f]">
                  {getRegionDescription(selectedRegion, locale)}
                </p>
              </div>
              <Link
                href={buildIdleHref("regions", selectedRegion.id)}
                className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full bg-[#eef3ee] px-4 text-sm font-semibold text-[#4f6d59]"
              >
                {locale === "zh" ? "查看区域" : "View Regions"}
              </Link>
            </div>
          </section>

          <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold text-[#183a2a]">
                {locale === "zh" ? "材料快照" : "Material Snapshot"}
              </h2>
              <Link
                href={buildIdleHref("materials", selectedRegion.id)}
                className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full bg-[#eef3ee] px-4 text-sm font-semibold text-[#4f6d59]"
              >
                {locale === "zh" ? "看全部" : "View All"}
              </Link>
            </div>
            {topMaterials.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {topMaterials.map((stack) => (
                  <div
                    key={stack.materialId}
                    className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-[#183a2a]">
                      {getMaterialName(stack.materialId, locale)}
                    </p>
                    <p className="mt-2 font-mono text-base text-[#1f4936]">
                      x{stack.amount}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[#55715f]">
                {locale === "zh"
                  ? "还没有积累材料，先去领取一次挂机收益吧。"
                  : "No materials collected yet. Claim once to start building a stash."}
              </p>
            )}
          </section>
        </>
      ) : null}

      {selectedTab === "regions" ? (
        <>
          <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
            <div className="grid grid-cols-2 gap-2">
              {regions.map((region) => {
                const isSelected = selectedRegion.id === region.id;

                return (
                  <Link
                    key={region.id}
                    href={buildIdleHref("regions", region.id)}
                    className={`flex min-h-24 flex-col justify-between rounded-2xl border p-3 transition ${
                      isSelected
                        ? "border-[#204b36] bg-[#edf8ed]"
                        : "border-[#dfeadf] bg-[#f8fbf7] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full bg-[#eef3ee] px-2.5 py-1 text-[11px] font-semibold text-[#51705c]">
                        {getRegionName(region, locale)}
                      </span>
                      <span className="text-[11px] font-semibold text-[#55715f]">
                        {region.isActive
                          ? locale === "zh"
                            ? "当前"
                            : "Active"
                          : !region.isUnlocked
                            ? locale === "zh"
                              ? "未解锁"
                              : "Locked"
                            : region.isAccessible
                              ? locale === "zh"
                                ? "可用"
                                : "Ready"
                              : locale === "zh"
                                ? "战力不足"
                                : "Need Power"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#55715f]">
                      {locale === "zh" ? "门槛 " : "Gate "}
                      {region.recommendedPower}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#183a2a]">
                  {getRegionName(selectedRegion, locale)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#55715f]">
                  {getRegionDescription(selectedRegion, locale)}
                </p>
              </div>

              <div className="rounded-full bg-[#e7f2e5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#315b43]">
                {selectedRegion.isActive
                  ? locale === "zh"
                    ? "当前"
                    : "Active"
                  : !selectedRegion.isUnlocked
                    ? locale === "zh"
                      ? "未解锁"
                      : "Locked"
                    : selectedRegion.isAccessible
                      ? locale === "zh"
                        ? "可切换"
                        : "Switchable"
                      : locale === "zh"
                        ? "战力不足"
                        : "Need Power"}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[#355645]">
              <div className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                  {locale === "zh" ? "战力门槛" : "Power Gate"}
                </p>
                <p className="mt-1 font-mono text-base">
                  {selectedRegion.recommendedPower}
                </p>
              </div>
              <div className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
                  {locale === "zh" ? "每分钟" : "Per Minute"}
                </p>
                <p className="mt-1 font-mono text-base">
                  {selectedRegion.goldPerMinute}
                  {locale === "zh" ? " 金 / " : "g / "}
                  {selectedRegion.expPerMinute}
                  {locale === "zh" ? " 经验" : "xp"}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#55715f]">
              {locale === "zh" ? "每小时材料：" : "Hourly materials: "}
              {selectedRegion.materialRates
                .map(
                  (rate) =>
                    `${getMaterialName(rate.materialId, locale)} x${rate.amountPerHour}`,
                )
                .join(", ")}
            </p>

            <form action={changeIdleRegionAction} className="mt-4">
              <input type="hidden" name="regionId" value={selectedRegion.id} />
              <input type="hidden" name="tab" value={selectedTab} />
              <input type="hidden" name="regionView" value={selectedRegion.id} />
              <button
                type="submit"
                disabled={selectedRegion.isActive || !selectedRegion.isAccessible}
                className={`min-h-11 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  selectedRegion.isActive
                    ? "bg-[#d8e8d7] text-[#51705c]"
                    : selectedRegion.isAccessible
                      ? "bg-[#204b36] text-white hover:bg-[#183a2a]"
                      : "bg-[#eef3ee] text-[#7f9787]"
                } disabled:cursor-not-allowed`}
              >
                {selectedRegion.isActive
                  ? locale === "zh"
                    ? "正在挂机"
                    : "Currently active"
                  : !selectedRegion.isUnlocked
                    ? locale === "zh"
                      ? "先击败前一位 Boss"
                      : "Beat the previous boss first"
                    : selectedRegion.isAccessible
                      ? locale === "zh"
                        ? "切换到这里"
                        : "Farm here"
                      : locale === "zh"
                        ? "战力不足"
                        : "Need more power"}
              </button>
            </form>
          </section>
        </>
      ) : null}

      {selectedTab === "materials" ? (
        <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
          <h2 className="text-lg font-semibold text-[#183a2a]">
            {locale === "zh" ? "材料仓库" : "Material Stash"}
          </h2>
          {materialStacks.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {materialStacks.map((stack) => (
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
              {locale === "zh"
                ? "还没有积累材料，先去领取一次挂机收益吧。"
                : "No materials collected yet. Claim from any region to start building a stash."}
            </p>
          )}
        </section>
      ) : null}
    </MobileShell>
  );
}
