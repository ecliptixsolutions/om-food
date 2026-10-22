import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageSquare, X } from "lucide-react";
import { z } from "zod";
import * as Dialog from "@radix-ui/react-dialog";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { whatsappUrl, enquiryMessage } from "@/lib/whatsapp";
import { useLanguage } from "@/lib/i18n";

const fields = [
  { name: "name", label: "Full Name", type: "text", autoComplete: "name", placeholder: "Enter your full name", maxLength: 120 },
  { name: "email", label: "Email ID", type: "email", autoComplete: "email", placeholder: "Enter your email address", maxLength: 255 },
  { name: "phone", label: "Phone Number", type: "tel", autoComplete: "tel", placeholder: "Enter your phone number", maxLength: 40 },
] as const;
const enquirySchema = z.object({
  name: z.string().trim().min(1, "Enter your full name.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(255),
  phone: z.string().trim().regex(/^\+?[\d\s().-]+$/, "Enter a valid phone number.")
    .refine(value => { const digits = value.replace(/\D/g, "").length; return digits >= 7 && digits <= 15; }, "Use 7–15 digits, including your country code."),
});

export function FloatingContact() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [handoff, setHandoff] = useState("");
  const locked = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!sending) return;
    const timer = window.setTimeout(() => { locked.current = false; setSending(false); }, 300);
    return () => window.clearTimeout(timer);
  }, [sending]);

  useEffect(() => {
    if (!open || !window.visualViewport) return;
    const viewport = window.visualViewport;
    const update = () => {
      panelRef.current?.style.setProperty("--enquiry-viewport-height", `${viewport.height}px`);
      panelRef.current?.style.setProperty("--enquiry-viewport-top", `${viewport.offsetTop}px`);
      panelRef.current?.style.setProperty("--enquiry-viewport-bottom", `${Math.max(0, window.innerHeight - viewport.offsetTop - viewport.height)}px`);
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [open]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    const result = enquirySchema.safeParse(values);
    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues) nextErrors[String(issue.path[0])] ??= t(issue.message);
      setErrors(nextErrors);
      setHandoff("");
      formRef.current?.querySelector<HTMLInputElement>(`[name="${result.error.issues[0]?.path[0]}"]`)?.focus();
      return;
    }
    setErrors({});
    locked.current = true;
    setSending(true);
    const url = whatsappUrl(enquiryMessage(result.data));
    setHandoff(url);
    // Open during the submit gesture. Always provide a fallback: browsers can
    // return null for noopener tabs even when the new tab opened successfully.
    try { window.open(url, "_blank", "noopener,noreferrer"); } catch { /* The visible fallback remains available. */ }
  }

  return <>
    <Dialog.Root modal={false} open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild><button type="button" className="quick-enquiry-trigger" style={{ visibility: open ? "hidden" : "visible" }}><MessageSquare aria-hidden="true" /><span>{t("Quick Enquiry")}</span></button></Dialog.Trigger>
      <Dialog.Portal><Dialog.Content ref={panelRef} className="quick-enquiry-panel">
        <Dialog.Title className="quick-enquiry-title">{t("Quick Enquiry")}</Dialog.Title>
        <Dialog.Description className="quick-enquiry-description">{t("Share your contact details and our team can follow up regarding your onion product requirements.")}</Dialog.Description>
        <form ref={formRef} className="quick-enquiry-form" onSubmit={submit} noValidate>
          {fields.map(field => <div key={field.name}><label htmlFor={`quick-${field.name}`}>{t(field.label)}</label><input id={`quick-${field.name}`} name={field.name} type={field.type} autoComplete={field.autoComplete} placeholder={t(field.placeholder)} maxLength={field.maxLength} required value={values[field.name]} onChange={event => { setValues(previous => ({ ...previous, [field.name]: event.target.value })); setHandoff(""); }} aria-invalid={Boolean(errors[field.name])} aria-describedby={errors[field.name] ? `quick-${field.name}-error` : undefined} />{errors[field.name] && <p id={`quick-${field.name}-error`} className="quick-enquiry-error" role="alert">{errors[field.name]}</p>}</div>)}
          <p className="quick-enquiry-notice">{t("Submit your details to prepare an enquiry message in WhatsApp. Review and send it to contact our team.")} <a href="/privacy">{t("Privacy policy")}</a>.</p>
          <button className="quick-enquiry-submit" type="submit" disabled={sending}>{sending ? t("Opening WhatsApp…") : t("Submit Enquiry")}</button>
          {handoff && <div className="quick-enquiry-result" role="status"><p>{t("Your enquiry details are ready. WhatsApp will open with your message. Please press Send to contact our team.")}</p><a href={handoff} target="_blank" rel="noopener noreferrer">{t("Open WhatsApp if it did not open")}</a></div>}
        </form>
      <Dialog.Close className="quick-enquiry-close" aria-label={t("Close")}><X aria-hidden="true" /></Dialog.Close></Dialog.Content></Dialog.Portal>
    </Dialog.Root>
    <a className="floating-whatsapp" href={whatsappUrl()} target="_blank" rel="noopener noreferrer" aria-label={t("Chat with us on WhatsApp")} title={t("Chat with us on WhatsApp")}><WhatsAppIcon /></a>
  </>;
}
