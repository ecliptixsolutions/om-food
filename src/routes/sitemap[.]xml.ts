import { createFileRoute } from "@tanstack/react-router";
import { siteOrigin } from "@/lib/site-metadata";
import { productCatalog } from "@/lib/product-catalog";
import { productSlug } from "@/components/catalog";
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const paths = [
          "/",
          "/about",
          "/products",
          "/dehydrated-onions",
          "/quality-sourcing",
          "/contact",
          "/privacy",
          "/terms",
          ...productCatalog.map((p) => `/products/${productSlug(p.name)}`),
        ];
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${siteOrigin}${p}</loc></url>`).join("")}</urlset>`,
          { headers: { "Content-Type": "application/xml; charset=utf-8" } },
        );
      },
    },
  },
});
