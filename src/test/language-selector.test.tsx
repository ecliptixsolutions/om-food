import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageSelector, languages } from "@/components/language-selector";
import { LanguageProvider, useLanguage } from "@/lib/i18n";
function TestApp() { const { t } = useLanguage(); return <><LanguageSelector /><h1>{t("Premium onion products. Sourced in India. Ready for your market.")}</h1><nav>{t("Products")}</nav></>; }
function renderApp() { return render(<LanguageProvider><TestApp /></LanguageProvider>); }
beforeEach(() => { localStorage.clear(); vi.stubGlobal("PointerEvent", MouseEvent); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
async function openMenu() {
  fireEvent.pointerDown(screen.getByRole("button", { name: /^(Dutch|English|French|German|Spanish|Russian)$/ }), { button: 0, ctrlKey: false });
  return screen.findByRole("menu");
}
describe("Header language preference", () => {
  it("defaults to English and displays six ordered flag/name options", async () => {
    renderApp();
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-expanded", "false");
    const menu = await openMenu();
    expect(screen.getAllByRole("menuitemradio").map(item => item.textContent)).toEqual(languages.map(language => language.name + language.nativeName));
    expect(menu.querySelectorAll("img")).toHaveLength(6);
    expect(screen.getByRole("heading", { name: "Premium onion products. Sourced in India. Ready for your market." })).toBeVisible();
  });
  it("selects each language, closes the menu and restores the saved preference after remount", async () => {
    renderApp();
    for (const language of languages) {
      await openMenu();
      fireEvent.click(screen.getByRole("menuitemradio", { name: new RegExp(`^${language.name}`) }));
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
      expect(screen.getByRole("button", { name: language.name })).toBeVisible();
      expect(localStorage.getItem("om-food-language")).toBe(language.code);
      await waitFor(() => expect(document.documentElement.lang).toBe(language.code));
      if (language.code === "en") {
        expect(screen.getByRole("heading", { name: "Premium onion products. Sourced in India. Ready for your market." })).toBeVisible();
        expect(screen.getByRole("navigation").textContent).toBe("Products");
      } else {
        expect(screen.getByRole("heading").textContent).not.toBe("Premium onion products. Sourced in India. Ready for your market.");
        expect(screen.getByRole("navigation").textContent).not.toBe("Products");
      }
    }
    cleanup(); renderApp();
    await openMenu();
    expect(screen.getByRole("menuitemradio", { name: /^Russian/ })).toHaveAttribute("aria-checked", "true");
  });
  it("opens with the keyboard and closes on Escape and outside interaction", async () => {
    renderApp();
    const trigger = screen.getByRole("button", { name: "English" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const menu = await screen.findByRole("menu");
    fireEvent.keyDown(menu, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    await openMenu();
    await new Promise(resolve => setTimeout(resolve, 0));
    fireEvent.pointerDown(document.body, { button: 0 });
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });
});
