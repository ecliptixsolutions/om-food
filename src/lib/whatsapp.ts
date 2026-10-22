export const whatsappNumber = "918140712205";
export const defaultWhatsAppMessage = "Hello OM Food and Spices LLP, I would like to enquire about your onion products.";

export function whatsappUrl(message = defaultWhatsAppMessage) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function enquiryMessage(details: { name: string; email: string; phone: string }) {
  return `Hello OM Food and Spices LLP,\n\nI would like to enquire about your onion products.\n\nName: ${details.name}\nEmail: ${details.email}\nPhone: ${details.phone}\n\nPlease contact me regarding product availability and pricing.\n\nThank you.`;
}
