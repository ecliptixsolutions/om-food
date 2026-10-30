import { useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Leaf,
  Mail,
  MapPin,
  Menu,
  Phone,
  Send,
} from "lucide-react";
import { FloatingContact } from "@/components/floating-contact";
import { LanguageSelector } from "@/components/language-selector";
import { whatsappUrl } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { usePublicCatalog } from "@/lib/public-catalog";
import { submitQuoteInquiry } from "@/lib/quote-inquiries.functions";

const navigation = [
  ["Home", "/"],
  ["About us", "/about"],
  ["Products", "/products"],
  ["Dehydrated onions", "/dehydrated-onions"],
  ["Dehydrated Garlic", "/products", "dehydrated-garlic"],
  ["Sourcing", "/quality-sourcing"],
] as const;

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      to="/"
      className={`brand-lockup${inverse ? " brand-lockup-inverse" : ""}`}
      aria-label="OM Food and Spices LLP home"
    >
      <span className="brand-symbol" aria-hidden="true">
        OM
      </span>
      <span className="brand-wordmark">
        <strong>OM FOOD</strong>
        <small>AND SPICES LLP</small>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const { t } = useLanguage();
  return (
    <>
      <div className="announcement-bar">
        <span>{t("Onion & garlic products")}</span>
        <span className="announcement-dot" />
        <span>{t("Bulk supply & export inquiries welcome")}</span>
      </div>
      <header className="site-header">
        <div className="site-header-inner">
          <BrandMark />
          <nav className="desktop-nav" aria-label="Main navigation">
            {navigation.map(([label, href, category]) =>
              category ? (
                <Link key={label} to="/products" search={{ category }}>
                  {t(label)}
                </Link>
              ) : href === "/products" ? (
                <Link key={href} to="/products" search={{ category: undefined }}>
                  {t(label)}
                </Link>
              ) : (
                <Link key={href} to={href}>
                  {t(label)}
                </Link>
              ),
            )}
          </nav>
          <LanguageSelector />
          <Button asChild className="header-cta">
            <Link to="/contact" search={{ product: undefined }}>
              {t("Request a quote")} <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <details className="mobile-nav">
            <summary aria-label="Open navigation">
              <Menu />
              <ChevronDown className="menu-chevron" />
            </summary>
            <nav aria-label="Mobile navigation">
              {navigation.map(([label, href, category]) =>
                category ? (
                  <Link key={label} to="/products" search={{ category }}>
                    {t(label)}
                  </Link>
                ) : href === "/products" ? (
                  <Link key={href} to="/products" search={{ category: undefined }}>
                    {t(label)}
                  </Link>
                ) : (
                  <Link key={href} to={href}>
                    {t(label)}
                  </Link>
                ),
              )}
              <Link className="mobile-quote" to="/contact" search={{ product: undefined }}>
                {t("Request a quote")} <ArrowRight />
              </Link>
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
        <div className="footer-brand">
          <BrandMark inverse />
          <p>Onion products and ingredient sourcing for wholesale buyers and food businesses.</p>
          <p className="footer-tagline">Natural Flavours. Better Tomorrows.</p>
        </div>
        <div className="footer-column">
          <h3>{t("Explore")}</h3>
          <Link to="/about">{t("About us")}</Link>
          <Link to="/products" search={{ category: undefined }}>
            {t("Products")}
          </Link>
          <Link to="/dehydrated-onions">{t("Dehydrated")}</Link>
          <Link to="/quality-sourcing">{t("Sourcing")}</Link>
        </div>
        <div className="footer-column">
          <h3>Get in touch</h3>
          <a href="tel:+918140712205">
            <Phone /> +91 81407 12205
          </a>
          <a href="mailto:Omfoodandspicesllp@gmail.com">
            <Mail /> Omfoodandspicesllp@gmail.com
          </a>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Survey+No.+125%2C+OM+Food+and+Spices+LLP%2C+P5%2C+Kikariya%2C+Gujarat+364280%2C+India"
            target="_blank"
            rel="noreferrer"
          >
            <MapPin /> Survey No. 125, OM Food and Spices LLP, P5, Kikariya, Gujarat 364280, India
          </a>
          <span className="footer-hours">
            Mon–Sun · 9:00 AM–6:30 PM IST
            <br />
            Subject to holiday variations
          </span>
        </div>
      </div>
      <div className="footer-bottom wrap">
        <span>© {new Date().getFullYear()} OM Food and Spices LLP</span>
        <div>
          <Link to="/privacy">Privacy policy</Link>
          <Link to="/terms">Terms &amp; conditions</Link>
        </div>
        <span>Gujarat, India</span>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <FloatingContact />
    </>
  );
}

