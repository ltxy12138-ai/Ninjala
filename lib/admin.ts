import "server-only";

import { notFound } from "next/navigation";

import { requireCurrentPlayer } from "@/lib/player";

export const ADMIN_INVITE_CODE = "PENGUIN-LI";

export function isAdminToolsEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_ADMIN_TOOLS === "true"
  );
}

export function canAccessAdminTools(inviteCode: string | null | undefined) {
  return isAdminToolsEnabled() && inviteCode === ADMIN_INVITE_CODE;
}

export async function requireAdminToolsAccess() {
  const currentPlayer = await requireCurrentPlayer();

  if (!canAccessAdminTools(currentPlayer.user.inviteCode?.code)) {
    notFound();
  }

  return currentPlayer;
}
