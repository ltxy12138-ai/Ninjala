import Link from "next/link";

import {
  clearAllAccountsAction,
  grantTestResourcesAction,
  resetAllProgressAction,
  resetPlayerProgressAction,
} from "@/app/actions/admin";
import { MobileShell } from "@/components/layout/MobileShell";
import { materialDefinitions, getMaterialName } from "@/data/materials";
import { regionDefinitions, getRegionName } from "@/data/regions";
import { requireAdminToolsAccess } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { formatUiNumber, getLocale } from "@/lib/i18n";

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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

function getStatusMessage(
  section: string | null,
  status: string | null,
  code: string | null,
  target: string | null,
  locale: "zh" | "en",
) {
  if (status === "success") {
    switch (section) {
      case "reset-player":
        return locale === "zh"
          ? `已重置 ${target ?? "该玩家"} 的进度。`
          : `Reset progress for ${target ?? "that player"}.`;
      case "reset-all-progress":
        return locale === "zh"
          ? "已重置全服进度，账号仍然保留。"
          : "All player progress was reset and accounts were kept.";
      case "grant-resources":
        return locale === "zh"
          ? "测试资源已经发放。"
          : "Test resources were granted.";
      default:
        return locale === "zh" ? "操作已完成。" : "Action completed.";
    }
  }

  switch (code) {
    case "missing_player":
      return locale === "zh"
        ? "请先选择一个玩家。"
        : "Please choose a player first.";
    default:
      return locale === "zh"
        ? "管理操作失败，请重试。"
        : "Admin action failed. Please try again.";
  }
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [{ user }, locale, params] = await Promise.all([
    requireAdminToolsAccess(),
    getLocale(),
    searchParams,
  ]);
  const db = getDb();
  const players = await db.player.findMany({
    include: {
      user: true,
      _count: {
        select: {
          items: true,
          materials: true,
        },
      },
    },
    orderBy: [{ createdAt: "asc" }],
  });
  const section = readSearchParam(params, "section");
  const status = readSearchParam(params, "status");
  const code = readSearchParam(params, "code");
  const target = readSearchParam(params, "target");
  const selectedPlayerId = readSearchParam(params, "playerId") ?? players[0]?.id ?? "";

  return (
    <MobileShell
      title={locale === "zh" ? "测试管理台" : "Test Admin"}
      subtitle={
        locale === "zh"
          ? "只在测试环境开放，用来重置进度、补资源和清理账号。"
          : "A test-only console for resets, resource grants, and account cleanup."
      }
    >
      <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#183a2a]">
              {locale === "zh" ? "当前操作人" : "Current Operator"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#55715f]">
              {locale === "zh"
                ? `你正以 ${user.nickname} 的会话使用测试管理工具。`
                : `You are using the test admin tools as ${user.nickname}.`}
            </p>
          </div>

          <Link
            href="/home?tab=routes"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#eef3ee] px-4 py-3 text-sm font-semibold text-[#355645] transition hover:bg-[#e3ebe3]"
          >
            {locale === "zh" ? "回首页" : "Back Home"}
          </Link>
        </div>
      </section>

      {status ? (
        <section
          className={`rounded-[24px] border p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)] ${
            status === "success"
              ? "border-[#cfe5cf] bg-[#edf8ed] text-[#1f4936]"
              : "border-[#f2d5d0] bg-[#fff3f1] text-[#8c372b]"
          }`}
        >
          <h2 className="text-lg font-semibold">
            {status === "success"
              ? locale === "zh"
                ? "管理动作已完成"
                : "Admin Action Completed"
              : locale === "zh"
                ? "管理动作失败"
                : "Admin Action Failed"}
          </h2>
          <p className="mt-2 text-sm leading-6">
            {getStatusMessage(section, status, code, target, locale)}
          </p>
        </section>
      ) : null}

      <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
        <h2 className="text-lg font-semibold text-[#183a2a]">
          {locale === "zh" ? "玩家总览" : "Player Overview"}
        </h2>
        <div className="mt-4 grid gap-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="rounded-[22px] border border-[#deeadc] bg-[#f8fbf7] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-[#183a2a]">
                    {player.user.nickname}
                  </p>
                  <p className="mt-1 text-sm text-[#5b7765]">
                    @{player.user.username}
                  </p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6c8a72]">
                  {locale === "zh" ? "玩家" : "Player"}
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-[#355645]">
                <p>
                  {locale === "zh" ? "金币" : "Gold"}:
                  {" "}
                  {formatUiNumber(player.gold, locale)}
                </p>
                <p>
                  EXP:
                  {" "}
                  {formatUiNumber(player.exp, locale)}
                </p>
                <p>
                  {locale === "zh" ? "等级" : "Level"}:
                  {" "}
                  {player.level}
                </p>
                <p>
                  {locale === "zh" ? "战力" : "Power"}:
                  {" "}
                  {formatUiNumber(player.power, locale)}
                </p>
                <p>
                  {locale === "zh" ? "当前区域" : "Region"}:
                  {" "}
                  {getRegionName(
                    regionDefinitions.find((region) => region.id === player.currentRegionId) ??
                      regionDefinitions[0],
                    locale,
                  )}
                </p>
                <p>
                  {locale === "zh" ? "装备/材料格" : "Items/Stacks"}:
                  {" "}
                  {player._count.items}/{player._count.materials}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
        <h2 className="text-lg font-semibold text-[#183a2a]">
          {locale === "zh" ? "重置单个玩家" : "Reset One Player"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#55715f]">
          {locale === "zh"
            ? "清空目标玩家的金币、经验、材料、装备、Boss 进度和个人日志，但保留账号本身。"
            : "Clear one player's gold, exp, materials, items, boss progress, and personal logs while keeping the account."}
        </p>
        <form action={resetPlayerProgressAction} className="mt-4 space-y-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-[#285038]">
            {locale === "zh" ? "目标玩家" : "Target Player"}
            <select
              name="playerId"
              defaultValue={selectedPlayerId}
              className="h-12 rounded-2xl border border-[#c7d9c8] bg-white px-4 text-base outline-none transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#92c47c]"
            >
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.user.nickname} (@{player.user.username})
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="flex min-h-11 items-center justify-center rounded-2xl bg-[#204b36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#183a2a]"
          >
            {locale === "zh" ? "重置该玩家" : "Reset Player"}
          </button>
        </form>
      </section>

      <section className="rounded-[24px] border border-[#d9e7d8] bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,58,42,0.08)]">
        <h2 className="text-lg font-semibold text-[#183a2a]">
          {locale === "zh" ? "补测试资源 / 跳进度" : "Grant Test Resources / Skip Ahead"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#55715f]">
          {locale === "zh"
            ? "给指定玩家补金币、经验、等级、挂机时间和材料，也能直接解锁或切换区域。"
            : "Grant gold, exp, levels, idle time, and materials, or directly unlock and switch regions."}
        </p>
        <form action={grantTestResourcesAction} className="mt-4 space-y-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-[#285038]">
            {locale === "zh" ? "目标玩家" : "Target Player"}
            <select
              name="playerId"
              defaultValue={selectedPlayerId}
              className="h-12 rounded-2xl border border-[#c7d9c8] bg-white px-4 text-base outline-none transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#92c47c]"
            >
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.user.nickname} (@{player.user.username})
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2 text-sm font-medium text-[#285038]">
              Gold
              <input
                type="number"
                min="0"
                name="gold"
                defaultValue="0"
                className="h-12 rounded-2xl border border-[#c7d9c8] bg-white px-4 text-base outline-none transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#92c47c]"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-[#285038]">
              EXP
              <input
                type="number"
                min="0"
                name="exp"
                defaultValue="0"
                className="h-12 rounded-2xl border border-[#c7d9c8] bg-white px-4 text-base outline-none transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#92c47c]"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-[#285038]">
              {locale === "zh" ? "补等级" : "Level Delta"}
              <input
                type="number"
                min="0"
                name="levelDelta"
                defaultValue="0"
                className="h-12 rounded-2xl border border-[#c7d9c8] bg-white px-4 text-base outline-none transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#92c47c]"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-[#285038]">
              {locale === "zh" ? "补挂机分钟" : "Idle Minutes"}
              <input
                type="number"
                min="0"
                name="idleMinutes"
                defaultValue="0"
                className="h-12 rounded-2xl border border-[#c7d9c8] bg-white px-4 text-base outline-none transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#92c47c]"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2 text-sm font-medium text-[#285038]">
              {locale === "zh" ? "解锁区域" : "Unlock Region"}
              <select
                name="unlockRegionId"
                defaultValue=""
                className="h-12 rounded-2xl border border-[#c7d9c8] bg-white px-4 text-base outline-none transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#92c47c]"
              >
                <option value="">{locale === "zh" ? "不改动" : "No change"}</option>
                {regionDefinitions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {getRegionName(region, locale)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-[#285038]">
              {locale === "zh" ? "切换当前区域" : "Set Current Region"}
              <select
                name="currentRegionId"
                defaultValue=""
                className="h-12 rounded-2xl border border-[#c7d9c8] bg-white px-4 text-base outline-none transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#92c47c]"
              >
                <option value="">{locale === "zh" ? "不改动" : "No change"}</option>
                {regionDefinitions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {getRegionName(region, locale)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-[22px] border border-[#deeadc] bg-[#f8fbf7] p-4">
            <h3 className="text-sm font-semibold text-[#183a2a]">
              {locale === "zh" ? "材料补给" : "Material Grants"}
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {materialDefinitions.map((material) => (
                <label
                  key={material.id}
                  className="flex flex-col gap-2 text-sm font-medium text-[#285038]"
                >
                  {getMaterialName(material.id, locale)}
                  <input
                    type="number"
                    min="0"
                    name={`material_${material.id}`}
                    defaultValue="0"
                    className="h-12 rounded-2xl border border-[#c7d9c8] bg-white px-4 text-base outline-none transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#92c47c]"
                  />
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="flex min-h-11 items-center justify-center rounded-2xl bg-[#204b36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#183a2a]"
          >
            {locale === "zh" ? "发放资源" : "Grant Resources"}
          </button>
        </form>
      </section>

      <section className="rounded-[24px] border border-[#ead0ca] bg-white/95 p-5 shadow-[0_16px_40px_rgba(140,55,43,0.08)]">
        <h2 className="text-lg font-semibold text-[#7d2f24]">
          {locale === "zh" ? "危险操作" : "Danger Zone"}
        </h2>
        <div className="mt-4 space-y-4">
          <form action={resetAllProgressAction} className="rounded-[22px] border border-[#f0dbd6] bg-[#fff7f5] p-4">
            <h3 className="text-sm font-semibold text-[#7d2f24]">
              {locale === "zh" ? "重置全服进度" : "Reset All Progress"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#9a4d41]">
              {locale === "zh"
                ? "保留账号，但清空所有玩家的进度、材料、装备、日志和 Boss 记录。"
                : "Keep accounts but clear every player's progress, materials, items, logs, and boss records."}
            </p>
            <button
              type="submit"
              className="mt-4 flex min-h-11 items-center justify-center rounded-2xl bg-[#a64636] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#913728]"
            >
              {locale === "zh" ? "重置全服进度" : "Reset All Progress"}
            </button>
          </form>

          <form action={clearAllAccountsAction} className="rounded-[22px] border border-[#f0dbd6] bg-[#fff7f5] p-4">
            <h3 className="text-sm font-semibold text-[#7d2f24]">
              {locale === "zh" ? "清空所有账号" : "Clear All Accounts"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#9a4d41]">
              {locale === "zh"
                ? "删除所有用户和玩家数据，只保留邀请码池。执行后当前会话也会退出。"
                : "Delete every user and player record while keeping the invite pool. Your current session will also be signed out."}
            </p>
            <button
              type="submit"
              className="mt-4 flex min-h-11 items-center justify-center rounded-2xl bg-[#8a2f23] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#732419]"
            >
              {locale === "zh" ? "清空账号" : "Clear Accounts"}
            </button>
          </form>
        </div>
      </section>
    </MobileShell>
  );
}
