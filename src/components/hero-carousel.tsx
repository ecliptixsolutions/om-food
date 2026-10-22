import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import firstImage from "@/assets/onion-hero.jpg";
import { Eyebrow } from "@/components/site";
import { useLanguage } from "@/lib/i18n";

type HeroSlide = { name: string; image: string; alt: string; eyebrow: string; title: string; description: string; primary: string; to: "/contact" | "/products"; category?: string; quoteProduct?: string; secondary: string; secondaryTo: "/products"; secondaryCategory?: string; proof?: [string, string, string] };
const slides: HeroSlide[] = [
  { name: "Fresh onions", image: firstImage, alt: "Fresh red and white onions", eyebrow: "FRESH ONIONS FROM GUJARAT, INDIA", title: "Fresh Indian Onions. Sourced for Your Market.", description: "Explore fresh red and white onions for wholesale sourcing, food distribution, and commercial supply.", primary: "Request a quote", to: "/contact", secondary: "Explore our products", secondaryTo: "/products" },
  { name: "Fresh garlic", image: "/images/hero-garlic-fresh.jpg", alt: "Fresh whole garlic bulbs and peeled garlic cloves", eyebrow: "FRESH GARLIC FROM GUJARAT, INDIA", title: "Fresh Indian Garlic. Sourced for Your Market.", description: "Explore fresh garlic for wholesale sourcing, food distribution, commercial kitchens, and food processing requirements.", primary: "Request a quote", to: "/contact", quoteProduct: "Fresh whole garlic", secondary: "Explore our products", secondaryTo: "/products", secondaryCategory: "fresh-garlic", proof: ["INDIAN AGRICULTURAL SUPPLY", "FRESH GARLIC", "DEHYDRATED INGREDIENTS"] },
  { name: "Dehydrated onions", image: "/images/hero-ingredients.webp", alt: "Bowls of dehydrated onion flakes, minced onion, granules and powder", eyebrow: "DEHYDRATED ONION INGREDIENTS", title: "Dehydrated Onion Ingredients for Industry.", description: "Discover onion ingredient formats for food processing, seasoning blends, and commercial applications.", primary: "Request product details", to: "/products", category: "dehydrated-onions", secondary: "View Onion Products", secondaryTo: "/products", secondaryCategory: "dehydrated-onions" },
  { name: "Dehydrated garlic", image: "/images/hero-garlic-dried.jpg", alt: "Dried garlic bulbs, illustrative image for the dehydrated garlic inquiry category", eyebrow: "DEHYDRATED GARLIC INGREDIENTS", title: "Dehydrated Garlic. Ready for Your Market.", description: "Explore dehydrated garlic flakes, minced garlic, granules, and powder for seasoning blends, food manufacturing, and commercial ingredient sourcing.", primary: "Request a quote", to: "/contact", quoteProduct: "Dehydrated garlic flakes", secondary: "Explore our products", secondaryTo: "/products", secondaryCategory: "dehydrated-garlic" },
];

export function HeroCarousel() {
  const { t } = useLanguage();
  const [position, setPosition] = useState(1);
  const [animated, setAnimated] = useState(false);
  const [revision, setRevision] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const currentPosition = useRef(1);
  const moving = useRef(false);
  const transitionTimer = useRef<number | undefined>(undefined);
  // Boundary copies let the track move one slide forward across the loop.
  const trackSlides: HeroSlide[] = [slides.at(-1)!, ...slides, slides[0]!];
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(preference.matches);
    };
    update();
    preference.addEventListener("change", update);
    // Warm the browser cache without blocking autoplay on a slow image.
    slides.forEach(slide => {
      const image = new Image();
      image.src = window.matchMedia("(max-width: 790px)").matches && slide.image.endsWith(".webp") ? slide.image.replace(".webp", "-mobile.webp") : slide.image;
    });
    return () => {
      preference.removeEventListener("change", update);
      window.clearTimeout(transitionTimer.current);
    };
  }, []);
  const navigate = useCallback((next: number) => {
    if (moving.current) return;
    const normalized = next === 0 ? slides.length : next === slides.length + 1 ? 1 : next;
    currentPosition.current = reducedMotion ? normalized : next;
    setAnimated(!reducedMotion);
    setPosition(currentPosition.current);
    setRevision(value => value + 1);
    if (reducedMotion) return;
    moving.current = true;
    transitionTimer.current = window.setTimeout(() => {
      // The copy and original are identical: reset invisibly after the roll.
      if (next !== normalized) {
        setAnimated(false);
        currentPosition.current = normalized;
        setPosition(normalized);
      }
      moving.current = false;
    }, 600);
  }, [reducedMotion]);
  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => navigate(currentPosition.current + 1), 2200);
    return () => window.clearTimeout(timer);
  }, [revision, paused, reducedMotion, navigate]);
  const move = (direction: number) => navigate(currentPosition.current + direction);
  return <section className="hero hero-carousel" aria-label={t("Onion and garlic products")} aria-roledescription="carousel" tabIndex={0} aria-describedby="hero-playback-help"
    onKeyDown={event => { if (event.key === " " && event.target === event.currentTarget) { event.preventDefault(); setPaused(value => !value); } if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); } }}>
    <link rel="preload" as="image" href={firstImage} fetchPriority="high" />
    <div className="hero-track" style={{ transform: `translate3d(-${position * 100}%, 0, 0)`, transition: animated && !reducedMotion ? "transform 600ms ease" : "none" }}>
    {trackSlides.map((slide, index) => <div className={`hero-frame${position === index ? " is-active" : ""}`} data-slide={slide.name} key={`${slide.name}-${index}`} aria-hidden={position !== index} inert={position !== index}>
      <picture className="hero-picture">{slide.image.endsWith(".webp") && <source media="(max-width: 790px)" srcSet={slide.image.replace(".webp", "-mobile.webp")} />}<img src={slide.image} alt={t(slide.alt)} width="1536" height="1024" fetchPriority={index === 1 ? "high" : "low"} loading="eager" /></picture>
      <div className="hero-shade" />
      <div className="wrap hero-inner"><div className="hero-copy"><Eyebrow light>{t(slide.eyebrow)}</Eyebrow><h1>{t(slide.title)}</h1><p>{t(slide.description)}</p><p className="hero-availability">{t("Product formats and availability are subject to company confirmation.")}</p><div className="hero-actions">{slide.to === "/products" ? <Link className="button button-primary" to="/products" search={{ category: slide.category }}>{t(slide.primary)}<ArrowRight aria-hidden="true" /></Link> : <Link className="button button-primary" to="/contact" search={{ product: slide.quoteProduct }}>{t(slide.primary)}<ArrowRight aria-hidden="true" /></Link>}{slide.secondaryTo === "/products" ? <Link className="button button-outline" to="/products" search={{ category: slide.secondaryCategory }}>{t(slide.secondary)}</Link> : <Link className="button button-outline" to={slide.secondaryTo}>{t(slide.secondary)}</Link>}</div><div className="hero-proof">{(slide.proof ?? ["Indian agricultural supply", "Fresh produce", "Dehydrated ingredients"]).map(label => <span key={label}>{t(label)}</span>)}</div></div></div>
    </div>)}
    </div>
    <p id="hero-playback-help" className="sr-only">Press Space to pause or resume automatic slides. Use Left and Right arrow keys to change slides.</p>
    <div className="hero-bottom wrap"><span className="hero-caption">{t("Bulk supply & export inquiries welcome")}</span></div>
  </section>;
}



