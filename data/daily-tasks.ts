export interface DailyTaskReward {
  gold: number;
  exp: number;
  materials?: Array<{ materialId: string; amount: number }>;
}

export interface DailyTaskDefinition {
  id: string;
  /** GameLog types that contribute to this task's progress */
  logTypes: string[];
  /** How many matching log entries are needed to complete */
  target: number;
  reward: DailyTaskReward;
}

export const dailyTaskDefinitions: DailyTaskDefinition[] = [
  {
    id: "idle_claim",
    logTypes: ["IDLE_CLAIM"],
    target: 1,
    reward: { gold: 200, exp: 100 },
  },
  {
    id: "boss_challenge",
    logTypes: ["BOSS_CHALLENGE", "BOSS_CLEAR"],
    target: 2,
    reward: {
      gold: 350,
      exp: 180,
      materials: [{ materialId: "iron_ore", amount: 3 }],
    },
  },
  {
    id: "forge_work",
    logTypes: [
      "EQUIPMENT_FORGE",
      "EQUIPMENT_REFORGE",
      "EQUIPMENT_ENHANCE",
      "MATERIAL_CRAFT",
    ],
    target: 3,
    reward: {
      gold: 300,
      exp: 150,
      materials: [{ materialId: "spirit_stone", amount: 1 }],
    },
  },
  {
    id: "gear_manage",
    logTypes: ["ITEM_DISMANTLE", "EQUIPMENT_ENHANCE"],
    target: 2,
    reward: { gold: 250, exp: 120 },
  },
];

/** Maps log types to the tasks that count them (built once at import time) */
function buildLogTypeTaskMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const task of dailyTaskDefinitions) {
    for (const logType of task.logTypes) {
      const existing = map.get(logType);
      if (existing) {
        existing.push(task.id);
      } else {
        map.set(logType, [task.id]);
      }
    }
  }
  return map;
}

const logTypeTaskMap = buildLogTypeTaskMap();

export function getTaskIdsForLogType(logType: string): string[] {
  return logTypeTaskMap.get(logType) ?? [];
}

export function getDailyTaskTitle(
  task: DailyTaskDefinition,
  locale: "zh" | "en",
): string {
  const titles: Record<string, { zh: string; en: string }> = {
    idle_claim: { zh: "挂机达人", en: "Idle Master" },
    boss_challenge: { zh: "Boss挑战者", en: "Boss Challenger" },
    forge_work: { zh: "锻造学徒", en: "Forge Apprentice" },
    gear_manage: { zh: "装备管理", en: "Gear Manager" },
  };
  const entry = titles[task.id];
  if (!entry) return task.id;
  return locale === "zh" ? entry.zh : entry.en;
}

export function getDailyTaskDescription(
  task: DailyTaskDefinition,
  locale: "zh" | "en",
): string {
  const descriptions: Record<
    string,
    { zh: string; en: string }
  > = {
    idle_claim: {
      zh: "领取1次挂机收益",
      en: "Claim idle rewards once",
    },
    boss_challenge: {
      zh: "挑战或击败Boss 2次",
      en: "Challenge or defeat bosses 2 times",
    },
    forge_work: {
      zh: "进行锻造/重铸/强化/合成3次",
      en: "Forge, reforge, enhance, or craft 3 times",
    },
    gear_manage: {
      zh: "分解或强化装备2次",
      en: "Dismantle or enhance gear 2 times",
    },
  };
  const entry = descriptions[task.id];
  if (!entry) return task.id;
  return locale === "zh" ? entry.zh : entry.en;
}
