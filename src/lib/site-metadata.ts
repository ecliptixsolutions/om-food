export const siteOrigin = (import.meta.env['VITE_SITE_URL'] || "https://example.com").replace(/\/$/, "");
export function pageHead(title: string, description: string, path: string) {
  const url = `${siteOrigin}${path}`;
  return {
    meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { property: "og:url", content: url }, { property: "og:image", content: `${siteOrigin}/social-preview.svg` }, { name: "twitter:card", content: "summary_large_image" }],
    links: [{ rel: "canonical", href: url }],
  };
}

