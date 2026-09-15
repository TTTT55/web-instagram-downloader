import { Logo } from "./Logo";
import { NavTabs } from "./NavTabs";
import { AdSlot } from "./AdSlot";

export function Header() {
  return (
    <header className="border-b border-slate-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <a
          href="#how-to"
          className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-900 sm:inline-block"
        >
          How it works
        </a>
      </div>
      <NavTabs />
      <AdSlot slot="header-banner" variant="banner" className="py-3" />
    </header>
  );
}
