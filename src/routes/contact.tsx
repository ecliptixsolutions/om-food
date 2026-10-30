import { useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageIntro, ContactDetails, QuoteForm } from "@/components/site";
import { pageHead } from "@/lib/site-metadata";
export const Route = createFileRoute("/contact")({ validateSearch: (search: Record<string, unknown>) => ({ embed: search["embed"] === "1", product: typeof search["product"] === "string" && search["product"].length <= 160 ? search["product"] : undefined }), head: () => pageHead("Contact & Request a Quote | OM Food and Spices LLP", "Contact our Gujarat team for onion product details and bulk quotations. Call +91 81407 12205.", "/contact"), component: Contact });
function EmbeddedQuote({ product }: { product?: string }) {
 const form = useRef<HTMLDivElement>(null);
 useEffect(() => {
  const sendHeight = () => window.parent.postMessage({ type: "om-enquiry-height", height: form.current?.getBoundingClientRect().height }, "https://omfoods-final.vercel.app");
  const observer = new ResizeObserver(sendHeight);
  if (form.current) observer.observe(form.current);
  sendHeight();
  return () => observer.disconnect();
 }, []);
 return <div ref={form} className="quotation-theme embedded-quote"><QuoteForm {...(product ? { selectedProduct: product } : {})} /></div>;
}
function Contact() { const { product, embed } = Route.useSearch(); if (embed) return <EmbeddedQuote {...(product ? { product } : {})} />; return <div className="quotation-theme"><SiteLayout><PageIntro eyebrow="Contact & quotations" title="Tell us what your business needs" description="Share your product, quantity and destination so our team can discuss availability and quotation requirements." /><div className="wrap contact-layout"><aside className="contact-panel"><h2>OM Food and Spices LLP</h2><ContactDetails /></aside><section className="quote-panel"><h2>Request a quote</h2><p>Product availability, specifications and shipping arrangements require company confirmation.</p><QuoteForm {...(product ? { selectedProduct: product } : {})} /></section></div></SiteLayout></div>; }
