import { jsonResponse } from "@/lib/instagram";

export const dynamic = "force-dynamic";

/**
 * Stateless contact / DMCA form handler.
 * Nothing is stored. If CONTACT_WEBHOOK_URL is configured (e.g. a Discord,
 * Slack, Formspree or Make.com webhook) the message is forwarded there;
 * otherwise the client falls back to a mailto: link.
 */
export async function POST(request: Request) {
  let body: { name?: string; email?: string; subject?: string; message?: string; urls?: string; website?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Malformed request." }, 400);
  }

  // Honeypot
  if (body.website) return jsonResponse({ ok: true, delivered: true });

  const email = (body.email || "").trim();
  const message = (body.message || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
    return jsonResponse({ ok: false, error: "Please provide a valid email and a message of at least 10 characters." }, 400);
  }

  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (!webhook) {
    return jsonResponse({ ok: true, delivered: false });
  }

  const text = [
    `**New ${body.subject || "contact"} request – QuickVideoSaver**`,
    `From: ${(body.name || "Anonymous").slice(0, 100)} <${email}>`,
    body.urls ? `URLs: ${body.urls.slice(0, 2000)}` : null,
    "",
    message.slice(0, 4000),
  ]
    .filter((l) => l !== null)
    .join("\n");

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, text, name: body.name, email, subject: body.subject, message, urls: body.urls }),
    });
    return jsonResponse({ ok: res.ok, delivered: res.ok });
  } catch {
    return jsonResponse({ ok: true, delivered: false });
  }
}
