"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneIncoming, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { PhoneOnlyBookingForm } from "@/components/booking/PhoneOnlyBookingForm";
import { siteConfig } from "@/lib/site";
import { buildCartLine, cartSubtotal, defaultQuantity } from "@/lib/booking-cart";
import { getPriceItem } from "@/lib/price-list";
import { itemLabel } from "@/lib/service-price-map";
import { BookingStepBack } from "@/components/booking/BookingStepBack";

type Phase = "choice" | "callback";

type Props = {
  onClose?: () => void;
  trackSource?: string;
  showBackOnChoice?: boolean;
  className?: string;
  serviceId?: "acRefill" | "acRepair";
};

/** AC recharge: call now or leave phone for callback. */
export function AcBookingChoiceFlow({
  onClose,
  trackSource = "ac_booking_choice",
  showBackOnChoice = false,
  className = "",
  serviceId = "acRefill",
}: Props) {
  const { t, locale } = useI18n();
  const c = t.bookingQuick;
  const s = t.seasonalAc;
  const [phase, setPhase] = useState<Phase>("choice");

  const baseItem = getPriceItem("ac_r134a");
  const cartLine = baseItem
    ? buildCartLine(baseItem, itemLabel(baseItem, locale), defaultQuantity(baseItem))
    : null;
  const serviceLabel =
    t.serviceItems[serviceId] ?? s.title;
  const estimatedTotal = cartLine ? cartSubtotal([cartLine]) : undefined;

  return (
    <div className={className}>
      {phase === "callback" && (
        <BookingStepBack
          label={t.bookingQuote.back}
          onClick={() => setPhase("choice")}
          className="mb-3"
        />
      )}

      <AnimatePresence mode="wait">
        {phase === "choice" && (
          <motion.div
            key="choice"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {showBackOnChoice && onClose ? (
              <BookingStepBack label={t.bookingQuote.back} onClick={onClose} />
            ) : null}
            <div className="text-center">
              <p className="text-xs uppercase text-bm-red tracking-widest font-bold">{s.badge}</p>
              <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-glow mt-2">
                {c.acChoiceTitle}
              </h2>
              <p className="text-sm text-bm-muted mt-2">{c.acChoiceSubtitle}</p>
            </div>

            <PhoneLink
              trackSource={`${trackSource}_call`}
              className="w-full py-4 rounded-xl bg-bm-red border-2 border-bm-red shadow-neon-sm font-display uppercase text-sm flex items-center justify-center gap-2 text-white hover:brightness-110 transition"
            >
              <Phone className="w-5 h-5" />
              {c.acChoiceCall}
            </PhoneLink>

            <button
              type="button"
              className="w-full py-4 rounded-xl glass border-2 border-bm-border hover:border-bm-red/50 font-display uppercase text-sm flex items-center justify-center gap-2 transition"
              onClick={() => setPhase("callback")}
            >
              <PhoneIncoming className="w-5 h-5 text-bm-red" />
              {c.acChoiceCallback}
            </button>

            <p className="text-center text-xs text-bm-muted font-mono">{siteConfig.phone}</p>
          </motion.div>
        )}

        {phase === "callback" && (
          <motion.div
            key="callback"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <PhoneOnlyBookingForm
              serviceId={serviceId}
              serviceLabel={serviceLabel}
              cartLines={cartLine ? [cartLine] : []}
              estimatedTotal={estimatedTotal}
              title={c.acCallbackTitle}
              subtitle={c.acCallbackSubtitle}
              submitLabel={c.acCallbackSubmit}
              trackSource={`${trackSource}_callback`}
              onDone={onClose}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  trackSource?: string;
};

export function AcBookingChoiceModal({ open, onClose, trackSource }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl glass-red neon-border p-6 sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-bm-muted hover:text-white"
          aria-label="Close"
        >
          <X size={22} />
        </button>
        <AcBookingChoiceFlow onClose={onClose} trackSource={trackSource} />
      </motion.div>
    </div>
  );
}

type ButtonProps = {
  className?: string;
  trackSource?: string;
  children: ReactNode;
};

export function AcBookCtaButton({ className, trackSource, children }: ButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        data-fbq-track="InitiateCheckout"
        data-fbq-params={
          trackSource ? JSON.stringify({ content_name: trackSource }) : undefined
        }
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      <AcBookingChoiceModal
        open={open}
        onClose={() => setOpen(false)}
        trackSource={trackSource}
      />
    </>
  );
}
