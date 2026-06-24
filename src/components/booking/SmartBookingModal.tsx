"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, ArrowRight, ChevronLeft, List, ExternalLink } from "lucide-react";
import { BookingStepBack } from "@/components/booking/BookingStepBack";
import { useI18n } from "@/lib/i18n/context";
import { contentLocale } from "@/lib/i18n/locale-utils";
import { serviceFlows, type ServiceId, type FlowOption } from "@/lib/services-catalog";
import { createCallRequest } from "@/lib/booking-actions";
import { BookingLink } from "@/components/analytics/BookingLink";
import { useAuth } from "@/lib/auth/session-context";
import { Button } from "@/components/ui/Button";
import { trackLead } from "@/lib/gtag";
import { saveSubmissionSnapshot, THANK_YOU_PATH } from "@/lib/submission-thank-you";
import {
  buildCartLine,
  cartSubtotal,
  cartHasFromPrices,
  formatPln,
  unitPriceHint,
  defaultQuantity,
  type CartLine,
} from "@/lib/booking-cart";
import { getPriceItem, HOURLY_RATE_PLN } from "@/lib/price-list";
import {
  serviceBasePriceId,
  resolvePriceIdsForOption,
  getItemForOption,
  itemLabel,
} from "@/lib/service-price-map";
import { serviceLandingHref } from "@/lib/service-slug-map";
import { BookingWorkVideoTeaser } from "@/components/gallery/OurWorksSection";
import { getOurWorkVideosForService } from "@/lib/our-works";
import { PhoneOnlyBookingForm } from "@/components/booking/PhoneOnlyBookingForm";
import {
  isAcBookingService,
  isPhoneContactValid,
  resolveBookingClientName,
} from "@/lib/booking-form-mode";

type Phase = "manager" | "flow" | "contact";
type SubmitMode = "call" | "booking";

const WORKSHOP_PHONE = "+48 791 257 229";

function withPhone(template: string): string {
  return template.replace("{phone}", WORKSHOP_PHONE);
}

type FlowScreen =
  | { type: "yesno"; key: string }
  | { type: "multi"; key: string; options: FlowOption[] }
  | { type: "pick"; key: string; options: FlowOption[] };

function buildScreens(serviceId: ServiceId): FlowScreen[] {
  const screens: FlowScreen[] = [];
  const flows = serviceFlows[serviceId];
  if (!flows) return screens;

  for (const f of flows) {
    if (f.kind === "options") {
      screens.push({
        type: f.multi ? "multi" : "pick",
        key: f.questionKey,
        options: f.options,
      });
    }
    if (f.kind === "yesnoThen") {
      screens.push({ type: "yesno", key: f.questionKey });
      if (f.ifYes[0]?.kind === "multi") {
        screens.push({
          type: "multi",
          key: f.ifYes[0].questionKey,
          options: f.ifYes[0].options,
        });
      }
      for (const then of f.then) {
        if (then.kind === "options") {
          screens.push({ type: "pick", key: then.questionKey, options: then.options });
        }
      }
    }
  }
  return screens;
}

interface Props {
  serviceId: ServiceId;
  onClose: () => void;
  onSuccess?: (kind: "call" | "booking") => void;
}

