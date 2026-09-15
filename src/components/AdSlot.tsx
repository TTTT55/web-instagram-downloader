import { ADSENSE_CLIENT } from "@/lib/site";

interface AdSlotProps {
  /** Identifier for the slot (e.g. "header-banner", "in-content-1"). Also used as data-ad-slot. */
  slot: string;
  /** Layout preset controlling the placeholder dimensions. */
  variant?: "banner" | "rectangle";
  className?: string;
}

/**
 * Ad placeholder. Renders a clearly labelled reserved area so layout doesn't
 * shift when real ads are added later. When NEXT_PUBLIC_ADSENSE_CLIENT is set
 * the AdSense <ins> tag is rendered instead (set the numeric slot id in the
 * `slot` prop or map it in your ad config).
 */
export function AdSlot({ slot, variant = "banner", className = "" }: AdSlotProps) {
  const sizeClass = variant === "banner" ? "min-h-[90px] md:min-h-[90px]" : "min-h-[250px]";

  if (ADSENSE_CLIENT) {
    return (
      <div className={`mx-auto w-full max-w-4xl px-4 ${className}`} data-ad-container={slot}>
        <ins
          className="adsbygoogle block"
          style={{ display: "block" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  return (
    <div className={`mx-auto w-full max-w-4xl px-4 ${className}`} data-ad-slot={slot} aria-hidden>
      <div
        className={`flex ${sizeClass} w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-widest text-slate-400`}
      >
        Advertisement
      </div>
    </div>
  );
}
