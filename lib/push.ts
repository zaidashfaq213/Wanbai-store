import "server-only";

// Push notifications for the mobile app via Expo's push service — no
// account/API key needed for basic sending, just the recipient's Expo push
// token (registered by the app, see app/api/v1/me/push-token/route.ts).
// The web dashboard has no push equivalent (bell icon + email cover that),
// so this is mobile-only and always optional: every caller here is a
// fire-and-forget alongside the in-app Notification row that already exists
// (see notifyUser in lib/notify.ts) — a missing/invalid token just no-ops.
export async function sendExpoPush(
  pushToken: string | null | undefined,
  input: { title: string; body: string; href?: string },
): Promise<void> {
  if (!pushToken || !pushToken.startsWith("ExponentPushToken")) return;
  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        to: pushToken,
        title: input.title,
        body: input.body,
        data: input.href ? { href: input.href } : undefined,
        sound: "default",
      }),
    });
    if (!res.ok) {
      console.error("[sendExpoPush] failed:", res.status, await res.text());
    }
  } catch (e) {
    console.error("[sendExpoPush] error:", e);
  }
}
