import { ADSENSE_CLIENT } from "@/lib/site";

interface AdSlotProps {
  /** Numeric AdSense ad-unit ID. Leave empty until an ad unit is created in AdSense. */
  slot?: string;
  /** Layout preset controlling the placeholder dimensions. */
  variant?: "banner" | "rectangle";
  className?: string;
}

const isValidAdSlot = (slot?: string) => Boolean(slot && /^\d+$/.test(slot));

/**
 * Ad placeholder. Once a numeric AdSense ad-unit ID is supplied, renders the
 * responsive AdSense unit. Until then, it keeps a labelled placeholder so the
 * site remains valid while the AdSense site review is pending.
 */
export function AdSlot({ slot, variant = "banner", className = "" }: AdSlotProps) {
  const sizeClass = variant === "banner" ? "min-h-[90px] md:min-h-[90px]" : "min-h-[250px]";

  if (ADSENSE_CLIENT && isValidAdSlot(slot)) {
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
    <div className={`mx-auto w-full max-w-4xl px-4 ${className}`} data-ad-slot={slot || "unconfigured"} aria-hidden>
      <div
        className={`flex ${sizeClass} w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-widest text-slate-400`}
      >
        Advertisement
      </div>
    </div>
  );
}
