import { logoutAction } from "@/app/actions/auth";
import type { Locale } from "@/lib/i18n";

type LogoutButtonProps = {
  locale: Locale;
};

export function LogoutButton({ locale }: LogoutButtonProps) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex h-10 items-center justify-center rounded-full border border-[#d4e4d3] bg-white/90 px-4 text-sm font-medium text-[#2b5a3f] transition hover:bg-white"
      >
        {locale === "zh" ? "退出" : "Sign Out"}
      </button>
    </form>
  );
}
