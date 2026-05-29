import { describe, expect, it, vi } from "vitest";

import {
  loginWithPassword,
  registerWithInviteCode,
  type AuthRepository,
} from "@/lib/login";
import { createPasswordHash } from "@/lib/password";

function createRepository(overrides?: Partial<AuthRepository>) {
  return {
    findInviteCodeByCode: vi.fn(),
    findUserByUsername: vi.fn(),
    touchLastLogin: vi.fn(),
    createUserFromInvite: vi.fn(),
    ...overrides,
  } satisfies AuthRepository;
}

describe("registerWithInviteCode", () => {
  it("rejects a reused invite code", async () => {
    const repository = createRepository({
      findInviteCodeByCode: vi.fn().mockResolvedValue({
        id: "invite-1",
        code: "PENGUIN-LI",
        user: {
          id: "user-1",
          username: "li",
          nickname: "Li",
          playerId: "player-1",
        },
      }),
    });

    await expect(
      registerWithInviteCode(
        repository,
        {
          inviteCode: "PENGUIN-LI",
          username: "new_li",
          password: "secret123",
          nickname: "New Li",
        },
        createPasswordHash,
      ),
    ).rejects.toMatchObject({
      code: "INVITE_CODE_USED",
    });
  });

  it("creates a new account for an unused invite code", async () => {
    const repository = createRepository({
      findInviteCodeByCode: vi.fn().mockResolvedValue({
        id: "invite-1",
        code: "PENGUIN-LI",
        user: null,
      }),
      findUserByUsername: vi.fn().mockResolvedValue(null),
      createUserFromInvite: vi.fn().mockImplementation(async (input) => ({
        userId: "user-2",
        playerId: "player-2",
        username: input.username,
        nickname: input.nickname,
        wasCreated: true,
      })),
    });

    const result = await registerWithInviteCode(
      repository,
      {
        inviteCode: "penguin-li",
        username: "Penguin_Li",
        password: "secret123",
        nickname: "Li",
      },
      createPasswordHash,
    );

    expect(result).toEqual({
      userId: "user-2",
      playerId: "player-2",
      username: "penguin_li",
      nickname: "Li",
      wasCreated: true,
    });
    expect(repository.createUserFromInvite).toHaveBeenCalledOnce();
  });
});

describe("loginWithPassword", () => {
  it("rejects invalid credentials", async () => {
    const repository = createRepository({
      findUserByUsername: vi.fn().mockResolvedValue(null),
    });

    await expect(
      loginWithPassword(repository, {
        username: "missing_user",
        password: "secret123",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
  });

  it("signs in an existing account with a valid password", async () => {
    const repository = createRepository({
      findUserByUsername: vi.fn().mockResolvedValue({
        id: "user-1",
        username: "penguin_li",
        nickname: "Li",
        playerId: "player-1",
        passwordHash: createPasswordHash("secret123"),
      }),
    });

    const result = await loginWithPassword(repository, {
      username: "Penguin_Li",
      password: "secret123",
    });

    expect(result).toEqual({
      userId: "user-1",
      playerId: "player-1",
      username: "penguin_li",
      nickname: "Li",
      wasCreated: false,
    });
    expect(repository.touchLastLogin).toHaveBeenCalledWith("user-1");
  });
});
