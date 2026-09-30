import type { Metadata } from "next";
import Link from "next/link";
import { ContentLayout } from "@/components/ContentLayout";
import { FAQ } from "@/lib/site";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers about QuickVideoSaver, supported public Instagram media, downloads, privacy and responsible reuse.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <ContentLayout
      title="Frequently asked questions"
      intro="Answers to common questions about QuickVideoSaver, supported public Instagram media, downloads and responsible reuse."
    >
      {FAQ.map((item) => (
        <section key={item.q}>
          <h2>{item.q}</h2>
          <p className="mt-3">{item.a}</p>
        </section>
      ))}

      <section>
        <h2>What if my download fails?</h2>
        <p className="mt-3">
          Start with the <Link href="/guides/instagram-download-troubleshooting">troubleshooting guide</Link>. The most useful first check is whether the original Instagram post still opens publicly in your browser.
        </p>
      </section>

      <section>
        <h2>Where can I learn more?</h2>
        <p className="mt-3">
          Visit the <Link href="/guides">download guides</Link> for detailed explanations of videos, carousels and common technical problems, or read <Link href="/about">about QuickVideoSaver</Link> to understand how the service is designed.
        </p>
      </section>
    </ContentLayout>
  );
}
