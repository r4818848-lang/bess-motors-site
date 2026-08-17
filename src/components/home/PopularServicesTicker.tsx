"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Droplets, Filter, Disc, Snowflake, Circle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";
import { buildBookingUrl } from "@/lib/booking-url";

const INTERVAL_MS = 2500;

type SlideId = "ac" | "oil" | "filters" | "pads" | "tires";

const SLIDE_META: {
  id: SlideId;
  icon: typeof Snowflake;
  href: string;
}[] = [
  { id: "ac", icon: Snowflake, href: "/klimatyzacja" },
  { id: "oil", icon: Droplets, href: buildBookingUrl(["oil_filter"]) },
  { id: "filters", icon: Filter, href: buildBookingUrl(["cabin_filter", "air_filter"]) },
  { id: "pads", icon: Disc, href: buildBookingUrl(["brake_pads_front"]) },
  { id: "tires", icon: Circle, href: "/opony" },
];

/** Slim rotating promo under the header — popular same-day jobs, 2.5s */
export function PopularServicesTicker() {
  const { t } = useI18n();
  const tk = t.serviceTicker;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDE_META.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const slide = SLIDE_META[index]!;
  const Icon = slide.icon;
  const copy = tk.slides[slide.id];

  return (
    <div
      className="overflow-hidden border-t border-white/10 bg-bm-red text-white"
      role="region"
      aria-roledescription="carousel"
      aria-label={tk.badge}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto flex h-11 sm:h-12 max-w-7xl items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-8 overflow-hidden">
        <span className="hidden sm:inline shrink-0 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest">
          {tk.badge}
        </span>

        <div className="relative min-w-0 flex-1 h-full overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={slide.id}
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -18, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute inset-0 flex items-center gap-2 sm:gap-3 overflow-hidden"
            >
              <Icon size={16} className="shrink-0 opacity-90" aria-hidden />
              <p className="min-w-0 truncate text-xs sm:text-sm font-semibold">
                <span className="uppercase tracking-wide">{copy.title}</span>
                <span className="mx-1.5 opacity-60">·</span>
                <span className="text-yellow-200">{copy.price}</span>
                <span className="hidden md:inline">
                  <span className="mx-1.5 opacity-60">·</span>
                  <span className="font-normal opacity-90">{tk.eta}</span>
                </span>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="hidden sm:flex shrink-0 items-center gap-1">
          {SLIDE_META.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={tk.slides[s.id].title}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-4 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>

        <BookingLink
          href={slide.href}
          trackSource={`ticker_${slide.id}`}
          className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white text-bm-red px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide hover:bg-white/95"
        >
          {tk.cta}
          <ChevronRight size={14} />
        </BookingLink>
      </div>
    </div>
  );
}
