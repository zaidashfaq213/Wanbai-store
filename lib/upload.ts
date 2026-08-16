import "server-only";

// Payment screenshots stay capped at 5 MB. Admin uploads (logo, product images)
// use a much higher ceiling — effectively "no limit" for normal images. The
// hard stop is the Server Action body limit set in next.config.ts.
export const PROOF_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const IMAGE_MAX_BYTES = 25 * 1024 * 1024; // 25 MB
// Logo/favicon are embedded as a data URL directly in the HTML of every
// single page (header + <link rel="icon">), so they stay small — this also
// keeps them well clear of Next's ~2MB unstable_cache item limit elsewhere.
export const BRANDING_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
// Product images ride inside getProductBySlug/getProductDetail, which ARE
// unstable_cache-wrapped (unlike settings). Base64 inflates a file by ~4/3,
// so this stays comfortably under the 2MB cache-item ceiling even after
// encoding, instead of silently losing caching (or worse, shipping a multi-MB
// data URL inline in that product's page HTML) the way the old unlimited
// logo/favicon upload once did.
export const PRODUCT_IMAGE_MAX_BYTES = 1 * 1024 * 1024; // 1 MB
const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
// Favicons are commonly shipped as .ico or .svg — browsers/OSes report a few
// different MIME types for .ico depending on how the file was saved.
export const FAVICON_ALLOWED = [
  ...ALLOWED,
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/svg+xml",
];

export type UploadResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: "too_large" | "bad_type" | "empty" };

// Some browsers/OSes report no (or a generic) MIME type for .ico files. When
// that happens, fall back to sniffing the file extension so a real .ico/.svg
// favicon isn't rejected just because the browser didn't label it.
const EXT_MIME: Record<string, string> = {
  ico: "image/x-icon",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/**
 * Validate an uploaded image and return it as a base64 data URL, stored
 * directly in the DB — no cloud/object storage or external API required,
 * matching the manual-fulfillment model.
 */
export async function imageToDataUrl(
  file: unknown,
  maxBytes: number = IMAGE_MAX_BYTES,
  allowed: string[] = ALLOWED,
): Promise<UploadResult> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "empty" };

  let type = file.type;
  if (!allowed.includes(type)) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const sniffed = EXT_MIME[ext];
    if (sniffed && allowed.includes(sniffed)) type = sniffed;
    else return { ok: false, error: "bad_type" };
  }
  if (file.size > maxBytes) return { ok: false, error: "too_large" };

  const buffer = Buffer.from(await file.arrayBuffer());
  return { ok: true, dataUrl: `data:${type};base64,${buffer.toString("base64")}` };
}
