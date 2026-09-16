import { AdSlot } from "./AdSlot";
import { DownloadForm } from "./DownloadForm";
import { Faq, Features, Steps } from "./Sections";
import { SITE_NAME, SITE_URL, type ToolConfig } from "@/lib/site";

export function ToolPage({ tool }: { tool: ToolConfig }) {
  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${SITE_NAME} – ${tool.title}`,
    url: `${SITE_URL}${tool.path}`,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description: tool.metaDescription,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-white dark:bg-[#0f172a] dark:border-b dark:border-slate-800">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-brand-50 to-white dark:from-[#251a2c] dark:via-[#111827] dark:to-[#0f172a]" aria-hidden />
        <div className="mx-auto max-w-3xl px-4 pb-10 pt-10 text-center sm:pt-14">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-slate-50 sm:text-5xl">{tool.h1}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-400 sm:text-lg">{tool.subtitle}</p>
          <div className="mt-8">
            <DownloadForm mode={tool.mode} placeholder={tool.placeholder} />
          </div>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <li className="flex items-center gap-1.5">
              <Check /> No login
            </li>
            <li className="flex items-center gap-1.5">
              <Check /> No watermark
            </li>
            <li className="flex items-center gap-1.5">
              <Check /> Free &amp; unlimited
            </li>
            <li className="flex items-center gap-1.5">
              <Check /> Nothing stored
            </li>
          </ul>
        </div>
      </section>

      <AdSlot slot="in-content-1" variant="rectangle" className="py-2" />

      <Steps />
      <Features tool={tool} />

      <AdSlot slot="in-content-2" variant="banner" className="pt-10" />

      <Faq />
    </>
  );
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
