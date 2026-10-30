import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/i18n";
import { usePublicCatalog } from "@/lib/public-catalog";

export function CatalogCards({ group }: { group?: string }) {
  const { t } = useLanguage();
  const { products } = usePublicCatalog();
  return <div className="product-grid">{products.filter(p => !group || p.group === group).map(p => <article className="product-card" key={p.slug}><img src={p.image} alt={t(p.alt)} loading="lazy" width="600" height="480" /><div className="product-card-copy"><h3>{t(p.name)}</h3><p>{t(p.description)}</p><Link className="text-link" to="/products/$slug" params={{ slug: p.slug }}>{t("Request details →")}</Link></div></article>)}</div>;
}
export { slugify as productSlug } from "@/lib/public-catalog";
