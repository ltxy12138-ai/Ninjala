"use client";

import { useActionState, useState } from "react";

import {
  loginAction,
  registerAction,
  type AuthActionState,
} from "@/app/actions/auth";
import type { Locale } from "@/lib/i18n";

const initialState: AuthActionState = {
  error: null,
};

type LoginFormProps = {
  locale: Locale;
};

type AuthMode = "login" | "register";

export function LoginForm({ locale }: LoginFormProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginState, loginFormAction, isLoginPending] = useActionState(
    loginAction,
    initialState,
  );
  const [registerState, registerFormAction, isRegisterPending] = useActionState(
    registerAction,
    initialState,
  );
  const state = mode === "login" ? loginState : registerState;
  const isPending = mode === "login" ? isLoginPending : isRegisterPending;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-[24px] bg-[#eef4ee] p-1">
        {([
          { id: "login", zh: "登录", en: "Login" },
          { id: "register", zh: "注册", en: "Register" },
        ] as const).map((option) => {
          const isActive = mode === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setMode(option.id)}
              className={`inline-flex min-h-11 items-center justify-center rounded-[20px] px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-[#204b36] text-white"
                  : "text-[#4f6d59] hover:bg-white/70"
              }`}
            >
              {locale === "zh" ? option.zh : option.en}
            </button>
          );
        })}
      </div>

      {mode === "login" ? (
        <form action={loginFormAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-[#285038]">
            {locale === "zh" ? "账号" : "Username"}
            <input
              name="username"
              autoComplete="username"
              placeholder={locale === "zh" ? "例如 penguin_li" : "Example: penguin_li"}
              className="h-12 rounded-2xl border border-[#c7d9c8] bg-white px-4 text-base outline-none transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#92c47c]"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-[#285038]">
            {locale === "zh" ? "密码" : "Password"}
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder={locale === "zh" ? "输入你的密码" : "Enter your password"}
              className="h-12 rounded-2xl border border-[#c7d9c8] bg-white px-4 text-base outline-none transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#92c47c]"
            />
          </label>

          {state.error ? (
            <p className="rounded-2xl bg-[#fff0ef] px-4 py-3 text-sm text-[#a33f2f]">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="flex h-12 items-center justify-center rounded-2xl bg-[#204b36] px-4 text-base font-semibold text-white transition hover:bg-[#183a2a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? locale === "zh"
                ? "登录中..."
                : "Signing in..."
              : locale === "zh"
                ? "登录账号"
                : "Sign In"}
          </button>
        </form>
      ) : (
        <form action={registerFormAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-[#285038]">
            {locale === "zh" ? "邀请码" : "Invite Code"}
            <input
              name="inviteCode"
              autoComplete="off"
              placeholder={locale === "zh" ? "例如 PENGUIN-LI" : "Example: PENGUIN-LI"}
              className="h-12 rounded-2xl border border-[#c7d9c8] bg-white px-4 text-base outline-none transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#92c47c]"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-[#285038]">
            {locale === "zh" ? "账号" : "Username"}
            <input
              name="username"
              autoComplete="username"
              placeholder={locale === "zh" ? "3-20 位字母/数字/下划线" : "3-20 lowercase letters, numbers, or _"}
              className="h-12 rounded-2xl border border-[#c7d9c8] bg-white px-4 text-base outline-none transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#92c47c]"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-[#285038]">
            {locale === "zh" ? "密码" : "Password"}
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder={locale === "zh" ? "至少 6 位" : "At least 6 characters"}
              className="h-12 rounded-2xl border border-[#c7d9c8] bg-white px-4 text-base outline-none transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#92c47c]"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-[#285038]">
            {locale === "zh" ? "昵称" : "Nickname"}
            <input
              name="nickname"
              autoComplete="nickname"
              placeholder={locale === "zh" ? "游戏里显示的名字" : "Display name in game"}
              className="h-12 rounded-2xl border border-[#c7d9c8] bg-white px-4 text-base outline-none transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#92c47c]"
            />
          </label>

          <p className="rounded-2xl bg-[#eef7ee] px-4 py-3 text-sm leading-6 text-[#446451]">
            {locale === "zh"
              ? "邀请码只在注册时使用，而且每个邀请码只能注册 1 个账号。"
              : "Invite codes are only used during registration, and each code can create only one account."}
          </p>

          {state.error ? (
            <p className="rounded-2xl bg-[#fff0ef] px-4 py-3 text-sm text-[#a33f2f]">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="flex h-12 items-center justify-center rounded-2xl bg-[#204b36] px-4 text-base font-semibold text-white transition hover:bg-[#183a2a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? locale === "zh"
                ? "注册中..."
                : "Registering..."
              : locale === "zh"
                ? "创建账号"
                : "Create Account"}
          </button>
        </form>
      )}
    </div>
  );
}
