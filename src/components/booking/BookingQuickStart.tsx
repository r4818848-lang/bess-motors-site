"use client";

import { ArrowRight, CalendarCheck2, CircleHelp, Disc, Droplets, Gauge } from "lucide-react";
import { BookingLink } from "@/components/analytics/BookingLink";
import { useI18n } from "@/lib/i18n/context";
import { buildBookingUrl } from "@/lib/booking-url";
import { OIL_CHANGE_PROMO_BOOKING_ITEMS } from "@/lib/oil-brake-promo";
import { TIRE_AD_LANDING_PATH } from "@/lib/tire-media";

const copy = {
  pl: { eyebrow: "Szybszy start", heading: "Wiesz już, czego potrzebujesz?", intro: "Wybierz usługę. Jeśli nie masz pewności, skorzystaj z pełnego formularza niżej.", oil: "Olej i filtr", brakes: "Hamulce", tires: "Wymiana opon", diagnostic: "Diagnostyka", action: "Wybierz", detail: "Ostateczny koszt i zakres prac potwierdzamy przed wizytą." },
  ru: { eyebrow: "Быстрый выбор", heading: "Уже знаете, какая нужна услуга?", intro: "Выберите работу. Если не уверены — воспользуйтесь полным списком ниже.", oil: "Масло и фильтр", brakes: "Тормоза", tires: "Шиномонтаж", diagnostic: "Диагностика", action: "Выбрать", detail: "Итоговую стоимость и объём работ согласуем до визита." },
  uk: { eyebrow: "Швидкий вибір", heading: "Вже знаєте, яка послуга потрібна?", intro: "Оберіть роботу або скористайтеся повним переліком нижче.", oil: "Олива та фільтр", brakes: "Гальма", tires: "Шиномонтаж", diagnostic: "Діагностика", action: "Обрати", detail: "Кінцеву вартість і перелік робіт погоджуємо до візиту." },
  en: { eyebrow: "Quick start", heading: "Know what your car needs?", intro: "Choose a service or use the full selection below if you are unsure.", oil: "Oil and filter", brakes: "Brakes", tires: "Tyres", diagnostic: "Diagnostics", action: "Choose", detail: "We confirm the final price and scope before the visit." },
} as const;

export function BookingQuickStart() {
  const { locale } = useI18n();
  const ui = copy[locale];
  const choices = [
    { label: ui.oil, icon: Droplets, href: buildBookingUrl([...OIL_CHANGE_PROMO_BOOKING_ITEMS]) + "#wybor-uslug", tag: "oil" },
    { label: ui.brakes, icon: Disc, href: buildBookingUrl(["brake_pads_front"]) + "#wybor-uslug", tag: "brakes" },
    { label: ui.tires, icon: Gauge, href: TIRE_AD_LANDING_PATH + "#zapis-opony", tag: "tires" },
    { label: ui.diagnostic, icon: CircleHelp, href: buildBookingUrl(["computer_diag"]) + "#wybor-uslug", tag: "diagnostics" },
  ];
  return (
    <section className="mb-8 rounded-[26px] border border-white/10 bg-gradient-to-br from-[#1b2029] to-[#12161d] p-5 sm:p-7" aria-labelledby="booking-quick-heading" data-testid="booking-quick-start">
      <p className="text-xs font-bold uppercase tracking-[0.17em] text-bm-accent">{ui.eyebrow}</p>
      <h2 id="booking-quick-heading" className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">{ui.heading}</h2>
      <p className="mt-2 text-sm leading-relaxed text-bm-label">{ui.intro}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {choices.map((item) => (
          <BookingLink
            key={item.tag}
            href={item.href}
            trackSource={"booking_quick_" + item.tag}
            className="bm-premium-card flex min-h-[114px] flex-col justify-between rounded-2xl border border-white/15 bg-white/[0.045] p-4 text-white hover:border-bm-red/60 hover:bg-bm-red/10"
          >
            <span className="flex items-center justify-between"><item.icon size={22} className="text-bm-accent" aria-hidden /><ArrowRight size={17} className="text-bm-label" aria-hidden /></span>
            <span className="text-sm font-bold leading-tight sm:text-base">{item.label}</span>
          </BookingLink>
        ))}
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-bm-label"><CalendarCheck2 size={15} className="text-bm-accent" aria-hidden />{ui.detail}</p>
    </section>
  );
}
