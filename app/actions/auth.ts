"use server";

import { redirect } from "next/navigation";

import { clearSession, registerWithInvite, signInWithPassword } from "@/lib/auth";
import { LoginError } from "@/lib/login";

export type AuthActionState = {
  error: string | null;
};

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    await signInWithPassword({
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
  } catch (error) {
    if (error instanceof LoginError) {
      return { error: error.message };
    }

    return { error: "登录失败，请稍后重试。" };
  }

  redirect("/home");
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    await registerWithInvite({
      inviteCode: String(formData.get("inviteCode") ?? ""),
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
      nickname: String(formData.get("nickname") ?? ""),
    });
  } catch (error) {
    if (error instanceof LoginError) {
      return { error: error.message };
    }

    return { error: "登录失败，请稍后重试。" };
  }

  redirect("/home");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
