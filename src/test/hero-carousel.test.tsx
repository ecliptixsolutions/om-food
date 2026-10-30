import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps, ReactNode } from "react";
import { HeroCarousel } from "@/components/hero-carousel";
import { LanguageProvider, supportedLanguages, useLanguage } from "@/lib/i18n";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    search,
    children,
    ...props
  }: ComponentProps<"a"> & { to: string; search?: { category?: string } }) => (
    <a href={`${to}${search?.category ? `?category=${search.category}` : ""}`} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/site", () => ({
  Eyebrow: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "Image",
    class {
      complete = false;
      src = "";
    },
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
async function mount() {
  render(<HeroCarousel />);
  await act(async () => {});
}
function activeSlide() {
  return document.querySelector(".hero-frame.is-active");
}
function track() {
  return document.querySelector<HTMLElement>(".hero-track")!;
}
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

function LanguageProbe() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <>
      <output data-testid="localized-eyebrow">{t("DEHYDRATED ONION INGREDIENTS")}</output>
      <output data-testid="localized-slide-copy">
        {["Dehydrated Onion Ingredients for Industry.", "Dehydrated Garlic. Ready for Your Market."]
          .map(t)
          .join("|")}
      </output>
      {supportedLanguages.map((code) => (
        <button key={code} onClick={() => setLanguage(code)}>
          {code}
        </button>
      ))}
      <output>{language}</output>
    </>
  );
}

describe("Rolling dehydrated-products hero carousel", () => {
  it("shows only the two dehydrated categories and loops horizontally at the target timing", async () => {
    await mount();
    expect(document.querySelectorAll(".hero-frame")).toHaveLength(6); // three copies for seamless looping
    expect(activeSlide()).toHaveTextContent("Dehydrated Onion Ingredients for Industry.");
    expect(activeSlide()?.querySelector("img")).toHaveAttribute(
      "alt",
      "Bowls of dehydrated onion flakes, minced onion, granules and powder",
    );
    expect(activeSlide()).toHaveTextContent(
      "Discover onion ingredient formats for food processing, seasoning blends, and commercial applications.",
    );
    expect(activeSlide()).toHaveTextContent(
      "Product formats and availability are subject to company confirmation.",
    );
    advance(2199);
    expect(activeSlide()).toHaveTextContent("Dehydrated Onion Ingredients for Industry.");
    advance(1);
    expect(activeSlide()).toHaveTextContent("Dehydrated Garlic. Ready for Your Market.");
    expect(activeSlide()).toHaveTextContent(
      "Explore dehydrated garlic flakes, minced garlic, granules, and powder for seasoning blends, food manufacturing, and commercial ingredient sourcing.",
    );
    expect(activeSlide()?.querySelector("img")).toHaveAttribute(
      "src",
      "/images/hero-garlic-dried.jpg",
    );
    expect(track().style.transform).toBe("translate3d(-200%, 0, 0)");
    expect(track().style.transition).toBe("transform 600ms ease");
    expect(activeSlide()?.querySelector("a")).toHaveAttribute(
      "href",
      "/products?category=dehydrated-garlic",
    );
    advance(2200);
    expect(activeSlide()).toHaveTextContent("Dehydrated Onion Ingredients for Industry.");
    advance(600);
    expect(track().style.transform).toMatch(/translate3d\(-[13]00%, 0, 0\)/);
    expect(document.body).not.toHaveTextContent(/fresh (onion|garlic)/i);
    cleanup();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("supports keyboard navigation and pause", async () => {
    await mount();
    const hero = screen.getByRole("region", { name: "Onion and garlic products" });
    fireEvent.keyDown(hero, { key: "ArrowLeft" });
    expect(activeSlide()).toHaveTextContent("Dehydrated Garlic. Ready for Your Market.");
    advance(600);
    fireEvent.keyDown(hero, { key: "ArrowRight" });
    expect(activeSlide()).toHaveTextContent("Dehydrated Onion Ingredients for Industry.");
    fireEvent.keyDown(hero, { key: " " });
    advance(4400);
    expect(activeSlide()).toHaveTextContent("Dehydrated Onion Ingredients for Industry.");
  });

  it("respects reduced motion", async () => {
    const original = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      ...original(query),
      matches: query.includes("prefers-reduced-motion"),
    }));
    await mount();
    advance(2200);
    expect(activeSlide()).toHaveTextContent("Dehydrated Garlic. Ready for Your Market.");
    expect(track().style.transition).toBe("none");
    fireEvent.keyDown(screen.getByRole("region", { name: "Onion and garlic products" }), {
      key: "ArrowRight",
    });
    expect(activeSlide()).toHaveTextContent("Dehydrated Onion Ingredients for Industry.");
    fireEvent.keyDown(screen.getByRole("region", { name: "Onion and garlic products" }), {
      key: " ",
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("translates product slide messaging in every supported language", () => {
    render(
      <LanguageProvider>
        <LanguageProbe />
      </LanguageProvider>,
    );
    for (const code of supportedLanguages) {
      fireEvent.click(screen.getByRole("button", { name: code }));
      const copy = screen.getByTestId("localized-slide-copy").textContent ?? "";
      expect(copy).not.toMatch(/fresh (onion|garlic)/i);
      if (code !== "en") expect(copy).not.toContain("Dehydrated Onion Ingredients for Industry.");
    }
  });
});
