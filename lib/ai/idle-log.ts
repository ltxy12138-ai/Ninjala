import { describeMaterialRewards } from "@/lib/game/idle";
import type { ItemSlot, ItemRarity } from "@/lib/game/types";
import type { Locale } from "@/lib/i18n";

type MaterialReward = {
  materialId: string;
  amount: number;
};

type ItemReward = {
  name: string;
  slot: ItemSlot;
  rarity: ItemRarity;
};

export type IdleFlavorPayload = {
  locale: Locale;
  playerName: string;
  regionName: string;
  regionDescription: string;
  claimableMinutes: number;
  gold: number;
  exp: number;
  materials: MaterialReward[];
  items: ItemReward[];
  fallbackMessage: string;
};

type IdleFlavorResponse = {
  summary: string;
  claimableMinutes: number;
  gold: number;
  exp: number;
  materials: MaterialReward[];
  items: ItemReward[];
};

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

export type GenerateIdleFlavorOptions = {
  apiKey?: string | null;
  model?: string;
  timeoutMs?: number;
  fetchImpl?: FetchLike;
};

export type GenerateIdleFlavorResult = {
  message: string;
  source: "ai" | "fallback";
  reason:
    | "missing_api_key"
    | "timeout"
    | "request_failed"
    | "invalid_json"
    | "invalid_payload"
    | null;
};

function buildSystemPrompt(locale: Locale) {
  return locale === "zh"
    ? [
        '你是"企鹅忍者村"的挂机日志文书，一只叫"墨丸"的圆滚滚企鹅，坐在村口大树下帮忍者们写修行记录。',
        "你只负责观察和记录，绝不要把自己当成修行者。",
        "玩家名字通过 payload 提供，日志主语必须是玩家名字，不是墨丸。",
        "你只能基于提供的真实奖励数据写文案，不能发明任何奖励、数值、材料、装备、战斗结果或额外剧情。",
        "每次都要随机选一种文风，不要固定：企鹅憨憨风、热血中二风、毒舌吐槽风、武侠风、日常流水账。",
        "语气要像玩家回营后的简短见闻，而不是系统公告、测试日志或开发备注。",
        "你必须返回单个 JSON 对象，字段必须完整匹配要求。",
      ].join("")
    : [
        "You are the idle flavor log recorder for Penguin Ninja Village.",
        "You are a round penguin clerk named Mowan who writes short training notes for returning ninjas.",
        "You only observe and record; never speak as if you were the adventurer.",
        "The player name comes from the payload, and the sentence subject must be the player name, not Mowan.",
        "You may only use the provided real reward data and must never invent rewards, values, materials, items, combat outcomes, or extra story events.",
        "Vary the tone each time: cute penguin narration, dramatic anime flair, snarky teasing, wuxia-like flavor, or casual diary style.",
        "The tone should feel like a short field note from a return trip, not a system message, QA note, or developer changelog.",
        "You must return one JSON object with every required field.",
      ].join(" ");
}

