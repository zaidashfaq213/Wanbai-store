import { prisma } from "@/lib/db";
import { ok, withAuth } from "@/lib/api/core";

// POST { id? } — mark one as read, or all when no id is given.
export const POST = withAuth(async (req, user) => {
  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : undefined;

  await prisma.notification.updateMany({
    where: { userId: user.id, read: false, ...(id ? { id } : {}) },
    data: { read: true },
  });
  return ok({ read: true });
});
