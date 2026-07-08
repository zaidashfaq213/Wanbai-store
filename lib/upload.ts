import "server-only";

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB
const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export type UploadResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: "too_large" | "bad_type" | "empty" };

/**
 * Validate an uploaded image (payment screenshot) and return it as a base64
 * data URL, which we store directly in the DB — no cloud/object storage or
 * external API required, matching the manual-fulfillment model.
 */
export async function imageToDataUrl(file: unknown): Promise<UploadResult> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "empty" };
  if (!ALLOWED.includes(file.type)) return { ok: false, error: "bad_type" };
  if (file.size > MAX_BYTES) return { ok: false, error: "too_large" };

  const buffer = Buffer.from(await file.arrayBuffer());
  return { ok: true, dataUrl: `data:${file.type};base64,${buffer.toString("base64")}` };
}
