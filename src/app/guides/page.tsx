import type { Metadata } from "next";
import Link from "next/link";
import { ContentLayout } from "@/components/ContentLayout";

export const metadata: Metadata = {
  title: "Instagram Download Guides",
  description: "Practical guides for downloading public Instagram videos, Reels, photos and carousel posts with QuickVideoSaver.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return (
    <ContentLayout
      title="Instagram download guides"
      intro="Practical information for using QuickVideoSaver, understanding what can be downloaded, and troubleshooting links that do not work."
    >
      <section>
        <h2>Choose a guide</h2>
        <div className="mt-5 grid gap-4">
          <Link href="/guides/download-instagram-videos" className="rounded-2xl border border-slate-200 p-5 no-underline transition hover:border-brand-300 hover:bg-brand-50/40 dark:border-slate-800 dark:hover:bg-slate-900">
            <h3>How to download an Instagram video</h3>
            <p className="mt-2 font-normal text-slate-600 dark:text-slate-400">A step-by-step explanation for public feed videos and Reels, including what to check when the browser does not start a download.</p>
          </Link>
          <Link href="/guides/instagram-carousel-download" className="rounded-2xl border border-slate-200 p-5 no-underline transition hover:border-brand-300 hover:bg-brand-50/40 dark:border-slate-800 dark:hover:bg-slate-900">
            <h3>How Instagram carousel downloads work</h3>
            <p className="mt-2 font-normal text-slate-600 dark:text-slate-400">Learn why a carousel can contain several media items and how QuickVideoSaver presents those items separately.</p>
          </Link>
          <Link href="/guides/instagram-download-troubleshooting" className="rounded-2xl border border-slate-200 p-5 no-underline transition hover:border-brand-300 hover:bg-brand-50/40 dark:border-slate-800 dark:hover:bg-slate-900">
            <h3>Instagram download troubleshooting</h3>
            <p className="mt-2 font-normal text-slate-600 dark:text-slate-400">A practical checklist for deleted posts, private accounts, expired links, unsupported URLs and browser download issues.</p>
          </Link>
        </div>
      </section>

      <section>
        <h2>Why these guides exist</h2>
        <p className="mt-3">
          Downloading public media is not always a single-step process. Instagram's public responses and media URLs can change, and browsers handle direct media links differently. These guides explain the expected behavior so users can tell the difference between a temporary technical problem and content that simply is not available.
        </p>
      </section>

      <section>
        <h2>Use downloads responsibly</h2>
        <p className="mt-3">
          Public visibility does not automatically grant permission to republish someone else's work. Before using a downloaded image, video or audio outside your personal use, check the creator's permissions and any applicable copyright or platform rules.
        </p>
      </section>
    </ContentLayout>
  );
}
