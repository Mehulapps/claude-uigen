import { test, expect, vi, beforeEach } from "vitest";

const { mockGet, mockSet, mockJwtVerify, mockSign } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockJwtVerify: vi.fn(),
  mockSign: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: mockGet, set: mockSet })),
}));

const chainable = {
  setProtectedHeader: vi.fn().mockReturnThis(),
  setExpirationTime: vi.fn().mockReturnThis(),
  setIssuedAt: vi.fn().mockReturnThis(),
  sign: mockSign,
};

vi.mock("jose", () => ({
  jwtVerify: mockJwtVerify,
  SignJWT: vi.fn(() => chainable),
}));

import { getSession, createSession } from "@/lib/auth";

beforeEach(() => {
  vi.clearAllMocks();
});

test("getSession returns null when no cookie is present", async () => {
  mockGet.mockReturnValue(undefined);

  const result = await getSession();

  expect(result).toBeNull();
});

test("getSession returns session payload when cookie is valid", async () => {
  const payload = {
    userId: "user_123",
    email: "test@example.com",
    expiresAt: new Date("2099-01-01"),
  };
  mockGet.mockReturnValue({ value: "valid.jwt.token" });
  mockJwtVerify.mockResolvedValue({ payload });

  const result = await getSession();

  expect(result).toEqual(payload);
});

test("getSession returns null when jwt verification fails", async () => {
  mockGet.mockReturnValue({ value: "invalid.jwt.token" });
  mockJwtVerify.mockRejectedValue(new Error("invalid signature"));

  const result = await getSession();

  expect(result).toBeNull();
});

test("getSession returns null when jwt is expired", async () => {
  mockGet.mockReturnValue({ value: "expired.jwt.token" });
  mockJwtVerify.mockRejectedValue(new Error("JWTExpired"));

  const result = await getSession();

  expect(result).toBeNull();
});

// --- createSession ---

test("createSession sets an httpOnly cookie with the signed token", async () => {
  mockSign.mockResolvedValue("signed.jwt.token");

  await createSession("user_123", "test@example.com");

  expect(mockSet).toHaveBeenCalledWith(
    "auth-token",
    "signed.jwt.token",
    expect.objectContaining({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    })
  );
});

test("createSession signs a JWT with userId and email", async () => {
  const { SignJWT } = await import("jose");
  mockSign.mockResolvedValue("signed.jwt.token");

  await createSession("user_abc", "hello@example.com");

  expect(SignJWT).toHaveBeenCalledWith(
    expect.objectContaining({ userId: "user_abc", email: "hello@example.com" })
  );
  expect(chainable.setProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
  expect(chainable.setExpirationTime).toHaveBeenCalledWith("7d");
  expect(chainable.setIssuedAt).toHaveBeenCalled();
});

test("createSession cookie expires ~7 days from now", async () => {
  mockSign.mockResolvedValue("signed.jwt.token");
  const before = Date.now();

  await createSession("user_123", "test@example.com");

  const after = Date.now();
  const cookieOptions = mockSet.mock.calls[0][2] as { expires: Date };
  const expiresMs = cookieOptions.expires.getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDays - 1000);
  expect(expiresMs).toBeLessThanOrEqual(after + sevenDays + 1000);
});

test("createSession cookie is not secure in development", async () => {
  mockSign.mockResolvedValue("signed.jwt.token");

  await createSession("user_123", "test@example.com");

  const cookieOptions = mockSet.mock.calls[0][2] as { secure: boolean };
  expect(cookieOptions.secure).toBe(false);
});
