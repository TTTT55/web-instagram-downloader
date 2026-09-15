import Link from "next/link";
import { Logo } from "./Logo";
import { TOOL_LIST, SITE_NAME } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <Logo />
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Free online tool to download public Instagram videos, Reels, photos and audio. No login, no watermark, nothing stored.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tools</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {TOOL_LIST.map((t) => (
                <li key={t.mode}>
                  <Link href={t.path} className="text-slate-700 hover:text-brand-600">
                    {t.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-slate-700 hover:text-brand-600">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-700 hover:text-brand-600">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/dmca" className="text-slate-700 hover:text-brand-600">
                  DMCA / Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-xs leading-relaxed text-slate-500">
          <p>
            <strong className="font-semibold text-slate-600">Disclaimer:</strong> {SITE_NAME} is not affiliated with, endorsed by, or
            sponsored by Instagram or Meta Platforms, Inc. &ldquo;Instagram&rdquo; is a trademark of Meta Platforms, Inc. This tool works only
            with publicly available content, never requires a login, and does not store any media or personal data. Downloaded content
            remains the property of its respective owners and may not be used commercially. Users are solely responsible for how they use
            downloaded files.
          </p>
          <p className="mt-3">
            &copy; {year} {SITE_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
