import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { getDb } from "@/lib/db";
import {
  LoginError,
  loginWithPassword,
  registerWithInviteCode,
} from "@/lib/login";
import { createPasswordHash } from "@/lib/password";

const SESSION_COOKIE_NAME = "idle_friends_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

type SessionPayload = {
  userId: string;
};

function getSessionSecret() {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }

  if (process.env.NODE_ENV !== "production") {
    return "idle-friends-rpg-local-dev-secret";
  }

  throw new Error("SESSION_SECRET is required in production.");
}

function signSession(encodedPayload: string) {
  return createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function encodeSession(payload: SessionPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );

  return `${encodedPayload}.${signSession(encodedPayload)}`;
}

function decodeSession(value: string): SessionPayload | null {
  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signSession(encodedPayload);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return null;
  }

  try {
    return JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as SessionPayload;
  } catch {
    return null;
  }
}

async function writeSessionCookie(userId: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, encodeSession({ userId }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUserId() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!cookieValue) {
    return null;
  }

  return decodeSession(cookieValue)?.userId ?? null;
}

function createAuthRepository() {
  const db = getDb();

  return {
    async findInviteCodeByCode(code: string) {
      const inviteCode = await db.inviteCode.findUnique({
        where: { code },
        include: {
          user: {
            include: {
              player: true,
            },
          },
        },
      });

      if (!inviteCode) {
        return null;
      }

      return {
        id: inviteCode.id,
        code: inviteCode.code,
        user: inviteCode.user?.player
          ? {
              id: inviteCode.user.id,
              username: inviteCode.user.username,
              nickname: inviteCode.user.nickname,
              playerId: inviteCode.user.player.id,
              passwordHash: inviteCode.user.passwordHash,
            }
          : null,
      };
    },
    async findUserByUsername(username: string) {
      const user = await db.user.findUnique({
        where: { username },
        include: {
          player: true,
        },
      });

      if (!user?.player) {
        return null;
      }

      return {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        playerId: user.player.id,
        passwordHash: user.passwordHash,
      };
    },
    async touchLastLogin(userId: string) {
      await db.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
        },
      });
    },
    async createUserFromInvite({
      inviteCodeId,
      username,
      passwordHash,
      nickname,
    }: {
      inviteCodeId: string;
      username: string;
      passwordHash: string;
      nickname: string;
    }) {
      return db.$transaction(async (tx) => {
        const [currentInviteCode, existingUser] = await Promise.all([
          tx.inviteCode.findUnique({
            where: { id: inviteCodeId },
            include: {
              user: {
                include: {
                  player: true,
                },
              },
            },
          }),
          tx.user.findUnique({
            where: { username },
          }),
        ]);

        if (!currentInviteCode) {
          throw new LoginError(
            "INVALID_INVITE_CODE",
            "邀请码无效，请检查后重试。",
          );
        }

        if (currentInviteCode.user?.player) {
          throw new LoginError("INVITE_CODE_USED", "这个邀请码已经被使用过了。");
        }

        if (existingUser) {
          throw new LoginError("USERNAME_TAKEN", "这个账号已经被注册了。");
        }

        const user = await tx.user.create({
          data: {
            username,
            passwordHash,
            inviteCodeId,
            nickname,
            lastLoginAt: new Date(),
            player: {
              create: {
                name: nickname,
              },
            },
          },
          include: {
            player: true,
          },
        });

        return {
          userId: user.id,
          playerId: user.player!.id,
          username: user.username,
          nickname: user.nickname,
          wasCreated: true,
        };
      });
    },
  };
}

export async function signInWithPassword(input: {
  username: string;
  password: string;
}) {
  const result = await loginWithPassword(createAuthRepository(), input);

  await writeSessionCookie(result.userId);

  return result;
}

export async function registerWithInvite(input: {
  inviteCode: string;
  username: string;
  password: string;
  nickname: string;
}) {
  const result = await registerWithInviteCode(
    createAuthRepository(),
    input,
    createPasswordHash,
  );

  await writeSessionCookie(result.userId);

  return result;
}

export async function getCurrentUserWithPlayer() {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  return getDb().user.findUnique({
    where: { id: userId },
    include: {
      player: true,
      inviteCode: true,
    },
  });
}
