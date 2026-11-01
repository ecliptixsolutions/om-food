import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { CatalogCards } from "@/components/catalog";
import { SiteLayout, PageIntro, InquiryBanner } from "@/components/site";
import { pageHead } from "@/lib/site-metadata";
import { useLanguage } from "@/lib/i18n";
export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>) => ({
    category:
      search["category"] === "dehydrated-onions" || search["category"] === "dehydrated-garlic"
        ? search["category"]
        : undefined,
  }),
  head: () =>
    pageHead(
      "Product Catalogue | OM Food and Spices LLP",
      "Explore dehydrated onion and garlic inquiry categories for wholesale and food businesses.",
      "/products",
    ),
  component: Products,
});
function Products() {
  const [group, setGroup] = useState("");
  const { category: searchCategory } = useSearch({ from: "/products/" });
  const { t } = useLanguage();
  useEffect(() => {
    setGroup(
      searchCategory === "dehydrated-garlic"
        ? "Dehydrated garlic"
        : searchCategory === "dehydrated-onions"
          ? "Dehydrated onions"
          : "",
    );
  }, [searchCategory]);
  const categories = ["", "Dehydrated onions", "Dehydrated garlic"];
  const families = ["White onion", "Red onion", "Pink onion", "Garlic"];
  const formats = ["Flakes / Kibbled", "Chopped", "Minced", "Granules", "Powder"];
  return (
    <SiteLayout>
      <PageIntro
        eyebrow="Product catalogue"
        title="Find the right product format"
        description="Explore proposed product categories for your inquiry. Listings are not confirmed inventory; availability and specifications must be checked with the company."
      />
      <section className="section section-white">
        <div className="wrap">
          <div className="category-nav" aria-label={t("Filter products")}>
            {categories.map((category) => (
              <button
                type="button"
                className="button button-outline"
                aria-pressed={category === group}
                onClick={() => setGroup(category)}
                key={category}
              >
                {t(category || "All products")}
              </button>
            ))}
          </div>
          <CatalogCards group={group} />
          <p className="catalogue-note">
            No prices, grades, packaging or minimum order quantities are assumed. Request details
            for your requirements.
          </p>
        </div>
      </section>
      <section className="section section-paper" aria-labelledby="format-guide-title">
        <div className="wrap">
          <div className="text-section">
            <span className="eyebrow">Product format guide</span>
            <h2 id="format-guide-title">Four ingredient families. Five familiar forms.</h2>
            <p>
              Use this guide to describe what you need. These are inquiry categories, not a list of
              approved stock items. Our team will confirm each form, cut size and specification.
            </p>
          </div>
          <div className="format-family-grid">
            {families.map((family) => (
              <article className="format-family-card" key={family}>
                <h3>{family}</h3>
                <ul>{formats.map((format) => <li key={format}>{format}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>
      <InquiryBanner />
    </SiteLayout>
  );
}
