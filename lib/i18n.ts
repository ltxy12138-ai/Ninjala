import { cookies } from "next/headers";

export const LOCALE_COOKIE_NAME = "idle_friends_locale";

export type Locale = "zh" | "en";

export type LocalizedText = {
  zh: string;
  en: string;
};

export function normalizeLocale(value: string | null | undefined): Locale {
  return value === "en" ? "en" : "zh";
}

export async function getLocale() {
  const cookieStore = await cookies();

  return normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
}

export function pickLocalizedText(
  locale: Locale,
  text: LocalizedText,
) {
  return text[locale];
}

export function formatUiDateTime(
  value: Date,
  locale: Locale,
) {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    month: locale === "zh" ? "numeric" : "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export function formatUiNumber(
  value: number,
  locale: Locale,
) {
  return value.toLocaleString(locale === "zh" ? "zh-CN" : "en-US");
}
