"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  Minus,
} from "lucide-react";
import { BookingStepBack } from "@/components/booking/BookingStepBack";
import { useI18n } from "@/lib/i18n/context";
import { contentLocale, pickName } from "@/lib/i18n/locale-utils";
import type { Locale } from "@/lib/i18n/types";
import {
  priceCategories,
  priceListItems,
  HOURLY_RATE_PLN,
  itemsByCategory,
  type PriceCategoryId,
  type PriceListItem,
} from "@/lib/price-list";
import {
  buildCartLine,
  cartSubtotal,
  cartHasFromPrices,
  defaultQuantity,
  formatPln,
  quantityLabel,
  unitPriceHint,
  type CartLine,
} from "@/lib/booking-cart";
import { createBookingAppointment } from "@/lib/booking-actions";
import { trackMetaCustomizeProduct } from "@/lib/meta-pixel";
import { useAuth } from "@/lib/auth/session-context";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { formatDateKey } from "@/lib/appointments";
import { formatDisplayDateKey } from "@/lib/display-date";
import { timeSlots } from "@/lib/data";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/lib/site";
import { CarProblemWizard } from "@/components/booking/CarProblemWizard";
import { BookingAvailability } from "@/components/booking/BookingAvailability";
import { BookingVinLookup } from "@/components/booking/BookingVinLookup";
import {
  parseBookingParamsFromSearch,
  saveLastBooking,
} from "@/lib/booking-url";
import { getServicePackage } from "@/lib/service-packages";
import { WaitTimeEstimator } from "@/components/booking/WaitTimeEstimator";
import { useBookingAvailability } from "@/hooks/useBookingAvailability";

const WORKSHOP_PHONE = "+48 791 257 229";

function withPhone(template: string): string {
  return template.replace("{phone}", WORKSHOP_PHONE);
}
import {
  applyPromoDiscount,
  getPromoRules,
  matchPromoCode,
} from "@/lib/promo-codes";

type Phase = "services" | "datetime" | "confirm" | "done";

