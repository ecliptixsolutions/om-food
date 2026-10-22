import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, ChevronDown, Leaf, Mail, MapPin, Menu, Phone, Send } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { FloatingContact } from "@/components/floating-contact";
import { LanguageSelector } from "@/components/language-selector";
import { whatsappUrl } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { submitQuoteInquiry } from "@/lib/quote-inquiries.functions";
import { useLanguage } from "@/lib/i18n";
import { productCatalog } from "@/lib/product-catalog";

const navigation = [
  ["Home", "/"],
  ["About us", "/about"],
  ["Products", "/products"],
  ["Fresh onions", "/fresh-onions"],
  ["Dehydrated onions", "/dehydrated-onions"],
  ["Fresh Garlic", "/products", "fresh-garlic"],
  ["Dehydrated Garlic", "/products", "dehydrated-garlic"],
  ["Sourcing", "/quality-sourcing"],
] as const;

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link to="/" className={`brand-lockup${inverse ? " brand-lockup-inverse" : ""}`} aria-label="OM Food and Spices LLP home">
      <span className="brand-symbol" aria-hidden="true">OM</span>
      <span className="brand-wordmark"><strong>OM FOOD</strong><small>AND SPICES LLP</small></span>
    </Link>
  );
}

export function SiteHeader() {
  const { t } = useLanguage();
  return (
    <>
      <div className="announcement-bar"><span>{t("Onion & garlic products")}</span><span className="announcement-dot" /><span>{t("Bulk supply & export inquiries welcome")}</span></div>
      <header className="site-header">
        <div className="site-header-inner">
          <BrandMark />
          <nav className="desktop-nav" aria-label="Main navigation">
            {navigation.map(([label, href, category]) => category ? <Link key={label} to="/products" search={{ category }}>{t(label)}</Link> : href === "/products" ? <Link key={href} to="/products" search={{ category: undefined }}>{t(label)}</Link> : <Link key={href} to={href}>{t(label)}</Link>)}
          </nav>
          <LanguageSelector />
          <Button asChild className="header-cta"><Link to="/contact">{t("Request a quote")} <ArrowRight aria-hidden="true" /></Link></Button>
          <details className="mobile-nav">
            <summary aria-label="Open navigation"><Menu /><ChevronDown className="menu-chevron" /></summary>
            <nav aria-label="Mobile navigation">
              {navigation.map(([label, href, category]) => category ? <Link key={label} to="/products" search={{ category }}>{t(label)}</Link> : href === "/products" ? <Link key={href} to="/products" search={{ category: undefined }}>{t(label)}</Link> : <Link key={href} to={href}>{t(label)}</Link>)}
              <Link className="mobile-quote" to="/contact">{t("Request a quote")} <ArrowRight /></Link>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="site-footer">
      <div className="footer-main wrap">
        <div className="footer-brand"><BrandMark inverse /><p>Onion products and ingredient sourcing for wholesale buyers and food businesses.</p><p className="footer-tagline">Natural Flavours. Better Tomorrows.</p></div>
        <div className="footer-column"><h3>{t("Explore")}</h3><Link to="/about">{t("About us")}</Link><Link to="/products" search={{ category: undefined }}>{t("Products")}</Link><Link to="/fresh-onions">{t("Fresh onions")}</Link><Link to="/dehydrated-onions">{t("Dehydrated")}</Link><Link to="/quality-sourcing">{t("Sourcing")}</Link></div>
        <div className="footer-column"><h3>Get in touch</h3><a href="tel:+918140712205"><Phone /> +91 81407 12205</a><a href="mailto:Omfoodandspicesllp@gmail.com"><Mail /> Omfoodandspicesllp@gmail.com</a><a href="https://www.google.com/maps/search/?api=1&query=Survey+No.+125%2C+OM+Food+and+Spices+LLP%2C+P5%2C+Kikariya%2C+Gujarat+364280%2C+India" target="_blank" rel="noreferrer"><MapPin /> Survey No. 125, OM Food and Spices LLP, P5, Kikariya, Gujarat 364280, India</a><span className="footer-hours">Mon–Sun · 9:00 AM–6:30 PM IST<br />Subject to holiday variations</span></div>
      </div>
      <div className="footer-bottom wrap"><span>© {new Date().getFullYear()} OM Food and Spices LLP</span><div><Link to="/privacy">Privacy policy</Link><Link to="/terms">Terms &amp; conditions</Link></div><span>Gujarat, India</span></div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return <><SiteHeader /><main>{children}</main><SiteFooter /><FloatingContact /></>;
}

export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  const { t } = useLanguage();
  return <p className={`eyebrow${light ? " eyebrow-light" : ""}`}><span />{typeof children === "string" ? t(children) : children}</p>;
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  const { t } = useLanguage();
  return <section className="page-intro wrap"><Eyebrow>{eyebrow}</Eyebrow><h1>{t(title)}</h1><p>{t(description)}</p></section>;
}

