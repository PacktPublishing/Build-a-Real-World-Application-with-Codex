export function formatCurrency(cents, currency = "USD") {
  const amount = Number(cents || 0) / 100;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(isoString) {
  if (!isoString) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoString));
}

export function formatInvoiceNumber(number) {
  const value = String(number);

  if (/^\d+$/.test(value)) {
    return value.padStart(4, "0");
  }

  return value;
}
