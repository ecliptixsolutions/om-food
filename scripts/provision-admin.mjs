import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import mysql from "mysql2/promise";

if (existsSync(".env.local")) loadEnvFile(".env.local");
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!process.env.MYSQL_URL || !email || !password) {
  throw new Error("Set MYSQL_URL, ADMIN_EMAIL, and ADMIN_PASSWORD in the private environment.");
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  throw new Error("ADMIN_EMAIL must be a valid email address.");
if (password.length < 16) throw new Error("ADMIN_PASSWORD must be at least 16 characters.");

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
const connection = await mysql.createConnection({
  uri: process.env.MYSQL_URL,
  charset: "utf8mb4",
});
try {
  const [versions] = await connection.execute(
    "SELECT version FROM schema_migrations WHERE version=? LIMIT 1",
    ["001_initial"],
  );
  if (!versions.length) throw new Error("Run db:migrate:mysql before provisioning an admin.");
  await connection.execute(
    "INSERT INTO admin_users (id,email,password_hash,role,active) VALUES (?,?,?,'owner',TRUE) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash),role='owner',active=TRUE",
    [randomUUID(), email, `scrypt$${salt}$${hash}`],
  );
  console.log(`Owner admin is provisioned for ${email}.`);
} finally {
  await connection.end();
}