export function QuoteForm({ selectedProduct = "" }: { selectedProduct?: string }) {
  const { t } = useLanguage();
  const submit = useServerFn(submitQuoteInquiry);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (submitting || !form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form).entries());
    setSubmitting(true);
    setErrorMessage("");
    setAccepted(false);
    try {
      const result = await submit({ data: {
        full_name: String(values['full_name'] ?? ""),
        company_name: String(values['company_name'] ?? ""),
        business_email: String(values['business_email'] ?? ""),
        phone: String(values['phone'] ?? ""),
        country: String(values['country'] ?? ""),
        product_interest: String(values['product_interest'] ?? ""),
        required_quantity: String(values['required_quantity'] ?? ""),
        packaging_preference: String(values['packaging_preference'] ?? ""),
        destination: String(values['destination'] ?? ""),
        delivery_timeline: String(values['delivery_timeline'] ?? ""),
        message: String(values['message'] ?? ""),
        privacy_consent: values['privacy_consent'] === "on",
        website: String(values['website'] ?? ""),
      } });
      if (result.accepted) {
        setAccepted(true);
        form.reset();
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "We could not submit your inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="quote-form" onSubmit={handleSubmit}>
      <label className="spam-trap" aria-hidden="true">Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <div className="form-grid">
        <label>Full name <input name="full_name" autoComplete="name" maxLength={120} required placeholder="Your name" /></label>
        <label>Company name <input name="company_name" autoComplete="organization" maxLength={160} required placeholder="Business name" /></label>
        <label>Business email <input name="business_email" type="email" autoComplete="email" maxLength={255} required placeholder="name@company.com" /></label>
        <label>Phone / WhatsApp <input name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="Include country code" /></label>
        <label>Country <input name="country" autoComplete="country-name" maxLength={100} required placeholder="Country" /></label>
        <label>Product of interest <select name="product_interest" defaultValue={selectedProduct} required><option value="" disabled>Select a product</option>{productCatalog.map(product => <option key={product.name} value={product.name}>{t(product.name)}</option>)}<option value="Other product">{t("Other product")}</option></select></label>
        <label>Required quantity <input name="required_quantity" maxLength={120} placeholder="Quantity and unit" /></label>
        <label>Packaging preference <input name="packaging_preference" maxLength={200} placeholder="If known" /></label>
        <label>Destination / delivery location <input name="destination" maxLength={200} placeholder="Port, city or region" /></label>
        <label>Target delivery timeline <input name="delivery_timeline" maxLength={120} placeholder="If known" /></label>
        <label className="form-wide">Message / product requirements <textarea name="message" rows={5} maxLength={3000} required placeholder="Share preferred format, quantity, specifications or other requirements." /></label>
      </div>
      <label className="consent-row"><input name="privacy_consent" type="checkbox" required /><span>I agree that OM Food and Spices LLP may use these details to respond to my inquiry. Read the <Link to="/privacy">privacy policy</Link>.</span></label>
      {errorMessage && <p className="form-feedback form-error" role="alert">{errorMessage}</p>}
      {accepted && <p className="form-feedback form-success" role="status"><Check /> Your inquiry has been received. The team can review your requirements.</p>}
      <Button type="submit" size="lg" disabled={submitting} className="form-submit">{submitting ? "Sending inquiry…" : "Send inquiry"}<Send /></Button>
      <p className="form-note">Availability, specifications, pricing, packaging and shipping arrangements are subject to confirmation.</p>
    </form>
  );
}

export function InquiryBanner({ title = "Looking for an onion supply partner?", copy = "Share your product, quantity and destination requirements to discuss availability and a quotation." }: { title?: string; copy?: string }) {
  const { t } = useLanguage();
  return <section className="inquiry-banner"><div className="wrap inquiry-banner-inner"><div><Eyebrow light>Start a conversation</Eyebrow><h2>{t(title)}</h2><p>{t(copy)}</p></div><Button asChild variant="secondary" size="lg"><Link to="/contact">{t("Request a quote")} <ArrowRight /></Link></Button></div></section>;
}

export function ProcessSteps() {
  const { t } = useLanguage();
  const steps = ["Share your requirements", "Confirm product availability", "Discuss specifications and quotation", "Coordinate packaging and dispatch"];
  return <div className="process-grid">{steps.map((step, index) => <div className="process-step" key={step}><span className="process-number">0{index + 1}</span><h3>{t(step)}</h3></div>)}</div>;
}

export function ContactDetails() {
  return <div className="contact-details"><a href={whatsappUrl()} target="_blank" rel="noopener noreferrer"><img src="/whatsapp.svg" alt="" width="20" height="20" /><span><small>WhatsApp</small>Chat with our team</span></a><a href="tel:+918140712205"><Phone /><span><small>Call our team</small>+91 81407 12205</span></a><a href="mailto:Omfoodandspicesllp@gmail.com"><Mail /><span><small>Email</small>Omfoodandspicesllp@gmail.com</span></a><a href="https://www.google.com/maps/search/?api=1&query=Survey+No.+125%2C+OM+Food+and+Spices+LLP%2C+P5%2C+Kikariya%2C+Gujarat+364280%2C+India" target="_blank" rel="noreferrer"><MapPin /><span><small>Business address</small>Survey No. 125, OM Food and Spices LLP, P5,<br />Kikariya, Gujarat 364280, India</span></a><div className="contact-hours"><Leaf /><span><small>Business hours</small>Monday–Sunday, 9:00 AM–6:30 PM IST<br />Subject to holiday variations</span></div></div>;
}

export function SectionHeading({ eyebrow, title, copy, light = false }: { eyebrow: string; title: string; copy?: string; light?: boolean }) {
  const { t } = useLanguage();
  return <div className={`section-heading${light ? " section-heading-light" : ""}`}><Eyebrow light={light}>{eyebrow}</Eyebrow><h2>{t(title)}</h2>{copy && <p>{t(copy)}</p>}</div>;
}

