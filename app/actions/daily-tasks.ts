"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireCurrentPlayer } from "@/lib/player";
import { formatWorldBossDay } from "@/lib/game/world-boss";
import { dailyTaskDefinitions } from "@/data/daily-tasks";
import { getLocale } from "@/lib/i18n";

export async function claimDailyTaskRewardAction(formData: FormData) {
  const taskId = formData.get("taskId");
  if (!taskId || typeof taskId !== "string") {
    redirect("/home?tab=daily&error=INVALID_TASK");
  }

  const { player } = await requireCurrentPlayer();
  const db = getDb();
  const dayKey = formatWorldBossDay(new Date());
  const locale = await getLocale();

  const task = dailyTaskDefinitions.find((t) => t.id === taskId);
  if (!task) {
    redirect("/home?tab=daily&error=INVALID_TASK");
  }

  // Read the current record
  const record = await db.playerDailyTask.findUnique({
    where: {
      playerId_taskId_dayKey: {
        playerId: player.id,
        taskId,
        dayKey,
      },
    },
  });

  if (!record || !record.completed) {
    redirect("/home?tab=daily&error=NOT_COMPLETED");
  }

  if (record.rewardClaimed) {
    redirect("/home?tab=daily&error=ALREADY_CLAIMED");
  }

  // Grant reward + mark claimed in a transaction
  await db.$transaction(async (tx) => {
    // Update player gold & exp
    await tx.player.update({
      where: { id: player.id },
      data: {
        gold: { increment: task.reward.gold },
        exp: { increment: task.reward.exp },
      },
    });

    // Grant materials
    if (task.reward.materials) {
      for (const mat of task.reward.materials) {
        await tx.materialStack.upsert({
          where: {
            playerId_materialId: {
              playerId: player.id,
              materialId: mat.materialId,
            },
          },
          create: {
            playerId: player.id,
            materialId: mat.materialId,
            amount: mat.amount,
          },
          update: {
            amount: { increment: mat.amount },
          },
        });
      }
    }

    // Mark as claimed
    await tx.playerDailyTask.update({
      where: {
        playerId_taskId_dayKey: {
          playerId: player.id,
          taskId,
          dayKey,
        },
      },
      data: { rewardClaimed: true },
    });

    // Log it
    await tx.gameLog.create({
      data: {
        playerId: player.id,
        type: "DAILY_TASK_CLAIM",
        message:
          locale === "zh"
            ? `完成每日任务，获得 ${task.reward.gold} 金币、${task.reward.exp} 经验${task.reward.materials ? `、${task.reward.materials.map((m) => `${m.materialId} x${m.amount}`).join("、")}` : ""}`
            : `Completed daily task: ${task.reward.gold} gold, ${task.reward.exp} exp${task.reward.materials ? `, ${task.reward.materials.map((m) => `${m.materialId} x${m.amount}`).join(", ")}` : ""}`,
      },
    });
  });

  revalidatePath("/home");
  redirect("/home?tab=daily&task=claimed");
}
