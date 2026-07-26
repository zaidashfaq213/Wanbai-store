export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Turn any free-form text into a clean, URL-safe slug (lowercase, hyphenated,
 * a-z0-9 only). Handles accented Latin letters (café → cafe), punctuation,
 * numbers, extra whitespace and mixed case. Non-Latin text (e.g. Arabic-only
 * input) collapses to an empty string — slugs are inherently Latin/ASCII
 * identifiers, so callers should slugify the English name, not the Arabic one.
 */
const DIACRITICS_RE = new RegExp("[̀-ͯ]", "g");

export function slugify(text: string, maxLength = 60): string {
  return text
    .normalize("NFKD")
    .replace(DIACRITICS_RE, "") // strip accents/diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // any run of non-alphanumerics -> one hyphen
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .slice(0, maxLength)
    .replace(/-+$/g, ""); // a slice() can leave a trailing hyphen — trim again
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

/** Format an integer USD-cents amount into the selected currency. */
export function formatCents(
  cents: number,
  symbol: string,
  rate: number,
  locale: string,
): string {
  return formatPrice(cents / 100, symbol, rate, locale);
}
