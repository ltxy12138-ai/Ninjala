import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEY_LENGTH = 64;

export function createPasswordHash(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("base64url");

  return `${salt}:${hash}`;
}

export function verifyPasswordHash(password: string, passwordHash: string) {
  const [salt, expectedHash] = passwordHash.split(":");

  if (!salt || !expectedHash) {
    return false;
  }

  const providedHash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString(
    "base64url",
  );

  const provided = Buffer.from(providedHash);
  const expected = Buffer.from(expectedHash);

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}
