export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Replace {key} placeholders in a string with values. */
export function fmt(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

/** Write a year-long, lax cookie from the client. */
export function setCookie(name: string, value: string): void {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

/** Format a base-USD price into the selected currency for display. */
export function formatPrice(
  amountUsd: number,
  symbol: string,
  rate: number,
  locale: string,
): string {
  const value = amountUsd * rate;
  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return locale === "ar" ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}
