import "server-only";

// Admin alerts via Telegram — new orders (game + GSM), new support tickets,
// and pending payment/top-up submissions that need a manual approval. Both
// TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CHAT_ID must be set in .env; until
// then this silently no-ops (never blocks the actual order/ticket/payment
// flow just because Telegram isn't configured yet).
//
// Setup:
//  1. TELEGRAM_BOT_TOKEN — from @BotFather's "Use this token..." message.
//  2. Open a chat with the bot and send it any message (e.g. /start) — a bot
//     can't message someone who has never messaged it first.
//  3. TELEGRAM_ADMIN_CHAT_ID — your own numeric chat id. Easiest way: message
//     @userinfobot on Telegram, it replies with your id immediately.
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

export async function notifyAdminTelegram(text: string): Promise<void> {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      console.error("[telegram] sendMessage failed:", res.status, await res.text());
    }
  } catch (e) {
    console.error("[telegram] sendMessage error:", e);
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function notifyNewOrder(input: { ref: string; productName: string; packageLabel: string; totalCents: number; email: string }) {
  return notifyAdminTelegram(
    `🎮 <b>New order</b> ${esc(input.ref)}\n` +
      `${esc(input.productName)} — ${esc(input.packageLabel)}\n` +
      `${money(input.totalCents)} · ${esc(input.email)}`,
  );
}

export function notifyNewGsmOrder(input: { ref: string; serviceName: string; totalCents: number; email: string }) {
  return notifyAdminTelegram(
    `🛠️ <b>New GSM order</b> ${esc(input.ref)}\n` +
      `${esc(input.serviceName)}\n` +
      `${money(input.totalCents)} · ${esc(input.email)}`,
  );
}

export function notifyNewTicket(input: { ref: string; subject: string; email: string }) {
  return notifyAdminTelegram(
    `🎫 <b>New support ticket</b> ${esc(input.ref)}\n${esc(input.subject)}\n${esc(input.email)}`,
  );
}

export function notifyNewPaymentSubmission(input: {
  purpose: "WALLET_TOPUP" | "ORDER";
  amountCents: number;
  email: string;
  orderRef?: string;
}) {
  const label = input.purpose === "WALLET_TOPUP" ? "💰 Wallet top-up request" : "💰 Order payment submitted";
  return notifyAdminTelegram(
    `${label}\n${money(input.amountCents)} · ${esc(input.email)}` +
      (input.orderRef ? `\nOrder: ${esc(input.orderRef)}` : "") +
      `\nAwaiting approval.`,
  );
}
