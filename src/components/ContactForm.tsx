"use client";

import { useState, type FormEvent } from "react";
import { API_BASE, CONTACT_EMAIL } from "@/lib/site";

type Status = "idle" | "sending" | "sent" | "fallback" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "DMCA takedown request", urls: "", message: "", website: "" });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const mailtoHref = () => {
    const body = `Name: ${form.name}\nEmail: ${form.email}\nURLs: ${form.urls}\n\n${form.message}`;
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`[QuickVideoSaver] ${form.subject}`)}&body=${encodeURIComponent(body)}`;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus("sending");
    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { ok: boolean; delivered?: boolean; error?: string };
      if (!data.ok) {
        setStatus("error");
        setError(data.error || "Could not send your message.");
        return;
      }
      setStatus(data.delivered ? "sent" : "fallback");
    } catch {
      setStatus("error");
      setError("Network error. Please try again or email us directly.");
    }
  };

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
        <p className="font-semibold">Message sent — thank you.</p>
        <p className="mt-1">We review DMCA notices within 48 hours and will reply to {form.email}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5 sm:p-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-semibold text-slate-800">Name</span>
          <input className={inputCls} value={form.name} onChange={update("name")} autoComplete="name" required />
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-slate-800">Email *</span>
          <input className={inputCls} type="email" value={form.email} onChange={update("email")} autoComplete="email" required />
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-semibold text-slate-800">Subject</span>
        <select className={inputCls} value={form.subject} onChange={update("subject")}>
          <option>DMCA takedown request</option>
          <option>Bug report</option>
          <option>General question</option>
          <option>Advertising / partnership</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="font-semibold text-slate-800">Instagram URL(s) concerned</span>
        <input className={inputCls} value={form.urls} onChange={update("urls")} placeholder="https://www.instagram.com/p/…" />
      </label>
      <label className="block text-sm">
        <span className="font-semibold text-slate-800">Message *</span>
        <textarea className={`${inputCls} min-h-[140px]`} value={form.message} onChange={update("message")} required minLength={10} />
      </label>
      {/* Honeypot – hidden from humans */}
      <input type="text" name="website" value={form.website} onChange={update("website")} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {status === "fallback" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Almost there.</p>
          <p className="mt-1">
            Our inbox relay isn&apos;t configured on this deployment, so please send your message by email:
          </p>
          <a href={mailtoHref()} className="btn-primary mt-3 !py-2 text-sm">
            Open email to {CONTACT_EMAIL}
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Prefer email?{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
              {CONTACT_EMAIL}
            </a>
          </p>
          <button type="submit" className="btn-primary !py-2.5 text-sm" disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : "Send message"}
          </button>
        </div>
      )}
    </form>
  );
}

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-brand-500/30 focus:border-brand-500 focus:ring-4";
