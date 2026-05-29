import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/LoginForm";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { getCurrentUserWithPlayer } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [currentUser, locale, params] = await Promise.all([
    getCurrentUserWithPlayer(),
    getLocale(),
    searchParams,
  ]);

  if (currentUser?.player) {
    redirect("/home");
  }

  const adminStatus = readSearchParam(params, "admin");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
      <div className="rounded-[32px] border border-[#d8e8d8] bg-white/96 p-6 shadow-[0_24px_70px_rgba(21,53,31,0.12)]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6c8a6f]">
              {locale === "zh" ? "企鹅忍者村" : "Idle Friends RPG"}
            </p>
            <LanguageToggle locale={locale} />
          </div>

          <h1 className="text-3xl font-semibold text-[#16351f]">
            {locale === "zh" ? "进入企鹅忍者村" : "Enter Penguin Ninja Village"}
          </h1>
          <p className="text-sm leading-6 text-[#56705d]">
            {locale === "zh"
              ? "先注册账号密码，再用一次性邀请码完成建档；之后只需要账号密码登录。"
              : "Register once with an invite code, username, and password. After that, sign in with your username and password."}
          </p>
        </div>

        {adminStatus === "accounts_cleared" ? (
          <p className="mt-4 rounded-2xl bg-[#eef7ee] px-4 py-3 text-sm leading-6 text-[#355645]">
            {locale === "zh"
              ? "营地名册已经清空，你现在可以重新注册。"
              : "The roster has been cleared. You can register again now."}
          </p>
        ) : null}

        <div className="mt-6">
          <LoginForm locale={locale} />
        </div>
      </div>
    </main>
  );
}
