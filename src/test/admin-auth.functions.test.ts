import { createHash, scryptSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  cookie: undefined as string | undefined,
  setCookie: vi.fn(),
  middleware: undefined as ((input: { next: (input?: unknown) => unknown }) => unknown) | undefined,
  execute: vi.fn(),
}));

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const metadata: {
      validator?: (data: unknown) => unknown;
      handler?: (input: unknown) => unknown;
    } = {};
    const builder = {
      middleware: () => builder,
      validator: (validator: (data: unknown) => unknown) => {
        metadata.validator = validator;
        return builder;
      },
      handler: (handler: (input: unknown) => unknown) => {
        metadata.handler = handler;
        return Object.assign(
          (input: { data?: unknown; context?: unknown } = {}) =>
            handler({
              data: metadata.validator ? metadata.validator(input.data) : input.data,
              context: input.context ?? {},
            }),
          { metadata },
        );
      },
    };
    return builder;
  },
  createMiddleware: () => ({
    server: (middleware: typeof state.middleware) => {
      state.middleware = middleware;
      return middleware;
    },
  }),
}));
vi.mock("@tanstack/react-start/server", () => ({
  getRequestHeader: () => state.cookie,
  setCookie: state.setCookie,
}));
vi.mock("@/lib/mysql.server", () => ({ getMysqlPool: () => ({ execute: state.execute }) }));

import {
  adminLogin,
  adminLogout,
  getAdminSession,
  requireAdminAuth,
} from "@/lib/admin-auth.functions";

type MockedFunction = {
  metadata: {
    handler: (input: { data?: unknown; context?: unknown }) => Promise<unknown>;
  };
};
const handler = (fn: unknown) => (fn as MockedFunction).metadata.handler;

beforeEach(() => {
  state.cookie = undefined;
  state.setCookie.mockReset();
  state.execute.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("admin authentication handlers (mocked MySQL)", () => {
  it("creates a session for valid credentials and rejects invalid credentials", async () => {
    const salt = "test-salt";
    const passwordHash = `scrypt$${salt}$${scryptSync("correct horse battery staple", salt, 64).toString("hex")}`;
    state.execute
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([
        [{ id: "admin-1", email: "admin@example.com", role: "owner", password_hash: passwordHash }],
      ])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await expect(
      handler(adminLogin)({
        data: { email: "ADMIN@example.com", password: "correct horse battery staple" },
      }),
    ).resolves.toEqual({ signedIn: true });
    expect(state.execute).toHaveBeenCalledTimes(4);
    expect(state.execute.mock.calls[3]?.[0]).toContain("INSERT INTO admin_sessions");
    expect(state.setCookie).toHaveBeenCalledWith(
      "om_admin_session",
      expect.any(String),
      expect.objectContaining({ httpOnly: true, sameSite: "lax" }),
    );

    state.execute
      .mockReset()
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(
      handler(adminLogin)({ data: { email: "admin@example.com", password: "wrong" } }),
    ).rejects.toThrow("Invalid email or password.");
    expect(state.execute.mock.calls[2]?.[0]).toContain("admin_login_attempts");
  });

  it("clears the session cookie and invalidates the stored token on logout", async () => {
    state.cookie = "other=value; om_admin_session=opaque-token";
    state.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(handler(adminLogout)({})).resolves.toEqual({ signedOut: true });
    expect(state.execute).toHaveBeenCalledWith("DELETE FROM admin_sessions WHERE token_hash = ?", [
      createHash("sha256").update("opaque-token").digest("hex"),
    ]);
    expect(state.setCookie).toHaveBeenCalledWith(
      "om_admin_session",
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
  });

  it("does not report logout success when MySQL cannot revoke the session", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    state.cookie = "om_admin_session=opaque-token";
    state.execute.mockRejectedValueOnce(new Error("connection detail must not reach the client"));
    await expect(handler(adminLogout)({})).rejects.toThrow("Unable to securely sign out.");
    expect(state.setCookie).not.toHaveBeenCalled();
  });

  it("rejects login attempts during the database-backed lockout window", async () => {
    state.execute.mockResolvedValueOnce([[{ blocked: 1 }]]);
    await expect(
      handler(adminLogin)({ data: { email: "admin@example.com", password: "guess" } }),
    ).rejects.toThrow("Try again later.");
    expect(state.execute).toHaveBeenCalledOnce();
  });

  it("sets the database lockout at the fifth failed attempt", async () => {
    for (let attempt = 1; attempt <= 5; attempt++) {
      state.execute
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{}]);
      await expect(
        handler(adminLogin)({ data: { email: "admin@example.com", password: "wrong" } }),
      ).rejects.toThrow("Invalid email or password.");
    }
    const failureUpserts = state.execute.mock.calls.filter(([sql]) =>
      String(sql).includes("INSERT INTO admin_login_attempts"),
    );
    expect(failureUpserts).toHaveLength(5);
    expect(failureUpserts[4]?.[0]).toContain("failure_count>=5");
  });

  it("revokes a logged-out token so subsequent session lookups fail", async () => {
    state.cookie = "om_admin_session=revoked-token";
    state.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await handler(adminLogout)({});
    state.execute.mockResolvedValueOnce([[]]);
    await expect(handler(getAdminSession)({})).resolves.toEqual({ authenticated: false });
    expect(state.execute.mock.calls[1]?.[0]).toContain("s.expires_at > UTC_TIMESTAMP()");
  });

  it("reports missing and expired sessions as unauthenticated and blocks protected calls", async () => {
    await expect(handler(getAdminSession)({})).resolves.toEqual({ authenticated: false });
    await expect(state.middleware!({ next: vi.fn() })).rejects.toThrow("Sign in to continue.");

    state.cookie = "om_admin_session=expired-token";
    state.execute.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]);
    await expect(handler(getAdminSession)({})).resolves.toEqual({ authenticated: false });
    await expect(state.middleware!({ next: vi.fn() })).rejects.toThrow("Your session has expired.");
  });

  it("passes the authenticated identity to protected operations", async () => {
    state.cookie = "om_admin_session=valid-token";
    state.execute.mockResolvedValueOnce([
      [{ id: "admin-1", email: "admin@example.com", role: "manager" }],
    ]);
    const next = vi.fn().mockResolvedValue("ok");
    await expect(state.middleware!({ next })).resolves.toBe("ok");
    expect(next).toHaveBeenCalledWith({
      context: { admin: { id: "admin-1", email: "admin@example.com", role: "manager" } },
    });
  });
});
