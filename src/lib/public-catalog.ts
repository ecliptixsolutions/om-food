import { useQuery } from "@tanstack/react-query";
import { listPublicProducts } from "@/lib/admin.functions";
import { productCatalog } from "@/lib/product-catalog";

export type PublicCatalogItem = {
  id?: string;
  name: string;
  slug: string;
  group: string;
  description: string;
  image: string;
  alt: string;
};

const groups: Record<string, string> = {
  "dehydrated-onions": "Dehydrated onions",
  "dehydrated-garlic": "Dehydrated garlic",
};

export function usePublicCatalog() {
  const query = useQuery({
    queryKey: ["public-catalog"],
    queryFn: () => listPublicProducts(),
    staleTime: 30_000,
  });
  const products: PublicCatalogItem[] =
    query.data == null
      ? productCatalog.map((item) => ({ ...item, slug: slugify(item.name) }))
      : query.data.map((item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          group: groups[item.category] ?? "Products",
          description: item.description,
          image: item.image_url,
          alt: item.image_alt,
        }));
  return { ...query, products };
}

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-$/, "");
}
