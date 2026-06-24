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
} from "@/lib/booking-url";
import { PhoneOnlyBookingForm } from "@/components/booking/PhoneOnlyBookingForm";
import {
  isPhoneContactValid,
  isPhoneOnlyBookingUrl,
  resolveBookingClientName,
} from "@/lib/booking-form-mode";
import { saveSubmissionSnapshot, THANK_YOU_PATH } from "@/lib/submission-thank-you";
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
import type { ServiceId } from "@/lib/services-catalog";

type Phase = "services" | "phone" | "done";

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
  const quickFromAds = isPhoneOnlyBookingUrl(searchParams.toString());

  const [phase, setPhase] = useState<Phase>("services");
  const { t, locale } = useI18n();
  const { clientUser, sessionReady } = useAuth();
  const bq = t.bookingQuote;
  const contentLoc = contentLocale(locale);
  const [category, setCategory] = useState<PriceCategoryId>("maintenance");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [clientFirstName, setClientFirstName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
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
    if (quickFromAds && cart.length > 0) setPhase("phone");
  }, [quickFromAds, cart.length]);

  useEffect(() => {
    if (!sessionReady || !clientUser) return;
    const parts = clientUser.name.trim().split(/\s+/);
    setClientFirstName(parts[0] ?? "");
    setClientLastName(parts.slice(1).join(" "));
    setClientPhone(clientUser.phone);
  }, [sessionReady, clientUser]);

  const clientFullName = resolveBookingClientName(clientPhone, clientUser?.name);

  const contactValid = isPhoneContactValid(clientPhone);

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
                onClick={() => setPhase("phone")}
              >
                {bq.continue}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "phone" && cart.length > 0 && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto glass-red rounded-2xl p-6 sm:p-8"
          >
            <BookingStepBack label={bq.back} onClick={() => setPhase("services")} />
            <PhoneOnlyBookingForm
              serviceId="booking-quote"
              serviceLabel={cart.map((l) => l.label).join(", ")}
              cartLines={cart}
              estimatedTotal={total}
              trackSource="booking_page"
              onDone={() => onDone?.()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {(phase === "services" || phase === "phone") && (
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
                onClick={() => setPhase("phone")}
              >
                {bq.continue}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
