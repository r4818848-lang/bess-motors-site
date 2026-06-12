import Link from "next/link";
import { MapPin, Navigation } from "lucide-react";
import { siteConfig } from "@/lib/site";
import {
  LOCAL_SERVICE_RADIUS_KM,
  localAreaDescriptionPl,
  localDistrictsPl,
} from "@/lib/seo-local";

const LOCAL_LANDING_LINKS = [
  { href: "/warszawa-wlochy", label: "Włochy / Okęcie" },
  { href: "/warszawa-ursynow", label: "Ursynów" },
  { href: "/warszawa-mokotow", label: "Mokotów" },
  { href: "/warszawa-ochota", label: "Ochota" },
] as const;

type Props = {
  /** compact = contacts sidebar; full = homepage block */
  variant?: "full" | "compact";
};

/** Visible local SEO block — districts within ~8 km + internal links */
export function LocalServiceAreaSection({ variant = "full" }: Props) {
  const isCompact = variant === "compact";

  return (
    <section
      className={isCompact ? "mt-8" : "py-16 border-t border-bm-border/40"}
      aria-labelledby="local-service-area-heading"
    >
      <div className={isCompact ? "" : "mx-auto max-w-7xl px-4 lg:px-8"}>
        <div className="flex items-start gap-3 mb-4">
          <MapPin className="w-6 h-6 text-bm-red shrink-0 mt-0.5" aria-hidden />
          <div>
            <h2
              id="local-service-area-heading"
              className={
                isCompact
                  ? "font-display text-lg font-bold uppercase"
                  : "font-display text-2xl md:text-3xl font-bold uppercase text-glow"
              }
            >
              Serwis samochodowy — Warszawa i okolice ({LOCAL_SERVICE_RADIUS_KM} km)
            </h2>
            <p className="mt-2 text-sm text-bm-muted leading-relaxed max-w-3xl">
              {localAreaDescriptionPl()}
            </p>
          </div>
        </div>

        <p className="text-xs uppercase tracking-wide text-bm-muted mb-2">
          Dzielnice w zasięgu dojazdu
        </p>
        <ul className="flex flex-wrap gap-2 mb-6">
          {localDistrictsPl.map((d) => (
            <li
              key={d}
              className="text-xs px-3 py-1 rounded-full border border-bm-border/60 bg-bm-card/50 text-bm-muted"
            >
              {d}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3 items-center">
          {LOCAL_LANDING_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-bm-red hover:underline font-medium"
            >
              Mechanik {link.label}
            </Link>
          ))}
          <a
            href={siteConfig.googleMapsReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm btn-outline px-4 py-2"
          >
            <Navigation className="w-4 h-4" aria-hidden />
            Trasa do warsztatu
          </a>
        </div>
      </div>
    </section>
  );
}
