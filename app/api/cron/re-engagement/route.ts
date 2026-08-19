import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { reEngagementEmail } from "@/lib/emails/re-engagement";

// Cap per run so one invocation can't run unbounded — a daily cron will
// simply catch anyone left over on the next run.
const BATCH_LIMIT = 300;

/**
 * "Come back" email cron. Not user-facing — trigger it from the VPS's
 * crontab once a day, e.g.:
 *   0 10 * * * curl -s -H "x-cron-secret: $CRON_SECRET" https://wanbai-stoer.com/api/cron/re-engagement
 *
 * Requires CRON_SECRET in .env — without it the endpoint always 404s, so a
 * misconfigured/forgotten secret fails closed instead of running open.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("Not configured", { status: 404 });
  if (req.headers.get("x-cron-secret") !== secret) {
    return new Response("Not configured", { status: 404 });
  }

  const settings = await prisma.reEngagementSettings.findUnique({
    where: { id: "reengagement" },
  });
  if (!settings || !settings.enabled) {
    return Response.json({ ok: true, enabled: false, sent: 0 });
  }

  const now = Date.now();
  const inactiveSince = new Date(now - settings.inactiveDays * 86_400_000);
  const intervalSince = new Date(now - settings.intervalDays * 86_400_000);

  // Inactive (or never-tracked-but-old-enough-account), under the send cap,
  // not emailed again too recently, and hasn't ordered/topped-up recently —
  // that last check catches activity that doesn't touch lastActiveAt (e.g.
  // an admin manually adjusting a wallet) without treating it as "active".
  const candidates = await prisma.user.findMany({
    where: {
      emailVerified: { not: null },
      reEngageSentCount: { lt: settings.maxSends },
      // Never-tracked accounts fall back to createdAt, so a fresh signup
      // isn't immediately treated as "inactive" before they've done anything.
      createdAt: { lt: inactiveSince },
      AND: [
        { OR: [{ lastActiveAt: null }, { lastActiveAt: { lt: inactiveSince } }] },
        { OR: [{ reEngageLastSentAt: null }, { reEngageLastSentAt: { lt: intervalSince } }] },
      ],
      orders: { none: { createdAt: { gte: inactiveSince } } },
      walletTransactions: { none: { createdAt: { gte: inactiveSince } } },
    },
    select: { id: true, email: true, preferredLocale: true },
    take: BATCH_LIMIT,
  });

  let sent = 0;
  let failed = 0;
  for (const user of candidates) {
    const locale = user.preferredLocale === "en" ? "en" : "ar";
    const { subject, text, html } = reEngagementEmail({
      locale,
      subject: locale === "ar" ? settings.subjectAr : settings.subjectEn,
      body: locale === "ar" ? settings.bodyAr : settings.bodyEn,
    });
    const result = await sendMail({ to: user.email, subject, text, html });
    if (!result.delivered) {
      failed++;
      continue;
    }
    sent++;
    await prisma.user
      .update({
        where: { id: user.id },
        data: { reEngageSentCount: { increment: 1 }, reEngageLastSentAt: new Date() },
      })
      .catch(() => {});
  }

  return Response.json({ ok: true, enabled: true, candidates: candidates.length, sent, failed });
}