export function SmartBookingModal({ serviceId, onClose, onSuccess }: Props) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const bf = t.bookingFlow;
  const bq = t.bookingQuote;
  const contentLoc = contentLocale(locale);
  const serviceLabel =
    t.serviceItems[serviceId as keyof typeof t.serviceItems] ?? serviceId;
  const screens = useMemo(() => buildScreens(serviceId), [serviceId]);
  const { clientUser, sessionReady } = useAuth();

  const [phase, setPhase] = useState<Phase>("manager");
  const [submitMode, setSubmitMode] = useState<SubmitMode>("booking");
  const [screenIdx, setScreenIdx] = useState(0);
  const [oilExtra, setOilExtra] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [clientPhone, setClientPhone] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);

  useEffect(() => {
    if (!sessionReady || !clientUser) return;
    setClientPhone(clientUser.phone);
  }, [sessionReady, clientUser]);

  const clientFullName = resolveBookingClientName(clientPhone, clientUser?.name);
  const servicePageHref = serviceLandingHref(serviceId);
  const hasWorkVideo = getOurWorkVideosForService(serviceId).length > 0;

  const lbl = (key: string) => {
    const flow = bf as Record<string, string>;
    const items = t.serviceItems as Record<string, string>;
    return flow[key] ?? items[key] ?? key;
  };

  const addPriceIdsToCart = useCallback(
    (ids: string[]) => {
      for (const id of ids) {
        const item = getPriceItem(id);
        if (!item) continue;
        const line = buildCartLine(
          item,
          itemLabel(item, locale),
          defaultQuantity(item)
        );
        setCart((prev) => {
          const rest = prev.filter((l) => l.itemId !== id);
          return [...rest, line];
        });
      }
    },
    [locale]
  );

  const initBaseService = useCallback(() => {
    const baseId = serviceBasePriceId[serviceId];
    if (baseId) addPriceIdsToCart([baseId]);
  }, [serviceId, addPriceIdsToCart]);

  useEffect(() => {
    if (!isAcBookingService(serviceId)) return;
    setSubmitMode("booking");
    setCart([]);
    initBaseService();
    setPhase("contact");
  }, [serviceId, initBaseService]);

  const addOptionsToCart = useCallback(
    (optionIds: string[]) => {
      for (const optId of optionIds) {
        const ids = resolvePriceIdsForOption(serviceId, optId);
        if (ids.length) addPriceIdsToCart(ids);
      }
    },
    [serviceId, addPriceIdsToCart]
  );

  const total = cartSubtotal(cart);
  const hasFrom = cartHasFromPrices(cart);

  const currentScreen = (): FlowScreen | null => {
    if (serviceId === "oil" && screenIdx === 0) {
      return { type: "yesno", key: "oilExtra" };
    }
    if (serviceId === "oil") {
      if (screenIdx === 1 && oilExtra === "yes") {
        return {
          type: "multi",
          key: "oilFilters",
          options: [
            { id: "oilFilter", labelKey: "oilFilter" },
            { id: "cabinFilter", labelKey: "cabinFilter" },
            { id: "airFilter", labelKey: "airFilter" },
            { id: "fuelFilter", labelKey: "fuelFilter" },
          ],
        };
      }
      const offset = oilExtra === "yes" ? 2 : 1;
      if (screenIdx === offset) {
        return {
          type: "pick",
          key: "oilType",
          options: [
            { id: "5w30", labelKey: "w5w30" },
            { id: "5w40", labelKey: "w5w40" },
            { id: "0w30", labelKey: "w0w30" },
            { id: "0w20", labelKey: "w0w20" },
            { id: "other", labelKey: "other" },
          ],
        };
      }
      if (screenIdx === offset + 1) {
        return {
          type: "pick",
          key: "oilBrand",
          options: [
            { id: "motul", labelKey: "motul" },
            { id: "liqui", labelKey: "liqui" },
            { id: "castrol", labelKey: "castrol" },
            { id: "shell", labelKey: "shell" },
            { id: "valvoline", labelKey: "valvoline" },
            { id: "other", labelKey: "other" },
          ],
        };
      }
      return null;
    }
    const s = screens[screenIdx];
    if (s) return s;
    return null;
  };

  const screen = phase === "flow" ? currentScreen() : null;
  const oilFlowSteps = serviceId === "oil" ? (oilExtra === "yes" ? 4 : 3) : screens.length;
  const hasFlowSteps = screens.length > 0 || serviceId === "oil";

  const startSelfBooking = () => {
    setScreenIdx(0);
    setSubmitMode("booking");
    setCart([]);
    if (serviceId === "oil") {
      addPriceIdsToCart(["oil_filter"]);
    } else {
      initBaseService();
    }
    setPhase(hasFlowSteps ? "flow" : "contact");
  };

  const nextFlow = () => {
    const max = serviceId === "oil" ? oilFlowSteps : screens.length;
    if (screenIdx + 1 < max) {
      setScreenIdx((i) => i + 1);
      setPicked([]);
      return;
    }
    setPhase("contact");
  };

  const goBack = () => {
    setPicked([]);
    if (phase === "contact") {
      if (isAcBookingService(serviceId)) {
        onClose();
        return;
      }
      if (submitMode === "call") {
        setPhase("manager");
        return;
      }
      const max = serviceId === "oil" ? oilFlowSteps : screens.length;
      if (max > 0) {
        setScreenIdx(max - 1);
        setPhase("flow");
      } else {
        setPhase("manager");
      }
      return;
    }
    if (phase === "flow") {
      if (screenIdx > 0) {
        setScreenIdx((i) => i - 1);
      } else {
        setPhase("manager");
      }
    }
  };

  const goContact = (mode: SubmitMode) => {
    setSubmitMode(mode);
    setPhase("contact");
  };

  const contactValid = isPhoneContactValid(clientPhone);

  const submitCall = async () => {
    if (!contactValid || submitting || submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await createCallRequest({
        phone: clientPhone.trim(),
        clientName: clientFullName,
        serviceId,
        serviceLabel,
        comment: t.bookingQuick.phoneOnlyNote,
      });
      if (!result.ok) {
        setSubmitError(withPhone(bq.callFailed));
        return;
      }
      saveSubmissionSnapshot({
        kind: "call",
        submittedAt: new Date().toISOString(),
        clientPhone: clientPhone.trim(),
        serviceLabel,
      });
      trackLead("call_request", { source: "smart_booking_modal", serviceId });
      onSuccess?.("call");
      onClose();
      router.push(THANK_YOU_PATH);
    } finally {
      setSubmitting(false);
      submitLock.current = false;
    }
  };

  const renderOptionPrice = (opt: FlowOption) => {
    if (opt.id === "oilFilter" && serviceId === "oil") {
      const base = getPriceItem("oil_filter");
      if (base) {
        return (
          <span className="block text-[10px] text-bm-muted font-mono mt-1">
            {bf.includedInOilChange} (
            {unitPriceHint(base, locale)})
          </span>
        );
      }
    }
    const item = getItemForOption(serviceId, opt.id, contentLoc);
    if (!item) return null;
    return (
      <span className="block text-bm-red font-mono text-xs font-bold mt-1">
        {unitPriceHint(item, locale)}
      </span>
    );
  };

  const renderOptions = (sc: FlowScreen) => {
    if (sc.type === "yesno") {
      const base = getPriceItem("oil_filter");
      return (
        <div className="space-y-4">
          {base && serviceId === "oil" && (
            <p className="text-center text-sm text-bm-silver">
              {lbl("oilExtra")}{" "}
              <span className="text-bm-red font-mono font-bold">
                {unitPriceHint(base, locale)}
              </span>
            </p>
          )}
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              className="px-6 py-3 rounded-xl bg-bm-red/20 border border-bm-red font-semibold uppercase text-sm"
              onClick={() => {
                if (serviceId === "oil") setOilExtra("yes");
                nextFlow();
              }}
            >
              {bf.yes}
            </button>
            <button
              type="button"
              className="px-6 py-3 rounded-xl glass border border-bm-border font-semibold uppercase text-sm"
              onClick={() => {
                if (serviceId === "oil") setOilExtra("no");
                nextFlow();
              }}
            >
              {bf.no}
            </button>
          </div>
        </div>
      );
    }
    const multi = sc.type === "multi";
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sc.options.map((opt) => {
            const active = multi ? picked.includes(opt.id) : picked[0] === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  if (multi) {
                    setPicked((p) =>
                      p.includes(opt.id) ? p.filter((x) => x !== opt.id) : [...p, opt.id]
                    );
                  } else setPicked([opt.id]);
                }}
                className={`px-3 py-3 rounded-xl text-left transition-all ${
                  active
                    ? "bg-bm-red/25 border-2 border-bm-red text-white shadow-neon-sm"
                    : "glass border border-bm-border hover:border-bm-red/40"
                }`}
              >
                <span className="text-xs sm:text-sm font-semibold block">
                  {lbl(opt.labelKey)}
                </span>
                {renderOptionPrice(opt)}
              </button>
            );
          })}
        </div>
        {multi && picked.length > 0 && (
          <p className="text-center text-xs text-bm-muted font-mono">
            + {formatPln(
              picked.reduce((sum, id) => {
                const ids = resolvePriceIdsForOption(serviceId, id);
                return (
                  sum +
                  ids.reduce((s, pid) => {
                    const it = getPriceItem(pid);
                    return s + (it ? it.basePrice * defaultQuantity(it) : 0);
                  }, 0)
                );
              }, 0)
            )}
          </p>
        )}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={goBack}>
            <ChevronLeft className="w-4 h-4" />
            {bq.back}
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => {
              setPicked([]);
              nextFlow();
            }}
          >
            {bf.skipExtras}
          </Button>
          <Button
            className="flex-1"
            disabled={!multi && !picked[0]}
            onClick={() => {
              if (multi && picked.length) addOptionsToCart(picked);
              else if (!multi && picked[0]) addOptionsToCart(picked);
              nextFlow();
            }}
          >
            {bf.next}
          </Button>
        </div>
        {multi && (
          <p className="text-xs text-bm-muted text-center mt-3 leading-relaxed">
            {bf.extraServicesHint}
          </p>
        )}
      </>
    );
  };

  const runningTotalBar =
    cart.length > 0 && phase !== "manager" ? (
      <div className="rounded-lg border border-bm-red/30 bg-bm-red/10 px-3 py-2 flex justify-between items-center text-sm">
        <span className="text-bm-muted uppercase text-[10px] tracking-wide">
          {bq.total}
        </span>
        <span className="font-mono font-bold text-bm-red">{formatPln(total)}</span>
      </div>
    ) : null;

  return (
    <div
      data-testid="booking-modal"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
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
        >
          <X size={22} />
        </button>

        <p className="text-xs uppercase text-bm-red tracking-widest mb-1">{serviceLabel}</p>
        {servicePageHref && phase !== "manager" && (
          <Link
            href={servicePageHref}
            onClick={onClose}
            className="inline-flex items-center gap-1 text-[10px] uppercase text-bm-red hover:underline mb-2"
          >
            <ExternalLink size={12} />
            {bf.viewServicePage}
          </Link>
        )}
        <p className="text-[10px] text-bm-muted mb-3">
          {bq.hourlyNote} {HOURLY_RATE_PLN} zł/h
        </p>

        {phase !== "manager" && (
          <BookingStepBack label={bq.back} onClick={goBack} className="mt-1" />
        )}

        <AnimatePresence mode="wait">
          {phase === "manager" && (
            <motion.div
              key="mgr"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 pt-4"
            >
              <h2 className="font-display text-xl font-bold uppercase text-glow text-center">
                {bf.managerTitle}
              </h2>
              {hasWorkVideo ? <BookingWorkVideoTeaser serviceId={serviceId} /> : null}
              <BookingLink
                trackSource="booking_modal"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-bm-red/50 text-bm-red text-xs uppercase tracking-wide hover:bg-bm-red/10"
              >
                <List className="w-4 h-4" />
                {bf.fullPriceList}
              </BookingLink>
              {servicePageHref && (
                <Link
                  href={servicePageHref}
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-bm-border text-bm-silver text-xs uppercase tracking-wide hover:border-bm-red/40 hover:text-white"
                >
                  <ExternalLink className="w-4 h-4" />
                  {bf.viewServicePage}
                </Link>
              )}
              <button
                type="button"
                className="w-full py-4 rounded-xl bg-bm-red/20 border-2 border-bm-red shadow-neon-sm font-display uppercase text-sm flex items-center justify-center gap-2"
                onClick={() => goContact("call")}
              >
                <Phone className="w-5 h-5" />
                {bf.orderCall}
              </button>
              <button
                type="button"
                className="w-full py-4 rounded-xl glass border border-bm-border font-display uppercase text-sm"
                onClick={startSelfBooking}
              >
                {bf.continueSelf}
                <ArrowRight className="inline w-4 h-4 ml-1" />
              </button>
            </motion.div>
          )}

          {phase === "flow" && screen && (
            <motion.div key={`s-${screenIdx}`} className="space-y-4 pt-4">
              <h2 className="font-display text-lg uppercase text-center">
                {lbl(screen.key)}
              </h2>
              {runningTotalBar}
              {renderOptions(screen)}
            </motion.div>
          )}

          {phase === "flow" && !screen && screens.length === 0 && serviceId !== "oil" && (
            <motion.div className="pt-4 space-y-4">
              {runningTotalBar}
              <motion.div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={goBack}>
                  <ChevronLeft className="w-4 h-4" />
                  {bq.back}
                </Button>
                <Button className="flex-1" onClick={() => setPhase("contact")}>
                  {bf.next}
                </Button>
              </motion.div>
            </motion.div>
          )}

          {phase === "contact" && submitMode === "booking" && (
            <motion.div key="contact-booking" className="pt-4">
              <PhoneOnlyBookingForm
                serviceId={serviceId}
                serviceLabel={
                  cart.length > 0
                    ? cart.map((l) => l.label).join(", ")
                    : serviceLabel
                }
                cartLines={cart}
                estimatedTotal={total}
                trackSource="smart_booking_modal"
                onDone={() => {
                  onSuccess?.("booking");
                  onClose();
                }}
              />
            </motion.div>
          )}

          {phase === "contact" && submitMode === "call" && (
            <motion.div key="contact-call" className="space-y-4 pt-4">
              <h2 className="font-display text-lg uppercase text-center">{bf.orderCall}</h2>
              <p className="text-sm text-bm-muted text-center">{t.bookingQuick.phoneOnlySubtitle}</p>
              <div>
                <label className="text-[10px] uppercase text-bm-muted tracking-wide">{bf.yourPhone}</label>
                <input
                  type="tel"
                  className="input-premium w-full mt-1 text-lg"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+48 …"
                />
              </div>
              {submitError && (
                <p className="text-sm text-red-400 text-center">{submitError}</p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={goBack}>
                  <ChevronLeft className="w-4 h-4" />
                  {bq.back}
                </Button>
                <Button
                  className="flex-1"
                  data-fbq-track="Contact"
                  disabled={!contactValid || submitting}
                  onClick={submitCall}
                >
                  {submitting ? bq.submitting : bf.orderCall}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
