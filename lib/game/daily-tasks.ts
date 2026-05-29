import {
  dailyTaskDefinitions,
  getTaskIdsForLogType,
} from "@/data/daily-tasks";

// ---------------------------------------------------------------------------
// Repository interface — the home page passes an inline object matching this.
// ---------------------------------------------------------------------------

export interface DailyTaskRepository {
  countGameLogsByType(
    playerId: string,
    logType: string,
    dayKey: string,
  ): Promise<number>;

  getPlayerDailyTaskRecords(
    playerId: string,
    dayKey: string,
  ): Promise<
    Array<{
      taskId: string;
      progress: number;
      completed: boolean;
      rewardClaimed: boolean;
    }>
  >;

  upsertDailyTaskProgress(input: {
    playerId: string;
    taskId: string;
    dayKey: string;
    progress: number;
    completed: boolean;
  }): Promise<void>;
}

// ---------------------------------------------------------------------------
// Result type returned to the home page
// ---------------------------------------------------------------------------

export interface DailyTaskProgress {
  taskId: string;
  current: number;
  target: number;
  completed: boolean;
  rewardClaimed: boolean;
}

// ---------------------------------------------------------------------------
// Sync: count today's log entries per task and write to PlayerDailyTask
// ---------------------------------------------------------------------------

export async function syncDailyTaskProgress(
  repository: DailyTaskRepository,
  playerId: string,
  dayKey: string,
): Promise<void> {
  for (const task of dailyTaskDefinitions) {
    let total = 0;

    for (const logType of task.logTypes) {
      const count = await repository.countGameLogsByType(
        playerId,
        logType,
        dayKey,
      );
      total += count;
    }

    const completed = total >= task.target;

    await repository.upsertDailyTaskProgress({
      playerId,
      taskId: task.id,
      dayKey,
      progress: Math.min(total, task.target),
      completed,
    });
  }
}

// ---------------------------------------------------------------------------
// Get progress for display
// ---------------------------------------------------------------------------

export async function getDailyTaskProgress(
  repository: DailyTaskRepository,
  playerId: string,
  dayKey: string,
): Promise<DailyTaskProgress[]> {
  const records = await repository.getPlayerDailyTaskRecords(playerId, dayKey);

  // Return in definition order so the UI is stable
  return dailyTaskDefinitions.map((task) => {
    const record = records.find((r) => r.taskId === task.id);

    return {
      taskId: task.id,
      current: record?.progress ?? 0,
      target: task.target,
      completed: record?.completed ?? false,
      rewardClaimed: record?.rewardClaimed ?? false,
    };
  });
}

// ---------------------------------------------------------------------------
// Helpers called from other server actions (idle claim, boss, etc.)
// — increment progress for log types that match daily tasks
// ---------------------------------------------------------------------------

export async function incrementDailyTaskForLogType(
  repository: DailyTaskRepository,
  playerId: string,
  logType: string,
  dayKey: string,
): Promise<void> {
  const taskIds = getTaskIdsForLogType(logType);
  if (taskIds.length === 0) return;

  const definitions = dailyTaskDefinitions.filter((t) =>
    taskIds.includes(t.id),
  );

  for (const task of definitions) {
    const count = await repository.countGameLogsByType(
      playerId,
      logType,
      dayKey,
    );
    const completed = count >= task.target;

    await repository.upsertDailyTaskProgress({
      playerId,
      taskId: task.id,
      dayKey,
      progress: Math.min(count, task.target),
      completed,
    });
  }
}