function buildUserInstruction(payload: IdleFlavorPayload) {
  return payload.locale === "zh"
    ? {
        instruction:
          '返回 JSON。summary 必须只有 1 句，简短有趣，有"企鹅忍者村"的味道，也能带一点区域气质，但不能浮夸。字段中的数值、材料和装备必须与输入完全一致。不要输出 markdown，不要补充解释。',
        writingGoals: [
          "口吻像营地记录或冒险简报，不要像系统播报。",
          "主语必须是玩家名字，不要把墨丸写成主角。",
          "如果有装备掉落，优先点出最显眼的一件；如果没有装备，就突出收益或材料节奏。",
          "可以借用 regionDescription 的气质，但不能编造新的遭遇。",
          "尽量减少机械罗列感，让句子更像玩家真的刚回来汇报。",
          "每次随机切换文风，不要固定成同一种说话方式。",
        ],
        schema: buildSchema(),
        payload: {
          locale: payload.locale,
          playerName: payload.playerName,
          regionName: payload.regionName,
          regionDescription: payload.regionDescription,
          claimableMinutes: payload.claimableMinutes,
          gold: payload.gold,
          exp: payload.exp,
          materials: payload.materials,
          items: payload.items,
        },
      }
    : {
        instruction:
          "Return JSON. The summary must be exactly one sentence, short and fun, flavored by Penguin Ninja Village and lightly colored by the region without becoming overdramatic. Every value, material, and item field must match the input exactly. Do not output markdown or extra explanation.",
        writingGoals: [
          "Write like a camp note or short return report, not a system announcement.",
          "The player name must stay the subject; do not make Mowan the adventurer.",
          "If gear dropped, highlight the most notable piece first; if not, emphasize gains or materials.",
          "You may borrow tone from regionDescription, but you may not invent extra encounters.",
          "Avoid flat list-like phrasing and make it sound like a player just came back.",
          "Vary the voice instead of repeating one fixed style every time.",
        ],
        schema: buildSchema(),
        payload: {
          locale: payload.locale,
          playerName: payload.playerName,
          regionName: payload.regionName,
          regionDescription: payload.regionDescription,
          claimableMinutes: payload.claimableMinutes,
          gold: payload.gold,
          exp: payload.exp,
          materials: payload.materials,
          items: payload.items,
        },
      };
}

function normalizeMaterials(materials: MaterialReward[]) {
  return [...materials].sort((left, right) =>
    left.materialId.localeCompare(right.materialId),
  );
}

function normalizeItems(items: ItemReward[]) {
  return [...items].sort((left, right) => {
    const byName = left.name.localeCompare(right.name);

    if (byName !== 0) {
      return byName;
    }

    const byRarity = left.rarity.localeCompare(right.rarity);

    if (byRarity !== 0) {
      return byRarity;
    }

    return left.slot.localeCompare(right.slot);
  });
}

function buildSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "summary",
      "claimableMinutes",
      "gold",
      "exp",
      "materials",
      "items",
    ],
    properties: {
      summary: {
        type: "string",
      },
      claimableMinutes: {
        type: "integer",
      },
      gold: {
        type: "integer",
      },
      exp: {
        type: "integer",
      },
      materials: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["materialId", "amount"],
          properties: {
            materialId: { type: "string" },
            amount: { type: "integer" },
          },
        },
      },
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "slot", "rarity"],
          properties: {
            name: { type: "string" },
            slot: { type: "string" },
            rarity: { type: "string" },
          },
        },
      },
    },
  };
}

function extractResponseText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as {
    output_text?: unknown;
    output?: Array<{
      content?: Array<{
        text?: string;
      }>;
    }>;
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  if (typeof record.output_text === "string" && record.output_text.trim()) {
    return record.output_text;
  }

  const nestedText = record.output
    ?.flatMap((entry) => entry.content ?? [])
    .map((content) => content.text)
    .find((value): value is string => typeof value === "string" && value.trim().length > 0);

  if (nestedText) {
    return nestedText;
  }

  const choiceText = record.choices?.find(
    (entry) => typeof entry.message?.content === "string" && entry.message.content.trim().length > 0,
  )?.message?.content;

  return choiceText ?? null;
}

export function validateIdleFlavorOutput(
  output: unknown,
  payload: IdleFlavorPayload,
) {
  if (!output || typeof output !== "object") {
    return null;
  }

  const parsed = output as IdleFlavorResponse;

  if (typeof parsed.summary !== "string" || parsed.summary.trim().length < 8) {
    return null;
  }

  if (
    parsed.claimableMinutes !== payload.claimableMinutes ||
    parsed.gold !== payload.gold ||
    parsed.exp !== payload.exp
  ) {
    return null;
  }

  if (
    JSON.stringify(normalizeMaterials(parsed.materials)) !==
      JSON.stringify(normalizeMaterials(payload.materials)) ||
    JSON.stringify(normalizeItems(parsed.items)) !==
      JSON.stringify(normalizeItems(payload.items))
  ) {
    return null;
  }

  return parsed.summary.trim();
}

