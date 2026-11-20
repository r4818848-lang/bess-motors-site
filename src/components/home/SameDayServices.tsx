"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CircleDot, Disc3, Droplets, MonitorCog, Snowflake, Wrench, Smartphone, Lightbulb, Sparkles, ShieldCheck, Star } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { TIRE_AUDI_Q5_SRC } from "@/lib/tire-media";

const content = {
  pl: {
    eyebrow: "NASZE USŁUGI", all: "Wszystkie usługi",
    oil: "Wymiana oleju", oilDesc: "Olej i filtry silnikowe",
    tires: "Wymiana opon", tiresDesc: "Z wyważaniem kół",
    diagnostics: "Diagnostyka", diagnosticsDesc: "Komputerowa i mechaniczna",
    brakes: "Serwis hamulców", brakesDesc: "Tarcze, klocki, płyn",
    ac: "Klimatyzacja", acDesc: "Serwis i napełnianie",
    suspension: "Zawieszenie", suspensionDesc: "Diagnostyka i naprawa",
    universal: "Uniwersalne LED", universalDesc: "Podświetlenie wnętrza auta",
    ambient: "Ambient Light", ambientDesc: "Deska, drzwi i konsola",
    soundproof: "Wygłuszenie auta", soundproofDesc: "Drzwi, podłoga i bagażnik",
    carplay: "Apple CarPlay / Android Auto", carplayDesc: "Integracja telefonu z ekranem auta",
    starSky: "Gwiezdne niebo", starSkyDesc: "Światłowodowa podsufitka starlight",
    note: "Zakres i koszt prac uzgadniamy przed naprawą.",
  },
  ru: {
    eyebrow: "НАШИ УСЛУГИ", all: "Все услуги",
    oil: "Замена масла", oilDesc: "Масло и фильтры",
    tires: "Шиномонтаж", tiresDesc: "С балансировкой колёс",
    diagnostics: "Диагностика", diagnosticsDesc: "Компьютерная и техническая",
    brakes: "Тормозная система", brakesDesc: "Диски, колодки, жидкость",
    ac: "Кондиционер", acDesc: "Обслуживание и заправка",
    suspension: "Подвеска", suspensionDesc: "Диагностика и ремонт",
    universal: "Универсальная LED-подсветка", universalDesc: "Подсветка салона автомобиля",
    ambient: "Ambient Light", ambientDesc: "Панель, двери и консоль",
    soundproof: "Шумоизоляция авто", soundproofDesc: "Двери, пол и багажник",
    carplay: "Apple CarPlay / Android Auto", carplayDesc: "Подключение телефона к экрану",
    starSky: "Звёздное небо", starSkyDesc: "Оптоволоконная подсветка потолка",
    note: "Стоимость и объём работ согласуем до ремонта.",
  },
  uk: {
    eyebrow: "НАШІ ПОСЛУГИ", all: "Усі послуги",
    oil: "Заміна оливи", oilDesc: "Олива й фільтри",
    tires: "Шиномонтаж", tiresDesc: "З балансуванням коліс",
    diagnostics: "Діагностика", diagnosticsDesc: "Комп'ютерна й технічна",
    brakes: "Гальмівна система", brakesDesc: "Диски, колодки, рідина",
    ac: "Кондиціонер", acDesc: "Сервіс і заправка",
    suspension: "Підвіска", suspensionDesc: "Діагностика та ремонт",
    universal: "Універсальна LED-підсвітка", universalDesc: "Освітлення салону авто",
    ambient: "Ambient Light", ambientDesc: "Панель, двері та консоль",
    soundproof: "Шумоізоляція авто", soundproofDesc: "Двері, підлога та багажник",
    carplay: "Apple CarPlay / Android Auto", carplayDesc: "Підключення телефона до екрана",
    starSky: "Зоряне небо", starSkyDesc: "Світловолоконна підсвітка стелі",
    note: "Вартість та обсяг робіт погоджуємо до ремонту.",
  },
  en: {
    eyebrow: "OUR SERVICES", all: "All services",
    oil: "Oil change", oilDesc: "Engine oil and filters",
    tires: "Tyre service", tiresDesc: "Wheel balancing",
    diagnostics: "Diagnostics", diagnosticsDesc: "Computer and mechanical",
    brakes: "Brake service", brakesDesc: "Discs, pads and fluid",
    ac: "Air conditioning", acDesc: "Service and recharge",
    suspension: "Suspension", suspensionDesc: "Diagnostics and repairs",
    universal: "Universal LED lighting", universalDesc: "Custom interior illumination",
    ambient: "Ambient Light", ambientDesc: "Dashboard, doors and console",
    soundproof: "Car soundproofing", soundproofDesc: "Doors, floor and boot",
    carplay: "Apple CarPlay / Android Auto", carplayDesc: "Phone integration with car display",
    starSky: "Starlight headliner", starSkyDesc: "Fiber-optic starry car ceiling",
    note: "We agree on the scope and price before work begins.",
  },
} as const;

