export function whatsappLink(number, message) {
  const cleanNumber = String(number).replace(/[^\d]/g, "");
  const text = encodeURIComponent(message || "");
  return `https://wa.me/${cleanNumber}?text=${text}`;
}

export function callLink(number) {
  const cleanNumber = String(number).replace(/[^\d+]/g, "");
  return `tel:${cleanNumber}`;
}
