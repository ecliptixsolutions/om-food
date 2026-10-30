import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import { loadEnvFile } from "node:process";
import { resolve } from "node:path";

if (existsSync(".env.local")) loadEnvFile(".env.local");

const fields = [
  ["full_name", 120],
  ["company_name", 160],
  ["business_email", 255],
  ["phone", 40],
  ["country", 100],
  ["product_interest", 120],
  ["required_quantity", 120],
  ["packaging_preference", 200],
  ["destination", 200],
  ["delivery_timeline", 120],
  ["message", 3000],
];
const columns = ["id", "created_at", ...fields.map(([name]) => name), "privacy_consent"];
const select = columns.join(",");

export function parseLegacyCsv(csv) {
  csv = csv.replace(/^\uFEFF/, "");
  const records = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index++) {
    const char = csv[index];
    if (quoted) {
      if (char === '"' && csv[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') {
      if (field) throw new Error("Legacy CSV has an invalid quote.");
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      if (row.some(Boolean)) records.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (quoted) throw new Error("Legacy CSV has an unterminated quoted value.");
  if (field || row.length) {
    row.push(field);
    if (row.some(Boolean)) records.push(row);
  }
  if (records.length < 1) throw new Error("Legacy CSV is empty.");

  const headers = records
    .shift()
    .map((header, index) => (index === 0 ? header.replace(/^\uFEFF/, "") : header));
  if (
    new Set(headers).size !== headers.length ||
    columns.some((column) => !headers.includes(column))
  )
    throw new Error("Legacy CSV headers do not match the quote inquiry schema.");
  return records.map((values) => {
    if (values.length !== headers.length)
      throw new Error("Legacy CSV row has an invalid column count.");
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

export function mapLegacyInquiry(row) {
  if (!row || typeof row !== "object" || !/^[0-9a-f-]{36}$/i.test(row.id ?? ""))
    throw new Error("Legacy inquiry has an invalid identifier.");
  const result = { id: row.id, created_at: normalizeTimestamp(row.created_at) };
  for (const [field, max] of fields) {
    const value = row[field] ?? "";
    if (typeof value !== "string" || value.length > max)
      throw new Error(`Legacy inquiry field ${field} is incompatible with the MySQL schema.`);
    result[field] = value;
  }
  if (![true, false, "true", "false"].includes(row.privacy_consent))
    throw new Error("Legacy inquiry consent value is incompatible with the MySQL schema.");
  result.privacy_consent = row.privacy_consent === true || row.privacy_consent === "true";
  return result;
}

function normalizeTimestamp(value) {
  const text = value instanceof Date ? value.toISOString() : String(value ?? "");
  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(?:Z|([+-])(\d{2}):?(\d{2})?)?$/i,
  );
  if (!match) throw new Error("Legacy inquiry has an invalid timestamp.");
  const [, year, month, day, hour, minute, second, fraction = "", sign, offsetHour, offsetMinute] =
    match;
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);
  const numericHour = Number(hour);
  const numericMinute = Number(minute);
  const numericSecond = Number(second);
  const offsetHours = Number(offsetHour) || 0;
  const offsetMinutes = Number(offsetMinute) || 0;
  const calendarDate = new Date(Date.UTC(numericYear, numericMonth - 1, numericDay));
  if (
    numericYear < 1000 ||
    calendarDate.getUTCFullYear() !== numericYear ||
    calendarDate.getUTCMonth() !== numericMonth - 1 ||
    calendarDate.getUTCDate() !== numericDay ||
    numericHour > 23 ||
    numericMinute > 59 ||
    numericSecond > 59 ||
    offsetHours > 14 ||
    offsetMinutes > 59 ||
    (offsetHours === 14 && offsetMinutes !== 0)
  ) {
    throw new Error("Legacy inquiry has an invalid timestamp.");
  }
  const offset = (sign === "-" ? -1 : 1) * (offsetHours * 60 + offsetMinutes);
  const date = new Date(
    Date.UTC(numericYear, numericMonth - 1, numericDay, numericHour, numericMinute, numericSecond) -
      offset * 60_000,
  );
  if (!Number.isFinite(date.getTime())) throw new Error("Legacy inquiry has an invalid timestamp.");
  return `${date.toISOString().slice(0, 19).replace("T", " ")}.${fraction.padEnd(6, "0").slice(0, 6)}`;
}

export function sameLegacyInquiry(existing, incoming) {
  return columns.every((column) => {
    if (column === "created_at") return normalizeTimestamp(existing[column]) === incoming[column];
    if (column === "privacy_consent") return Boolean(existing[column]) === incoming[column];
    return String(existing[column]) === String(incoming[column]);
  });
}

export async function reconcileLegacyInquiries(rows, connection, apply) {
  const unique = new Map();
  for (const row of rows) {
    const prior = unique.get(row.id);
    if (prior && !sameLegacyInquiry(prior, row))
      throw new Error("Legacy source contains conflicting duplicate identifiers.");
    unique.set(row.id, row);
  }

  let transaction = false;
  let inserted = 0;
  let unchanged = 0;
  try {
    if (apply) {
      await connection.beginTransaction();
      transaction = true;
    }
    for (const row of unique.values()) {
      const [found] = await connection.execute(
        `SELECT ${select} FROM quote_inquiries WHERE id=? LIMIT 1`,
        [row.id],
      );
      if (found[0]) {
        if (!sameLegacyInquiry(found[0], row))
          throw new Error(
            "Target contains a conflicting inquiry identifier; import stopped without overwriting it.",
          );
        unchanged++;
        continue;
      }
      if (apply) {
        await connection.execute(
          `INSERT INTO quote_inquiries (${select}) VALUES (${columns.map(() => "?").join(",")})`,
          columns.map((column) => row[column]),
        );
      }
      inserted++;
    }
    if (transaction) {
      await connection.commit();
      transaction = false;
    }
    return { sourceRows: rows.length, uniqueRows: unique.size, inserted, unchanged };
  } catch (error) {
    if (transaction) await connection.rollback();
    throw error;
  }
}

async function run() {
  const apply = process.argv.includes("--apply");
  const target = process.argv.find((arg) => arg.startsWith("--target-database="))?.split("=")[1];
  const input = process.argv.find((arg) => arg.startsWith("--input="))?.slice("--input=".length);
  const mysqlUrl = process.env.MYSQL_URL;
  if (!input || !mysqlUrl || !target)
    throw new Error("Provide --input, MYSQL_URL, and --target-database.");

  const csv = await readFile(resolve(input), "utf8");
  const rows = parseLegacyCsv(csv.replace(/^\uFEFF/, "")).map(mapLegacyInquiry);
  const connection = await mysql.createConnection({
    uri: mysqlUrl,
    charset: "utf8mb4",
    timezone: "Z",
    dateStrings: true,
  });
  try {
    const [databases] = await connection.query("SELECT DATABASE() AS name");
    if (databases[0]?.name !== target)
      throw new Error("Connected database does not match --target-database.");
    const { sourceRows, inserted, unchanged } = await reconcileLegacyInquiries(
      rows,
      connection,
      apply,
    );
    console.log(
      `${apply ? "Import" : "Dry run"} complete: ${sourceRows} source rows, ${inserted} to import, ${unchanged} already reconciled.`,
    );
  } finally {
    await connection.end();
  }
}

if (process.argv[1]?.endsWith("import-legacy-inquiries.mjs")) {
  run().catch((error) => {
    console.error(
      `Legacy inquiry migration stopped (${error.code ?? "validation error"}); no row contents or credentials were logged.`,
    );
    process.exitCode = 1;
  });
}
