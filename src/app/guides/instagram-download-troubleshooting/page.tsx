import type { Metadata } from "next";
import Link from "next/link";
import { ContentLayout } from "@/components/ContentLayout";

export const metadata: Metadata = {
  title: "Instagram Download Troubleshooting",
  description: "Troubleshoot public Instagram download errors including unavailable posts, expired media links and browser download problems.",
  alternates: { canonical: "/guides/instagram-download-troubleshooting" },
};

export default function InstagramDownloadTroubleshootingPage() {
  return (
    <ContentLayout
      title="Instagram download troubleshooting"
      intro="If a public Instagram link does not download, the cause is usually the post's availability, a changed Instagram response, an expired media URL, or the browser's handling of the file."
    >
      <section>
        <h2>“Post not found” or “media unavailable”</h2>
        <p className="mt-3">
          First open the original Instagram URL in your normal browser. If Instagram itself cannot show the post, the post may have been deleted, made private, restricted, or otherwise removed from public access. QuickVideoSaver cannot restore media that is no longer publicly available.
        </p>
      </section>

      <section>
        <h2>The link worked earlier but no longer works</h2>
        <p className="mt-3">
          Instagram media URLs can be signed and time-limited. A previously extracted media URL may therefore stop working later even though the original post still exists. Submit the original Instagram post URL again so a fresh media URL can be resolved.
        </p>
      </section>

      <section>
        <h2>“Bad URL hash” or a broken media URL</h2>
        <p className="mt-3">
          This type of error usually points to the media URL rather than your device. Avoid copying and editing a long CDN URL manually. Go back to the original Instagram post and submit that URL again so QuickVideoSaver can resolve a fresh link.
        </p>
      </section>

      <section>
        <h2>The download opens in a new tab</h2>
        <p className="mt-3">
          Some browsers decide to display a media file instead of downloading it, especially when the remote server does not provide an attachment response. If that happens, use the browser's save/download control. On desktop, right-clicking a displayed image or video may also provide a save option.
        </p>
      </section>

      <section>
        <h2>Carousel items are missing</h2>
        <p className="mt-3">
          A carousel can contain several media objects, and Instagram may expose them inconsistently. Refresh the original public post and try again. If the post itself has changed or an item is no longer publicly accessible, that item may remain unavailable.
        </p>
      </section>

      <section>
        <h2>Private posts and stories</h2>
        <p className="mt-3">
          QuickVideoSaver does not ask for Instagram credentials and does not bypass private-account access. If Instagram requires you to log in to see the content, the service cannot guarantee that the content can be downloaded.
        </p>
      </section>

      <section>
        <h2>Still having trouble?</h2>
        <p className="mt-3">
          Check the <Link href="/faq">FAQ</Link> for common questions or use the <Link href="/dmca">contact page</Link> if you need to report a site issue or copyright concern.
        </p>
      </section>
    </ContentLayout>
  );
}
