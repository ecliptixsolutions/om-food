import { createServerFn } from "@tanstack/react-start";
import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { requireAdminAuth, type AdminRole } from "@/lib/admin-auth.functions";
import { getMysqlPool } from "@/lib/mysql.server";

type ProductRow = RowDataPacket & {
  id: string;
  name: string;
  slug: string;
  category: "fresh-onions" | "dehydrated-onions" | "fresh-garlic" | "dehydrated-garlic";
  description: string;
  image_url: string;
  image_alt: string;
  status: "draft" | "published" | "archived";
  featured: number | boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
};
type InquiryRow = RowDataPacket & {
  id: string;
  created_at: Date;
  full_name: string;
  company_name: string;
  business_email: string;
  phone: string;
  country: string;
  product_interest: string;
  required_quantity: string;
  destination: string;
  message: string;
  status: "new" | "in_progress" | "quoted" | "closed";
  updated_at: Date;
};

const roleGroups: Record<"products" | "enquiries", AdminRole[]> = {
  products: ["owner", "manager", "editor", "viewer"],
  enquiries: ["owner", "manager", "sales", "viewer"],
};

async function audit(actorId: string, action: string, entity: string, entityId?: string) {
  try {
    await getMysqlPool().execute(
      "INSERT INTO admin_activity_logs (id,actor_id,action,entity,entity_id) VALUES (?,?,?,?,?)",
      [randomUUID(), actorId, action, entity, entityId ?? null],
    );
  } catch (error) {
    console.error("Unable to write admin activity record", error);
  }
}

export const listPublicProducts = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const [rows] = await getMysqlPool().query<ProductRow[]>(
      "SELECT id,name,slug,category,description,image_url,image_alt,status,featured,display_order,created_at,updated_at FROM products WHERE status='published' AND category IN ('dehydrated-onions','dehydrated-garlic') ORDER BY display_order,created_at",
    );
    return rows.map((row) => ({ ...row, featured: Boolean(row.featured) }));
  } catch (error) {
    console.error("Unable to load public catalogue from MySQL", error);
    return null;
  }
});

export const getAdminConsole = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .handler(async ({ context }) => {
    const role = context.admin.role;
    const canProducts = roleGroups.products.includes(role);
    const canEnquiries = roleGroups.enquiries.includes(role);
    const pool = getMysqlPool();
    const [products, enquiries, activity] = await Promise.all([
      canProducts
        ? pool.query<ProductRow[]>("SELECT * FROM products ORDER BY updated_at DESC")
        : Promise.resolve([[], []] as const),
      canEnquiries
        ? pool.query<InquiryRow[]>(
            "SELECT id,created_at,full_name,company_name,business_email,phone,country,product_interest,required_quantity,destination,message,status,updated_at FROM quote_inquiries ORDER BY created_at DESC LIMIT 100",
          )
        : Promise.resolve([[], []] as const),
      pool.query<
        Array<
          RowDataPacket & {
            id: string;
            action: string;
            entity: string;
            entity_id: string | null;
            created_at: Date;
          }
        >
      >(
        "SELECT id,action,entity,entity_id,created_at FROM admin_activity_logs ORDER BY created_at DESC LIMIT 8",
      ),
    ]);
    return {
      role,
      canProducts,
      canEnquiries,
      products: products[0].map((row) => ({ ...row, featured: Boolean(row.featured) })),
      enquiries: enquiries[0],
      activity: activity[0],
    };
  });

const productInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.enum(["fresh-onions", "dehydrated-onions", "fresh-garlic", "dehydrated-garlic"]),
  description: z.string().trim().max(3000),
  image_url: z.string().trim().max(2000),
  image_alt: z.string().trim().max(300),
  status: z.enum(["draft", "published", "archived"]),
  featured: z.boolean(),
  display_order: z.number().int().min(0).max(9999),
});

export const saveAdminProduct = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((input) => productInput.parse(input))
  .handler(async ({ context, data }) => {
    if (!["owner", "manager", "editor"].includes(context.admin.role))
      throw new Error("You are not authorized to edit products.");
    if (data.status === "published" && data.category.startsWith("fresh-"))
      throw new Error("Only dehydrated products can be published in the public catalogue.");
    const pool = getMysqlPool();
    const id = data.id ?? randomUUID();
    if (data.id) {
      await pool.execute(
        "UPDATE products SET name=?,slug=?,category=?,description=?,image_url=?,image_alt=?,status=?,featured=?,display_order=?,updated_at=UTC_TIMESTAMP() WHERE id=?",
        [
          data.name,
          data.slug,
          data.category,
          data.description,
          data.image_url,
          data.image_alt,
          data.status,
          data.featured,
          data.display_order,
          id,
        ],
      );
    } else {
      await pool.execute(
        "INSERT INTO products (id,name,slug,category,description,image_url,image_alt,status,featured,display_order) VALUES (?,?,?,?,?,?,?,?,?,?)",
        [
          id,
          data.name,
          data.slug,
          data.category,
          data.description,
          data.image_url,
          data.image_alt,
          data.status,
          data.featured,
          data.display_order,
        ],
      );
    }
    await audit(context.admin.id, data.id ? "product.updated" : "product.created", "product", id);
    return { id };
  });

export const saveAdminMedia = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((input) =>
    z
      .object({
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        contents: z.string().min(1).max(7_000_000),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    if (!["owner", "manager", "editor"].includes(context.admin.role))
      throw new Error("You are not authorized to upload images.");
    const bytes = Buffer.from(data.contents, "base64");
    if (!bytes.length || bytes.length > 5 * 1024 * 1024)
      throw new Error("Image must be smaller than 5 MB.");
    const signature =
      data.mimeType === "image/jpeg"
        ? bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
        : data.mimeType === "image/png"
          ? bytes
              .subarray(0, 8)
              .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
          : bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
            bytes.subarray(8, 12).toString("ascii") === "WEBP";
    if (!signature) throw new Error("The uploaded file does not match its image type.");
    const id = randomUUID();
    await getMysqlPool().execute("INSERT INTO admin_media (id,mime_type,contents) VALUES (?,?,?)", [
      id,
      data.mimeType,
      bytes,
    ]);
    return { url: `/api/media/${id}` };
  });

export const updateInquiryStatus = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((input) =>
    z
      .object({ id: z.string().uuid(), status: z.enum(["new", "in_progress", "quoted", "closed"]) })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    if (!["owner", "manager", "sales"].includes(context.admin.role))
      throw new Error("You are not authorized to update enquiries.");
    const [result] = await getMysqlPool().execute(
      "UPDATE quote_inquiries SET status=?,updated_at=UTC_TIMESTAMP() WHERE id=?",
      [data.status, data.id],
    );
    if ("affectedRows" in result && result.affectedRows === 0)
      throw new Error("This enquiry could not be found.");
    await audit(context.admin.id, "enquiry.status_changed", "quote_inquiry", data.id);
    return { updated: true };
  });
