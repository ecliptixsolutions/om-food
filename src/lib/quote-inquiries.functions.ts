import { createHash, randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { getMysqlPool } from "@/lib/mysql.server";

const quoteInquirySchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  company_name: z.string().trim().min(1).max(160),
  business_email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40),
  country: z.string().trim().min(1).max(100),
  product_interest: z.string().trim().min(1).max(120),
  required_quantity: z.string().trim().max(120),
  packaging_preference: z.string().trim().max(200),
  destination: z.string().trim().max(200),
  delivery_timeline: z.string().trim().max(120),
  message: z.string().trim().min(1).max(3000),
  privacy_consent: z.literal(true),
  website: z.string().max(0, "Unable to submit this inquiry.").optional(),
});

export const submitQuoteInquiry = createServerFn({ method: "POST" })
  .validator((input) => quoteInquirySchema.parse(input))
  .handler(async ({ data }) => {
    const pool = getMysqlPool();
    const rawIp =
      getRequestHeader("cf-connecting-ip") ??
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const ipHash = createHash("sha256").update(rawIp).digest("hex");
    const { website: _website, ...inquiry } = data;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        "INSERT IGNORE INTO quote_rate_limits (ip_hash,last_submitted_at) VALUES (?, '1970-01-01 00:00:00')",
        [ipHash],
      );
      const [limits] = await connection.execute<Array<RowDataPacket & { allowed: number }>>(
        "SELECT last_submitted_at < UTC_TIMESTAMP() - INTERVAL 60 SECOND AS allowed FROM quote_rate_limits WHERE ip_hash=? FOR UPDATE",
        [ipHash],
      );
      if (!limits[0]?.allowed)
        throw new Error("Please wait a minute before sending another inquiry.");
      await connection.execute(
        "UPDATE quote_rate_limits SET last_submitted_at=UTC_TIMESTAMP() WHERE ip_hash=?",
        [ipHash],
      );
      await connection.execute(
        "INSERT INTO quote_inquiries (id,full_name,company_name,business_email,phone,country,product_interest,required_quantity,packaging_preference,destination,delivery_timeline,message,privacy_consent) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          randomUUID(),
          inquiry.full_name,
          inquiry.company_name,
          inquiry.business_email,
          inquiry.phone,
          inquiry.country,
          inquiry.product_interest,
          inquiry.required_quantity,
          inquiry.packaging_preference,
          inquiry.destination,
          inquiry.delivery_timeline,
          inquiry.message,
          inquiry.privacy_consent,
        ],
      );
      await connection.commit();
      return { accepted: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });
