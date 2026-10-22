import { HeroCarousel } from "@/components/hero-carousel";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, Globe2, Leaf, PackageCheck, Sprout } from "lucide-react";
import dehydratedOnion from "@/assets/dehydrated-onion.jpg";
import redOnions from "@/assets/red-onions.jpg";
import whiteOnions from "@/assets/white-onions.jpg";
import {
  Eyebrow,
  InquiryBanner,
  ProcessSteps,
  SectionHeading,
  SiteLayout,
} from "@/components/site";
import { pageHead } from "@/lib/site-metadata";
import { productCatalog } from "@/lib/product-catalog";
import { productSlug } from "@/components/catalog";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => pageHead(
    "OM Food and Spices LLP | Fresh & Dehydrated Onion Products",
    "Explore fresh onions and dehydrated onion products from OM Food and Spices LLP in Gujarat, India. Contact us for product details, bulk supply inquiries, and quotations.",
    "/",
  ),
});

const benefits = [
  { title: "Product-focused sourcing", copy: "Discuss onion formats, buyer requirements and the details that matter for your order.", icon: Sprout },
  { title: "Fresh and dehydrated options", copy: "Explore fresh onions and dehydrated ingredient formats, subject to availability confirmation.", icon: Leaf },
  { title: "Bulk inquiry support", copy: "Share your quantity, packaging and destination needs for a direct conversation.", icon: PackageCheck },
  { title: "Direct business communication", copy: "Speak with the team about product information and next steps for your inquiry.", icon: Globe2 },
];

const faqs = [
  ["What onion products can I enquire about?", "You can ask about fresh red or white onions and dehydrated formats such as flakes, kibbled onion, minced onion, granules or powder. Product availability is confirmed directly."],
  ["Do you supply fresh and dehydrated onions?", "These are the product categories presented on this site. Please contact the team to confirm which formats are available for your requirements."],
  ["Can I request bulk quantities?", "Yes, you can include your quantity and unit in an inquiry. Order acceptance and any minimum quantity require confirmation."],
  ["Can I enquire about international shipping?", "Share the destination or delivery location. Shipping arrangements and serviceability are subject to confirmation."],
  ["How can I obtain product specifications?", "Tell us the product and specifications you need. The team can discuss available product information and documentation."],
  ["How can I request a quotation?", "Use the quote form and include your product, quantity, destination and any other requirements."],
  ["What packaging options are available?", "Packaging depends on the product and order. Include your preference so it can be discussed with the team."],
  ["How can I contact OM Food and Spices LLP?", "Call +91 81407 12205 or email Omfoodandspicesllp@gmail.com during the listed business hours."],
] as const;

function HomePage() {
  const { t } = useLanguage();
  return (
    <SiteLayout>
      <HeroCarousel />

      <section className="section section-paper">
        <div className="wrap">
          <SectionHeading eyebrow="Our onion & garlic product range" title="Premium onion & garlic products for business buyers" copy="Explore fresh onions, fresh garlic and dehydrated ingredients for wholesale trade, food processing and commercial kitchens. Product formats and specifications are subject to availability confirmation." />
          <div className="product-grid">
            <ProductCard title="Fresh red onions" copy="Fresh red onion supply for wholesale and business inquiries." image={redOnions} alt="Fresh red onions" href="/fresh-onions" />
            <ProductCard title="Fresh white onions" copy="Ask our team about white onion requirements and availability." image={whiteOnions} alt="Fresh white onions" href="/fresh-onions" />
            <ProductCard title="Dehydrated onion flakes" copy="Ingredient formats for food businesses and manufacturing inquiries." image={dehydratedOnion} alt="Dehydrated onion pieces" href="/dehydrated-onions" />
            <ProductCard title="Granules, minced onion & powder" copy="Discuss the formats and specifications your business needs." image={dehydratedOnion} alt="Dehydrated onion ingredients" href="/dehydrated-onions" />
            {productCatalog.filter(product => product.group.includes("garlic")).map(product => <ProductCard key={product.name} title={product.name} copy={product.description} image={product.image} alt={product.alt} slug={productSlug(product.name)} />)}
          </div>
          <p className="catalogue-note">Products, formats, specifications and packaging depend on availability and confirmation by the company.</p>
        </div>
      </section>

      <section className="section section-white">
        <div className="wrap">
          <SectionHeading eyebrow="Working together" title="A practical partner for onion sourcing" copy="Start with your requirements. The team can discuss product availability, specifications and a suitable quotation." />
          <div className="feature-grid">
            {benefits.map(({ title, copy, icon: Icon }, index) => <article className="feature" key={title}><span className="feature-number">0{index + 1}</span><h3><Icon aria-hidden="true" />{title}</h3><p>{copy}</p></article>)}
          </div>
        </div>
      </section>

      <section className="split-section">
        <img className="split-image" src={redOnions} alt="Fresh red onions for wholesale inquiry" loading="lazy" />
        <div className="split-copy"><Eyebrow>Fresh onion supply</Eyebrow><h2>Fresh onions for wholesale markets</h2><p>Discuss fresh onion requirements for wholesale distribution, food service and commercial supply. Share your preferred variety, estimated quantity, packaging needs and destination.</p><ul className="format-list"><li>Fresh red onions</li><li>Fresh white onions</li><li>Other varieties, if available</li></ul><Link className="text-link" to="/fresh-onions">Enquire about fresh onions <ArrowRight /></Link></div>
      </section>
      <section className="split-section">
        <div className="split-copy"><Eyebrow>Dehydrated onion ingredients</Eyebrow><h2>Practical formats for food businesses</h2><p>Explore dehydrated onion formats for seasoning blends, sauces, prepared foods and food manufacturing. Product details and specifications can be discussed with the team.</p><ul className="format-list"><li>Flakes / kibbled</li><li>Minced onion</li><li>Granules</li><li>Powder</li></ul><Link className="text-link" to="/dehydrated-onions">Request dehydrated onion details <ArrowRight /></Link></div>
        <img className="split-image" src={dehydratedOnion} alt="Dehydrated onion pieces" loading="lazy" />
      </section>

      <section className="section section-paper">
        <div className="wrap">
          <SectionHeading eyebrow="Potential applications" title="Onion ingredients across food applications" copy="Depending on the product and its confirmed specifications, onion ingredients may be considered for a range of food uses." />
          <div className="application-grid">{["Seasoning and spice blends", "Sauces and condiments", "Snacks and savoury foods", "Ready meals and packaged foods", "Restaurants and commercial kitchens", "Food processing and manufacturing"].map((item, index) => <div className="application-item" key={item}><span>0{index + 1}</span>{item}</div>)}</div>
        </div>
      </section>

      <section className="section section-olive">
        <div className="wrap">
          <SectionHeading eyebrow="From inquiry to supply planning" title="A clear conversation, from the start" copy="Order acceptance, specifications, lead times, pricing and shipping depend on confirmation by the company." light />
          <ProcessSteps />
        </div>
      </section>

      <section className="section section-white">
        <div className="wrap two-column">
          <div className="text-section"><Eyebrow>Product information</Eyebrow><h2>Specifications matter</h2><p>Share what your business needs and the team can discuss product information and available documentation. No technical specification is assumed until confirmed.</p><ul><li>Onion variety and form</li><li>Size and grade, where applicable</li><li>Technical specifications for dehydrated products</li><li>Packaging options and available documentation</li><li>Quantity and delivery requirements</li></ul><Link className="text-link" to="/quality-sourcing">Discuss product specifications <ArrowRight /></Link></div>
          <img src={whiteOnions} alt="White onions" loading="lazy" />
        </div>
      </section>

      <section className="section section-paper">
        <div className="wrap">
          <SectionHeading eyebrow="Frequently asked questions" title="Useful details for your inquiry" />
          <div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
        </div>
      </section>
      <InquiryBanner title="Looking for an onion supply partner in India?" copy="Tell us what you need, where it needs to go and your expected quantity. Our team can discuss product availability and a quotation." />
    </SiteLayout>
  );
}

function ProductCard({ title, copy, image, alt, href, slug }: { title: string; copy: string; image: string; alt: string; href?: "/fresh-onions" | "/dehydrated-onions"; slug?: string }) {
  const { t } = useLanguage();
  const action = slug
    ? <Link className="text-link" to="/products/$slug" params={{ slug }}>{t("View details")} <ChevronRight /></Link>
    : <Link className="text-link" to={href!}>{t("View details")} <ChevronRight /></Link>;
  return <article className="product-card"><img src={image} alt={t(alt)} loading="lazy" /><div className="product-card-copy"><h3>{t(title)}</h3><p>{t(copy)}</p>{action}</div></article>;
}