function ServiceCard({
  item,
  locale,
  labels,
  inCart,
  onAdd,
}: {
  item: PriceListItem;
  locale: Locale;
  labels: Record<string, string>;
  inCart: boolean;
  onAdd: (qty: number) => void;
}) {
  const [qty, setQty] = useState(defaultQuantity(item));
  const needsQty =
    item.unit === "per_cylinder" ||
    item.unit === "per_wheel" ||
    item.unit === "per_100g";

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        inCart
          ? "border-bm-red/70 bg-bm-red/10 shadow-[0_0_16px_rgba(225,6,0,0.2)]"
          : "border-bm-border/60 bg-bm-card/60 hover:border-bm-red/40"
      }`}
    >
      <div className="flex justify-between gap-3 items-start">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white leading-snug">
            {pickName(item, locale)}
          </p>
          <p className="text-bm-red font-mono text-sm mt-1 font-bold">
            {unitPriceHint(item, locale)}
          </p>
        </div>
        <button
          type="button"
          data-fbq-track="AddToCart"
          onClick={() => onAdd(qty)}
          className="shrink-0 w-9 h-9 rounded-full border border-bm-red/60 flex items-center justify-center text-bm-red hover:bg-bm-red/20 transition-colors"
          title={labels.addService}
        >
          <Plus size={18} />
        </button>
      </div>
      {needsQty && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] uppercase text-bm-muted tracking-wide">
            {labels.quantity}:
          </span>
          <button
            type="button"
            className="w-8 h-8 rounded-lg border border-bm-border flex items-center justify-center"
            onClick={() =>
              setQty((q) => Math.max(item.minQty ?? 1, q - 1))
            }
          >
            <Minus size={14} />
          </button>
          <span className="font-mono text-sm w-8 text-center">{qty}</span>
          <button
            type="button"
            className="w-8 h-8 rounded-lg border border-bm-border flex items-center justify-center"
            onClick={() =>
              setQty((q) => Math.min(item.maxQty ?? 99, q + 1))
            }
          >
            <Plus size={14} />
          </button>
          <span className="text-xs text-bm-muted">
            = {formatPln(item.basePrice * qty)}
          </span>
        </div>
      )}
      {inCart && (
        <p className="text-[10px] text-emerald-400 mt-2 uppercase tracking-wide">
          ✓ {labels.inCart}
        </p>
      )}
    </div>
  );
}

function CartPanel({
  lines,
  locale,
  labels,
  onRemove,
  onQtyChange,
  sticky,
}: {
  lines: CartLine[];
  locale: Locale;
  labels: Record<string, string>;
  onRemove: (id: string) => void;
  onQtyChange: (id: string, qty: number) => void;
  sticky?: boolean;
}) {
  const total = cartSubtotal(lines);
  const hasFrom = cartHasFromPrices(lines);

  const inner = (
    <>
      <div className="flex items-center gap-2 mb-3">
        <ShoppingCart className="w-5 h-5 text-bm-red" />
        <h3 className="font-display text-sm uppercase tracking-wide">
          {labels.cartTitle}
        </h3>
        <span className="ml-auto text-xs text-bm-muted">{lines.length}</span>
      </div>
      {lines.length === 0 ? (
        <p className="text-sm text-bm-muted py-6 text-center">{labels.cartEmpty}</p>
      ) : (
        <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {lines.map((line) => {
            const item = priceListItems.find((i) => i.id === line.itemId);
            const qLabel = item ? quantityLabel(item, line.quantity, locale) : "";
            return (
              <li
                key={line.id}
                className="rounded-lg border border-bm-border/50 bg-bm-black/40 px-3 py-2 text-sm"
              >
                <div className="flex justify-between gap-2">
                  <span className="text-white font-medium leading-tight">
                    {line.label}
                    {qLabel ? (
                      <span className="text-bm-muted font-normal"> ({qLabel})</span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(line.id)}
                    className="text-bm-muted hover:text-bm-red shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-1">
                  {item &&
                  (item.unit === "per_cylinder" ||
                    item.unit === "per_wheel" ||
                    item.unit === "per_100g") ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="w-6 h-6 rounded border border-bm-border text-xs"
                        onClick={() =>
                          onQtyChange(line.id, line.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <span className="font-mono text-xs w-6 text-center">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        className="w-6 h-6 rounded border border-bm-border text-xs"
                        onClick={() =>
                          onQtyChange(line.id, line.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <span />
                  )}
                  <span className="font-mono text-bm-red font-bold">
                    {line.isFree ? labels.free : formatPln(line.lineTotal)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-4 pt-3 border-t border-bm-red/30">
        <div className="flex justify-between items-baseline">
          <span className="text-xs uppercase tracking-widest text-bm-muted">
            {labels.total}
          </span>
          <span className="font-display text-2xl font-bold text-bm-red font-mono">
            {formatPln(total)}
          </span>
        </div>
        {hasFrom && (
          <p className="text-[10px] text-amber-400/90 mt-2 flex gap-1 items-start">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
            {labels.fromWarning}
          </p>
        )}
      </div>
    </>
  );

  if (sticky) {
    return null;
  }

  return (
    <div className="glass-red rounded-2xl p-5 neon-border h-fit sticky top-28">
      {inner}
    </div>
  );
}

interface Props {
  onDone?: () => void;
}

export function BookingQuoteFlow({ onDone }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();
  const { clientUser, sessionReady } = useAuth();
  const bq = t.bookingQuote;
  const contentLoc = contentLocale(locale);

  const [phase, setPhase] = useState<Phase>("services");
  const [category, setCategory] = useState<PriceCategoryId>("maintenance");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [clientFirstName, setClientFirstName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [vehicleNote, setVehicleNote] = useState("");
  const [clientPlate, setClientPlate] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState<ReturnType<typeof matchPromoCode>>(null);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [activePackageId, setActivePackageId] = useState<string | undefined>();
  const submitLock = useRef(false);
  const { isSlotAvailable, loading: slotsLoading, availabilityError } = useBookingAvailability();

  const onSelectDate = useCallback((d: Date | null) => {
    setDate(d);
    setTime("");
    if (d) trackMetaCustomizeProduct("booking_date");
  }, []);

  const prefillFromUrl = useCallback(() => {
    const { items: ids, plate, packageId } = parseBookingParamsFromSearch(
      searchParams.toString()
    );
    setActivePackageId(packageId);
    if (plate) {
      setVehicleNote(plate);
      setClientPlate(plate);
    }
    if (!ids.length) return;
    const lines: CartLine[] = [];
    for (const id of ids) {
      const item = priceListItems.find((i) => i.id === id);
      if (!item) continue;
      lines.push(buildCartLine(item, pickName(item, locale), defaultQuantity(item)));
    }
    if (lines.length) setCart(lines);
  }, [searchParams, locale]);

  useEffect(() => {
    prefillFromUrl();
  }, [prefillFromUrl]);

  useEffect(() => {
    if (!sessionReady || !clientUser) return;
    const parts = clientUser.name.trim().split(/\s+/);
    setClientFirstName(parts[0] ?? "");
    setClientLastName(parts.slice(1).join(" "));
    setClientPhone(clientUser.phone);
  }, [sessionReady, clientUser]);

  const clientFullName = `${clientFirstName.trim()} ${clientLastName.trim()}`.trim();

  const labels: Record<string, string> = {
    addService: bq.addService,
    quantity: bq.quantity,
    inCart: bq.inCart,
    cartTitle: bq.cartTitle,
    cartEmpty: bq.cartEmpty,
    total: bq.total,
    free: bq.free,
    fromWarning: bq.fromWarning,
  };

  const addItem = (item: PriceListItem, qty: number) => {
    const line = buildCartLine(item, pickName(item, locale), qty);
    setCart((prev) => {
      const without = prev.filter((l) => l.itemId !== item.id);
      return [...without, line];
    });
  };

  const cartIds = new Set(cart.map((l) => l.itemId));
  const subtotal = cartSubtotal(cart);
  const activePackage = activePackageId ? getServicePackage(activePackageId) : undefined;
  const packageMatchesCart =
    !!activePackage &&
    activePackage.priceItemIds.length > 0 &&
    activePackage.priceItemIds.every((id) => cartIds.has(id)) &&
    cart.every((line) => activePackage.priceItemIds.includes(line.itemId));
  const packageDiscount =
    packageMatchesCart && activePackage
      ? Math.max(0, subtotal - activePackage.packagePricePln)
      : 0;
  const afterPackage = subtotal - packageDiscount;
  const total = promoApplied ? applyPromoDiscount(afterPackage, promoApplied) : afterPackage;
  const hasFrom = cartHasFromPrices(cart);
  const hasPromos = getPromoRules().length > 0;

  const contactValid =
    clientFirstName.trim().length >= 2 &&
    clientLastName.trim().length >= 2 &&
    clientPhone.trim().length >= 9;

  useEffect(() => {
    if (phase === "done" || clientPhone.trim().length < 9) return;
    const t = setTimeout(() => {
      void fetch("/api/booking/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: clientPhone.trim(),
          name: clientFullName,
          step: phase,
          serviceSummary: cart.map((l) => l.label).join(", ").slice(0, 200),
          date: date ? formatDateKey(date) : undefined,
          time,
        }),
      });
    }, 2000);
    return () => clearTimeout(t);
  }, [phase, clientPhone, clientFullName, cart, date, time]);

  const submit = async () => {
    if (!contactValid || cart.length === 0 || !date || !time || submitting || submitLock.current) return;
    const dateStr = formatDateKey(date);
    if (availabilityError) {
      setSubmitError(bq.availabilityError);
      return;
    }
    if (slotsLoading) {
      setSubmitError(bq.slotsLoading);
      return;
    }
    if (!isSlotAvailable(dateStr, time)) {
      setSubmitError(bq.slotTaken);
      return;
    }
    const breakdown = cart
      .map(
        (l) =>
          `${l.label}: ${l.isFree ? labels.free : formatPln(l.lineTotal)}`
      )
      .join("; ");
    const comment = [
      `[KOSZT SZACUNKOWY: ${formatPln(total)}]`,
      promoApplied ? `Promo: ${promoApplied.code} (-${promoApplied.percentOff}%)` : "",
      packageMatchesCart && activePackage
        ? `Pakiet: ${contentLoc === "ru" ? activePackage.nameRu : activePackage.namePl} (${formatPln(activePackage.packagePricePln)})`
        : "",
      vehicleNote.trim() ? `Auto: ${vehicleNote.trim()}` : "",
      breakdown,
      hasFrom ? bq.fromWarningShort : "",
      note.trim() ? `Uwagi: ${note.trim()}` : "",
      `${bq.hourlyNote} ${HOURLY_RATE_PLN} zł/h`,
    ]
      .filter(Boolean)
      .join(" | ");

    saveLastBooking({
      date: formatDateKey(date),
      time,
      clientName: clientFullName,
      estimatedTotal: total,
      serviceLabels: cart.map((l) => l.label).join(", "),
      serviceIds: cart.map((l) => l.itemId),
    });

    setSubmitting(true);
    setSubmitError("");
    submitLock.current = true;
    try {
      const result = await createBookingAppointment({
        serviceId: "booking-quote",
        serviceIds: cart.map((l) => l.itemId),
        date: formatDateKey(date),
        time,
        comment,
        clientName: clientFullName,
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
        if (result.error === "slot_taken") {
          setSubmitError(bq.slotTaken);
        } else {
          setSubmitError(withPhone(bq.cloudSyncFailed));
        }
        return;
      }
      onDone?.();
      router.replace("/booking/thank-you");
    } finally {
      setSubmitting(false);
      submitLock.current = false;
    }
  };

  return (
    <div className="pb-52 lg:pb-8">
      <p className="text-center text-sm text-bm-muted mb-2">{siteConfig.workingHours}</p>
      <p className="text-center text-xs text-bm-muted/80 mb-6 max-w-xl mx-auto">
        {bq.hourlyNote} <strong className="text-bm-red">{HOURLY_RATE_PLN} zł/h</strong>
      </p>

      <AnimatePresence mode="wait">
        {phase === "services" && (
          <motion.div
            key="svc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid lg:grid-cols-[1fr_320px] gap-8"
          >
            <div>
              <BookingVinLookup
                onDecoded={(info) => {
                  const label = [info.make, info.model, info.year].filter(Boolean).join(" ");
                  setVehicleNote(label);
                  if (note.trim()) return;
                  setNote(label);
                }}
              />
              <div className="flex flex-wrap gap-2 mb-6">
                {priceCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-2 rounded-full text-[11px] font-bold uppercase tracking-wide border transition-all ${
                      category === cat.id
                        ? "bg-bm-red/20 border-bm-red text-bm-red shadow-neon-sm"
                        : "border-bm-border text-bm-muted hover:text-white"
                    }`}
                  >
                    {contentLoc === "ru" ? cat.nameRu : cat.namePl}
                  </button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {itemsByCategory(category).map((item) => (
                  <ServiceCard
                    key={item.id}
                    item={item}
                    locale={locale}
                    labels={labels}
                    inCart={cartIds.has(item.id)}
                    onAdd={(qty) => addItem(item, qty)}
                  />
                ))}
              </div>
              {cart.length > 0 && (
                <div className="lg:hidden mt-6">
                  <CartPanel
                    lines={cart}
                    locale={locale}
                    labels={labels}
                    onRemove={(id) => setCart((c) => c.filter((l) => l.id !== id))}
                    onQtyChange={(id, qty) =>
                      setCart((c) =>
                        c.map((l) => {
                          if (l.id !== id) return l;
                          const item = priceListItems.find((i) => i.id === l.itemId);
                          if (!item) return l;
                          return buildCartLine(
                            item,
                            l.label.split(" (")[0],
                            qty
                          );
                        })
                      )
                    }
                  />
                </div>
              )}
              <div className="mt-8">
                <CarProblemWizard
                  onApply={(lines, cat) => {
                    setCart((prev) => {
                      const map = new Map(prev.map((l) => [l.itemId, l]));
                      for (const line of lines) map.set(line.itemId, line);
                      return [...map.values()];
                    });
                    setCategory(cat);
                  }}
                />
                <p className="text-xs text-bm-muted mt-3 leading-relaxed">
                  {t.carWizard.helpHint}
                </p>
              </div>
            </div>
            <div className="hidden lg:block">
              <CartPanel
                lines={cart}
                locale={locale}
                labels={labels}
                onRemove={(id) => setCart((c) => c.filter((l) => l.id !== id))}
                onQtyChange={(id, qty) =>
                  setCart((c) =>
                    c.map((l) => {
                      if (l.id !== id) return l;
                      const item = priceListItems.find((i) => i.id === l.itemId);
                      if (!item) return l;
                      return buildCartLine(
                        item,
                        l.label.split(" (")[0],
                        qty
                      );
                    })
                  )
                }
              />
              <Button
                className="w-full mt-4"
                data-fbq-track="InitiateCheckout"
                disabled={cart.length === 0}
                onClick={() => setPhase("datetime")}
              >
                {bq.continue}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "datetime" && (
          <motion.div
            key="dt"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-lg mx-auto space-y-6"
          >
            <BookingStepBack label={bq.back} onClick={() => setPhase("services")} />
            <div className="lg:sticky lg:top-24">
              <CartPanel
              lines={cart}
              locale={locale}
              labels={labels}
              onRemove={(id) => setCart((c) => c.filter((l) => l.id !== id))}
              onQtyChange={(id, qty) =>
                setCart((c) =>
                  c.map((l) => {
                    if (l.id !== id) return l;
                    const item = priceListItems.find((i) => i.id === l.itemId);
                    if (!item) return l;
                    return buildCartLine(item, l.label.split(" (")[0], qty);
                  })
                )
              }
            />
            </div>
            <BookingAvailability
              onPick={(d, tm) => {
                setDate(new Date(d + "T12:00:00"));
                setTime(tm);
              }}
            />
            <div className="max-w-xl mx-auto">
              <WaitTimeEstimator serviceId={cart[0]?.itemId} />
            </div>
            <h2 className="font-display text-lg uppercase text-center">
              {t.booking.selectDate}
            </h2>
            <BookingCalendar
              selected={date}
              onSelect={onSelectDate}
              locale={locale}
            />
            {date && (
              <>
                <h2 className="font-display text-lg uppercase text-center">
                  {t.booking.selectTime}
                </h2>
                <div className="flex flex-wrap gap-2 justify-center">
                  {timeSlots.map((slot) => {
                    const dateStr = formatDateKey(date);
                    const available = isSlotAvailable(dateStr, slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={!available}
                        onClick={() => {
                          if (!available) return;
                          setTime(slot);
                          trackMetaCustomizeProduct("booking_time");
                        }}
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
              </>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setPhase("services")}>
                <ChevronLeft className="w-4 h-4" />
                {bq.back}
              </Button>
              <Button
                className="flex-1"
                disabled={!date || !time}
                onClick={() => setPhase("confirm")}
              >
                {bq.continue}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "confirm" && (
          <motion.div
            key="cf"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-xl mx-auto space-y-6"
          >
            <BookingStepBack label={bq.back} onClick={() => setPhase("datetime")} />
            {cart.length > 0 && (
              <div className="lg:hidden">
                <CartPanel
                  lines={cart}
                  locale={locale}
                  labels={labels}
                  onRemove={(id) => setCart((c) => c.filter((l) => l.id !== id))}
                  onQtyChange={(id, qty) =>
                    setCart((c) =>
                      c.map((l) => {
                        if (l.id !== id) return l;
                        const item = priceListItems.find((i) => i.id === l.itemId);
                        if (!item) return l;
                        return buildCartLine(item, l.label.split(" (")[0], qty);
                      })
                    )
                  }
                />
              </div>
            )}
            {date && time && (
              <div className="rounded-xl border border-bm-red/30 bg-bm-red/10 px-4 py-3 text-center">
                <p className="text-[10px] uppercase text-bm-muted tracking-wide">
                  {bq.visitDateTime}
                </p>
                <p className="font-display text-lg text-white mt-1">
                  {formatDisplayDateKey(formatDateKey(date))}{" "}
                  · {time}
                </p>
              </div>
            )}
            <div className="glass-red rounded-2xl p-6 neon-border border-2 border-bm-red/40">
              <h2 className="font-display text-xl uppercase text-center text-glow mb-4">
                {bq.finalTotalTitle}
              </h2>
              <ul className="space-y-2 mb-4">
                {cart.map((line) => (
                  <li
                    key={line.id}
                    className="flex justify-between text-sm border-b border-bm-border/30 pb-2"
                  >
                    <span className="text-bm-silver pr-4">{line.label}</span>
                    <span className="font-mono text-bm-red font-semibold shrink-0">
                      {line.isFree ? labels.free : formatPln(line.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between items-baseline pt-2">
                <span className="font-display uppercase tracking-widest text-sm">
                  {bq.grandTotal}
                </span>
                <span className="font-display text-3xl font-black text-bm-red font-mono">
                  {formatPln(total)}
                </span>
              </div>
              {hasFrom && (
                <p className="text-xs text-amber-400/90 mt-4 flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {labels.fromWarning}
                </p>
              )}
              {packageDiscount > 0 && activePackage && (
                <p className="text-xs text-green-400 mt-2">
                  {t.servicePackages.packagePrice}: −{formatPln(packageDiscount)} (
                  {contentLoc === "ru" ? activePackage.nameRu : activePackage.namePl}
                  )
                </p>
              )}
              {promoApplied && afterPackage > total && (
                <p className="text-xs text-green-400 mt-2">
                  {t.bookingPromo.applied}: −{promoApplied.percentOff}% (
                  {formatPln(afterPackage - total)})
                </p>
              )}
            </div>

            {hasPromos && (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  className="input-premium flex-1 uppercase"
                  placeholder={t.bookingPromo.placeholder}
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const matched = matchPromoCode(promoInput);
                    if (!matched) {
                      setPromoError(t.bookingPromo.invalid);
                      setPromoApplied(null);
                      return;
                    }
                    setPromoError("");
                    setPromoApplied(matched);
                  }}
                >
                  {t.bookingPromo.apply}
                </Button>
                {promoError && <p className="text-xs text-red-400">{promoError}</p>}
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] uppercase text-bm-muted">{bq.firstName}</label>
              <input
                type="text"
                className="input-premium w-full"
                value={clientFirstName}
                onChange={(e) => setClientFirstName(e.target.value)}
                autoComplete="given-name"
              />
              <label className="text-[10px] uppercase text-bm-muted">{bq.lastName}</label>
              <input
                type="text"
                className="input-premium w-full"
                value={clientLastName}
                onChange={(e) => setClientLastName(e.target.value)}
                autoComplete="family-name"
              />
              <label className="text-[10px] uppercase text-bm-muted">{bq.yourPhone}</label>
              <input
                type="tel"
                className="input-premium w-full"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                autoComplete="tel"
              />
              <label className="text-[10px] uppercase text-bm-muted">
                {t.cabinet.registrationPlate} (opcjonalnie)
              </label>
              <input
                type="text"
                className="input-premium w-full font-mono uppercase"
                value={clientPlate}
                onChange={(e) => setClientPlate(e.target.value)}
                placeholder="WA 12345"
              />
              <p className="text-[10px] text-bm-muted">{t.auth.plateHint}</p>
              <label className="text-[10px] uppercase text-bm-muted">{bq.note}</label>
              <textarea
                className="input-premium w-full min-h-[80px]"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={bq.notePlaceholder}
              />
            </div>

            {submitError && (
              <p className="text-sm text-red-400 text-center">{submitError}</p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setPhase("datetime")}>
                <ChevronLeft className="w-4 h-4" />
                {bq.back}
              </Button>
              <Button
                className="flex-1 hidden lg:flex"
                data-fbq-track="Lead"
                disabled={!contactValid || submitting}
                onClick={submit}
              >
                {submitting ? bq.submitting : bq.submit}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(phase === "services" || phase === "datetime" || phase === "confirm") && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] glass-red border-t border-bm-red/40 shadow-[0_-8px_32px_rgba(0,0,0,0.85)] safe-area-pb">
          {cart.length > 0 && (
            <div className="max-h-44 overflow-y-auto border-b border-bm-border/40 px-3 py-2 space-y-1">
              {cart.map((line) => (
                <div key={line.id} className="flex justify-between text-xs gap-2">
                  <span className="text-bm-silver truncate">{line.label}</span>
                  <span className="font-mono text-bm-red shrink-0">
                    {line.isFree ? labels.free : formatPln(line.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase text-bm-muted tracking-wide">
                {labels.cartTitle} ({cart.length})
              </p>
              <p className="font-display text-xl font-bold text-bm-red font-mono">
                {formatPln(total)}
              </p>
            </div>
            {phase === "services" ? (
              <Button
                className="shrink-0"
                data-fbq-track="InitiateCheckout"
                disabled={cart.length === 0}
                onClick={() => setPhase("datetime")}
              >
                {bq.continue}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : phase === "datetime" ? (
              <Button
                className="shrink-0"
                disabled={!date || !time}
                onClick={() => setPhase("confirm")}
              >
                {bq.continue}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                className="shrink-0"
                data-fbq-track="Lead"
                disabled={!contactValid || submitting}
                onClick={submit}
              >
                {submitting ? bq.submitting : bq.submit}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
