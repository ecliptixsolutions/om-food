import { createFileRoute } from "@tanstack/react-router";
import { CatalogCards } from "@/components/catalog";
import { SiteLayout, PageIntro, InquiryBanner } from "@/components/site";
import { pageHead } from "@/lib/site-metadata";
export const Route = createFileRoute("/fresh-onions")({ head: () => pageHead("Fresh onions | OM Food and Spices LLP", "Discuss fresh red and white onion requirements for wholesale distribution, food service and commercial markets.", "/fresh-onions"), component: Category });
function Category() { return <SiteLayout><PageIntro eyebrow="Fresh onions" title="Fresh onion supply for wholesale buyers" description="Discuss fresh red and white onion requirements for wholesale distribution, food service and commercial markets." /><section className="section section-white"><div className="wrap"><CatalogCards group="Fresh onions" /><p className="catalogue-note">These are inquiry categories, subject to company confirmation. Share your preferred variety or format, size or particle grade, quantity, packaging and destination. Technical specifications and documentation are supplied only when available and confirmed.</p></div></section><InquiryBanner /></SiteLayout>; }
