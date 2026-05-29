import { describe, expect, it } from "vitest";

import {
  BlessingActionError,
  sendBlessing,
  type BlessingRepository,
} from "@/lib/game/blessing";

function createRepository(
  overrides?: Partial<BlessingRepository>,
): BlessingRepository {
  return {
    async findPlayerById(playerId: string) {
      if (playerId === "target-1") {
        return {
          id: "target-1",
          name: "Hu",
          effectStats: {
            luck: 0,
            crit: 0,
            goldBonus: 0,
            expBonus: 0,
            dropBonus: 0,
          },
        };
      }

      return {
        id: "player-1",
        name: "Li",
        effectStats: {
          luck: 0,
          crit: 0,
          goldBonus: 0,
          expBonus: 0,
          dropBonus: 0,
        },
      };
    },
    async applyBlessing() {
      return {
        status: "sent" as const,
      };
    },
    ...overrides,
  };
}

describe("blessings", () => {
  it("blocks blessing yourself", async () => {
    await expect(
      sendBlessing(createRepository(), {
        playerId: "player-1",
        targetPlayerId: "player-1",
        now: new Date("2026-05-27T10:00:00.000Z"),
      }),
    ).rejects.toMatchObject({
      code: "SELF_TARGET",
    } satisfies Partial<BlessingActionError>);
  });

  it("enforces one blessing per day", async () => {
    await expect(
      sendBlessing(
        createRepository({
          async applyBlessing() {
            return {
              status: "daily_limit",
            };
          },
        }),
        {
          playerId: "player-1",
          targetPlayerId: "target-1",
          now: new Date("2026-05-27T10:00:00.000Z"),
        },
      ),
    ).rejects.toMatchObject({
      code: "DAILY_LIMIT",
    } satisfies Partial<BlessingActionError>);
  });

  it("returns the rewarded target on success", async () => {
    const result = await sendBlessing(createRepository(), {
      playerId: "player-1",
      targetPlayerId: "target-1",
      now: new Date("2026-05-27T10:00:00.000Z"),
    });

    expect(result.target.name).toBe("Hu");
    expect(result.goldGranted).toBe(40);
    expect(result.expGranted).toBe(30);
  });

  it("applies the target's reward bonuses to blessing gains", async () => {
    const result = await sendBlessing(
      createRepository({
        async findPlayerById(playerId: string) {
          if (playerId === "target-1") {
            return {
              id: "target-1",
              name: "Hu",
              effectStats: {
                luck: 0,
                crit: 0,
                goldBonus: 10,
                expBonus: 20,
                dropBonus: 0,
              },
            };
          }

          return {
            id: "player-1",
            name: "Li",
            effectStats: {
              luck: 0,
              crit: 0,
              goldBonus: 0,
              expBonus: 0,
              dropBonus: 0,
            },
          };
        },
      }),
      {
        playerId: "player-1",
        targetPlayerId: "target-1",
        now: new Date("2026-05-27T10:00:00.000Z"),
      },
    );

    expect(result.goldGranted).toBe(44);
    expect(result.expGranted).toBe(36);
  });
});
