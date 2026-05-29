import { getMaterialName } from "@/data/materials";
import type { RegionDefinition } from "@/data/regions";
import type { Locale } from "@/lib/i18n";

export const MINIMUM_CLAIM_MINUTES = 1;
export const MAXIMUM_CLAIM_MINUTES = 12 * 60;

export type MaterialReward = {
  materialId: string;
  amount: number;
};

export type IdleRewardSummary = {
  claimableMinutes: number;
  gold: number;
  exp: number;
  materials: MaterialReward[];
};

export class IdleActionError extends Error {
  constructor(
    readonly code:
      | "PLAYER_NOT_FOUND"
      | "REGION_NOT_FOUND"
      | "NOT_READY"
      | "POWER_GATE"
      | "DUPLICATE_CLAIM",
    message: string,
  ) {
    super(message);
    this.name = "IdleActionError";
  }
}

export function calculateClaimableMinutes(elapsedMs: number) {
  if (elapsedMs <= 0) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(Math.floor(elapsedMs / 60000), MAXIMUM_CLAIM_MINUTES),
  );
}

export function calculateIdleRewards(
  region: RegionDefinition,
  elapsedMs: number,
): IdleRewardSummary {
  const claimableMinutes = calculateClaimableMinutes(elapsedMs);

  const materials = region.materialRates
    .map((rate) => ({
      materialId: rate.materialId,
      amount: Math.floor((claimableMinutes * rate.amountPerHour) / 60),
    }))
    .filter((reward) => reward.amount > 0);

  return {
    claimableMinutes,
    gold: region.goldPerMinute * claimableMinutes,
    exp: region.expPerMinute * claimableMinutes,
    materials,
  };
}

export function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

export function describeMaterialRewards(
  materials: MaterialReward[],
  locale: Locale = "zh",
) {
  if (materials.length === 0) {
    return locale === "zh" ? "无材料" : "No materials";
  }

  return materials
    .map((material) => `${getMaterialName(material.materialId, locale)} x${material.amount}`)
    .join(", ");
}

export function serializeMaterials(materials: MaterialReward[]) {
  return materials.map((material) => `${material.materialId}:${material.amount}`).join(",");
}

export function deserializeMaterials(serialized: string | null | undefined) {
  if (!serialized) {
    return [] as MaterialReward[];
  }

  return serialized
    .split(",")
    .map((entry) => {
      const [materialId, rawAmount] = entry.split(":");
      const amount = Number(rawAmount);

      if (!materialId || !Number.isFinite(amount) || amount <= 0) {
        return null;
      }

      return {
        materialId,
        amount,
      } satisfies MaterialReward;
    })
    .filter((entry): entry is MaterialReward => entry !== null);
}
