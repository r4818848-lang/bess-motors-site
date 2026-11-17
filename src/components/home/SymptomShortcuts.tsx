"use client";

import Link from "next/link";
import { Activity, ArrowUpRight, CircleAlert, Disc, Droplets, Gauge, Snowflake, Wrench } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

const symptoms = [
  { href: "/diagnostyka-zawieszenia-warszawa", icon: Wrench, text: { pl: "Coś stuka", ru: "Что-то стучит", uk: "Щось стукає", en: "Knocking noise" } },
  { href: "/check-engine", icon: CircleAlert, text: { pl: "Świeci kontrolka", ru: "Горит индикатор", uk: "Горить індикатор", en: "Warning light" } },
  { href: "/hamulce", icon: Disc, text: { pl: "Auto słabo hamuje", ru: "Плохо тормозит", uk: "Погано гальмує", en: "Weak brakes" } },
  { href: "/klimatyzacja", icon: Snowflake, text: { pl: "Klima nie chłodzi", ru: "Не холодит кондиционер", uk: "Не охолоджує клімат", en: "A/C not cooling" } },
  { href: "/diagnostyka-silnika-warszawa", icon: Activity, text: { pl: "Silnik pracuje nierówno", ru: "Неровная работа мотора", uk: "Двигун працює нерівно", en: "Rough idle" } },
  { href: "/wymiana-oleju", icon: Droplets, text: { pl: "Czas na wymianę oleju", ru: "Пора менять масло", uk: "Час міняти оливу", en: "Oil service due" } },
  { href: "/wymiana-opon-warszawa", icon: Gauge, text: { pl: "Chcę zmienić opony", ru: "Нужна замена шин", uk: "Треба змінити шини", en: "Change tyres" } },
] as const;
const heading = {
  pl: ["Nie znasz nazwy naprawy?", "Wybierz objaw. Pokażemy odpowiednią usługę — to nie jest diagnoza samochodu."],
  ru: ["Не знаете, что сломалось?", "Выберите симптом, чтобы найти нужную услугу. Это не диагностика автомобиля."],
  uk: ["Не знаєте, що зламалося?", "Оберіть симптом, щоб знайти послугу. Це не діагностика автомобіля."],
  en: ["Not sure what needs fixing?", "Choose a symptom to find the right service. This isn't a vehicle diagnosis."],
} as const;

export function SymptomShortcuts() {
  const { locale } = useI18n();
  return (
    <section id="objawy" className="scroll-mt-20 border-t border-white/10 bg-[#0d1016] py-12 sm:py-16" aria-labelledby="symptom-shortcuts-heading">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff7772]">BESS MOTORS / DIAGNOSTYKA</p>
          <h2 id="symptom-shortcuts-heading" className="mt-3 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{heading[locale][0]}</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/60 sm:text-base">{heading[locale][1]}</p>
        </div>
        <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {symptoms.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="group flex min-h-[82px] items-center gap-3 rounded-2xl border border-white/[0.10] bg-[#191d25] px-4 py-3 text-white transition-all hover:border-bm-red/50 hover:bg-[#242832]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bm-red/10 text-[#ff716d]"><item.icon size={19} aria-hidden /></span>
                <span className="flex-1 text-sm font-semibold leading-snug">{item.text[locale]}</span>
                <ArrowUpRight size={17} className="shrink-0 text-white/35 group-hover:text-white" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
