import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroCarousel } from "@/components/hero-carousel";
import { LanguageProvider, supportedLanguages, useLanguage } from "@/lib/i18n";
vi.mock("@tanstack/react-router", () => ({ Link: ({ to, search, children, ...props }: any) => <a href={`${to}${search?.category ? `?category=${search.category}` : search?.product ? `?product=${encodeURIComponent(search.product)}` : ""}`} {...props}>{children}</a> }));
vi.mock("@/components/site", () => ({ Eyebrow: ({ children }: any) => <p>{children}</p> }));
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("Image", class { complete = false; src = ""; });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
async function mount() { render(<HeroCarousel />); await act(async () => {}); }
function activeSlide() { return document.querySelector(".hero-frame.is-active"); }
function track() { return document.querySelector<HTMLElement>(".hero-track")!; }
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
function LanguageProbe() {
  const { language, setLanguage, t } = useLanguage();
  return <><output data-testid="localized-eyebrow">{t("FRESH GARLIC FROM GUJARAT, INDIA")}</output><output data-testid="localized-slide-copy">{["Fresh Indian Garlic. Sourced for Your Market.", "Explore fresh garlic for wholesale sourcing, food distribution, commercial kitchens, and food processing requirements.", "Dehydrated Onion Ingredients for Industry.", "Dehydrated Garlic. Ready for Your Market.", "Explore dehydrated garlic flakes, minced garlic, granules, and powder for seasoning blends, food manufacturing, and commercial ingredient sourcing."].map(t).join("|")}</output>{supportedLanguages.map(code => <button key={code} onClick={() => setLanguage(code)}>{code}</button>)}<output>{language}</output></>;
}

describe("Rolling hero carousel", () => {
  it("shows four synchronized products and loops horizontally at the target timing", async () => {
    await mount();
    expect(document.querySelectorAll(".hero-frame")).toHaveLength(6); // four slides plus loop copies
    expect(activeSlide()).toHaveTextContent("Fresh Indian Onions.");
    expect(activeSlide()?.querySelector("img")).toHaveAttribute("alt", "Fresh red and white onions");
    expect(activeSlide()).toHaveTextContent("Explore fresh red and white onions for wholesale sourcing, food distribution, and commercial supply.");
    expect(activeSlide()).toHaveTextContent("Product formats and availability are subject to company confirmation.");
    advance(2199); expect(activeSlide()).toHaveTextContent("Fresh Indian Onions.");
    advance(1); expect(activeSlide()).toHaveTextContent("Fresh Indian Garlic. Sourced for Your Market.");
    expect(activeSlide()).toHaveTextContent("Explore fresh garlic for wholesale sourcing, food distribution, commercial kitchens, and food processing requirements.");
    expect(activeSlide()?.querySelector("img")).toHaveAttribute("src", "/images/hero-garlic-fresh.jpg");
    expect(activeSlide()?.querySelector("img")).toHaveAttribute("alt", "Fresh whole garlic bulbs and peeled garlic cloves");
    expect(track().style.transform).toBe("translate3d(-200%, 0, 0)");
    expect(track().style.transition).toBe("transform 600ms ease");
    expect(activeSlide()?.querySelector("a")).toHaveAttribute("href", "/contact?product=Fresh%20whole%20garlic");
    advance(2200); expect(activeSlide()).toHaveTextContent("Dehydrated Onion Ingredients for Industry.");
    expect(activeSlide()).toHaveTextContent("Discover onion ingredient formats for food processing, seasoning blends, and commercial applications.");
    expect(activeSlide()?.querySelector("img")).toHaveAttribute("src", "/images/hero-ingredients.webp");
    expect(activeSlide()?.querySelector("a")).toHaveAttribute("href", "/products?category=dehydrated-onions");
    advance(2200); expect(activeSlide()).toHaveTextContent("Dehydrated Garlic. Ready for Your Market.");
    expect(activeSlide()).toHaveTextContent("Explore dehydrated garlic flakes, minced garlic, granules, and powder for seasoning blends, food manufacturing, and commercial ingredient sourcing.");
    expect(activeSlide()?.querySelector("img")).toHaveAttribute("src", "/images/hero-garlic-dried.jpg");
    expect(activeSlide()?.querySelector("a")).toHaveAttribute("href", "/contact?product=Dehydrated%20garlic%20flakes");
    advance(2200); expect(activeSlide()).toHaveTextContent("Fresh Indian Onions.");
    advance(600); expect(track().style.transform).toBe("translate3d(-100%, 0, 0)");
    expect(track().style.transition).toBe("none");
    cleanup(); expect(vi.getTimerCount()).toBe(0);
  });

  it("supports keyboard navigation and pause", async () => {
    await mount();
    const hero = screen.getByRole("region", { name: "Onion and garlic products" });
    fireEvent.keyDown(hero, { key: "ArrowLeft" });
    expect(activeSlide()).toHaveTextContent("Dehydrated Garlic. Ready for Your Market.");
    advance(600);
    fireEvent.keyDown(hero, { key: "ArrowRight" });
    expect(activeSlide()).toHaveTextContent("Fresh Indian Onions.");
    fireEvent.keyDown(hero, { key: " " });
    advance(4400); expect(activeSlide()).toHaveTextContent("Fresh Indian Onions.");
  });

  it("respects reduced motion", async () => {
    const original = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation(query => ({ ...original(query), matches: query.includes("prefers-reduced-motion") }));
    await mount(); advance(2200); expect(activeSlide()).toHaveTextContent("Fresh Indian Garlic. Sourced for Your Market.");
    expect(track().style.transition).toBe("none");
    fireEvent.keyDown(screen.getByRole("region", { name: "Onion and garlic products" }), { key: "ArrowRight" });
    expect(activeSlide()).toHaveTextContent("Dehydrated Onion Ingredients for Industry.");
    fireEvent.keyDown(screen.getByRole("region", { name: "Onion and garlic products" }), { key: " " });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("translates hero messaging in all supported languages", () => {
    const expected = { nl: "VERSE KNOFLOOK UIT GUJARAT, INDIA", en: "FRESH GARLIC FROM GUJARAT, INDIA", fr: "AIL FRAIS DU GUJARAT, INDE", de: "FRISCHER KNOBLAUCH AUS GUJARAT, INDIEN", es: "AJO FRESCO DE GUJARAT, INDIA", ru: "СВЕЖИЙ ЧЕСНОК ИЗ ГУДЖАРАТА, ИНДИЯ" };
    render(<LanguageProvider><LanguageProbe /></LanguageProvider>);
    for (const code of supportedLanguages) {
      fireEvent.click(screen.getByRole("button", { name: code }));
      expect(screen.getByTestId("localized-eyebrow")).toHaveTextContent(expected[code]);
      if (code !== "en") { expect(screen.getByTestId("localized-slide-copy").textContent).not.toContain("Fresh Indian Garlic. Sourced for Your Market."); expect(screen.getByTestId("localized-slide-copy").textContent).not.toContain("Dehydrated Garlic. Ready for Your Market."); }
    }
  });
});
