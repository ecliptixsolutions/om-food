import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

const schema = readFileSync(resolve(process.cwd(), "database/mysql-schema.sql"), "utf8");
const seed = readFileSync(resolve(process.cwd(), "database/mysql-seed.sql"), "utf8");
const migration = readFileSync(resolve(process.cwd(), "scripts/migrate-mysql.mjs"), "utf8");

describe("MySQL schema safety contract", () => {
  it("creates the version table and all eight application tables using InnoDB and utf8mb4", () => {
    const tables = [...schema.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map(
      (match) => match[1],
    );
    expect(tables).toHaveLength(9);
    expect(tables).toContain("schema_migrations");
    for (const table of tables) {
      const definition = schema.match(
        new RegExp(
          `CREATE TABLE IF NOT EXISTS ${table} \\(([\\s\\S]*?)\\) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        ),
      );
      expect(definition, `${table} must use InnoDB and utf8mb4`).not.toBeNull();
    }
  });

  it("keeps seeds repeatable and separate from DDL, with no destructive SQL", () => {
    expect(seed).toMatch(/^INSERT IGNORE INTO products/m);
    expect(seed).not.toMatch(/'fresh-(?:onions|garlic)'/i);
    expect(seed).not.toMatch(/\b(DROP|TRUNCATE|DELETE)\b/i);
    expect(schema).not.toMatch(/\b(DROP|TRUNCATE|INSERT)\b/i);
  });

  it("keeps imported legacy inquiry timestamps at microsecond precision", () => {
    expect(schema).toMatch(
      /CREATE TABLE IF NOT EXISTS quote_inquiries[\s\S]*?created_at TIMESTAMP\(6\) NOT NULL DEFAULT CURRENT_TIMESTAMP\(6\)/,
    );
    expect(migration).toContain('created_at: "timestamp(6)"');
  });

  it("validates the schema before transactional seed and version recording", () => {
    const verify = migration.indexOf("await verifySchema();");
    const seedStart = migration.indexOf("await connection.beginTransaction();");
    const seedApply = migration.indexOf("await connection.query(seedSql);");
    const recordVersion = migration.indexOf(
      "INSERT IGNORE INTO schema_migrations (version) VALUES (?)",
    );
    const commit = migration.indexOf("await connection.commit();");
    expect(verify).toBeGreaterThan(-1);
    expect(verify).toBeLessThan(seedStart);
    expect(seedStart).toBeLessThan(seedApply);
    expect(seedApply).toBeLessThan(recordVersion);
    expect(recordVersion).toBeLessThan(commit);
    expect(migration).toMatch(/await connection\.rollback\(\)/);
  });
});

describe("MySQL runtime configuration", () => {
  it("fails explicitly when MYSQL_URL is missing", async () => {
    vi.stubEnv("MYSQL_URL", "");
    vi.resetModules();
    try {
      const { getMysqlPool } = await import("@/lib/mysql.server");
      expect(() => getMysqlPool()).toThrow("MySQL is not configured.");
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  it("surfaces a refused local database connection", async () => {
    vi.stubEnv("MYSQL_URL", "mysql://test:test@127.0.0.1:1/om_food?connectTimeout=500");
    vi.resetModules();
    const { getMysqlPool } = await import("@/lib/mysql.server");
    const pool = getMysqlPool();
    try {
      await expect(pool.query("SELECT 1")).rejects.toMatchObject({ code: "ECONNREFUSED" });
    } finally {
      await pool.end();
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });
});
