import { HeroCarousel } from "@/components/hero-carousel";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Globe2, Leaf, PackageCheck, Sprout } from "lucide-react";

import {
  Eyebrow,
  InquiryBanner,
  ProcessSteps,
  SectionHeading,
  SiteLayout,
} from "@/components/site";
import { pageHead } from "@/lib/site-metadata";
import { CatalogCards } from "@/components/catalog";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () =>
    pageHead(
      "OM Food and Spices LLP | Dehydrated Onion & Garlic Products",
      "Explore dehydrated onion and garlic product inquiry categories from OM Food and Spices LLP in Gujarat, India.",
      "/",
    ),
});

const benefits = [
  {
    title: "Product-focused sourcing",
    copy: "Discuss onion formats, buyer requirements and the details that matter for your order.",
    icon: Sprout,
  },
  {
    title: "Dehydrated ingredient formats",
    copy: "Discuss onion and garlic ingredient formats, subject to availability confirmation.",
    icon: Leaf,
  },
  {
    title: "Bulk inquiry support",
    copy: "Share your quantity, packaging and destination needs for a direct conversation.",
    icon: PackageCheck,
  },
  {
    title: "Direct business communication",
    copy: "Speak with the team about product information and next steps for your inquiry.",
    icon: Globe2,
  },
];

const faqs = [
  [
    "What dehydrated onion products can I enquire about?",
    "Ask about flakes or kibbled pieces, minced onion, granules or powder. Product availability and specifications are confirmed directly.",
  ],
  [
    "What dehydrated garlic products can I enquire about?",
    "Ask about flakes, minced garlic, granules or powder. Product availability and specifications are confirmed directly.",
  ],
  [
    "Can I request bulk quantities?",
    "Yes, you can include your quantity and unit in an inquiry. Order acceptance and any minimum quantity require confirmation.",
  ],
  [
    "Can I enquire about international shipping?",
    "Share the destination or delivery location. Shipping arrangements and serviceability are subject to confirmation.",
  ],
  [
    "How can I obtain product specifications?",
    "Tell us the product and specifications you need. The team can discuss available product information and documentation.",
  ],
  [
    "How can I request a quotation?",
    "Use the quote form and include your product, quantity, destination and any other requirements.",
  ],
  [
    "What packaging options are available?",
    "Packaging depends on the product and order. Include your preference so it can be discussed with the team.",
  ],
  [
    "How can I contact OM Food and Spices LLP?",
    "Call +91 81407 12205 or email Omfoodandspicesllp@gmail.com during the listed business hours.",
  ],
] as const;

function HomePage() {
  return (
    <SiteLayout>
      <HeroCarousel />

      <section className="section section-paper">
        <div className="wrap">
          <SectionHeading
            eyebrow="Our dehydrated product range"
            title="Onion & garlic ingredients for business buyers"
            copy="Explore dehydrated onion and garlic inquiry categories for food processing, seasoning blends and commercial kitchens. Formats and specifications are subject to company confirmation."
          />
          <CatalogCards />
          <p className="catalogue-note">
            Products, formats, specifications and packaging depend on availability and confirmation
            by the company.
          </p>
        </div>
      </section>

      <section className="section section-white">
        <div className="wrap">
          <SectionHeading
            eyebrow="Working together"
            title="A practical partner for onion sourcing"
            copy="Start with your requirements. The team can discuss product availability, specifications and a suitable quotation."
          />
          <div className="feature-grid">
            {benefits.map(({ title, copy, icon: Icon }, index) => (
              <article className="feature" key={title}>
                <span className="feature-number">0{index + 1}</span>
                <h3>
                  <Icon aria-hidden="true" />
                  {title}
                </h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="split-section">
        <div className="split-copy">
          <Eyebrow>Dehydrated onion ingredients</Eyebrow>
          <h2>Practical formats for food businesses</h2>
          <p>
            Explore dehydrated onion formats for seasoning blends, sauces, prepared foods and food
            manufacturing. Product details and specifications can be discussed with the team.
          </p>
          <ul className="format-list">
            <li>Flakes / kibbled</li>
            <li>Minced onion</li>
            <li>Granules</li>
            <li>Powder</li>
          </ul>
          <Link className="text-link" to="/dehydrated-onions">
            Request dehydrated onion details <ArrowRight />
          </Link>
        </div>
        <img
          className="split-image"
          src="/catalog/onion-flakes.webp"
          alt="Dehydrated onion pieces"
          loading="lazy"
        />
      </section>
      <section className="split-section">
        <img
          className="split-image"
          src="/images/hero-garlic-dried.jpg"
          alt="Illustrative dried garlic image for the dehydrated ingredient category"
          loading="lazy"
        />
        <div className="split-copy">
          <Eyebrow>Dehydrated garlic ingredients</Eyebrow>
          <h2>Garlic formats for food manufacturing</h2>
          <p>
            Explore dehydrated garlic inquiry categories for seasoning, sauces and food processing.
            Product availability and specifications require confirmation.
          </p>
          <ul className="format-list">
            <li>Flakes</li>
            <li>Minced garlic</li>
            <li>Granules</li>
            <li>Powder</li>
          </ul>
          <Link className="text-link" to="/products" search={{ category: "dehydrated-garlic" }}>
            Request dehydrated garlic details <ArrowRight />
          </Link>
        </div>
      </section>

      <section className="section section-paper">
        <div className="wrap">
          <SectionHeading
            eyebrow="Potential applications"
            title="Onion ingredients across food applications"
            copy="Depending on the product and its confirmed specifications, onion ingredients may be considered for a range of food uses."
          />
          <div className="application-grid">
            {[
              "Seasoning and spice blends",
              "Sauces and condiments",
              "Snacks and savoury foods",
              "Ready meals and packaged foods",
              "Restaurants and commercial kitchens",
              "Food processing and manufacturing",
            ].map((item, index) => (
              <div className="application-item" key={item}>
                <span>0{index + 1}</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-olive">
        <div className="wrap">
          <SectionHeading
            eyebrow="From inquiry to supply planning"
            title="A clear conversation, from the start"
            copy="Order acceptance, specifications, lead times, pricing and shipping depend on confirmation by the company."
            light
          />
          <ProcessSteps />
        </div>
      </section>

      <section className="section section-white">
        <div className="wrap two-column">
          <div className="text-section">
            <Eyebrow>Product information</Eyebrow>
            <h2>Specifications matter</h2>
            <p>
              Share what your business needs and the team can discuss product information and
              available documentation. No technical specification is assumed until confirmed.
            </p>
            <ul>
              <li>Onion variety and form</li>
              <li>Size and grade, where applicable</li>
              <li>Technical specifications for dehydrated products</li>
              <li>Packaging options and available documentation</li>
              <li>Quantity and delivery requirements</li>
            </ul>
            <Link className="text-link" to="/quality-sourcing">
              Discuss product specifications <ArrowRight />
            </Link>
          </div>
          <img src="/catalog/onion-flakes.webp" alt="Dehydrated onion ingredient" loading="lazy" />
        </div>
      </section>

      <section className="section section-paper">
        <div className="wrap">
          <SectionHeading
            eyebrow="Frequently asked questions"
            title="Useful details for your inquiry"
          />
          <div className="faq-list">
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <InquiryBanner
        title="Looking for an onion supply partner in India?"
        copy="Tell us what you need, where it needs to go and your expected quantity. Our team can discuss product availability and a quotation."
      />
    </SiteLayout>
  );
}
