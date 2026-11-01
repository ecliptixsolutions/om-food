import { createFileRoute } from "@tanstack/react-router";
import { InquiryBanner, PageIntro, SiteLayout } from "@/components/site";
import { pageHead } from "@/lib/site-metadata";

export const Route = createFileRoute("/certificates")({
  head: () => pageHead("Certificates & Documents | OM Food and Spices LLP", "Request current certificates and product documents for supplier approval.", "/certificates"),
  component: Certificates,
});

function Certificates() {
  return <SiteLayout><PageIntro eyebrow="Certificates & documents" title="The documents your team needs" description="Request current company and product documents for supplier approval. Public downloads appear here only after their scope, validity and permission to publish are confirmed." />
    <section className="section section-white"><div className="wrap text-section"><h2>Documents available on request</h2><p>Ask for applicable registration, product specifications, treatment records and batch-specific test results. Our team will confirm what applies to your product and shipment.</p></div></section><InquiryBanner /></SiteLayout>;
}
