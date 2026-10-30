import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";
import mysql from "mysql2/promise";

if (existsSync(".env.local")) loadEnvFile(".env.local");
if (!process.env.MYSQL_URL) throw new Error("Set MYSQL_URL before running the MySQL migration.");
const connection = await mysql.createConnection({
  uri: process.env.MYSQL_URL,
  multipleStatements: true,
  charset: "utf8mb4",
});

const schemaVersion = "001_initial";
let transactionStarted = false;

// CREATE TABLE IF NOT EXISTS leaves existing tables untouched. Verify the
// application-facing shape before recording this version.
const expectedSchema = {
  schema_migrations: { version: "varchar(50)", applied_at: "timestamp" },
  admin_users: {
    id: "char(36)",
    email: "varchar(255)",
    password_hash: "varchar(180)",
    role: "enum('owner','manager','editor','sales','viewer')",
    active: "tinyint(1)",
    created_at: "timestamp",
  },
  admin_sessions: {
    id: "char(36)",
    admin_id: "char(36)",
    token_hash: "char(64)",
    expires_at: "datetime",
    created_at: "timestamp",
  },
  admin_login_attempts: {
    email_hash: "char(64)",
    failure_count: "tinyint unsigned",
    window_started_at: "datetime",
    blocked_until: "datetime",
  },
  products: {
    id: "char(36)",
    name: "varchar(160)",
    slug: "varchar(180)",
    category: "enum('fresh-onions','dehydrated-onions','fresh-garlic','dehydrated-garlic')",
    description: "text",
    image_url: "varchar(2000)",
    image_alt: "varchar(300)",
    status: "enum('draft','published','archived')",
    featured: "tinyint(1)",
    display_order: "int unsigned",
    created_at: "timestamp",
    updated_at: "timestamp",
  },
  quote_inquiries: {
    id: "char(36)",
    full_name: "varchar(120)",
    company_name: "varchar(160)",
    business_email: "varchar(255)",
    phone: "varchar(40)",
    country: "varchar(100)",
    product_interest: "varchar(120)",
    required_quantity: "varchar(120)",
    packaging_preference: "varchar(200)",
    destination: "varchar(200)",
    delivery_timeline: "varchar(120)",
    message: "text",
    privacy_consent: "tinyint(1)",
    status: "enum('new','in_progress','quoted','closed')",
    created_at: "timestamp(6)",
    updated_at: "timestamp",
  },
  quote_rate_limits: { ip_hash: "char(64)", last_submitted_at: "datetime" },
  admin_activity_logs: {
    id: "char(36)",
    actor_id: "char(36)",
    action: "varchar(100)",
    entity: "varchar(80)",
    entity_id: "char(36)",
    created_at: "timestamp",
  },
  admin_media: {
    id: "char(36)",
    mime_type: "enum('image/jpeg','image/png','image/webp')",
    contents: "longblob",
    created_at: "timestamp",
  },
};

const expectedIndexes = {
  schema_migrations: { PRIMARY: ["version"] },
  admin_users: { PRIMARY: ["id"], email: ["email"] },
  admin_sessions: {
    PRIMARY: ["id"],
    token_hash: ["token_hash"],
    admin_sessions_admin_id_idx: ["admin_id"],
    admin_sessions_expiry_idx: ["expires_at"],
  },
  admin_login_attempts: { PRIMARY: ["email_hash"] },
  products: {
    PRIMARY: ["id"],
    slug: ["slug"],
    products_status_order_idx: ["status", "display_order"],
    products_updated_idx: ["updated_at"],
  },
  quote_inquiries: {
    PRIMARY: ["id"],
    quote_inquiries_created_idx: ["created_at"],
    quote_inquiries_status_idx: ["status", "created_at"],
  },
  quote_rate_limits: { PRIMARY: ["ip_hash"] },
  admin_activity_logs: { PRIMARY: ["id"], admin_activity_created_idx: ["created_at"] },
  admin_media: { PRIMARY: ["id"] },
};
const expectedUniqueIndexes = new Set([
  "schema_migrations.PRIMARY",
  "admin_users.PRIMARY",
  "admin_users.email",
  "admin_sessions.PRIMARY",
  "admin_sessions.token_hash",
  "admin_login_attempts.PRIMARY",
  "products.PRIMARY",
  "products.slug",
  "quote_inquiries.PRIMARY",
  "quote_rate_limits.PRIMARY",
  "admin_activity_logs.PRIMARY",
  "admin_media.PRIMARY",
]);

const expectedForeignKeys = [
  {
    table: "admin_sessions",
    name: "admin_sessions_user_fk",
    column: "admin_id",
    referencedTable: "admin_users",
    referencedColumn: "id",
    deleteRule: "CASCADE",
  },
];

