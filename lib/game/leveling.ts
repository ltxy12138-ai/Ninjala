export const MAX_PLAYER_LEVEL = 3000;

function getLevelPoint(level: number) {
  return Math.floor(level + 300 * 2 ** (level / 7));
}

function buildLevelXpThresholds() {
  const thresholds = [0];
  let points = 0;

  for (let level = 1; level < MAX_PLAYER_LEVEL; level += 1) {
    points += getLevelPoint(level);
    thresholds.push(Math.floor(points / 4));
  }

  return thresholds;
}

export const levelXpThresholds = buildLevelXpThresholds();

export function getRequiredXpForLevel(level: number) {
  const normalizedLevel = Math.max(1, Math.min(MAX_PLAYER_LEVEL, Math.trunc(level)));

  return levelXpThresholds[normalizedLevel - 1] ?? 0;
}

export function getLevelForTotalExp(totalExp: number) {
  const safeExp = Math.max(0, Math.trunc(totalExp));
  let low = 0;
  let high = levelXpThresholds.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const threshold = levelXpThresholds[middle] ?? 0;

    if (threshold <= safeExp) {
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return Math.max(1, Math.min(MAX_PLAYER_LEVEL, high + 1));
}

export function normalizePlayerProgress(totalExp: number) {
  const exp = Math.max(0, Math.trunc(totalExp));
  const level = getLevelForTotalExp(exp);

  return {
    exp,
    level,
  };
}

export function applyExpReward(currentExp: number, expDelta: number) {
  return normalizePlayerProgress(currentExp + Math.max(0, Math.trunc(expDelta)));
}

export function applyLevelDelta(
  currentExp: number,
  currentLevel: number,
  levelDelta: number,
) {
  const targetLevel = Math.max(
    1,
    Math.min(
      MAX_PLAYER_LEVEL,
      Math.trunc(currentLevel) + Math.max(0, Math.trunc(levelDelta)),
    ),
  );

  return normalizePlayerProgress(
    Math.max(currentExp, getRequiredXpForLevel(targetLevel)),
  );
}

export function getExpProgressWithinLevel(totalExp: number) {
  const progress = normalizePlayerProgress(totalExp);

  if (progress.level >= MAX_PLAYER_LEVEL) {
    return {
      ...progress,
      currentLevelXp: getRequiredXpForLevel(progress.level),
      nextLevelXp: null,
      progressXp: 0,
      neededXp: 0,
      isMaxLevel: true,
    };
  }

  const currentLevelXp = getRequiredXpForLevel(progress.level);
  const nextLevelXp = getRequiredXpForLevel(progress.level + 1);

  return {
    ...progress,
    currentLevelXp,
    nextLevelXp,
    progressXp: progress.exp - currentLevelXp,
    neededXp: nextLevelXp - currentLevelXp,
    isMaxLevel: false,
  };
}
