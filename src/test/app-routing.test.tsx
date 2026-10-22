import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { productCatalog } from "@/lib/product-catalog";
import { productSlug } from "@/components/catalog";
describe("Business website navigation", () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
  it.each(["/", "/about", "/products", "/fresh-onions", "/dehydrated-onions", "/quality-sourcing", "/contact", "/privacy", "/terms", ...productCatalog.map(p => `/products/${productSlug(p.name)}`)])("matches %s completely", path => {
    const match = router.matchRoutes(path).at(-1);
    expect(match?.routeId).not.toBe("__root__");
    expect(match?.pathname.replace(/\/$/, "")).toBe(path.replace(/\/$/, ""));
  });
  it("keeps product form values distinct", () => expect(new Set(productCatalog.map(p => p.name)).size).toBe(productCatalog.length));
  it("includes six distinct garlic inquiry categories and leaves unconfirmed dehydrated cloves out", () => {
    const garlic = productCatalog.filter(p => p.group.includes("garlic"));
    expect(garlic.map(p => p.name)).toEqual(["Fresh whole garlic", "Fresh peeled garlic", "Dehydrated garlic flakes", "Dehydrated minced garlic", "Dehydrated garlic granules", "Dehydrated garlic powder"]);
    expect(new Set(garlic.map(p => p.image)).size).toBe(6);
    expect(garlic.every(p => p.alt && p.description && p.path)).toBe(true);
  });
  it("gives each dehydrated product its own image and descriptive alt text", () => {
    const products = productCatalog.filter(p => p.group === "Dehydrated onions");
    expect(products).toHaveLength(4);
    expect(new Set(products.map(p => p.image)).size).toBe(4);
    expect(products.map(p => p.alt)).toEqual([
      "Dehydrated onion flakes and kibbled onion pieces.",
      "Minced dehydrated onion pieces.",
      "Dehydrated onion granules.",
      "Fine dehydrated onion powder.",
    ]);
  });
});
