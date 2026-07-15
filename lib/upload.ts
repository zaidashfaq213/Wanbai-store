import "server-only";

// Payment screenshots stay capped at 5 MB. Admin uploads (logo, product images)
// use a much higher ceiling — effectively "no limit" for normal images. The
// hard stop is the Server Action body limit set in next.config.ts.
export const PROOF_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const IMAGE_MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export type UploadResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: "too_large" | "bad_type" | "empty" };

/**
 * Validate an uploaded image and return it as a base64 data URL, stored
 * directly in the DB — no cloud/object storage or external API required,
 * matching the manual-fulfillment model.
 */
export async function imageToDataUrl(
  file: unknown,
  maxBytes: number = IMAGE_MAX_BYTES,
): Promise<UploadResult> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "empty" };
  if (!ALLOWED.includes(file.type)) return { ok: false, error: "bad_type" };
  if (file.size > maxBytes) return { ok: false, error: "too_large" };

  const buffer = Buffer.from(await file.arrayBuffer());
  return { ok: true, dataUrl: `data:${file.type};base64,${buffer.toString("base64")}` };
}
