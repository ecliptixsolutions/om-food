import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

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
    if (!process.env['SUPABASE_SERVICE_ROLE_KEY']) throw new Error("Inquiry storage is unavailable. Use the WhatsApp enquiry form or contact us directly.");
    const ipAddress = getRequestHeader("cf-connecting-ip") ?? "unknown";
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ipAddress));
    const keyHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: allowed, error: rateLimitError } = await supabaseAdmin.rpc("allow_quote_inquiry", {
      _key_hash: keyHash,
    });
    if (rateLimitError) {
      console.error("Unable to validate inquiry rate limit", rateLimitError.message);
      throw new Error("We could not submit your inquiry right now. Please try again shortly.");
    }
    if (!allowed) throw new Error("Please wait a minute before sending another inquiry.");

    const { error } = await supabaseAdmin.from("quote_inquiries").insert((({ website: _website, ...inquiry }) => inquiry)(data));
    if (error) {
      console.error("Unable to save buyer inquiry", error.message);
      throw new Error("We could not submit your inquiry right now. Please try again shortly.");
    }
    return { accepted: true };
  });