async function verifySchema() {
  const [tableRows] = await connection.execute(
    "SELECT TABLE_NAME, ENGINE, TABLE_COLLATION FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'",
  );
  const tables = new Map(tableRows.map((row) => [row.TABLE_NAME, row]));
  const mismatches = [];
  for (const table of Object.keys(expectedSchema)) {
    const actual = tables.get(table);
    if (!actual) {
      mismatches.push(`${table}: table is missing`);
    } else {
      if (actual.ENGINE !== "InnoDB")
        mismatches.push(`${table}: expected InnoDB, found ${actual.ENGINE}`);
      if (!String(actual.TABLE_COLLATION).toLowerCase().startsWith("utf8mb4_")) {
        mismatches.push(`${table}: expected utf8mb4 collation, found ${actual.TABLE_COLLATION}`);
      }
    }
  }

  const [colRows] = await connection.execute(
    "SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE()",
  );
  const columnsByTable = new Map();
  for (const row of colRows) {
    const columns = columnsByTable.get(row.TABLE_NAME) ?? new Map();
    columns.set(row.COLUMN_NAME, String(row.COLUMN_TYPE).toLowerCase());
    columnsByTable.set(row.TABLE_NAME, columns);
  }

  for (const [table, expectedColumns] of Object.entries(expectedSchema)) {
    const actualColumns = columnsByTable.get(table) ?? new Map();
    for (const [column, expectedType] of Object.entries(expectedColumns)) {
      const actualType = actualColumns.get(column);
      if (!actualType) mismatches.push(`${table}.${column}: column is missing`);
      else if (actualType !== expectedType) {
        mismatches.push(`${table}.${column}: expected ${expectedType}, found ${actualType}`);
      }
    }
  }

  const [indexRows] = await connection.execute(
    "SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX",
  );
  const indexesByTable = new Map();
  for (const row of indexRows) {
    const indexes = indexesByTable.get(row.TABLE_NAME) ?? new Map();
    const index = indexes.get(row.INDEX_NAME) ?? {
      unique: Number(row.NON_UNIQUE) === 0,
      columns: [],
    };
    index.columns.push(row.COLUMN_NAME);
    indexes.set(row.INDEX_NAME, index);
    indexesByTable.set(row.TABLE_NAME, indexes);
  }
  for (const [table, expected] of Object.entries(expectedIndexes)) {
    const actualIndexes = indexesByTable.get(table) ?? new Map();
    for (const [name, columns] of Object.entries(expected)) {
      const actual = actualIndexes.get(name);
      const expectedUnique = expectedUniqueIndexes.has(`${table}.${name}`);
      if (
        !actual ||
        actual.unique !== expectedUnique ||
        JSON.stringify(actual.columns) !== JSON.stringify(columns)
      ) {
        mismatches.push(`${table}.${name}: missing or incompatible unique/index definition`);
      }
    }
  }

  const [foreignKeyRows] = await connection.execute(
    "SELECT k.TABLE_NAME, k.CONSTRAINT_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME, r.DELETE_RULE FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA AND r.TABLE_NAME = k.TABLE_NAME AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME WHERE k.CONSTRAINT_SCHEMA = DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL",
  );
  const actualForeignKeys = foreignKeyRows.map((row) => ({
    table: row.TABLE_NAME,
    name: row.CONSTRAINT_NAME,
    column: row.COLUMN_NAME,
    referencedTable: row.REFERENCED_TABLE_NAME,
    referencedColumn: row.REFERENCED_COLUMN_NAME,
    deleteRule: row.DELETE_RULE,
  }));
  if (JSON.stringify(actualForeignKeys) !== JSON.stringify(expectedForeignKeys)) {
    mismatches.push("foreign keys: found definitions do not match the required constraints");
  }

  if (mismatches.length) {
    throw new Error(
      "Schema mismatch detected; this migration will not alter existing tables. Apply a reviewed, non-destructive ALTER migration after backing up the database:\n" +
        mismatches.map((m) => `  ${m}`).join("\n"),
    );
  }
}

try {
  const sql = await readFile(new URL("../database/mysql-schema.sql", import.meta.url), "utf8");
  const seedSql = await readFile(new URL("../database/mysql-seed.sql", import.meta.url), "utf8");
  // MySQL DDL implicitly commits; this is repeatable DDL, not one atomic transaction.
  // A failure may leave some tables created, but the version is not recorded until
  // every schema check and seed statement has succeeded.
  await connection.query(sql);

  // Verify the schema actually matches what the application expects.
  // CREATE TABLE IF NOT EXISTS silently skips tables that already exist,
  // so an incompatible pre-existing table would not be fixed.
  await verifySchema();

  await connection.beginTransaction();
  transactionStarted = true;
  await connection.query(seedSql);
  const [productRows] = await connection.execute(
    "SELECT COUNT(*) AS count FROM products WHERE status = 'published'",
  );
  await connection.execute("INSERT IGNORE INTO schema_migrations (version) VALUES (?)", [
    schemaVersion,
  ]);
  await connection.commit();
  transactionStarted = false;

  console.log("MySQL schema and initial catalogue are ready.");
  console.log(`Schema version: ${schemaVersion}`);
  console.log(`Published products: ${productRows[0]?.count ?? 0}`);
  console.log("Schema verification passed: all tables and columns match expectations.");
} catch (error) {
  if (transactionStarted) await connection.rollback();
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await connection.end();
}
