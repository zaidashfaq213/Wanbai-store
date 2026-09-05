import { prisma } from "@/lib/db";
import { ok, fail, withAuth } from "@/lib/api/core";

// POST /api/v1/me/push-token — the app calls this once it has an Expo push
// token (on login and whenever the token changes/refreshes). Overwrites
// whatever was there before — only the latest token for a user is ever
// valid, and a user can only be signed into one device's push at a time
// with this simple a model (matches how the web dashboard has no
// multi-session push concept either).
export const POST = withAuth(async (req, user) => {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!token) return fail("invalid_input");

  await prisma.user.update({ where: { id: user.id }, data: { pushToken: token } });
  return ok({ ok: true });
});

// DELETE /api/v1/me/push-token — called on logout so a signed-out device
// stops receiving push for the account it just left.
export const DELETE = withAuth(async (_req, user) => {
  await prisma.user.update({ where: { id: user.id }, data: { pushToken: null } });
  return ok({ ok: true });
});
