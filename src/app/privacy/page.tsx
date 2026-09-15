import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/LegalLayout";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `${SITE_NAME} privacy policy – we don't require login, don't store files and don't sell data.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="January 2025">
      <section>
        <p>
          {SITE_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a free online tool for downloading publicly available Instagram media. We designed the
          service to collect as little data as possible. This policy explains what is — and isn&apos;t — processed when you use the site.
        </p>
      </section>

      <section>
        <h2>1. No accounts, no login</h2>
        <p>
          You never need to create an account or log in to Instagram or {SITE_NAME}. We never ask for, receive or store Instagram
          credentials, cookies or session tokens.
        </p>
      </section>

      <section>
        <h2>2. What happens when you paste a link</h2>
        <p>
          When you submit a link, our stateless serverless function requests the public post&apos;s metadata from Instagram and returns
          the direct media URL to your browser. The media file is streamed from Instagram&apos;s servers to your device. We do not save
          the URL you submitted, the resulting media, or any history of downloads on our servers.
        </p>
        <p>
          Audio extraction happens entirely in your browser using the Web Audio API — the file is never uploaded to us.
        </p>
      </section>

      <section>
        <h2>3. Technical data</h2>
        <p>
          Like every website, our hosting provider (Cloudflare) may process standard connection data such as IP address, user agent
          and request time in transient server logs for security, abuse prevention and rate limiting. We do not use this data to
          build profiles and it is not linked to the content you download.
        </p>
      </section>

      <section>
        <h2>4. Cookies and advertising</h2>
        <p>
          {SITE_NAME} does not set tracking cookies of its own. We may display advertising through third‑party networks (for example
          Google AdSense) to keep the service free. These networks may use cookies or similar technologies to serve and measure ads
          in accordance with their own privacy policies. You can opt out of personalised advertising via{" "}
          <a href="https://adssettings.google.com" rel="noopener noreferrer nofollow" target="_blank" className="text-brand-600 underline">
            Google Ads Settings
          </a>{" "}
          or{" "}
          <a href="https://www.aboutads.info/choices" rel="noopener noreferrer nofollow" target="_blank" className="text-brand-600 underline">
            aboutads.info
          </a>
          .
        </p>
      </section>

      <section>
        <h2>5. Contact form</h2>
        <p>
          If you use our contact or DMCA form, the information you provide (name, email, message) is forwarded to us by email/webhook
          so we can respond. It is not stored in a database on this site and is used only to handle your request.
        </p>
      </section>

      <section>
        <h2>6. Children</h2>
        <p>The service is not directed at children under 13 and we do not knowingly collect information from them.</p>
      </section>

      <section>
        <h2>7. Third‑party services</h2>
        <p>
          We are not affiliated with Instagram or Meta Platforms, Inc. Content you download originates from Instagram and is subject to
          Instagram&apos;s own terms and privacy policy.
        </p>
      </section>

      <section>
        <h2>8. Changes &amp; contact</h2>
        <p>
          We may update this policy from time to time; the date above reflects the latest revision. Questions? Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-600 underline">
            {CONTACT_EMAIL}
          </a>{" "}
          or use the <Link href="/dmca" className="text-brand-600 underline">contact form</Link>.
        </p>
      </section>
    </LegalLayout>
  );
}
