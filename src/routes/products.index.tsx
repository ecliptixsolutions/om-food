import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { CatalogCards } from "@/components/catalog";
import { SiteLayout, PageIntro, InquiryBanner } from "@/components/site";
import { pageHead } from "@/lib/site-metadata";
import { useLanguage } from "@/lib/i18n";
export const Route = createFileRoute("/products/")({ validateSearch: (search: Record<string, unknown>) => ({ category: typeof search["category"] === "string" ? search["category"] : undefined }), head: () => pageHead("Product Catalogue | OM Food and Spices LLP", "Explore fresh and dehydrated onion and garlic inquiry categories for wholesale and food businesses.", "/products"), component: Products });
function Products() {
  const [group, setGroup] = useState("");
  const { category: searchCategory } = useSearch({ from: "/products/" });
  const { t } = useLanguage();
  useEffect(() => {
    setGroup(searchCategory === "fresh-garlic" ? "Fresh garlic" : searchCategory === "dehydrated-garlic" ? "Dehydrated garlic" : searchCategory === "fresh-onions" ? "Fresh onions" : searchCategory === "dehydrated-onions" ? "Dehydrated onions" : "");
  }, [searchCategory]);
  const categories = ["", "Fresh onions", "Dehydrated onions", "Fresh garlic", "Dehydrated garlic"];
  return <SiteLayout><PageIntro eyebrow="Product catalogue" title="Find the right product format" description="Explore proposed product categories for your inquiry. Listings are not confirmed inventory; availability and specifications must be checked with the company." /><section className="section section-white"><div className="wrap"><div className="category-nav" aria-label={t("Filter products")}>{categories.map(category => <button type="button" className="button button-outline" aria-pressed={category === group} onClick={() => setGroup(category)} key={category}>{t(category || "All products")}</button>)}</div><CatalogCards group={group} /><p className="catalogue-note">No prices, grades, packaging or minimum order quantities are assumed. Request details for your requirements.</p></div></section><InquiryBanner /></SiteLayout>;
}
