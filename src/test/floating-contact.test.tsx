import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FloatingContact } from "@/components/floating-contact";
import { enquiryMessage, whatsappUrl } from "@/lib/whatsapp";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
async function openForm() {
  render(<FloatingContact />);
  fireEvent.click(screen.getByRole("button", { name: "Quick Enquiry" }));
  return screen.findByRole("dialog");
}
function fill() {
  fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Asha & Sons" } });
  fireEvent.change(screen.getByLabelText("Email ID"), { target: { value: "asha+buyer@example.com" } });
  fireEvent.change(screen.getByLabelText("Phone Number"), { target: { value: "+91 (81407) 12205" } });
}
describe("Floating contact handoff", () => {
  it("uses the shared exact number and opens an accessible three-field dialog with focus restoration", async () => {
    await openForm();
    expect(document.querySelector('[data-state="open"].fixed.inset-0')).toBeNull();
    expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-modal", "true");
    expect(document.body.style.pointerEvents).not.toBe("none");
    expect(document.querySelector(".quick-enquiry-trigger")).not.toBeVisible();
    const link = screen.getByLabelText("Chat with us on WhatsApp");
    expect(link.querySelector("svg path")).not.toBeNull();
    expect(link.querySelector("img")).toBeNull();
    expect(new URL(link.getAttribute("href")!).pathname).toBe("/918140712205");
    expect(screen.getAllByRole("textbox")).toHaveLength(3);
    for (const input of screen.getAllByRole("textbox")) expect(input).toBeRequired();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Quick Enquiry" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Quick Enquiry" }));
    await screen.findByRole("dialog");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Quick Enquiry" })).toHaveFocus();
  });
  it("rejects empty fields and invalid email/phone without opening WhatsApp", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    await openForm();
    fireEvent.click(screen.getByRole("button", { name: "Submit Enquiry" }));
    expect(screen.getByText("Enter your full name.")).toBeInTheDocument();
    expect(open).not.toHaveBeenCalled();
    fill();
    fireEvent.change(screen.getByLabelText("Email ID"), { target: { value: "invalid" } });
    fireEvent.change(screen.getByLabelText("Phone Number"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Enquiry" }));
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Use 7–15 digits, including your country code.")).toBeInTheDocument();
    expect(open).not.toHaveBeenCalled();
  });
  it("tracks the visible viewport when a mobile keyboard changes its size", async () => {
    const viewport = Object.assign(new EventTarget(), { height: 640, offsetTop: 0 });
    const original = Object.getOwnPropertyDescriptor(window, "visualViewport");
    Object.defineProperty(window, "visualViewport", { configurable: true, value: viewport });
    try {
      const dialog = await openForm();
      viewport.height = 320;
      viewport.offsetTop = 24;
      act(() => viewport.dispatchEvent(new Event("resize")));
      expect(dialog.style.getPropertyValue("--enquiry-viewport-height")).toBe("320px");
      expect(dialog.style.getPropertyValue("--enquiry-viewport-top")).toBe("24px");
      expect(dialog.style.getPropertyValue("--enquiry-viewport-bottom")).toBe(`${Math.max(0, window.innerHeight - 344)}px`);
    } finally {
      cleanup();
      if (original) Object.defineProperty(window, "visualViewport", original);
      else Reflect.deleteProperty(window, "visualViewport");
    }
  });
  it("prefills real values, prevents duplicate processing, and retains a popup fallback and form values", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    await openForm(); fill();
    const submit = screen.getByRole("button", { name: "Submit Enquiry" });
    fireEvent.click(submit); fireEvent.click(submit);
    expect(open).toHaveBeenCalledTimes(1);
    const url = new URL(String(open.mock.calls[0]?.[0]));
    expect(url.origin).toBe("https://wa.me");
    expect(url.pathname).toBe("/918140712205");
    expect(url.searchParams.get("text")).toBe(enquiryMessage({ name: "Asha & Sons", email: "asha+buyer@example.com", phone: "+91 (81407) 12205" }));
    expect(screen.getByRole("status")).toHaveTextContent("Please press Send");
    expect(screen.getByRole("link", { name: "Open WhatsApp if it did not open" })).toHaveAttribute("href", url.href);
    expect(screen.getByLabelText("Full Name")).toHaveValue("Asha & Sons");
    expect(whatsappUrl("A & B\nhello?")).toBe("https://wa.me/918140712205?text=A%20%26%20B%0Ahello%3F");
    await act(async () => {});
  });
});