/** All card imagery is from actual BESS MOTORS service work in /public. */
export function SameDayServices() {
  const { locale } = useI18n();
  const c = content[locale];
  const services = [
    { title: c.oil, description: c.oilDesc, href: "/wymiana-oleju", image: "/images/works/oil-change-drain.png", icon: Droplets, alt: "Wymiana oleju w BESS MOTORS" },
    { title: c.tires, description: c.tiresDesc, href: "/wymiana-opon-warszawa", image: TIRE_AUDI_Q5_SRC, icon: CircleDot, alt: "Wymiana opon Audi Q5 w BESS MOTORS" },
    { title: c.diagnostics, description: c.diagnosticsDesc, href: "/diagnostyka-komputerowa-warszawa", image: "/images/workshop/lift-bay.png", icon: MonitorCog, alt: "Stanowisko warsztatowe BESS MOTORS" },
    { title: c.brakes, description: c.brakesDesc, href: "/hamulce", image: "/images/works/brake-pads-change.png", icon: Disc3, alt: "Serwis hamulców w BESS MOTORS" },
    { title: c.ac, description: c.acDesc, href: "/klimatyzacja", image: "/images/works/ac-recharge-bmw.png", icon: Snowflake, alt: "Serwis klimatyzacji w BESS MOTORS" },
    { title: c.suspension, description: c.suspensionDesc, href: "/naprawa-zawieszenia-warszawa", image: "/images/works/before-after/audi-a6-suspension/after/01.jpg", icon: Wrench, alt: "Naprawa zawieszenia Audi A6 w BESS MOTORS" },
    { title: c.universal, description: c.universalDesc, href: "/oswietlenie-ambientowe-samochodu-warszawa", image: "/images/enhancements/ambient/ambient-15.webp", icon: Lightbulb, alt: "Uniwersalna podświetlenie LED wnętrza samochodu" },
    { title: c.ambient, description: c.ambientDesc, href: "/oswietlenie-ambientowe-samochodu-warszawa", image: "/images/enhancements/ambient/ambient-08.webp", icon: Sparkles, alt: "Oświetlenie ambientowe deski i drzwi samochodu" },
    { title: c.soundproof, description: c.soundproofDesc, href: "/wygluszenie-samochodu-warszawa", image: "/images/enhancements/soundproofing/wyciszenie-02.webp", icon: ShieldCheck, alt: "Wygłuszenie drzwi samochodu matami akustycznymi" },
    { title: c.carplay, description: c.carplayDesc, href: "/montaz-apple-carplay-warszawa", image: "/images/enhancements/carplay/bmw-android-auto-cockpit.jpg", icon: Smartphone, alt: "BMW z Android Auto, Google Maps na ekranie i fabrycznym systemem multimedialnym" },
    { title: c.starSky, description: c.starSkyDesc, href: "/gwiezdne-niebo-w-samochodzie-warszawa", image: "/images/enhancements/star-headliner/gwiezdne-niebo-gotowy-efekt.jpg", icon: Star, alt: "Światłowodowe gwiezdne niebo na czarnej podsufitce samochodu" },
  ] as const;

  return (
    <section
      className="relative border-t border-white/10 bg-[#0c1016] pb-12 pt-9 sm:pb-16 sm:pt-14"
      aria-labelledby="popular-services-heading"
      data-testid="homepage-services"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-7">
          <div>
            <h2 id="popular-services-heading" className="flex items-center gap-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-bm-copy">
              <span className="h-[2px] w-8 bg-bm-red" aria-hidden />{c.eyebrow}
            </h2>
          </div>
          <Link href="/services" className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-white underline decoration-bm-red/50 underline-offset-4 hover:text-bm-accent sm:text-sm">
            {c.all}<ArrowRight size={16} aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3" data-testid="services-visual-grid">
          {services.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bm-premium-card group relative flex min-h-[151px] flex-col justify-between overflow-hidden rounded-[18px] border border-white/20 bg-[#161b23] p-3.5 text-white shadow-[0_15px_35px_rgba(0,0,0,.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bm-accent sm:min-h-[165px] sm:rounded-[22px] sm:p-5"
              data-testid="visual-service-card"
            >
              <div className="pointer-events-none absolute inset-y-0 right-0 w-[68%] opacity-50 transition-opacity duration-300 group-hover:opacity-75" aria-hidden>
                <Image
                  src={item.image}
                  alt=""
                  fill
                  quality={75}
                  loading="lazy"
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 40vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#11151d] via-[#11151d]/90 to-[#11151d]/40" aria-hidden />
              <div className="relative z-10 flex items-start justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-bm-accent/30 bg-black/40 text-bm-accent sm:h-11 sm:w-11">
                  <item.icon size={22} aria-hidden />
                </span>
                <ArrowRight size={17} className="mt-1 shrink-0 text-white/80 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
              </div>
              <div className="relative z-10 mt-4 max-w-[90%]">
                <h3 className="font-display text-[16px] font-bold leading-[1.1] tracking-tight text-white sm:text-xl">{item.title}</h3>
                <p className="mt-1 text-[11px] leading-snug text-bm-copy sm:text-sm">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-4 text-xs text-bm-label">{c.note}</p>
      </div>
    </section>
  );
}
