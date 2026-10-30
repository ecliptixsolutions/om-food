import { createFileRoute } from "@tanstack/react-router";
import { getMysqlPool } from "@/lib/mysql.server";
import type { RowDataPacket } from "mysql2";

export const Route = createFileRoute("/api/media/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!/^[0-9a-f-]{36}$/i.test(params.id)) return new Response("Not found", { status: 404 });
        // Uploaded media stays private until a published product explicitly
        // references its local media URL. Drafts and archived products never
        // make their image blobs publicly addressable.
        const [rows] = await getMysqlPool().execute<
          (RowDataPacket & { mime_type: string; contents: Buffer })[]
        >(
          "SELECT m.mime_type,m.contents FROM admin_media m WHERE m.id=? AND EXISTS (SELECT 1 FROM products p WHERE p.status='published' AND p.image_url=CONCAT('/api/media/',m.id)) LIMIT 1",
          [params.id],
        );
        const image = rows[0];
        if (!image) return new Response("Not found", { status: 404 });
        return new Response(new Uint8Array(image.contents), {
          headers: {
            "content-type": image.mime_type,
            "cache-control": "public, max-age=31536000, immutable",
            "x-content-type-options": "nosniff",
          },
        });
      },
    },
  },
});
