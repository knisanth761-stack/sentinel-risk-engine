export function formatPercent(value) {
  const number = Number(value || 0) * 100;
  if (number >= 99.99) return "99.9999%";
  return `${number.toFixed(2)}%`;
}

export function formatCurrency(value, currency = "USD") {
  const number = Number(value || 0);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(number);
  } catch {
    return `${currency} ${number.toLocaleString()}`;
  }
}

export function formatCompactCurrency(value, currency = "USD") {
  const number = Number(value || 0);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(number);
  } catch {
    return formatCurrency(value, currency);
  }
}

// Dedicated en-IN/INR helpers — additive only, do not alter the
// behavior of formatCurrency/formatCompactCurrency above (still
// en-US-locale, used unchanged by every existing call site). These use
// genuine Indian-style grouping (Lakh/Crore), so they are only meant
// for contexts that explicitly want that presentation.
export function formatINR(value) {
  const number = Number(value || 0);
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(number);
  } catch {
    return `₹${number.toLocaleString("en-IN")}`;
  }
}

export function formatCompactINR(value) {
  const number = Number(value || 0);
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(number);
  } catch {
    return formatINR(value);
  }
}

export function formatTime(date) {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString();
}

export function formatDateTime(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString();
}

export function formatSigned(value, digits = 3) {
  const number = Number(value || 0);
  const sign = number > 0 ? "+" : "";
  return `${sign}${number.toFixed(digits)}`;
}
