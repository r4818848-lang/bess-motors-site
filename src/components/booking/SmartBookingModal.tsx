"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, ArrowRight, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { serviceFlows, type ServiceId, type FlowOption } from "@/lib/services-catalog";
import { timeSlots } from "@/lib/data";
import { createCallRequest, createBookingAppointment } from "@/lib/booking-actions";
import { loadDb } from "@/lib/store";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { Button } from "@/components/ui/Button";

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
  const serviceLabel =
    t.serviceItems[serviceId as keyof typeof t.serviceItems] ?? serviceId;
  const screens = useMemo(() => buildScreens(serviceId), [serviceId]);
  const isOtherReason = serviceId === "otherReason";

  const loggedIn = useMemo(() => {
    if (typeof window === "undefined") return { name: "", phone: "" };
    const db = loadDb();
    const u = db.users.find((x) => x.id === db.currentUserId && x.role === "client");
    return { name: u?.name ?? "", phone: u?.phone ?? "" };
  }, []);

  const [phase, setPhase] = useState<Phase>("manager");
  const [submitMode, setSubmitMode] = useState<SubmitMode>("booking");
  const [screenIdx, setScreenIdx] = useState(0);
  const [oilExtra, setOilExtra] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [extras, setExtras] = useState<string[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [problem, setProblem] = useState("");
  const [clientName, setClientName] = useState(loggedIn.name);
  const [clientPhone, setClientPhone] = useState(loggedIn.phone);
  const [doneKind, setDoneKind] = useState<"call" | "booking">("booking");

  const lbl = (key: string) => {
    const flow = bf as Record<string, string>;
    const items = t.serviceItems as Record<string, string>;
    return flow[key] ?? items[key] ?? key;
  };

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

  const nextFlow = () => {
    const max = serviceId === "oil" ? oilFlowSteps : screens.length;
    if (screenIdx + 1 < max) {
      setScreenIdx((i) => i + 1);
      setPicked([]);
      return;
    }
    setPhase("date");
  };

  const goContact = (mode: SubmitMode) => {
    setSubmitMode(mode);
    setPhase("contact");
  };

  const contactValid =
    clientName.trim().length >= 2 && clientPhone.trim().length >= 9;

  const problemValid = !isOtherReason || problem.trim().length >= 3;

  const submitCall = () => {
    if (!contactValid) return;
    createCallRequest({
      phone: clientPhone.trim(),
      clientName: clientName.trim(),
      serviceId,
      serviceLabel,
      comment: problem,
    });
    setDoneKind("call");
    setPhase("done");
    onSuccess?.("call");
  };

  const submitBooking = () => {
    if (!contactValid) return;
    const comment = [
      extras.length ? extras.join(", ") : "",
      picked.length ? picked.join(", ") : "",
      problem,
    ]
      .filter(Boolean)
      .join(" | ");
    createBookingAppointment({
      serviceId,
      serviceIds: [serviceId, ...extras, ...picked],
      date: date?.toISOString().slice(0, 10) ?? "",
      time,
      comment,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
    });
    setDoneKind("booking");
    setPhase("done");
    onSuccess?.("booking");
  };

  const renderOptions = (sc: FlowScreen) => {
    if (sc.type === "yesno") {
      return (
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
      );
    }
    const multi = sc.type === "multi";
    return (
      <>
        <div className="flex flex-wrap gap-2 justify-center">
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
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm transition-all ${
                  active
                    ? "bg-bm-red text-white shadow-neon-sm"
                    : "glass border border-bm-border hover:border-bm-red/40"
                }`}
              >
                {lbl(opt.labelKey)}
              </button>
            );
          })}
        </div>
        <Button
          className="w-full mt-4"
          disabled={multi ? picked.length === 0 : !picked[0]}
          onClick={() => {
            setExtras((e) => [...e, ...picked]);
            nextFlow();
          }}
        >
          {bf.next}
        </Button>
      </>
    );
  };

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
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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

        <AnimatePresence mode="wait">
          {phase === "manager" && (
            <motion.div
              key="mgr"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pt-4"
            >
              <h2 className="font-display text-xl font-bold uppercase text-glow text-center">
                {bf.managerTitle}
              </h2>
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
                onClick={() => {
                  setScreenIdx(0);
                  setSubmitMode("booking");
                  setPhase(
                    screens.length || serviceId === "oil" ? "flow" : "date"
                  );
                }}
              >
                {bf.continueSelf}
                <ArrowRight className="inline w-4 h-4 ml-1" />
              </button>
            </motion.div>
          )}

          {phase === "flow" && screen && (
            <motion.div key={`s-${screenIdx}`} className="space-y-5 pt-4">
              <h2 className="font-display text-lg uppercase text-center">
                {lbl(screen.key)}
              </h2>
              {renderOptions(screen)}
            </motion.div>
          )}

          {phase === "flow" && !screen && screens.length === 0 && serviceId !== "oil" && (
            <motion.div className="pt-4">
              <Button className="w-full" onClick={() => setPhase("date")}>
                {bf.next}
              </Button>
            </motion.div>
          )}

          {phase === "date" && (
            <motion.div key="date" className="space-y-4 pt-4">
              <h2 className="font-display text-lg uppercase text-center">{t.booking.selectDate}</h2>
              <BookingCalendar selected={date} onSelect={setDate} locale={locale} />
              <Button className="w-full" disabled={!date} onClick={() => setPhase("time")}>
                {bf.next}
              </Button>
            </motion.div>
          )}

          {phase === "time" && (
            <motion.div key="time" className="space-y-4 pt-4">
              <h2 className="font-display text-lg uppercase text-center">{t.booking.selectTime}</h2>
              <div className="flex flex-wrap gap-2 justify-center">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTime(slot)}
                    className={`px-3 py-2 rounded-lg text-sm font-mono ${
                      time === slot ? "bg-bm-red shadow-neon-sm" : "glass"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              <Button className="w-full" disabled={!time} onClick={() => setPhase("problem")}>
                {bf.next}
              </Button>
            </motion.div>
          )}

          {phase === "problem" && (
            <motion.div key="prob" className="space-y-4 pt-4">
              <h2 className="font-display text-lg uppercase text-center">
                {isOtherReason ? bf.otherReasonDescribe : bf.describeProblem}
              </h2>
              <textarea
                className="input-premium w-full min-h-[100px]"
                placeholder={
                  isOtherReason ? bf.otherReasonPlaceholder : bf.problemPlaceholder
                }
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
              />
              <Button
                className="w-full"
                disabled={!problemValid}
                onClick={() => goContact("booking")}
              >
                {bf.next}
              </Button>
            </motion.div>
          )}

          {phase === "contact" && (
            <motion.div key="contact" className="space-y-4 pt-4">
              <h2 className="font-display text-lg uppercase text-center">{bf.contactTitle}</h2>
              {contactFields}
              <Button
                className="w-full"
                disabled={!contactValid}
                onClick={submitMode === "call" ? submitCall : submitBooking}
              >
                {submitMode === "call" ? bf.orderCall : t.booking.confirm}
              </Button>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div key="done" className="text-center py-8 space-y-4">
              <Check className="w-14 h-14 text-bm-red mx-auto" />
              <p className="font-display text-xl uppercase text-glow">
                {doneKind === "call" ? bf.callSuccess : t.booking.success}
              </p>
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
