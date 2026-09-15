"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TOOL_LIST } from "@/lib/site";

const ICONS: Record<string, string> = {
  video: "🎬",
  photo: "🖼️",
  audio: "🎵",
  reels: "📱",
  stories: "⭕",
};

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Download tools" className="border-t border-slate-100">
      <div className="mx-auto max-w-4xl overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max items-center gap-1 py-1">
          {TOOL_LIST.map((tool) => {
            const active = pathname === tool.path;
            return (
              <li key={tool.mode}>
                <Link
                  href={tool.path}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active ? "bg-brand-50 text-brand-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span aria-hidden className="text-base leading-none">
                    {ICONS[tool.mode]}
                  </span>
                  {tool.nav}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
