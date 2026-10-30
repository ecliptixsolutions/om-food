import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: { to: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/admin.functions", () => ({ listPublicProducts: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/quote-inquiries.functions", () => ({
  submitQuoteInquiry: vi.fn().mockResolvedValue({ accepted: true }),
}));

import { QuoteForm } from "@/components/site";
import { LanguageProvider } from "@/lib/i18n";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const renderForm = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <LanguageProvider>
        <QuoteForm selectedProduct="Dehydrated garlic flakes" />
      </LanguageProvider>
    </QueryClientProvider>,
  );
function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Asha & Sons" } });
  fireEvent.change(screen.getByLabelText("Company name"), { target: { value: "Asha Foods" } });
  fireEvent.change(screen.getByLabelText("Business email"), {
    target: { value: "asha+buyer@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/Phone \/ WhatsApp/), {
    target: { value: "+91 81407 12205" },
  });
  fireEvent.change(screen.getByLabelText("Country"), { target: { value: "India" } });
  fireEvent.change(screen.getByLabelText("Required quantity"), {
    target: { value: "Other / Custom Quantity" },
  });
  fireEvent.change(screen.getByLabelText("Specify Quantity and Unit"), {
    target: { value: "250 kg" },
  });
  fireEvent.change(screen.getByLabelText(/Packaging preference/), {
    target: { value: "Custom Packaging" },
  });
  fireEvent.change(screen.getByLabelText("Specify Packaging Requirements"), {
    target: { value: "Moisture-resistant export cartons" },
  });
  fireEvent.change(screen.getByLabelText("Destination / delivery location"), {
    target: { value: "Mumbai Port" },
  });
  fireEvent.change(screen.getByLabelText("Target delivery timeline"), {
    target: { value: "November" },
  });
  fireEvent.change(screen.getByLabelText("Message / product requirements"), {
    target: { value: "Please share current specifications." },
  });
  fireEvent.click(screen.getByRole("checkbox"));
}

describe("quote form quantity and packaging choices", () => {
  it("offers the full single-select lists and reveals only the matching custom fields", () => {
    renderForm();
    const quantity = screen.getByLabelText("Required quantity") as HTMLSelectElement;
    const packaging = screen.getByLabelText(/Packaging preference/) as HTMLSelectElement;
    expect(quantity).toHaveValue("");
    expect(packaging).toHaveValue("");
    expect(Array.from(quantity.options).map((option) => option.textContent)).toEqual([
      "Select required quantity",
      "Sample / Trial Order",
      "100–500 kg",
      "500 kg–1 Metric Ton",
      "1–5 Metric Tons",
      "5–10 Metric Tons",
      "10–20 Metric Tons",
      "20+ Metric Tons",
      "Other / Custom Quantity",
    ]);
    expect(Array.from(packaging.options).map((option) => option.textContent)).toEqual([
      "Select packaging preference",
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
    ]);
    expect(screen.queryByLabelText("Specify Quantity and Unit")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Specify Packaging Requirements")).not.toBeInTheDocument();
    fireEvent.change(quantity, { target: { value: "Other / Custom Quantity" } });
    const customQuantity = screen.getByLabelText("Specify Quantity and Unit") as HTMLInputElement;
    fireEvent.change(customQuantity, { target: { value: "250" } });
    expect(customQuantity.checkValidity()).toBe(false);
    fireEvent.change(customQuantity, { target: { value: "250 kg" } });
    expect(customQuantity.checkValidity()).toBe(true);
    fireEvent.change(packaging, { target: { value: "Custom Packaging" } });
    expect(customQuantity).toBeRequired();
    expect(screen.getByLabelText("Specify Packaging Requirements")).toBeRequired();
    fireEvent.change(packaging, {
      target: { value: "No Preference / Recommend Suitable Packaging" },
    });
    expect(screen.queryByLabelText("Specify Packaging Requirements")).not.toBeInTheDocument();
    expect(quantity).toHaveValue("Other / Custom Quantity");
  });

  it("opens one WhatsApp draft with all entered details after validation", async () => {
    const popup = { opener: window } as Window;
    const open = vi.spyOn(window, "open").mockReturnValue(popup);
    renderForm();
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "Send inquiry" }));

    await waitFor(() => expect(open).toHaveBeenCalledOnce());
    expect(open.mock.calls[0]![1]).toBe("_blank");
    expect(popup.opener).toBeNull();
    const url = new URL(String(open.mock.calls[0]![0]));
    expect(url.origin).toBe("https://wa.me");
    expect(url.pathname).toBe("/918140712205");
    const text = url.searchParams.get("text")!;
    expect(text).toContain("Name: Asha & Sons");
    expect(text).toContain("Company: Asha Foods");
    expect(text).toContain("Email: asha+buyer@example.com");
    expect(text).toContain("Phone: +91 81407 12205");
    expect(text).toContain("Product: Dehydrated garlic flakes");
    expect(text).toContain("Required Quantity: Other / Custom Quantity: 250 kg");
    expect(text).toContain(
      "Packaging Preference: Custom Packaging: Moisture-resistant export cartons",
    );
    expect(text).toContain("Destination: Mumbai Port");
    expect(text).toContain("Delivery timeline: November");
    expect(text).toContain("Please share current specifications.");
    expect(text).not.toContain("undefined");
    expect(screen.getByRole("status")).toHaveTextContent("Review it and press Send");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps invalid forms out of WhatsApp and validates an optional phone when provided", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Send inquiry" }));
    expect(open).not.toHaveBeenCalled();
    fillRequiredFields();
    fireEvent.change(screen.getByLabelText(/Phone \/ WhatsApp/), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "Send inquiry" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Use 7–15 digits");
    expect(open).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Phone \/ WhatsApp/), {
      target: { value: "+91 81407 12205" },
    });
    fireEvent.change(screen.getByLabelText("Business email"), { target: { value: "invalid" } });
    fireEvent.click(screen.getByRole("button", { name: "Send inquiry" }));
    expect(open).not.toHaveBeenCalled();
  });

  it("shows direct WhatsApp, phone, and email fallback when a new tab is blocked", async () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    renderForm();
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "Send inquiry" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Unable to open WhatsApp"),
    );
    const link = screen.getByRole("link", { name: "Open WhatsApp with your enquiry" });
    expect(new URL(link.getAttribute("href")!).pathname).toBe("/918140712205");
    expect(screen.getByRole("link", { name: "+91 81407 12205" })).toHaveAttribute(
      "href",
      "tel:+918140712205",
    );
    expect(screen.getByRole("link", { name: "Omfoodandspicesllp@gmail.com" })).toHaveAttribute(
      "href",
      "mailto:Omfoodandspicesllp@gmail.com",
    );
  });

  it("shows a storage error but still opens WhatsApp when the server function fails", async () => {
    const { submitQuoteInquiry } = await import("@/lib/quote-inquiries.functions");
    vi.mocked(submitQuoteInquiry).mockRejectedValueOnce(
      new Error("Please wait a minute before sending another inquiry."),
    );
    const popup = { opener: window } as Window;
    vi.spyOn(window, "open").mockReturnValue(popup);
    renderForm();
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "Send inquiry" }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent("Please wait a minute");
    expect(screen.getByRole("status")).toHaveTextContent("could not be saved");
    expect(vi.mocked(window.open)).toHaveBeenCalledOnce();
  });
});
