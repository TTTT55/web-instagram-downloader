import type { Metadata } from "next";
import Link from "next/link";
import { ContentLayout } from "@/components/ContentLayout";

export const metadata: Metadata = {
  title: "How Instagram Carousel Downloads Work",
  description: "Understand how QuickVideoSaver handles public Instagram carousel posts containing multiple photos or videos.",
  alternates: { canonical: "/guides/instagram-carousel-download" },
};

export default function InstagramCarouselDownloadPage() {
  return (
    <ContentLayout
      title="How Instagram carousel downloads work"
      intro="Instagram carousel posts can contain several media items in one URL. QuickVideoSaver treats the items separately so you can select the photo or video you actually need."
    >
      <section>
        <h2>What is a carousel?</h2>
        <p className="mt-3">
          A carousel is a single Instagram post containing multiple photos, videos, or a mixture of both. The post has one shareable URL, but the media response can contain several individual items.
        </p>
      </section>

      <section>
        <h2>What happens after you paste the link?</h2>
        <p className="mt-3">
          QuickVideoSaver first resolves the public post. When the response exposes multiple media items, the downloader builds a list of those items instead of treating the carousel as one file. Each item can then be downloaded individually.
        </p>
      </section>

      <section>
        <h2>Mixed photo and video carousels</h2>
        <p className="mt-3">
          A carousel does not have to contain only photos. If a public post contains both photos and videos, the result can contain both file types. Video items are offered as video files and image items as image files.
        </p>
      </section>

      <section>
        <h2>Why one item might be missing</h2>
        <p className="mt-3">
          Instagram can return incomplete public data, a media item can become unavailable, or a signed media URL can expire. This means a carousel may occasionally resolve only some of its original items. Refreshing the public post and trying again can help when the underlying media is still available.
        </p>
      </section>

      <section>
        <h2>For a step-by-step download</h2>
        <p className="mt-3">
          Start at the <Link href="/">Instagram video downloader</Link> for mixed-media posts, or use the <Link href="/photo">photo downloader</Link> when you only need images.
        </p>
      </section>

      <section>
        <h2>Use carousel media responsibly</h2>
        <p className="mt-3">
          Each image or video can have its own creator and copyright status. Public availability does not by itself grant permission to republish or commercially use the media.
        </p>
      </section>
    </ContentLayout>
  );
}
