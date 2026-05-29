import type { ReactNode } from "react";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { BottomNav } from "@/components/layout/BottomNav";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { ScrollRestore } from "@/components/layout/ScrollRestore";
import { getLocale } from "@/lib/i18n";

type MobileShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export async function MobileShell({
  title,
  subtitle,
  children,
}: MobileShellProps) {
  const locale = await getLocale();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <ScrollRestore />
      <header className="sticky top-0 z-20 border-b border-[#dce8da] bg-[#f7fbf5]/95 px-4 pb-4 pt-5 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#72906f]">
              {locale === "zh" ? "企鹅忍者村" : "Penguin Ninja Village"}
            </p>
            <h1 className="text-2xl font-semibold text-[#16351f]">{title}</h1>
            <p className="text-sm text-[#52705d]">{subtitle}</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <LanguageToggle locale={locale} />
            <LogoutButton locale={locale} />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-4">{children}</main>

      <BottomNav locale={locale} />
    </div>
  );
}