export function Eyebrow({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <p className={`eyebrow${light ? " eyebrow-light" : ""}`}>
      <span />
      {typeof children === "string" ? t(children) : children}
    </p>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
  backToSite = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  backToSite?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <section className="page-intro wrap">
      {backToSite && (
        <Button asChild variant="outline" className="legal-back-link">
          <Link to="/">
            <ArrowLeft aria-hidden="true" />
            {t("Back to Site")}
          </Link>
        </Button>
      )}
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1>{t(title)}</h1>
      <p>{t(description)}</p>
    </section>
  );
}

export function QuoteForm({ selectedProduct = "" }: { selectedProduct?: string }) {
  const { t } = useLanguage();
  const { products } = usePublicCatalog();
  const [handoff, setHandoff] = useState("");
  const [feedback, setFeedback] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [opened, setOpened] = useState(false);
  const openedOnce = useRef(false);
  const [quantityOption, setQuantityOption] = useState("");
  const [customQuantity, setCustomQuantity] = useState("");
  const [packagingOption, setPackagingOption] = useState("");
  const [customPackaging, setCustomPackaging] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (openedOnce.current || submitting) return;
    setFeedback("");
    setHandoff("");
    setSubmitError("");
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form).entries());
    const phone = String(values["phone"] ?? "").trim();
    const phoneDigits = phone.replace(/\D/g, "");
    if (phone && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
      setPhoneError(t("Use 7–15 digits, including your country code."));
      (form.elements.namedItem("phone") as HTMLInputElement).focus();
      return;
    }
    setPhoneError("");
    const quantity =
      quantityOption === "Other / Custom Quantity"
        ? `${t(quantityOption)}: ${customQuantity}`
        : quantityOption
          ? t(quantityOption)
          : "";
    const packaging =
      packagingOption === "Custom Packaging"
        ? `${t(packagingOption)}: ${customPackaging}`
        : packagingOption
          ? t(packagingOption)
          : "";

    // Persist the enquiry through the MySQL server function before opening WhatsApp.
    setSubmitting(true);
    let persisted = false;
    try {
      await submitQuoteInquiry({
        data: {
          full_name: String(values["full_name"] ?? ""),
          company_name: String(values["company_name"] ?? ""),
          business_email: String(values["business_email"] ?? ""),
          phone,
          country: String(values["country"] ?? ""),
          product_interest: String(values["product_interest"] ?? ""),
          required_quantity: quantity,
          packaging_preference: packaging,
          destination: String(values["destination"] ?? ""),
          delivery_timeline: String(values["delivery_timeline"] ?? ""),
          message: String(values["message"] ?? ""),
          privacy_consent: true,
          website: String(values["website"] ?? ""),
        },
      });
      persisted = true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      setSubmitError(
        /not configured|MySQL/i.test(msg)
          ? "We could not save your enquiry online. Please send the WhatsApp message to contact us."
          : msg || "We could not save your enquiry. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }

    const product = products.find((item) => item.name === values["product_interest"]);
    const lines = [
      "Hello OM Food and Spices LLP,",
      "",
      t("I would like to submit a product enquiry."),
      "",
      t("Customer Details:"),
      `${t("Name: ")}${values["full_name"]}`,
      `${t("Company: ")}${values["company_name"]}`,
      `${t("Email: ")}${values["business_email"]}`,
      ...(phone ? [`${t("Phone: ")}${phone}`] : []),
      `${t("Country: ")}${values["country"]}`,
      ...(values["destination"] ? [`${t("Destination: ")}${values["destination"]}`] : []),
      ...(values["delivery_timeline"]
        ? [`${t("Delivery timeline: ")}${values["delivery_timeline"]}`]
        : []),
      "",
      t("Product Details:"),
      `${t("Product: ")}${product ? t(product.name) : String(values["product_interest"])}`,
      ...(quantity ? [`${t("Required Quantity: ")}${quantity}`] : []),
      ...(packaging ? [`${t("Packaging Preference: ")}${packaging}`] : []),
      "",
      t("Message / Requirements:"),
      String(values["message"] ?? ""),
      "",
      t(
        "Please share the available specifications, pricing, packaging options, and export details.",
      ),
      "",
      t("Thank you."),
    ];
    const url = whatsappUrl(lines.join("\n"));
    let popup: Window | null = null;
    try {
      popup = window.open(url, "_blank");
    } catch {
      /* Show the direct link fallback below. */
    }
    if (popup) {
      popup.opener = null;
      openedOnce.current = true;
      setOpened(true);
      setFeedback(
        persisted
          ? t(
              "WhatsApp opened with your enquiry draft. Review it and press Send to contact the company.",
            )
          : "WhatsApp opened. Your enquiry could not be saved online — please send the WhatsApp message to contact us.",
      );
    } else setHandoff(url);
  }

  return (
    <form
      className="quote-form"
      onSubmit={handleSubmit}
      onChange={() => {
        setFeedback("");
        setHandoff("");
        setSubmitError("");
      }}
    >
      <label className="spam-trap" aria-hidden="true">
        Leave this empty
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="form-grid">
        <label>
          Full name{" "}
          <input
            name="full_name"
            autoComplete="name"
            maxLength={120}
            required
            placeholder="Your name"
          />
        </label>
        <label>
          Company name{" "}
          <input
            name="company_name"
            autoComplete="organization"
            maxLength={160}
            required
            placeholder="Business name"
          />
        </label>
        <label>
          Business email{" "}
          <input
            name="business_email"
            type="email"
            autoComplete="email"
            maxLength={255}
            required
            placeholder="name@company.com"
          />
        </label>
        <label>
          Phone / WhatsApp{" "}
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
            aria-invalid={Boolean(phoneError)}
            aria-describedby={phoneError ? "quote-phone-error" : undefined}
            onChange={() => setPhoneError("")}
            placeholder="Include country code"
          />
          {phoneError && (
            <small id="quote-phone-error" className="field-error" role="alert">
              {phoneError}
            </small>
          )}
        </label>
        <label>
          Country{" "}
          <input
            name="country"
            autoComplete="country-name"
            maxLength={100}
            required
            placeholder="Country"
          />
        </label>
        <label>
          Product of interest{" "}
          <select name="product_interest" defaultValue={selectedProduct} required>
            <option value="" disabled>
              Select a product
            </option>
            {products.map((product) => (
              <option key={product.slug} value={product.name}>
                {t(product.name)}
              </option>
            ))}
            <option value="Other product">{t("Other product")}</option>
          </select>
        </label>
        <label>
          {t("Required quantity")}
          <select
            name="required_quantity"
            value={quantityOption}
            onChange={(event) => setQuantityOption(event.target.value)}
          >
            <option value="" disabled>
              {t("Select required quantity")}
            </option>
            {[
              "Sample / Trial Order",
              "100–500 kg",
              "500 kg–1 Metric Ton",
              "1–5 Metric Tons",
              "5–10 Metric Tons",
              "10–20 Metric Tons",
              "20+ Metric Tons",
              "Other / Custom Quantity",
            ].map((option) => (
              <option key={option} value={option}>
                {t(option)}
              </option>
            ))}
          </select>
        </label>
        {quantityOption === "Other / Custom Quantity" && (
          <label>
            {t("Specify Quantity and Unit")}
            <input
              name="custom_quantity"
              value={customQuantity}
              onChange={(event) => setCustomQuantity(event.target.value)}
              maxLength={120}
              required
              pattern="\s*[0-9]+(?:[.,][0-9]+)?\s*[A-Za-z][A-Za-z ]{0,30}\s*"
              title={t("Enter a quantity and unit, such as 250 kg.")}
              placeholder={t("For example, 250 kg or 2 metric tons")}
            />
          </label>
        )}
        <div className="form-field-group">
          <label htmlFor="packaging_preference">{t("Packaging preference")}</label>
          <select
            id="packaging_preference"
            aria-describedby="packaging-note"
            name="packaging_preference"
            value={packagingOption}
            onChange={(event) => setPackagingOption(event.target.value)}
          >
            <option value="" disabled>
              {t("Select packaging preference")}
            </option>
            {[
              "Standard Bulk Packaging",
              "10 kg Bags",
              "20 kg Bags",
              "25 kg Bags",
              "50 kg Bags",
              "Bulk Bags / Jumbo Bags",
              "Food-Grade Packaging",
              "Export Packaging",
              "Custom Packaging",
              "No Preference / Recommend Suitable Packaging",
            ].map((option) => (
              <option key={option} value={option}>
                {t(option)}
              </option>
            ))}
          </select>
          <small id="packaging-note" className="form-field-note">
            {t("Packaging options are subject to product availability and company confirmation.")}
          </small>
        </div>
        {packagingOption === "Custom Packaging" && (
          <label>
            {t("Specify Packaging Requirements")}
            <input
              name="custom_packaging"
              value={customPackaging}
              onChange={(event) => setCustomPackaging(event.target.value)}
              maxLength={180}
              required
            />
          </label>
        )}
        <label>
          Destination / delivery location{" "}
          <input name="destination" maxLength={200} placeholder="Port, city or region" />
        </label>
        <label>
          Target delivery timeline{" "}
          <input name="delivery_timeline" maxLength={120} placeholder="If known" />
        </label>
        <label className="form-wide">
          Message / product requirements{" "}
          <textarea
            name="message"
            rows={5}
            maxLength={3000}
            required
            placeholder="Share preferred format, quantity, specifications or other requirements."
          />
        </label>
      </div>
      <label className="consent-row">
        <input name="privacy_consent" type="checkbox" required />
        <span>
          I agree that OM Food and Spices LLP may use these details to respond to my inquiry. Read
          the <Link to="/privacy">privacy policy</Link>.
        </span>
      </label>
      {submitError && (
        <p className="form-feedback form-error" role="alert">
          {submitError}
        </p>
      )}
      {feedback && (
        <p className="form-feedback form-success" role="status">
          {feedback}
        </p>
      )}
      {handoff && (
        <div className="form-feedback form-error" role="status">
          <p>{t("Unable to open WhatsApp? Contact us directly.")}</p>
          <p>
            <a href={handoff} target="_blank" rel="noopener noreferrer">
              {t("Open WhatsApp with your enquiry")}
            </a>
          </p>
          <p>
            <a href="tel:+918140712205">+91 81407 12205</a> ·{" "}
            <a href="mailto:Omfoodandspicesllp@gmail.com">Omfoodandspicesllp@gmail.com</a>
          </p>
        </div>
      )}
      <Button type="submit" size="lg" disabled={submitting || opened} className="form-submit">
        {submitting ? "Submitting…" : opened ? t("WhatsApp opened") : t("Send inquiry")}
        <Send />
      </Button>
      <p className="form-note">
        Availability, specifications, pricing, packaging and shipping arrangements are subject to
        confirmation.
      </p>
    </form>
  );
}

