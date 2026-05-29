"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Locale } from "@/lib/i18n";

type BottomNavProps = {
  locale: Locale;
};

export function BottomNav({ locale }: BottomNavProps) {
  const pathname = usePathname();
  const navItems = [
    { href: "/home", label: locale === "zh" ? "首页" : "Home" },
    { href: "/idle", label: locale === "zh" ? "挂机" : "Idle" },
    { href: "/inventory", label: locale === "zh" ? "背包" : "Bag" },
    { href: "/characters", label: locale === "zh" ? "角色" : "Hero" },
    { href: "/boss", label: "Boss" },
    { href: "/rankings", label: locale === "zh" ? "排行" : "Ranks" },
    { href: "/logs", label: locale === "zh" ? "日志" : "Logs" },
  ];

  return (
    <nav className="sticky bottom-0 z-20 border-t border-[#d7e6d5] bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-11 items-center justify-center rounded-2xl px-1 text-center text-xs font-medium transition ${
                isActive
                  ? "bg-[#204b36] text-white shadow-sm"
                  : "text-[#4d6a58] hover:bg-[#eff5ef]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
