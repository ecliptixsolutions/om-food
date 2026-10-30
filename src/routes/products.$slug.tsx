import { whatsappUrl } from "@/lib/whatsapp";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { productCatalog } from "@/lib/product-catalog";
import { listPublicProducts } from "@/lib/admin.functions";
import { productSlug } from "@/components/catalog";
import { SiteLayout, PageIntro, QuoteForm } from "@/components/site";
import { pageHead } from "@/lib/site-metadata";
import { useLanguage } from "@/lib/i18n";
const categoryLabels: Record<string, string> = {
  "dehydrated-onions": "Dehydrated onions",
  "dehydrated-garlic": "Dehydrated garlic",
};
export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }) => {
    const rows = await listPublicProducts();
    const row = rows?.find((item) => item.slug === params.slug);
    const product = row
      ? {
          name: row.name,
          group: categoryLabels[row.category] ?? "Products",
          description: row.description,
          image: row.image_url,
          alt: row.image_alt,
        }
      : rows === null
        ? productCatalog.find((item) => productSlug(item.name) === params.slug)
        : undefined;
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData: p, params }) =>
    pageHead(
      `${p?.name ?? "Product"} | OM Food and Spices LLP`,
      p?.description ?? "Product inquiry",
      `/products/${params.slug}`,
    ),
  component: Product,
});
function Product() {
  const p = Route.useLoaderData();
  const { t } = useLanguage();
  return (
    <SiteLayout>
      <PageIntro eyebrow={p.group} title={p.name} description={p.description} />
      <section className="section section-white">
        <div className="wrap">
          <nav aria-label="Breadcrumb">
            <Link to="/">{t("Home")}</Link> /{" "}
            <Link to="/products" search={{ category: undefined }}>
              {t("Products")}
            </Link>{" "}
            / <span>{t(p.name)}</span>
          </nav>
          <div className="two-column">
            <img src={p.image} alt={t(p.alt)} width="600" height="480" />
            <div className="text-section">
              <h2>{t("Discuss your specifications")}</h2>
              <p>
                {t(
                  "This is a proposed inquiry category. Availability requires direct confirmation.",
                )}
              </p>
              <h3>{t("Potential applications")}</h3>
              <p>
                {t(
                  "Seasoning blends, sauces, prepared foods and commercial food processing, depending on confirmed specifications.",
                )}
              </p>
              <p>
                <a
                  className="text-link"
                  href={whatsappUrl(
                    `Hello OM Food and Spices LLP, I would like to enquire about ${p.name.toLowerCase()}. Please share the available specifications and quotation details.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("Enquire on WhatsApp")}
                </a>
              </p>
              <h3>{t("Specifications and packaging")}</h3>
              <p>
                {t(
                  "Ask about variety, size or particle grade, packaging and available documentation. For dehydrated formats, request documented moisture and microbiological information where available. No technical values or shelf life are assumed.",
                )}
              </p>
            </div>
          </div>
          <div className="quote-panel" style={{ marginTop: 48 }}>
            <h2>
              {t("Enquire about")} {t(p.name)}
            </h2>
            <QuoteForm selectedProduct={p.name} />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
