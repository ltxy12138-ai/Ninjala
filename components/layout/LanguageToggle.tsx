"use client";

import { usePathname } from "next/navigation";

import { setLocaleAction } from "@/app/actions/preferences";
import type { Locale } from "@/lib/i18n";

type LanguageToggleProps = {
  locale: Locale;
};

export function LanguageToggle({ locale }: LanguageToggleProps) {
  const pathname = usePathname();

  return (
    <div className="flex shrink-0 items-center gap-2">
      {(["zh", "en"] as const).map((nextLocale) => {
        const isActive = locale === nextLocale;

        return (
          <form key={nextLocale} action={setLocaleAction}>
            <input type="hidden" name="locale" value={nextLocale} />
            <input type="hidden" name="redirectTo" value={pathname || "/"} />
            <button
              type="submit"
              className={`inline-flex h-9 min-w-[3.5rem] items-center justify-center whitespace-nowrap rounded-full px-3 text-xs font-semibold leading-none transition ${
                isActive
                  ? "bg-[#204b36] text-white"
                  : "border border-[#d4e4d3] bg-white/90 text-[#2b5a3f] hover:bg-white"
              }`}
            >
              {nextLocale === "zh" ? "中文" : "EN"}
            </button>
          </form>
        );
      })}
    </div>
  );
}
