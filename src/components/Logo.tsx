import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`} aria-label={`${SITE_NAME} home`}>
      <span className="ig-gradient inline-flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      </span>
      <span className="text-lg font-extrabold tracking-tight text-slate-900">
        Quick<span className="ig-gradient-text">Video</span>Saver
      </span>
    </Link>
  );
}
