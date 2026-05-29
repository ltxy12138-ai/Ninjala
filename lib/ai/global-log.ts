import type { Locale } from "@/lib/i18n";

type MinimalResponse = {
  ok: boolean;
  json(): Promise<unknown>;
};

type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  },
) => Promise<MinimalResponse>;

export type GlobalFlavorPayload = {
  locale: Locale;
  eventType: "RARE_DROP" | "WORLD_BOSS_CLEAR";
  playerName: string;
  bossName?: string;
  itemName?: string;
  itemRarity?: string;
};

export type GenerateGlobalFlavorResult = {
  message: string;
  source: "ai" | "fallback";
};

function buildSystemPrompt(locale: Locale) {
  return locale === "zh"
    ? [
        '你是"企鹅忍者村"的村口公告员，一只叫"墨丸"的圆滚滚企鹅，蹲在村口告示板上写公告。',
        "你只负责用一句话记录村内发生的大事。",
        "每次随机选一种文风：企鹅憨憨风、热血中二风、毒舌吐槽风、武侠风、流水账报道。",
        "不要输出 markdown 或多余格式，只需要一句话。",
      ].join("")
    : [
        "You are the village noticeboard writer for Penguin Ninja Village, a round penguin named Mowan.",
        "You write exactly one sentence announcing major events in the village.",
        "Vary the tone each time: cute penguin narration, dramatic anime flair, snarky teasing, wuxia-like flavor, or casual diary style.",
        "Do not output markdown or extra formatting. Just one sentence.",
      ].join(" ");
}

function buildRareDropInstruction(
  locale: Locale,
  playerName: string,
  bossName: string,
  itemName: string,
  itemRarity: string,
) {
  if (locale === "zh") {
    return `写一句话新闻：${playerName} 在击败 ${bossName} 后掉落了稀有装备 ${itemName}（${itemRarity}品质）。`;
  }
  return `Write one sentence: ${playerName} defeated ${bossName} and found rare gear ${itemName} (${itemRarity} quality).`;
}

function buildWorldBossClearInstruction(
  locale: Locale,
  playerName: string,
  bossName: string,
) {
  if (locale === "zh") {
    return `写一句话新闻：${playerName} 完成了对世界 Boss ${bossName} 的最后一击。`;
  }
  return `Write one sentence: ${playerName} landed the final blow on the world boss ${bossName}.`;
}

export function buildFallbackMessage(payload: GlobalFlavorPayload): string {
  if (payload.locale === "zh") {
    switch (payload.eventType) {
      case "RARE_DROP":
        return `${payload.playerName} 击败 ${payload.bossName} 后掉落了稀有装备 ${payload.itemName}。`;
      case "WORLD_BOSS_CLEAR":
        return `${payload.playerName} 完成了对世界 Boss ${payload.bossName} 的最后一击。`;
    }
  }
  switch (payload.eventType) {
    case "RARE_DROP":
      return `${payload.playerName} defeated ${payload.bossName} and found rare gear ${payload.itemName}.`;
    case "WORLD_BOSS_CLEAR":
      return `${payload.playerName} landed the final blow on the world boss ${payload.bossName}.`;
  }
}

export async function generateGlobalFlavor(
  payload: GlobalFlavorPayload,
): Promise<GenerateGlobalFlavorResult> {
  const fallbackMessage = buildFallbackMessage(payload);
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();

  if (!apiKey) {
    return { message: fallbackMessage, source: "fallback" };
  }

  const controller = new AbortController();
  const timeoutMs = 2000;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    const response = await Promise.race([
      fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: process.env.DEEPSEEK_IDLE_LOG_MODEL ?? "deepseek-chat",
          messages: [
            { role: "system", content: buildSystemPrompt(payload.locale) },
            {
              role: "user",
              content:
                payload.eventType === "RARE_DROP" && payload.bossName && payload.itemName
                  ? buildRareDropInstruction(
                      payload.locale,
                      payload.playerName,
                      payload.bossName,
                      payload.itemName,
                      payload.itemRarity ?? "",
                    )
                  : buildWorldBossClearInstruction(
                      payload.locale,
                      payload.playerName,
                      payload.bossName ?? "",
                    ),
            },
          ],
          max_tokens: 80,
          temperature: 0.7,
        }),
      }),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          reject(new Error("GLOBAL_FLAVOR_TIMEOUT"));
        }, timeoutMs);
      }),
    ]);

    if (!response.ok) {
      return { message: fallbackMessage, source: "fallback" };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data?.choices?.[0]?.message?.content?.trim();

    if (!text || text.length < 5) {
      return { message: fallbackMessage, source: "fallback" };
    }

    return { message: text, source: "ai" };
  } catch {
    return { message: fallbackMessage, source: "fallback" };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
