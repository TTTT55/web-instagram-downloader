import { FAQ, type ToolConfig } from "@/lib/site";

export function Steps() {
  const steps = [
    {
      n: 1,
      title: "Copy the link",
      text: "Open Instagram, tap the ⋯ or share icon on the post or reel and choose “Copy link”.",
    },
    {
      n: 2,
      title: "Paste it above",
      text: "Come back to QuickVideoSaver and paste the URL into the box, then press Download.",
    },
    {
      n: 3,
      title: "Save the file",
      text: "Pick the video, photo or audio you want and it downloads straight to your device.",
    },
  ];
  return (
    <section id="how-to" className="mx-auto max-w-4xl scroll-mt-20 px-4 py-14">
      <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">How to download from Instagram</h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">Three quick steps — no app, no account, no watermark.</p>
      <ol className="mt-10 grid gap-6 sm:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="card relative p-6 pt-8">
            <span className="ig-gradient absolute -top-4 left-6 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold text-white shadow">
              {s.n}
            </span>
            <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Features({ tool }: { tool: ToolConfig }) {
  return (
    <section className="bg-slate-50 py-14">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Why use {tool.title}?</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {tool.features.map((f) => (
            <div key={f.title} className="card flex gap-4 p-5">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <div>
                <h3 className="font-bold text-slate-900">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Frequently asked questions</h2>
      <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {FAQ.map((f, i) => (
          <details key={f.q} className="group px-5" open={i === 0}>
            <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 text-left font-semibold text-slate-900">
              {f.q}
              <svg className="faq-chevron h-5 w-5 shrink-0 text-slate-400 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p className="pb-5 text-sm leading-relaxed text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
