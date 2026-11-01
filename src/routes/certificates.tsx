import { createFileRoute } from "@tanstack/react-router";
import { InquiryBanner, PageIntro, SiteLayout } from "@/components/site";
import { pageHead } from "@/lib/site-metadata";

export const Route = createFileRoute("/certificates")({
  head: () => pageHead("Certificates & Documents | OM Food and Spices LLP", "Request current certificates and product documents for supplier approval.", "/certificates"),
  component: Certificates,
});

function Certificates() {
  return <SiteLayout><PageIntro eyebrow="Certificates & documents" title="The documents your team needs" description="Request current company and product documents for supplier approval. Public downloads appear here only after their scope, validity and permission to publish are confirmed." />
    <section className="section section-white"><div className="wrap text-section"><h2>GST registration</h2><p>OM Food and Spices LLP is registered in Gujarat under GSTIN <strong>24AAKFO2365E1ZE</strong>. The supplied registration certificate shows a validity start date of 10 June 2026.</p><p>Ask our team for the current document when qualifying the company as a supplier.</p><h2>Other documents available on request</h2><p>Ask for applicable product specifications, treatment records and batch-specific test results. Our team will confirm what applies to your product and shipment. No product certification is implied by the GST registration.</p></div></section><InquiryBanner /></SiteLayout>;
}