export function buildFallbackIdleFlavorText(payload: IdleFlavorPayload) {
  const itemSummary =
    payload.items.length > 0
      ? payload.locale === "zh"
        ? payload.items.length === 1
          ? `还顺手带回了 ${payload.items[0]!.name}。`
          : `还顺手带回了 ${payload.items[0]!.name} 等 ${payload.items.length} 件装备。`
        : payload.items.length === 1
          ? `A ${payload.items[0]!.name} came back with you as well.`
          : `${payload.items[0]!.name} was the standout among ${payload.items.length} gear drops.`
      : payload.locale === "zh"
        ? "这趟没有装备掉落。"
        : "No gear dropped this trip.";

  return payload.locale === "zh"
    ? `${payload.playerName} 在 ${payload.regionName} 转了一圈，花了 ${payload.claimableMinutes} 分钟带回 ${payload.gold} 金币、${payload.exp} 经验，还有 ${describeMaterialRewards(payload.materials, payload.locale)}。${itemSummary}`
    : `${payload.playerName} spent ${payload.claimableMinutes} minutes roaming ${payload.regionName}, returning with ${payload.gold} gold, ${payload.exp} exp, and ${describeMaterialRewards(payload.materials, payload.locale)}. ${itemSummary}`;
}

export async function generateIdleFlavorLog(
  payload: IdleFlavorPayload,
  options: GenerateIdleFlavorOptions = {},
): Promise<GenerateIdleFlavorResult> {
  const fallbackMessage = payload.fallbackMessage || buildFallbackIdleFlavorText(payload);
  const apiKey = options.apiKey?.trim();

  if (!apiKey) {
    return {
      message: fallbackMessage,
      source: "fallback",
      reason: "missing_api_key",
    };
  }

  const fetchImpl = options.fetchImpl ?? (globalThis.fetch as FetchLike | undefined);

  if (!fetchImpl) {
    return {
      message: fallbackMessage,
      source: "fallback",
      reason: "request_failed",
    };
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 2500;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    const response = await Promise.race([
      fetchImpl("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: options.model ?? process.env.DEEPSEEK_IDLE_LOG_MODEL ?? "deepseek-v4-flash",
          response_format: {
            type: "json_object",
          },
          messages: [
            {
              role: "system",
              content: buildSystemPrompt(payload.locale),
            },
            {
              role: "user",
              content: JSON.stringify(buildUserInstruction(payload)),
            },
          ],
        }),
      }),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          reject(new Error("IDLE_FLAVOR_TIMEOUT"));
        }, timeoutMs);
      }),
    ]);

    if (!response.ok) {
      return {
        message: fallbackMessage,
        source: "fallback",
        reason: "request_failed",
      };
    }

    const responsePayload = await response.json();
    const responseText = extractResponseText(responsePayload);

    if (!responseText) {
      return {
        message: fallbackMessage,
        source: "fallback",
        reason: "invalid_json",
      };
    }

    let parsedOutput: unknown;

    try {
      parsedOutput = JSON.parse(responseText);
    } catch {
      return {
        message: fallbackMessage,
        source: "fallback",
        reason: "invalid_json",
      };
    }

    const validatedSummary = validateIdleFlavorOutput(parsedOutput, payload);

    if (!validatedSummary) {
      return {
        message: fallbackMessage,
        source: "fallback",
        reason: "invalid_payload",
      };
    }

    return {
      message: validatedSummary,
      source: "ai",
      reason: null,
    };
  } catch (error) {
    return {
      message: fallbackMessage,
      source: "fallback",
      reason:
        error instanceof Error &&
        (error.name === "AbortError" || error.message === "IDLE_FLAVOR_TIMEOUT")
          ? "timeout"
          : "request_failed",
    };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
