import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/LegalLayout";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${SITE_NAME}. Personal, non-commercial use of public Instagram content only.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="January 2025">
      <section>
        <p>
          By accessing or using {SITE_NAME} (the &ldquo;Service&rdquo;) you agree to these Terms. If you do not agree, please do not use the
          Service.
        </p>
      </section>

      <section>
        <h2>1. Not affiliated with Instagram or Meta</h2>
        <p>
          {SITE_NAME} is an independent tool. It is not affiliated with, endorsed by, sponsored by or otherwise connected to Instagram,
          Meta Platforms, Inc. or any of their subsidiaries. &ldquo;Instagram&rdquo; and related marks are trademarks of Meta Platforms,
          Inc.
        </p>
      </section>

      <section>
        <h2>2. Description of the Service</h2>
        <p>
          The Service lets you locate and download media that is already publicly accessible on Instagram by pasting a public post,
          reel or video link. The Service only works with public accounts and content. We never request, store or use Instagram
          login credentials, and we do not store downloaded files or keep any download history.
        </p>
      </section>

      <section>
        <h2>3. Acceptable use</h2>
        <p>You agree that you will:</p>
        <ul>
          <li>Only download content for personal, non‑commercial use (for example, to save a post for offline viewing).</li>
          <li>Not download, reproduce, distribute or sell content without permission from the copyright owner.</li>
          <li>Not use the Service to infringe any intellectual‑property, privacy, publicity or other rights of any person.</li>
          <li>Not use automated scripts, bots or bulk tooling against the Service, or attempt to circumvent rate limits.</li>
          <li>Not use the Service for anything unlawful, harassing, defamatory or otherwise objectionable.</li>
        </ul>
      </section>

      <section>
        <h2>4. Intellectual property &amp; user responsibility</h2>
        <p>
          All media you download remains the property of its original creator or rights holder. {SITE_NAME} does not claim any
          ownership of, and grants you no rights in, downloaded content. <strong>Downloaded content may not be used commercially</strong>{" "}
          and may not be re‑uploaded, edited or redistributed without the owner&apos;s consent.
        </p>
        <p>
          <strong>You are solely responsible for how you use the Service and any downloaded files</strong>, including compliance with
          applicable copyright laws, Instagram&apos;s Terms of Use and the rights of content creators.
        </p>
      </section>

      <section>
        <h2>5. Copyright complaints</h2>
        <p>
          We respect intellectual‑property rights. If you believe the Service has been used to infringe your copyright, please follow
          the process on our <Link href="/dmca" className="text-brand-600 underline">DMCA page</Link>.
        </p>
      </section>

      <section>
        <h2>6. Availability &amp; changes</h2>
        <p>
          The Service is provided free of charge and may be modified, suspended or discontinued at any time without notice. Because
          the Service depends on Instagram&apos;s public interfaces, functionality may break when Instagram changes its platform.
        </p>
      </section>

      <section>
        <h2>7. Disclaimer of warranties</h2>
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
          INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON‑INFRINGEMENT.
        </p>
      </section>

      <section>
        <h2>8. Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, {SITE_NAME.toUpperCase()} AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, ARISING OUT OF OR RELATED TO YOUR USE OF THE
          SERVICE OR ANY DOWNLOADED CONTENT.
        </p>
      </section>

      <section>
        <h2>9. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless {SITE_NAME} and its operators from any claims, damages or expenses arising from your
          use of the Service or your violation of these Terms or of any third‑party rights.
        </p>
      </section>

      <section>
        <h2>10. Changes to these Terms</h2>
        <p>We may update these Terms at any time. Continued use of the Service after changes are posted constitutes acceptance.</p>
      </section>

      <section>
        <h2>11. Contact</h2>
        <p>
          Questions about these Terms:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-600 underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  );
}
