import Link from "next/link";

import { MobileShell } from "@/components/layout/MobileShell";
import { getMaterialName } from "@/data/materials";
import { getDb } from "@/lib/db";
import { formatRarityLabel, type ItemRarity } from "@/lib/game/types";
import { formatUiDateTime, getLocale } from "@/lib/i18n";
import { requireCurrentPlayer } from "@/lib/player";

type LogsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type LogsView = "timeline" | "drops";

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

function normalizeLogsView(value: string | null): LogsView {
  return value === "drops" ? "drops" : "timeline";
}

function buildLogsHref(
  scope: string,
  category: string,
  view: LogsView,
  page: number,
) {
  const searchParams = new URLSearchParams();
  searchParams.set("scope", scope);
  searchParams.set("category", category);
  searchParams.set("view", view);
  searchParams.set("page", String(page));

  return `/logs?${searchParams.toString()}`;
}

function getLogTypeLabel(type: string, locale: "zh" | "en") {
  switch (type) {
    case "IDLE_CLAIM":
      return locale === "zh" ? "挂机结算" : "Idle Claim";
    case "BOSS_CHALLENGE":
      return locale === "zh" ? "Boss 挑战" : "Boss Challenge";
    case "BOSS_CLEAR":
      return locale === "zh" ? "Boss 首通" : "Boss First Clear";
    case "REGION_UNLOCK":
      return locale === "zh" ? "区域解锁" : "Region Unlock";
    case "RARE_DROP":
      return locale === "zh" ? "稀有掉落" : "Rare Drop";
    case "EQUIPMENT_ENHANCE":
      return locale === "zh" ? "装备强化" : "Equipment Enhance";
    case "MATERIAL_CRAFT":
      return locale === "zh" ? "材料合成" : "Material Craft";
    case "ITEM_DISMANTLE":
      return locale === "zh" ? "装备分解" : "Item Dismantle";
    case "EQUIPMENT_FORGE":
      return locale === "zh" ? "装备锻造" : "Equipment Forge";
    case "EQUIPMENT_REFORGE":
      return locale === "zh" ? "装备重铸" : "Equipment Reforge";
    case "WORLD_BOSS_ATTACK":
      return locale === "zh" ? "世界 Boss 出手" : "World Boss Attack";
    case "WORLD_BOSS_CLEAR":
      return locale === "zh" ? "世界 Boss 终结" : "World Boss Final Blow";
    case "WORLD_BOSS_REWARD":
      return locale === "zh" ? "世界 Boss 奖励" : "World Boss Reward";
    case "BLESSING":
      return locale === "zh" ? "好友祝福" : "Blessing";
    case "DAILY_TASK_CLAIM":
      return locale === "zh" ? "每日任务" : "Daily Task";
    default:
      return type.replaceAll("_", " ");
  }
}

function getLogCategory(type: string) {
  if (type === "IDLE_CLAIM") {
    return "idle";
  }

  if (
    [
      "BOSS_CHALLENGE",
      "BOSS_CLEAR",
      "REGION_UNLOCK",
      "WORLD_BOSS_ATTACK",
      "WORLD_BOSS_CLEAR",
      "WORLD_BOSS_REWARD",
    ].includes(type)
  ) {
    return "boss";
  }

  if (
    [
      "EQUIPMENT_ENHANCE",
      "MATERIAL_CRAFT",
      "ITEM_DISMANTLE",
      "EQUIPMENT_FORGE",
      "EQUIPMENT_REFORGE",
      "RARE_DROP",
    ].includes(type)
  ) {
    return "gear";
  }

  if (type === "BLESSING") {
    return "social";
  }

  return "other";
}

