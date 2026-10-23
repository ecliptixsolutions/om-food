import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PageIntro } from "@/components/site";
import { LanguageProvider, supportedLanguages, useLanguage } from "@/lib/i18n";

vi.mock("@tanstack/react-router", () => ({ Link: ({ to, children, ...props }: any) => <a href={to} {...props}>{children}</a> }));

function LanguageControls() {
  const { setLanguage } = useLanguage();
  return <>{supportedLanguages.map(code => <button key={code} onClick={() => setLanguage(code)}>{code}</button>)}</>;
}

describe("legal page return link", () => {
  it("links directly to the homepage and translates its label", () => {
    render(<LanguageProvider><LanguageControls /><PageIntro eyebrow="Business review required" title="Privacy policy — draft" description="Review notice." backToSite /></LanguageProvider>);
    const labels = { nl: "Terug naar de website", en: "Back to Site", fr: "Retour au site", de: "Zurück zur Website", es: "Volver al sitio", ru: "Вернуться на сайт" };
    for (const code of supportedLanguages) {
      fireEvent.click(screen.getByRole("button", { name: code }));
      expect(screen.getByRole("link", { name: labels[code] })).toHaveAttribute("href", "/");
    }
  });
});
