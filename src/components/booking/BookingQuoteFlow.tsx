"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { trackMetaAddToCart } from "@/lib/meta-pixel";
import { useAuth } from "@/lib/auth/session-context";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { timeSlots } from "@/lib/data";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/lib/site";

type Phase = "services" | "datetime" | "confirm" | "done";

function itemName(item: PriceListItem, locale: string): string {
  return locale === "ru" ? item.nameRu : item.namePl;
}

function ServiceCard({
  item,
  locale,
  labels,
  inCart,
  onAdd,
}: {
  item: PriceListItem;
  locale: string;
  labels: Record<string, string>;
  inCart: boolean;
  onAdd: (qty: number) => void;
}) {
  const [qty, setQty] = useState(defaultQuantity(item));
  const needsQty =
    item.unit === "per_cylinder" ||
    item.unit === "per_wheel" ||
    item.unit === "per_100g";
  const loc = locale === "ru" ? "ru" : "pl";

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
            {itemName(item, locale)}
          </p>
          <p className="text-bm-red font-mono text-sm mt-1 font-bold">
            {unitPriceHint(item, loc)}
          </p>
        </div>
        <button
          type="button"
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
  locale: string;
  labels: Record<string, string>;
  onRemove: (id: string) => void;
  onQtyChange: (id: string, qty: number) => void;
  sticky?: boolean;
}) {
  const total = cartSubtotal(lines);
  const hasFrom = cartHasFromPrices(lines);
  const loc = locale === "ru" ? "ru" : "pl";

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
            const qLabel = item ? quantityLabel(item, line.quantity, loc) : "";
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
  const { t, locale } = useI18n();
  const { clientUser, sessionReady } = useAuth();
  const bq = t.bookingQuote;
  const loc = locale === "ru" || locale === "uk" ? "ru" : "pl";

  const [phase, setPhase] = useState<Phase>("services");
  const [category, setCategory] = useState<PriceCategoryId>("maintenance");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  useEffect(() => {
    if (!sessionReady || !clientUser) return;
    setClientName(clientUser.name);
    setClientPhone(clientUser.phone);
  }, [sessionReady, clientUser]);

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
    const line = buildCartLine(item, itemName(item, loc), qty);
    setCart((prev) => {
      const without = prev.filter((l) => l.itemId !== item.id);
      return [...without, line];
    });
  };

  const cartIds = new Set(cart.map((l) => l.itemId));
  const total = cartSubtotal(cart);
  const hasFrom = cartHasFromPrices(cart);

  const contactValid =
    clientName.trim().length >= 2 && clientPhone.trim().length >= 9;

  const submit = () => {
    if (!contactValid || cart.length === 0 || !date || !time) return;
    const breakdown = cart
      .map(
        (l) =>
          `${l.label}: ${l.isFree ? labels.free : formatPln(l.lineTotal)}`
      )
      .join("; ");
    const comment = [
      `[KOSZT SZACUNKOWY: ${formatPln(total)}]`,
      breakdown,
      hasFrom ? bq.fromWarningShort : "",
      note.trim() ? `Uwagi: ${note.trim()}` : "",
      `${bq.hourlyNote} ${HOURLY_RATE_PLN} zł/h`,
    ]
      .filter(Boolean)
      .join(" | ");

    createBookingAppointment({
      serviceId: "booking-quote",
      serviceIds: cart.map((l) => l.itemId),
      date: date.toISOString().slice(0, 10),
      time,
      comment,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      estimatedTotal: total,
      cartLines: cart.map((l) => ({
        itemId: l.itemId,
        label: l.label,
        lineTotal: l.lineTotal,
        priceFrom: l.priceFrom,
      })),
    });
    onDone?.();
    router.replace("/booking/thank-you");
  };

  return (
    <div className="pb-32 lg:pb-8">
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
                    {loc === "ru" ? cat.nameRu : cat.namePl}
                  </button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {itemsByCategory(category).map((item) => (
                  <ServiceCard
                    key={item.id}
                    item={item}
                    locale={loc}
                    labels={labels}
                    inCart={cartIds.has(item.id)}
                    onAdd={(qty) => addItem(item, qty)}
                  />
                ))}
              </div>
            </div>
            <div className="hidden lg:block">
              <CartPanel
                lines={cart}
                locale={loc}
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
                disabled={cart.length === 0}
                onClick={() => {
                  trackMetaAddToCart("booking_cart");
                  setPhase("datetime");
                }}
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
            <CartPanel
              lines={cart}
              locale={loc}
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
            <h2 className="font-display text-lg uppercase text-center">
              {t.booking.selectDate}
            </h2>
            <BookingCalendar selected={date} onSelect={setDate} locale={locale} />
            {date && (
              <>
                <h2 className="font-display text-lg uppercase text-center">
                  {t.booking.selectTime}
                </h2>
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
            </div>

            <div className="space-y-3">
              <label className="text-[10px] uppercase text-bm-muted">{bq.yourName}</label>
              <input
                type="text"
                className="input-premium w-full"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
              <label className="text-[10px] uppercase text-bm-muted">{bq.yourPhone}</label>
              <input
                type="tel"
                className="input-premium w-full"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
              <label className="text-[10px] uppercase text-bm-muted">{bq.note}</label>
              <textarea
                className="input-premium w-full min-h-[80px]"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={bq.notePlaceholder}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setPhase("datetime")}>
                <ChevronLeft className="w-4 h-4" />
                {bq.back}
              </Button>
              <Button className="flex-1" disabled={!contactValid} onClick={submit}>
                {bq.submit}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "services" && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-red border-t border-bm-red/40 p-3 shadow-[0_-8px_32px_rgba(0,0,0,0.85)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase text-bm-muted tracking-wide">
                {labels.cartTitle} ({cart.length})
              </p>
              <p className="font-display text-xl font-bold text-bm-red font-mono">
                {formatPln(total)}
              </p>
            </div>
            <Button
              className="shrink-0"
              disabled={cart.length === 0}
              onClick={() => setPhase("datetime")}
            >
              {bq.continue}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
