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
        ? `还捡到了 ${payload.items.length} 件装备。`
        : `You also pulled ${payload.items.length} gear drops.`
      : payload.locale === "zh"
        ? "这次没有装备掉落。"
        : "No gear dropped this time.";

  return payload.locale === "zh"
    ? `${payload.playerName} 在 ${payload.regionName} 修行了 ${payload.claimableMinutes} 分钟，带回 ${payload.gold} 金币、${payload.exp} 经验，${describeMaterialRewards(payload.materials, payload.locale)}。${itemSummary}`
    : `${payload.playerName} trained in ${payload.regionName} for ${payload.claimableMinutes} minutes and returned with ${payload.gold} gold, ${payload.exp} exp, and ${describeMaterialRewards(payload.materials, payload.locale)}. ${itemSummary}`;
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
              content:
                payload.locale === "zh"
                  ? "你是一个放置刷宝 RPG 的挂机日志文案助手。你只能基于提供的真实奖励数据写 1 句简短中文日志，不能发明任何奖励、数值、材料、装备或战斗结果。你必须返回单个 JSON 对象，字段必须完整匹配要求。"
                  : "You are an idle RPG flavor log assistant. Write one short English sentence using only the provided true rewards. Never invent rewards, values, materials, items, or combat outcomes. You must return one JSON object with every required field.",
            },
            {
              role: "user",
              content: JSON.stringify({
                instruction:
                  payload.locale === "zh"
                    ? "返回 JSON。summary 必须简短自然，字段中的数值、材料和装备必须与输入完全一致。不要输出 markdown，不要补充解释。"
                    : "Return JSON. The summary must be short and natural, and every value, material, and item must match the input exactly. Do not output markdown or extra explanation.",
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
              }),
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
