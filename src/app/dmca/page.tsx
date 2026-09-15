import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { ContactForm } from "@/components/ContactForm";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "DMCA Policy & Contact",
  description: `Submit a DMCA takedown notice or contact the ${SITE_NAME} team.`,
  alternates: { canonical: "/dmca" },
};

export default function DmcaPage() {
  return (
    <LegalLayout title="DMCA Policy & Contact" updated="January 2025">
      <section>
        <p>
          {SITE_NAME} respects the intellectual‑property rights of others and complies with the Digital Millennium Copyright Act
          (DMCA) and equivalent laws. We are not affiliated with Instagram or Meta.
        </p>
      </section>

      <section>
        <h2>How the Service works (and what we can remove)</h2>
        <p>
          {SITE_NAME} does not host, cache or store any media. When a user pastes a public Instagram link, our stateless function
          retrieves the publicly available media URL from Instagram and the file is delivered directly from Instagram&apos;s servers.
          Because nothing is stored on our side, the most effective way to remove content is to delete it or make it private on
          Instagram, or to file a complaint with Instagram/Meta.
        </p>
        <p>
          Nevertheless, if you believe your copyrighted work is being accessed through our Service in a way that infringes your
          rights, we will act promptly: we can block specific post URLs, shortcodes or usernames from being processed by our tool.
        </p>
      </section>

      <section>
        <h2>Filing a DMCA takedown notice</h2>
        <p>Please include the following in your notice so we can process it quickly:</p>
        <ul>
          <li>Identification of the copyrighted work you claim has been infringed.</li>
          <li>The exact Instagram URL(s) of the material you want blocked.</li>
          <li>Your name, address, telephone number and email address.</li>
          <li>
            A statement that you have a good‑faith belief that the use of the material is not authorised by the copyright owner, its
            agent or the law.
          </li>
          <li>
            A statement, under penalty of perjury, that the information in the notice is accurate and that you are the copyright owner
            or authorised to act on the owner&apos;s behalf.
          </li>
          <li>Your physical or electronic signature.</li>
        </ul>
        <p>
          Send your notice via the form below or to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-600 underline">
            {CONTACT_EMAIL}
          </a>
          . We aim to respond within 48 hours. Misrepresentations in a notice may result in liability under 17 U.S.C. § 512(f).
        </p>
      </section>

      <section>
        <h2>Counter‑notice</h2>
        <p>
          If you believe a block was applied in error, you may submit a counter‑notice containing your contact details, identification
          of the blocked URL, a statement under penalty of perjury that the block resulted from mistake or misidentification, and your
          consent to the jurisdiction of your local federal court.
        </p>
      </section>

      <section>
        <h2>Contact us</h2>
        <p>Use this form for DMCA notices, bug reports, questions or partnership requests. Nothing you submit is stored on this site.</p>
        <div className="mt-5">
          <ContactForm />
        </div>
      </section>
    </LegalLayout>
  );
}
