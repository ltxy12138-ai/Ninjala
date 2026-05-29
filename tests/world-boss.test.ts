import { describe, expect, it } from "vitest";

import {
  WorldBossActionError,
  attackWorldBoss,
  calculateWorldBossDamage,
  claimWorldBossRewards,
  clampWorldBossHp,
  type WorldBossRepository,
} from "@/lib/game/world-boss";

function createRepository(
  overrides?: Partial<WorldBossRepository>,
): WorldBossRepository {
  return {
    async findPlayerById() {
      return {
        id: "player-1",
        name: "Li",
        power: 200,
        effectStats: {
          luck: 0,
          crit: 0,
          goldBonus: 0,
          expBonus: 0,
          dropBonus: 0,
        },
      };
    },
    async ensureWorldBossState() {
      return {
        id: "state-1",
        bossId: "world_boss_glacier_tortoise",
        cycleDay: "2026-05-27",
        currentHp: 2400,
        maxHp: 2400,
        status: "ACTIVE",
        defeatedAt: null,
        lastHitPlayerId: null,
      };
    },
    async applyWorldBossAttack() {
      return {
        status: "applied",
        damageDealt: 180,
        remainingHp: 2220,
        attacksUsed: 1,
        isFinalBlow: false,
        lastHitPlayerId: null,
      };
    },
    async claimWorldBossReward() {
      return {
        status: "claimed",
      };
    },
    ...overrides,
  };
}

describe("world boss", () => {
  it("keeps shared hp from going negative", () => {
    expect(clampWorldBossHp(10, 50)).toBe(0);
  });

  it("scales damage from player power", () => {
    expect(calculateWorldBossDamage(200)).toBeGreaterThan(
      calculateWorldBossDamage(80),
    );
  });

  it("lets crit and luck raise world boss damage", () => {
    expect(
      calculateWorldBossDamage(200, {
        crit: 10,
        luck: 5,
        goldBonus: 0,
        expBonus: 0,
        dropBonus: 0,
      }),
    ).toBeGreaterThan(calculateWorldBossDamage(200));
  });

  it("enforces the daily attack limit", async () => {
    await expect(
      attackWorldBoss(
        createRepository({
          async applyWorldBossAttack() {
            return {
              status: "attack_limit",
              damageDealt: 0,
              remainingHp: 2400,
              attacksUsed: 3,
              isFinalBlow: false,
              lastHitPlayerId: null,
            };
          },
        }),
        {
          playerId: "player-1",
          now: new Date("2026-05-27T10:00:00.000Z"),
        },
      ),
    ).rejects.toMatchObject({
      code: "ATTACK_LIMIT",
    } satisfies Partial<WorldBossActionError>);
  });

  it("returns a final blow result when the last attack defeats the boss", async () => {
    const result = await attackWorldBoss(
      createRepository({
        async ensureWorldBossState() {
          return {
            id: "state-1",
            bossId: "world_boss_glacier_tortoise",
            cycleDay: "2026-05-27",
            currentHp: 120,
            maxHp: 2400,
            status: "ACTIVE",
            defeatedAt: null,
            lastHitPlayerId: null,
          };
        },
        async applyWorldBossAttack() {
          return {
            status: "applied",
            damageDealt: 120,
            remainingHp: 0,
            attacksUsed: 2,
            isFinalBlow: true,
            lastHitPlayerId: "player-1",
          };
        },
      }),
      {
        playerId: "player-1",
        now: new Date("2026-05-27T10:00:00.000Z"),
      },
    );

    expect(result.remainingHp).toBe(0);
    expect(result.isFinalBlow).toBe(true);
  });

  it("blocks duplicate reward claims", async () => {
    await expect(
      claimWorldBossRewards(
        createRepository({
          async claimWorldBossReward() {
            return {
              status: "reward_already_claimed",
            };
          },
        }),
        {
          playerId: "player-1",
          now: new Date("2026-05-27T10:00:00.000Z"),
        },
      ),
    ).rejects.toMatchObject({
      code: "REWARD_ALREADY_CLAIMED",
    } satisfies Partial<WorldBossActionError>);
  });
});
