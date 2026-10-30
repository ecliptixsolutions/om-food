import { attachDatabasePool } from "@vercel/functions";
import mysql from "mysql2/promise";

const mysqlUrl = process.env["MYSQL_URL"];
if (!mysqlUrl && process.env["NODE_ENV"] === "production") {
  console.warn("MYSQL_URL is not configured; database-backed features will be unavailable.");
}

export const mysqlPool = mysqlUrl ? mysql.createPool({ uri: mysqlUrl, charset: "utf8mb4" }) : null;
if (mysqlPool && process.env["VERCEL"]) attachDatabasePool(mysqlPool);

export function getMysqlPool() {
  if (!mysqlPool) throw new Error("MySQL is not configured. Set MYSQL_URL on the server.");
  return mysqlPool;
}
