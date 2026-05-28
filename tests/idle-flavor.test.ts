import { describe, expect, it } from "vitest";

import {
  buildFallbackIdleFlavorText,
  generateIdleFlavorLog,
} from "@/lib/ai/idle-log";

const basePayload = {
  locale: "zh" as const,
  playerName: "Li",
  regionName: "新手竹林",
  regionDescription: "适合起步挂机，能稳定拿到草材和石料。",
  claimableMinutes: 60,
  gold: 120,
  exp: 60,
  materials: [
    { materialId: "bamboo_shoot", amount: 6 },
    { materialId: "river_stone", amount: 3 },
  ],
  items: [
    {
      name: "沉稳青竹枪",
      slot: "weapon" as const,
      rarity: "rare" as const,
    },
  ],
  fallbackMessage: "在新手竹林挂机 60 分钟，获得 120 金币、60 经验。",
};

describe("idle flavor logs", () => {
  it("uses validated AI output when it matches the true payload", async () => {
    const result = await generateIdleFlavorLog(basePayload, {
      apiKey: "test-key",
      fetchImpl: async () => ({
        ok: true,
        async json() {
          return {
            output_text: JSON.stringify({
              summary:
                "Li 在新手竹林巡了一圈，背回 120 金币、60 经验，还顺手捡到一把沉稳青竹枪。",
              claimableMinutes: 60,
              gold: 120,
              exp: 60,
              materials: [
                { materialId: "bamboo_shoot", amount: 6 },
                { materialId: "river_stone", amount: 3 },
              ],
              items: [
                {
                  name: "沉稳青竹枪",
                  slot: "weapon",
                  rarity: "rare",
                },
              ],
            }),
          };
        },
      }),
    });

    expect(result.source).toBe("ai");
    expect(result.reason).toBeNull();
    expect(result.message).toContain("120 金币");
  });

  it("falls back when the AI request times out", async () => {
    const result = await generateIdleFlavorLog(basePayload, {
      apiKey: "test-key",
      timeoutMs: 10,
      fetchImpl: async () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              async json() {
                return {};
              },
            });
          }, 50);
        }),
    });

    expect(result.source).toBe("fallback");
    expect(result.reason).toBe("timeout");
    expect(result.message).toBe(basePayload.fallbackMessage);
  });

  it("falls back when the AI response is not valid JSON", async () => {
    const result = await generateIdleFlavorLog(basePayload, {
      apiKey: "test-key",
      fetchImpl: async () => ({
        ok: true,
        async json() {
          return {
            output_text: "not-json",
          };
        },
      }),
    });

    expect(result.source).toBe("fallback");
    expect(result.reason).toBe("invalid_json");
  });

  it("falls back when the AI fabricates rewards", async () => {
    const result = await generateIdleFlavorLog(basePayload, {
      apiKey: "test-key",
      fetchImpl: async () => ({
        ok: true,
        async json() {
          return {
            output_text: JSON.stringify({
              summary: "Li 带回了 999 金币和两件传说装备。",
              claimableMinutes: 60,
              gold: 999,
              exp: 60,
              materials: [
                { materialId: "bamboo_shoot", amount: 6 },
                { materialId: "river_stone", amount: 3 },
              ],
              items: [
                {
                  name: "沉稳青竹枪",
                  slot: "weapon",
                  rarity: "legendary",
                },
              ],
            }),
          };
        },
      }),
    });

    expect(result.source).toBe("fallback");
    expect(result.reason).toBe("invalid_payload");
    expect(result.message).toBe(basePayload.fallbackMessage);
  });

  it("falls back cleanly when no API key is configured", async () => {
    const result = await generateIdleFlavorLog(basePayload, {
      apiKey: "",
    });

    expect(result.source).toBe("fallback");
    expect(result.reason).toBe("missing_api_key");
    expect(result.message).toBe(basePayload.fallbackMessage);
    expect(buildFallbackIdleFlavorText(basePayload)).toContain("120 金币");
  });
});
