"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, ArrowRight, ChevronLeft, Check, List } from "lucide-react";
import { BookingStepBack } from "@/components/booking/BookingStepBack";
import { useI18n } from "@/lib/i18n/context";
import { contentLocale } from "@/lib/i18n/locale-utils";
import { serviceFlows, type ServiceId, type FlowOption } from "@/lib/services-catalog";
import { formatDateKey } from "@/lib/appointments";
import { timeSlots } from "@/lib/data";
import { createCallRequest, createBookingAppointment } from "@/lib/booking-actions";
import { BookingLink } from "@/components/analytics/BookingLink";
import { useAuth } from "@/lib/auth/session-context";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { Button } from "@/components/ui/Button";
import { BookingTotalSummary } from "@/components/booking/BookingTotalSummary";
import { trackLead } from "@/lib/gtag";
import { useBookingAvailability } from "@/hooks/useBookingAvailability";
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

type Phase = "manager" | "flow" | "date" | "time" | "problem" | "contact" | "done";
type SubmitMode = "call" | "booking";

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
  const { t, locale } = useI18n();
  const bf = t.bookingFlow;
  const bq = t.bookingQuote;
  const contentLoc = contentLocale(locale);
  const serviceLabel =
    t.serviceItems[serviceId as keyof typeof t.serviceItems] ?? serviceId;
  const screens = useMemo(() => buildScreens(serviceId), [serviceId]);
  const isOtherReason = serviceId === "otherReason";
  const { clientUser, sessionReady } = useAuth();

  const [phase, setPhase] = useState<Phase>("manager");
  const [submitMode, setSubmitMode] = useState<SubmitMode>("booking");
  const [screenIdx, setScreenIdx] = useState(0);
  const [oilExtra, setOilExtra] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [problem, setProblem] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientPlate, setClientPlate] = useState("");
  const [doneKind, setDoneKind] = useState<"call" | "booking">("booking");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [syncPending, setSyncPending] = useState(false);
  const { isSlotAvailable, loading: slotsLoading } = useBookingAvailability(14);

  useEffect(() => {
    if (!sessionReady || !clientUser) return;
    setClientName(clientUser.name);
    setClientPhone(clientUser.phone);
  }, [sessionReady, clientUser]);

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

  const startSelfBooking = () => {
    setScreenIdx(0);
    setSubmitMode("booking");
    setCart([]);
    if (serviceId === "oil") {
      addPriceIdsToCart(["oil_filter"]);
    } else {
      initBaseService();
    }
    setPhase(screens.length || serviceId === "oil" ? "flow" : "date");
  };

  const nextFlow = () => {
    const max = serviceId === "oil" ? oilFlowSteps : screens.length;
    if (screenIdx + 1 < max) {
      setScreenIdx((i) => i + 1);
      setPicked([]);
      return;
    }
    setPhase("date");
  };

  const goBack = () => {
    setPicked([]);
    if (phase === "contact") {
      setPhase(submitMode === "call" ? "manager" : "problem");
      return;
    }
    if (phase === "problem") {
      setPhase("time");
      return;
    }
    if (phase === "time") {
      setPhase("date");
      return;
    }
    if (phase === "date") {
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

  const contactValid =
    clientName.trim().length >= 2 &&
    clientPhone.trim().length >= 9 &&
    clientPlate.replace(/\s/g, "").length >= 2;

  const problemValid = !isOtherReason || problem.trim().length >= 3;

  const submitCall = async () => {
    if (!contactValid || submitting) return;
    setSubmitting(true);
    await createCallRequest({
      phone: clientPhone.trim(),
      clientName: clientName.trim(),
      serviceId,
      serviceLabel,
      comment: problem,
    });
    setSubmitting(false);
    trackLead("call_request", { source: "smart_booking_modal", serviceId });
    setDoneKind("call");
    setPhase("done");
    onSuccess?.("call");
  };

  const submitBooking = async () => {
    if (!contactValid || submitting) return;
    const dateStr = date ? formatDateKey(date) : "";
    if (!dateStr || !time) return;
    if (slotsLoading) {
      setSubmitError(bq.slotsLoading);
      return;
    }
    if (!isSlotAvailable(dateStr, time)) {
      setSubmitError(bq.slotTaken);
      return;
    }
    const breakdown = cart
      .map((l) => `${l.label}: ${l.isFree ? bq.free : formatPln(l.lineTotal)}`)
      .join("; ");
    const comment = [
      cart.length ? `[${bq.grandTotal}: ${formatPln(total)}]` : "",
      breakdown,
      hasFrom ? bq.fromWarningShort : "",
      problem.trim() ? `${bf.describeProblem}: ${problem.trim()}` : "",
      `${bq.hourlyNote} ${HOURLY_RATE_PLN} zł/h`,
    ]
      .filter(Boolean)
      .join(" | ");

    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await createBookingAppointment({
        serviceId,
        serviceIds: cart.length
          ? cart.map((l) => l.itemId)
          : [serviceId],
        date: date ? formatDateKey(date) : "",
        time,
        comment,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientPlate: clientPlate.trim(),
        estimatedTotal: total,
        cartLines: cart.map((l) => ({
          itemId: l.itemId,
          label: l.label,
          lineTotal: l.lineTotal,
          priceFrom: l.priceFrom,
        })),
      });
      if (!result.ok) {
        setSubmitError(bq.submitFailed);
        return;
      }
      trackLead("booking", { source: "smart_booking_modal", serviceId });
      setSyncPending(!result.cloudOk);
      setDoneKind("booking");
      setPhase("done");
      onSuccess?.("booking");
    } finally {
      setSubmitting(false);
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
            className="flex-1"
            disabled={multi ? picked.length === 0 : !picked[0]}
            onClick={() => {
              if (multi) addOptionsToCart(picked);
              else if (picked[0]) addOptionsToCart(picked);
              nextFlow();
            }}
          >
            {bf.next}
          </Button>
        </div>
      </>
    );
  };

  const runningTotalBar =
    cart.length > 0 && phase !== "done" && phase !== "manager" ? (
      <div className="rounded-lg border border-bm-red/30 bg-bm-red/10 px-3 py-2 flex justify-between items-center text-sm">
        <span className="text-bm-muted uppercase text-[10px] tracking-wide">
          {bq.total}
        </span>
        <span className="font-mono font-bold text-bm-red">{formatPln(total)}</span>
      </div>
    ) : null;

  const contactFields = (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] uppercase text-bm-muted tracking-wide">{bf.yourName}</label>
        <input
          type="text"
          className="input-premium w-full mt-1"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          autoComplete="name"
        />
      </div>
      <div>
        <label className="text-[10px] uppercase text-bm-muted tracking-wide">{bf.yourPhone}</label>
        <input
          type="tel"
          className="input-premium w-full mt-1"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
          autoComplete="tel"
        />
      </div>
      <div>
        <label className="text-[10px] uppercase text-bm-muted tracking-wide">
          {t.cabinet.registrationPlate}
        </label>
        <input
          type="text"
          className="input-premium w-full mt-1 font-mono uppercase"
          value={clientPlate}
          onChange={(e) => setClientPlate(e.target.value)}
          autoComplete="off"
          placeholder="WA 12345"
        />
        <p className="text-[10px] text-bm-muted mt-1">{t.auth.plateHint}</p>
      </div>
    </div>
  );

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
        <p className="text-[10px] text-bm-muted mb-3">
          {bq.hourlyNote} {HOURLY_RATE_PLN} zł/h
        </p>

        {phase !== "manager" && phase !== "done" && (
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
              <BookingLink
                trackSource="booking_modal"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-bm-red/50 text-bm-red text-xs uppercase tracking-wide hover:bg-bm-red/10"
              >
                <List className="w-4 h-4" />
                {bf.fullPriceList}
              </BookingLink>
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
                <Button className="flex-1" onClick={() => setPhase("date")}>
                  {bf.next}
                </Button>
              </motion.div>
            </motion.div>
          )}

          {phase === "date" && (
            <motion.div key="date" className="space-y-4 pt-4">
              <h2 className="font-display text-lg uppercase text-center">{t.booking.selectDate}</h2>
              {runningTotalBar}
              <BookingCalendar selected={date} onSelect={setDate} locale={locale} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={goBack}>
                  <ChevronLeft className="w-4 h-4" />
                  {bq.back}
                </Button>
                <Button className="flex-1" disabled={!date} onClick={() => setPhase("time")}>
                  {bf.next}
                </Button>
              </div>
            </motion.div>
          )}

          {phase === "time" && (
            <motion.div key="time" className="space-y-4 pt-4">
              <h2 className="font-display text-lg uppercase text-center">{t.booking.selectTime}</h2>
              {runningTotalBar}
              <div className="flex flex-wrap gap-2 justify-center">
                {timeSlots.map((slot) => {
                  const dateStr = date ? formatDateKey(date) : "";
                  const available = dateStr ? isSlotAvailable(dateStr, slot) : true;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={!available}
                      onClick={() => available && setTime(slot)}
                      className={`px-3 py-2 rounded-lg text-sm font-mono ${
                        !available
                          ? "opacity-30 cursor-not-allowed line-through"
                          : time === slot
                            ? "bg-bm-red shadow-neon-sm"
                            : "glass"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={goBack}>
                  <ChevronLeft className="w-4 h-4" />
                  {bq.back}
                </Button>
                <Button className="flex-1" disabled={!time} onClick={() => setPhase("problem")}>
                  {bf.next}
                </Button>
              </div>
            </motion.div>
          )}

          {phase === "problem" && (
            <motion.div key="prob" className="space-y-4 pt-4">
              <h2 className="font-display text-lg uppercase text-center">
                {isOtherReason ? bf.otherReasonDescribe : bf.describeProblem}
              </h2>
              {runningTotalBar}
              <textarea
                className="input-premium w-full min-h-[100px]"
                placeholder={
                  isOtherReason ? bf.otherReasonPlaceholder : bf.problemPlaceholder
                }
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={goBack}>
                  <ChevronLeft className="w-4 h-4" />
                  {bq.back}
                </Button>
                <Button
                  className="flex-1"
                  disabled={!problemValid}
                  onClick={() => goContact("booking")}
                >
                  {bf.next}
                </Button>
              </div>
            </motion.div>
          )}

          {phase === "contact" && (
            <motion.div key="contact" className="space-y-4 pt-4">
              <h2 className="font-display text-lg uppercase text-center">{bf.contactTitle}</h2>
              <BookingTotalSummary
                lines={cart}
                title={bq.finalTotalTitle}
                grandLabel={bq.grandTotal}
                fromWarning={bq.fromWarning}
              />
              {contactFields}
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
                  data-fbq-track={submitMode === "call" ? "Contact" : "Lead"}
                  disabled={
                    !contactValid ||
                    submitting ||
                    (submitMode === "booking" && !problemValid)
                  }
                  onClick={submitMode === "call" ? submitCall : submitBooking}
                >
                  {submitting
                    ? bq.submitting
                    : submitMode === "call"
                      ? bf.orderCall
                      : bq.submit}
                </Button>
              </div>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div key="done" className="text-center py-8 space-y-4">
              <Check className="w-14 h-14 text-bm-red mx-auto" />
              <p className="font-display text-xl uppercase text-glow">
                {doneKind === "call" ? bf.callSuccess : t.booking.success}
              </p>
              {syncPending && doneKind === "booking" && (
                <p className="text-sm text-amber-400">{t.thankYou.syncPending}</p>
              )}
              {cart.length > 0 && (
                <p className="text-sm text-bm-muted">
                  {bq.grandTotal}: <span className="text-bm-red font-mono">{formatPln(total)}</span>
                </p>
              )}
              <Button variant="outline" className="w-full" onClick={onClose}>
                OK
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
