import { verifyPasswordHash } from "@/lib/password";

export type LoginErrorCode =
  | "EMPTY_INVITE_CODE"
  | "INVALID_INVITE_CODE"
  | "INVITE_CODE_USED"
  | "EMPTY_NICKNAME"
  | "EMPTY_USERNAME"
  | "INVALID_USERNAME"
  | "USERNAME_TAKEN"
  | "EMPTY_PASSWORD"
  | "PASSWORD_TOO_SHORT"
  | "INVALID_CREDENTIALS";

export class LoginError extends Error {
  constructor(
    readonly code: LoginErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "LoginError";
  }
}

export type InviteCodeRecord = {
  id: string;
  code: string;
  user: ExistingUserRecord | null;
};

export type ExistingUserRecord = {
  id: string;
  username: string;
  nickname: string;
  playerId: string;
  passwordHash?: string;
};

export type LoginResult = {
  userId: string;
  playerId: string;
  username: string;
  nickname: string;
  wasCreated: boolean;
};

export type AuthRepository = {
  findInviteCodeByCode(code: string): Promise<InviteCodeRecord | null>;
  findUserByUsername(username: string): Promise<ExistingUserRecord | null>;
  touchLastLogin(userId: string): Promise<void>;
  createUserFromInvite(input: {
    inviteCodeId: string;
    username: string;
    passwordHash: string;
    nickname: string;
  }): Promise<LoginResult>;
};

export function normalizeInviteCode(rawValue: string) {
  return rawValue.trim().toUpperCase();
}

export function normalizeNickname(rawValue: string) {
  return rawValue.trim();
}

export function normalizeUsername(rawValue: string) {
  return rawValue.trim().toLowerCase();
}

function validateUsername(username: string) {
  return /^[a-z0-9_]{3,20}$/.test(username);
}

function validatePassword(password: string) {
  return password.trim().length >= 6;
}

export async function registerWithInviteCode(
  repository: AuthRepository,
  input: {
    inviteCode: string;
    username: string;
    password: string;
    nickname: string;
  },
  createPasswordHash: (password: string) => string | Promise<string>,
) {
  const inviteCode = normalizeInviteCode(input.inviteCode);

  if (!inviteCode) {
    throw new LoginError("EMPTY_INVITE_CODE", "请输入邀请码。");
  }

  const inviteRecord = await repository.findInviteCodeByCode(inviteCode);

  if (!inviteRecord) {
    throw new LoginError("INVALID_INVITE_CODE", "邀请码无效，请检查后重试。");
  }

  if (inviteRecord.user) {
    throw new LoginError("INVITE_CODE_USED", "这个邀请码已经被使用过了。");
  }

  const nickname = normalizeNickname(input.nickname);

  if (!nickname) {
    throw new LoginError("EMPTY_NICKNAME", "注册时需要填写昵称。");
  }

  const username = normalizeUsername(input.username);

  if (!username) {
    throw new LoginError("EMPTY_USERNAME", "请输入账号。");
  }

  if (!validateUsername(username)) {
    throw new LoginError(
      "INVALID_USERNAME",
      "账号需为 3-20 位小写字母、数字或下划线。",
    );
  }

  const password = input.password;

  if (!password) {
    throw new LoginError("EMPTY_PASSWORD", "请输入密码。");
  }

  if (!validatePassword(password)) {
    throw new LoginError("PASSWORD_TOO_SHORT", "密码至少需要 6 位。");
  }

  const existingUser = await repository.findUserByUsername(username);

  if (existingUser) {
    throw new LoginError("USERNAME_TAKEN", "这个账号已经被注册了。");
  }

  const passwordHash = await createPasswordHash(password);

  return repository.createUserFromInvite({
    inviteCodeId: inviteRecord.id,
    username,
    passwordHash,
    nickname,
  });
}

export async function loginWithPassword(
  repository: AuthRepository,
  input: {
    username: string;
    password: string;
  },
) {
  const username = normalizeUsername(input.username);

  if (!username) {
    throw new LoginError("EMPTY_USERNAME", "请输入账号。");
  }

  const password = input.password;

  if (!password) {
    throw new LoginError("EMPTY_PASSWORD", "请输入密码。");
  }

  const user = await repository.findUserByUsername(username);

  if (
    !user?.passwordHash ||
    !verifyPasswordHash(password, user.passwordHash)
  ) {
    throw new LoginError("INVALID_CREDENTIALS", "账号或密码错误。");
  }

  await repository.touchLastLogin(user.id);

  return {
    userId: user.id,
    playerId: user.playerId,
    username: user.username,
    nickname: user.nickname,
    wasCreated: false,
  } satisfies LoginResult;
}
