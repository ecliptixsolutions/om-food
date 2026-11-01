import { createFileRoute } from "@tanstack/react-router";
import { InquiryBanner, PageIntro, SiteLayout } from "@/components/site";
import { pageHead } from "@/lib/site-metadata";

const stages = [
  "Raw material receiving", "Incoming inspection", "Sorting", "Peeling", "Washing",
  "Cutting", "Dehydration", "Cooling", "Size grading", "Milling", "Sieving",
  "Foreign matter control", "Quality testing", "Batch identification", "Food-grade packing",
  "Finished goods inspection", "Storage", "Dispatch",
];

export const Route = createFileRoute("/process")({
  head: () => pageHead("Our Process | OM Food and Spices LLP", "How onion and garlic ingredient requirements are handled from raw materials to dispatch.", "/process"),
  component: Process,
});

function Process() {
  return <SiteLayout><PageIntro eyebrow="Our process" title="From raw material to your requirement" description="An overview of stages buyers may ask us to document. Confirm the equipment, controls and applicable stages for the product you need with our team." />
    <section className="section section-white"><div className="wrap process-grid">{stages.map((stage, i) => <article className="process-step" key={stage}><span className="process-number">{String(i + 1).padStart(2, "0")}</span><h3>{stage}</h3></article>)}</div></section><InquiryBanner /></SiteLayout>;
}