export function InquiryBanner({
  title = "Looking for an onion supply partner?",
  copy = "Share your product, quantity and destination requirements to discuss availability and a quotation.",
}: {
  title?: string;
  copy?: string;
}) {
  const { t } = useLanguage();
  return (
    <section className="inquiry-banner">
      <div className="wrap inquiry-banner-inner">
        <div>
          <Eyebrow light>Start a conversation</Eyebrow>
          <h2>{t(title)}</h2>
          <p>{t(copy)}</p>
        </div>
        <Button asChild variant="secondary" size="lg">
          <Link to="/contact" search={{ product: undefined }}>
            {t("Request a quote")} <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}

export function ProcessSteps() {
  const { t } = useLanguage();
  const steps = [
    "Share your requirements",
    "Confirm product availability",
    "Discuss specifications and quotation",
    "Coordinate packaging and dispatch",
  ];
  return (
    <div className="process-grid">
      {steps.map((step, index) => (
        <div className="process-step" key={step}>
          <span className="process-number">0{index + 1}</span>
          <h3>{t(step)}</h3>
        </div>
      ))}
    </div>
  );
}

export function ContactDetails() {
  return (
    <div className="contact-details">
      <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
        <img src="/whatsapp.svg" alt="" width="20" height="20" />
        <span>
          <small>WhatsApp</small>Chat with our team
        </span>
      </a>
      <a href="tel:+918140712205">
        <Phone />
        <span>
          <small>Call our team</small>+91 81407 12205
        </span>
      </a>
      <a href="mailto:Omfoodandspicesllp@gmail.com">
        <Mail />
        <span>
          <small>Email</small>Omfoodandspicesllp@gmail.com
        </span>
      </a>
      <a
        href="https://www.google.com/maps/search/?api=1&query=Survey+No.+125%2C+OM+Food+and+Spices+LLP%2C+P5%2C+Kikariya%2C+Gujarat+364280%2C+India"
        target="_blank"
        rel="noreferrer"
      >
        <MapPin />
        <span>
          <small>Business address</small>Survey No. 125, OM Food and Spices LLP, P5,
          <br />
          Kikariya, Gujarat 364280, India
        </span>
      </a>
      <div className="contact-hours">
        <Leaf />
        <span>
          <small>Business hours</small>Monday–Sunday, 9:00 AM–6:30 PM IST
          <br />
          Subject to holiday variations
        </span>
      </div>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  copy,
  light = false,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  light?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className={`section-heading${light ? " section-heading-light" : ""}`}>
      <Eyebrow light={light}>{eyebrow}</Eyebrow>
      <h2>{t(title)}</h2>
      {copy && <p>{t(copy)}</p>}
    </div>
  );
}
