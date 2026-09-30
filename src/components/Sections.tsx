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

export function GuideContent({ tool }: { tool: ToolConfig }) {
  const guides: Record<ToolConfig["mode"], { title: string; paragraphs: string[]; tips: string[] }> = {
    video: {
      title: "Understanding Instagram video downloads",
      paragraphs: [
        "A public Instagram video is still controlled by its creator and may be subject to copyright or other reuse restrictions. QuickVideoSaver is designed for situations where you have permission to save the media or are using it for a permitted personal purpose.",
        "The downloader resolves the public information available for the post and presents the media Instagram makes accessible. Resolution, encoding and availability come from the source; the service does not create a higher-quality copy.",
      ],
      tips: ["Use the original post URL rather than a copied CDN URL.", "If a link stops working, submit the original post again to obtain a fresh media URL.", "A private or deleted post cannot be made public by the downloader."],
    },
    photo: {
      title: "Understanding Instagram photo downloads",
      paragraphs: [
        "Instagram posts can contain a single image or several images in a carousel. When public media information is available, QuickVideoSaver lists the individual images so you can choose the one you need.",
        "The downloaded image is limited by the source Instagram makes available. Saving a file does not transfer copyright ownership or permission to republish it.",
      ],
      tips: ["Use the public post URL, not a manually copied image CDN URL.", "For carousels, check each returned item because a post can contain multiple images.", "Ask the creator for permission before commercial or public reuse."],
    },
    audio: {
      title: "Understanding audio extraction",
      paragraphs: [
        "For supported public videos and Reels, QuickVideoSaver can expose the video's audio for saving. Audio may be subject to separate copyright or licensing restrictions from the video itself.",
        "The available sound depends on the source media. If Instagram does not expose an accessible video or audio track, the service cannot reconstruct one from an unavailable post.",
      ],
      tips: ["Start with the public Reel or video URL.", "If extraction fails, first check whether the original post still plays publicly.", "Treat downloaded music and other audio as copyrighted unless you have permission to reuse it."],
    },
    reels: {
      title: "Understanding Instagram Reel downloads",
      paragraphs: [
        "Reels are short-form Instagram videos that can be shared publicly through a Reel URL. QuickVideoSaver attempts to resolve the public media attached to that URL without asking for an Instagram login.",
        "Instagram can change how public Reel data is exposed or can expire signed media links. A failed download therefore does not necessarily mean the Reel itself has disappeared.",
      ],
      tips: ["Open the Reel in Instagram first to confirm it is publicly accessible.", "Submit the Reel URL again if an earlier download link has expired.", "Downloaded media remains subject to the creator's copyright and reuse permissions."],
    },
    stories: {
      title: "Understanding Instagram story links",
      paragraphs: [
        "Instagram Stories can have stricter access requirements than ordinary public posts. QuickVideoSaver does not request your Instagram credentials and does not attempt to bypass private access.",
        "If a story requires a login or is no longer available, there may be no public media URL that the service can resolve. Stories that are also available as public posts or Reels can sometimes be handled through their public post URL instead.",
      ],
      tips: ["Use a publicly accessible URL.", "Never give your Instagram password to a downloader.", "If the story is unavailable to a logged-out browser, the service cannot guarantee access."],
    },
  };

  const guide = guides[tool.mode];

  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">{guide.title}</h2>
        <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400">
          {guide.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <h3 className="mt-7 font-bold text-slate-900 dark:text-slate-100">Useful checks before downloading</h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          {guide.tips.map((tip) => <li key={tip} className="ml-5 list-disc">{tip}</li>)}
        </ul>
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
