import { createFileRoute } from "@tanstack/react-router";
import { CatalogCards } from "@/components/catalog";
import { SiteLayout, PageIntro, InquiryBanner } from "@/components/site";
import { pageHead } from "@/lib/site-metadata";
export const Route = createFileRoute("/dehydrated-onions")({ head: () => pageHead("Dehydrated onions | OM Food and Spices LLP", "Explore inquiry formats for seasoning blends, sauces, prepared foods and food manufacturing.", "/dehydrated-onions"), component: Category });
function Category() { return <SiteLayout><PageIntro eyebrow="Dehydrated onions" title="Dehydrated onion ingredients for food businesses" description="Explore inquiry formats for seasoning blends, sauces, prepared foods and food manufacturing." /><section className="section section-white"><div className="wrap"><CatalogCards group="Dehydrated onions" /><p className="catalogue-note">These are inquiry categories, subject to company confirmation. Share your preferred variety or format, size or particle grade, quantity, packaging and destination. Technical specifications and documentation are supplied only when available and confirmed.</p></div></section><InquiryBanner /></SiteLayout>; }
