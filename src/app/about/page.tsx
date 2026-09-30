import type { Metadata } from "next";
import Link from "next/link";
import { ContentLayout } from "@/components/ContentLayout";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "About QuickVideoSaver",
  description: "Learn what QuickVideoSaver does, how the service is designed, and what it does not support.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ContentLayout
      title="About QuickVideoSaver"
      intro="QuickVideoSaver is a browser-based utility for saving publicly accessible Instagram media when the user has the right to download and reuse it."
    >
      <section>
        <h2>What the service is for</h2>
        <p className="mt-3">
          QuickVideoSaver was built around a simple task: a user has a public Instagram post or Reel link and wants a copy of the media available in the browser. The service provides a small, focused interface instead of requiring an app installation or an Instagram password.
        </p>
        <p className="mt-3">
          The site supports several common media types, including videos, photos, carousel posts and audio extraction from supported videos. Availability depends on what Instagram makes publicly accessible at the time a link is processed.
        </p>
      </section>

      <section>
        <h2>How QuickVideoSaver works</h2>
        <p className="mt-3">
          When you submit a public Instagram URL, QuickVideoSaver attempts to resolve the post and identify media URLs that can be delivered to your browser. The result page then presents the media items that were successfully found.
        </p>
        <p className="mt-3">
          Instagram can change its public web responses, expire signed media URLs, or make a post unavailable. For that reason, a link that worked earlier may not always produce a downloadable result later. The service reports these cases instead of asking users for their Instagram credentials.
        </p>
      </section>

      <section>
        <h2>What we deliberately do not support</h2>
        <ul className="mt-4">
          <li>We do not ask for or collect Instagram passwords.</li>
          <li>We do not provide a way to bypass a private account or private post.</li>
          <li>We do not claim ownership of media published by Instagram users.</li>
          <li>We do not guarantee that every public URL will remain downloadable as Instagram changes its systems.</li>
        </ul>
      </section>

      <section>
        <h2>Respect creators and copyright</h2>
        <p className="mt-3">
          A downloadable file is not automatically free of copyright restrictions. If you plan to repost, edit, publish, or use someone else's media commercially, obtain the necessary permission from the rights holder. Our <Link href="/dmca">DMCA and contact page</Link> explains how to report a copyright concern.
        </p>
      </section>

      <section>
        <h2>Explore the guides</h2>
        <p className="mt-3">
          We maintain practical guides covering <Link href="/guides/download-instagram-videos">video downloads</Link>, <Link href="/guides/instagram-carousel-download">carousel posts</Link> and <Link href="/guides/instagram-download-troubleshooting">common download problems</Link>.
        </p>
      </section>
    </ContentLayout>
  );
}
