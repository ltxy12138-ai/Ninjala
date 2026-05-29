"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearSession } from "@/lib/auth";
import { requireAdminToolsAccess } from "@/lib/admin";
import {
  adminRoutePaths,
  clearAllAccounts,
  grantTestResources,
  parseAdminInt,
  resetAllPlayerProgress,
  resetPlayerProgress,
} from "@/lib/admin-tools";
import { materialDefinitions } from "@/data/materials";
import { getDb } from "@/lib/db";

function buildAdminRedirectUrl(
  values: Record<string, string | number | null | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();

  return query ? `/admin?${query}` : "/admin";
}

async function revalidateAdminAffectedPaths() {
  for (const path of adminRoutePaths) {
    revalidatePath(path);
  }
}

export async function resetPlayerProgressAction(formData: FormData) {
  await requireAdminToolsAccess();

  const playerId = String(formData.get("playerId") ?? "");

  if (!playerId) {
    redirect(
      buildAdminRedirectUrl({
        section: "reset-player",
        status: "error",
        code: "missing_player",
      }),
    );
  }

  const db = getDb();
  const player = await db.player.findUnique({
    where: { id: playerId },
    include: { user: true },
  });

  if (!player) {
    redirect(
      buildAdminRedirectUrl({
        section: "reset-player",
        status: "error",
        code: "missing_player",
      }),
    );
  }

  await db.$transaction(async (tx) => {
    await resetPlayerProgress(tx, {
      playerId: player.id,
      nickname: player.user.nickname,
    });
  });

  await revalidateAdminAffectedPaths();

  redirect(
    buildAdminRedirectUrl({
      section: "reset-player",
      status: "success",
      target: player.user.nickname,
    }),
  );
}

export async function resetAllProgressAction() {
  await requireAdminToolsAccess();

  const db = getDb();

  await db.$transaction(async (tx) => {
    await resetAllPlayerProgress(tx);
  });

  await revalidateAdminAffectedPaths();

  redirect(
    buildAdminRedirectUrl({
      section: "reset-all-progress",
      status: "success",
    }),
  );
}

export async function grantTestResourcesAction(formData: FormData) {
  await requireAdminToolsAccess();

  const playerId = String(formData.get("playerId") ?? "");

  if (!playerId) {
    redirect(
      buildAdminRedirectUrl({
        section: "grant-resources",
        status: "error",
        code: "missing_player",
      }),
    );
  }

  const materialAmounts = Object.fromEntries(
    materialDefinitions.map((material) => [
      material.id,
      parseAdminInt(formData.get(`material_${material.id}`)),
    ]),
  );

  const success = await grantTestResources(getDb(), {
    playerId,
    gold: parseAdminInt(formData.get("gold")),
    exp: parseAdminInt(formData.get("exp")),
    levelDelta: parseAdminInt(formData.get("levelDelta")),
    idleMinutes: parseAdminInt(formData.get("idleMinutes")),
    currentRegionId: String(formData.get("currentRegionId") ?? "") || null,
    unlockRegionId: String(formData.get("unlockRegionId") ?? "") || null,
    materialAmounts,
  });

  if (!success) {
    redirect(
      buildAdminRedirectUrl({
        section: "grant-resources",
        status: "error",
        code: "missing_player",
      }),
    );
  }

  await revalidateAdminAffectedPaths();

  redirect(
    buildAdminRedirectUrl({
      section: "grant-resources",
      status: "success",
    }),
  );
}

export async function clearAllAccountsAction() {
  await requireAdminToolsAccess();

  const db = getDb();

  await db.$transaction(async (tx) => {
    await clearAllAccounts(tx);
  });

  await clearSession();
  await revalidateAdminAffectedPaths();

  redirect("/login?admin=accounts_cleared");
}
