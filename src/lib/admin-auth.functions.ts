import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequestHeader, setCookie } from "@tanstack/react-start/server";
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { getMysqlPool } from "@/lib/mysql.server";

const cookieName = "om_admin_session";
const sessionLifetimeSeconds = 60 * 60 * 12;
const dummyPasswordHash = `scrypt$om-admin-auth-dummy$${scryptSync("not-a-real-password", "om-admin-auth-dummy", 64).toString("hex")}`;

export type AdminRole = "owner" | "manager" | "editor" | "sales" | "viewer";
export type AdminIdentity = { id: string; email: string; role: AdminRole };

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function cookieValue(header: string | undefined, name: string) {
  return header
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function passwordMatches(password: string, stored: string) {
  const [scheme, salt, expected] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  const actual = await new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, key) =>
      error ? reject(error) : resolve(key as Buffer),
    );
  });
  const expectedBuffer = Buffer.from(expected, "hex");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

export const adminLogin = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({ email: z.string().trim().email().max(255), password: z.string().min(1).max(200) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const pool = getMysqlPool();
    const emailHash = createHash("sha256").update(data.email.toLowerCase()).digest("hex");
    const [limits] = await pool.execute<RowDataPacket[]>(
      "SELECT blocked_until > UTC_TIMESTAMP() AS blocked FROM admin_login_attempts WHERE email_hash=? LIMIT 1",
      [emailHash],
    );
    if (limits[0]?.["blocked"]) throw new Error("Invalid email or password. Try again later.");
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id,email,password_hash,role FROM admin_users WHERE email = ? AND active = 1 LIMIT 1",
      [data.email.toLowerCase()],
    );
    const admin = rows[0];
    const passwordValid = await passwordMatches(
      data.password,
      admin ? String(admin["password_hash"]) : dummyPasswordHash,
    );
    if (!admin || !passwordValid) {
      await pool.execute(
        "INSERT INTO admin_login_attempts (email_hash,failure_count,window_started_at) VALUES (?,1,UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE failure_count=IF(window_started_at < UTC_TIMESTAMP() - INTERVAL 15 MINUTE,1,failure_count+1),blocked_until=CASE WHEN failure_count=1 THEN NULL WHEN failure_count>=5 THEN UTC_TIMESTAMP() + INTERVAL 15 MINUTE ELSE blocked_until END,window_started_at=IF(window_started_at < UTC_TIMESTAMP() - INTERVAL 15 MINUTE,UTC_TIMESTAMP(),window_started_at)",
        [emailHash],
      );
      throw new Error("Invalid email or password.");
    }
    await pool.execute("DELETE FROM admin_login_attempts WHERE email_hash=?", [emailHash]);
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + sessionLifetimeSeconds * 1000);
    await pool.execute(
      "INSERT INTO admin_sessions (id, admin_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
      [randomUUID(), admin["id"], hashToken(token), expiresAt],
    );
    setCookie(cookieName, token, cookieOptions(sessionLifetimeSeconds));
    return { signedIn: true };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const token = cookieValue(getRequestHeader("cookie"), cookieName);
  if (token) {
    try {
      await getMysqlPool().execute("DELETE FROM admin_sessions WHERE token_hash = ?", [
        hashToken(token),
      ]);
    } catch (error) {
      console.error("Unable to invalidate the admin session in MySQL", error);
      throw new Error("Unable to securely sign out. Please try again.");
    }
  }
  setCookie(cookieName, "", cookieOptions(0));
  return { signedOut: true };
});

export const getAdminSession = createServerFn({ method: "GET" }).handler(async () => {
  const token = cookieValue(getRequestHeader("cookie"), cookieName);
  if (!token) return { authenticated: false };
  const [rows] = await getMysqlPool().execute<RowDataPacket[]>(
    "SELECT u.id,u.email,u.role FROM admin_sessions s JOIN admin_users u ON u.id=s.admin_id WHERE s.token_hash=? AND s.expires_at > UTC_TIMESTAMP() AND u.active=1 LIMIT 1",
    [hashToken(token)],
  );
  return { authenticated: Boolean(rows[0]) };
});

export const requireAdminAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const token = cookieValue(getRequestHeader("cookie"), cookieName);
  if (!token) throw new Error("Sign in to continue.");
  const [rows] = await getMysqlPool().execute<RowDataPacket[]>(
    "SELECT u.id,u.email,u.role FROM admin_sessions s JOIN admin_users u ON u.id=s.admin_id WHERE s.token_hash=? AND s.expires_at > UTC_TIMESTAMP() AND u.active=1 LIMIT 1",
    [hashToken(token)],
  );
  const admin = rows[0];
  if (!admin) throw new Error("Your session has expired. Sign in again to continue.");
  return next({
    context: {
      admin: {
        id: String(admin["id"]),
        email: String(admin["email"]),
        role: admin["role"] as AdminRole,
      } satisfies AdminIdentity,
    },
  });
});
