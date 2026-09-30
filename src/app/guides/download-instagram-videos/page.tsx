import type { Metadata } from "next";
import Link from "next/link";
import { ContentLayout } from "@/components/ContentLayout";

export const metadata: Metadata = {
  title: "How to Download Instagram Videos",
  description: "A practical guide to downloading publicly accessible Instagram videos and Reels with QuickVideoSaver.",
  alternates: { canonical: "/guides/download-instagram-videos" },
};

export default function DownloadInstagramVideosPage() {
  return (
    <ContentLayout
      title="How to download an Instagram video"
      intro="QuickVideoSaver can resolve publicly accessible Instagram video and Reel links without requiring an Instagram login. Here is what the process looks like and what can affect the result."
    >
      <section>
        <h2>1. Copy the public Instagram link</h2>
        <p className="mt-3">
          Open the Instagram post or Reel you want to save. Use Instagram's share menu and choose the option to copy the link. The URL should point to a public post or Reel rather than a private account.
        </p>
      </section>

      <section>
        <h2>2. Paste the link into QuickVideoSaver</h2>
        <p className="mt-3">
          Paste the URL into the downloader on the <Link href="/">homepage</Link> and submit it. QuickVideoSaver checks the public information available for that post and attempts to identify its media items.
        </p>
      </section>

      <section>
        <h2>3. Choose the media you want</h2>
        <p className="mt-3">
          A normal video post usually produces a video item. A carousel can contain several photos and videos, so the result may contain multiple items. If more than one item is available, choose the specific file you want rather than downloading the entire page.
        </p>
      </section>

      <section>
        <h2>Why a video may not download</h2>
        <ul className="mt-4">
          <li>The post was deleted or is no longer publicly accessible.</li>
          <li>The account or post requires a login.</li>
          <li>Instagram has changed the public response used to identify the media.</li>
          <li>The signed media URL has expired between extraction and download.</li>
          <li>The submitted URL is not a supported Instagram post or Reel URL.</li>
        </ul>
        <p className="mt-4">
          If you encounter an error, see the <Link href="/guides/instagram-download-troubleshooting">download troubleshooting guide</Link> before assuming the browser or device is at fault.
        </p>
      </section>

      <section>
        <h2>Quality and watermarks</h2>
        <p className="mt-3">
          QuickVideoSaver does not add a watermark to files it retrieves. The available resolution and encoding are determined by the media Instagram makes available; the service cannot create a higher-quality version than the source.
        </p>
      </section>

      <section>
        <h2>Copyright reminder</h2>
        <p className="mt-3">
          Downloading a public video does not transfer copyright ownership. If you intend to repost, edit, publish, or monetize someone else's video, get permission from the rights holder first.
        </p>
      </section>
    </ContentLayout>
  );
}