function parseLogPayload(
  payload: string | null,
  locale: "zh" | "en",
) {
  if (!payload) {
    return {
      materialSummary: "",
      itemSummary: "",
      hasRewards: false,
    };
  }

  try {
    const parsed = JSON.parse(payload) as {
      materials?: { materialId: string; amount: number }[];
      items?: { name: string; slot: string; rarity: string }[];
    };
    const materialSummary =
      parsed.materials
        ?.map(
          (material) =>
            `${getMaterialName(material.materialId, locale)} x${material.amount}`,
        )
        .join(locale === "zh" ? "、" : ", ") ?? "";
    const itemSummary =
      parsed.items
        ?.map(
          (item) =>
            `${item.name} (${formatRarityLabel(item.rarity as ItemRarity, locale)})`,
        )
        .join(locale === "zh" ? "、" : ", ") ?? "";

    return {
      materialSummary,
      itemSummary,
      hasRewards: Boolean(materialSummary || itemSummary),
    };
  } catch {
    return {
      materialSummary: "",
      itemSummary: "",
      hasRewards: false,
    };
  }
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const [{ player }, locale, params] = await Promise.all([
    requireCurrentPlayer(),
    getLocale(),
    searchParams,
  ]);
  const scope = readSearchParam(params, "scope") ?? "all";
  const category = readSearchParam(params, "category") ?? "all";
  const view = normalizeLogsView(readSearchParam(params, "view"));
  const currentPage = Math.max(1, Number(readSearchParam(params, "page") ?? "1"));

  const logs = await getDb().gameLog.findMany({
    where: {
      ...(scope === "mine"
        ? { playerId: player.id }
        : scope === "global"
          ? { playerId: null }
          : { OR: [{ playerId: player.id }, { playerId: null }] }),
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 80,
  });

  const categoryFilteredLogs =
    category === "all"
      ? logs
      : logs.filter((log) => getLogCategory(log.type) === category);
  const viewFilteredLogs =
    view === "drops"
      ? categoryFilteredLogs.filter((log) =>
          parseLogPayload(log.payload, locale).hasRewards,
        )
      : categoryFilteredLogs;
  const pageSize = view === "drops" ? 8 : 10;
  const totalPages = Math.max(1, Math.ceil(viewFilteredLogs.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const visibleLogs = viewFilteredLogs.slice((page - 1) * pageSize, page * pageSize);

  return (
    <MobileShell
      title={locale === "zh" ? "游戏日志" : "Game Logs"}
      subtitle={
        locale === "zh"
          ? "按时间或奖励回看最近发生了什么。"
          : "Review recent activity by timeline or by rewards."
      }
    >
      <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "timeline", zh: "时间线", en: "Timeline" },
            { id: "drops", zh: "奖励视图", en: "Rewards" },
          ].map((option) => {
            const isActive = view === option.id;

            return (
              <Link
                key={option.id}
                href={buildLogsHref(scope, category, option.id as LogsView, 1)}
                className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#204b36] text-white"
                    : "bg-[#eef3ee] text-[#4f6d59] hover:bg-[#e4ece4]"
                }`}
              >
                {locale === "zh" ? option.zh : option.en}
              </Link>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { id: "all", zh: "全部", en: "All" },
            { id: "mine", zh: "我的", en: "Mine" },
            { id: "global", zh: "全服", en: "Global" },
          ].map((option) => {
            const isActive = scope === option.id;

            return (
              <Link
                key={option.id}
                href={buildLogsHref(option.id, category, view, 1)}
                className={`inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#315b43] text-white"
                    : "bg-[#eef3ee] text-[#4f6d59] hover:bg-[#e4ece4]"
                }`}
              >
                {locale === "zh" ? option.zh : option.en}
              </Link>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { id: "all", zh: "全部事件", en: "All Events" },
            { id: "idle", zh: "挂机", en: "Idle" },
            { id: "boss", zh: "Boss", en: "Boss" },
            { id: "gear", zh: "装备", en: "Gear" },
            { id: "social", zh: "社交", en: "Social" },
          ].map((option) => {
            const isActive = category === option.id;

            return (
              <Link
                key={option.id}
                href={buildLogsHref(scope, option.id, view, 1)}
                className={`inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#7a4f1f] text-white"
                    : "bg-[#f3efe8] text-[#7a5a33] hover:bg-[#ebe4d8]"
                }`}
              >
                {locale === "zh" ? option.zh : option.en}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-[24px] border border-[#d9e7d8] bg-white/95 px-4 py-3 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
          <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
            {locale === "zh" ? "当前结果" : "Matches"}
          </p>
          <p className="mt-1 font-mono text-lg text-[#1f4936]">
            {viewFilteredLogs.length}
          </p>
        </div>
        <div className="rounded-[24px] border border-[#d9e7d8] bg-white/95 px-4 py-3 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
          <p className="text-xs uppercase tracking-[0.14em] text-[#6c8a72]">
            {locale === "zh" ? "当前页" : "Page"}
          </p>
          <p className="mt-1 font-mono text-lg text-[#1f4936]">
            {page} / {totalPages}
          </p>
        </div>
      </section>

      {visibleLogs.length > 0 ? (
        view === "timeline" ? (
          <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
            <div className="flex flex-col gap-3">
              {visibleLogs.map((log) => {
                const parsed = parseLogPayload(log.payload, locale);

                return (
                  <article
                    key={log.id}
                    className="rounded-2xl border border-[#e1ece0] bg-[#f8fbf7] px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#eef3ee] px-2.5 py-1 text-[11px] font-semibold text-[#51705c]">
                            {getLogTypeLabel(log.type, locale)}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              log.playerId === null
                                ? "bg-[#edf2ff] text-[#49609a]"
                                : "bg-[#fff4e8] text-[#8a5a24]"
                            }`}
                          >
                            {log.playerId === null
                              ? locale === "zh"
                                ? "全服"
                                : "Global"
                              : locale === "zh"
                                ? "我的"
                                : "Mine"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-[#183a2a]">
                          {log.message}
                        </p>
                        {parsed.materialSummary ? (
                          <p className="mt-1 text-xs leading-5 text-[#55715f]">
                            {locale === "zh" ? "材料：" : "Materials: "}
                            {parsed.materialSummary}
                          </p>
                        ) : null}
                        {parsed.itemSummary ? (
                          <p className="mt-1 text-xs leading-5 text-[#55715f]">
                            {locale === "zh" ? "装备：" : "Gear: "}
                            {parsed.itemSummary}
                          </p>
                        ) : null}
                      </div>

                      <p className="shrink-0 text-xs text-[#6b8771]">
                        {formatUiDateTime(log.createdAt, locale)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="grid grid-cols-2 gap-3">
            {visibleLogs.map((log) => {
              const parsed = parseLogPayload(log.payload, locale);

              return (
                <article
                  key={log.id}
                  className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-[#eef3ee] px-2.5 py-1 text-[11px] font-semibold text-[#51705c]">
                      {getLogTypeLabel(log.type, locale)}
                    </span>
                    <p className="text-[11px] text-[#6b8771]">
                      {formatUiDateTime(log.createdAt, locale)}
                    </p>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#183a2a]">
                    {log.message}
                  </p>
                  <div className="mt-3 space-y-2 text-xs leading-5 text-[#55715f]">
                    {parsed.materialSummary ? (
                      <p>
                        {locale === "zh" ? "材料：" : "Materials: "}
                        {parsed.materialSummary}
                      </p>
                    ) : null}
                    {parsed.itemSummary ? (
                      <p>
                        {locale === "zh" ? "装备：" : "Gear: "}
                        {parsed.itemSummary}
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        )
      ) : (
        <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
          <h2 className="text-lg font-semibold text-[#183a2a]">
            {locale === "zh" ? "还没有日志" : "No Logs Yet"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#55715f]">
            {locale === "zh"
              ? "换个分类试试，或者继续挂机、挑战 Boss、分解装备后再回来看看。"
              : "Try another filter, or come back after more idle claims, boss fights, or crafting."}
          </p>
        </section>
      )}

      <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-4 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={buildLogsHref(scope, category, view, Math.max(1, page - 1))}
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
            href={buildLogsHref(scope, category, view, Math.min(totalPages, page + 1))}
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
