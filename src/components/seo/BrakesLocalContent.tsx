"use client";

import { useI18n } from "@/lib/i18n/context";
import Link from "next/link";
import { BookingLink } from "@/components/analytics/BookingLink";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { siteConfig } from "@/lib/site";
import { getServicePrice, formatServicePricePl, OIL_BRAKE_PROMO_CODE, OIL_BRAKE_PROMO_VALID_UNTIL } from "@/lib/service-prices";
import type { ServicePriceId } from "@/lib/service-prices";

const brakeItems: { id: ServicePriceId; label: string }[] = [
  { id: "brake_pads_front", label: "Klocki przednie" },
  { id: "brake_disc_front", label: "Tarcze i klocki przednie" },
  { id: "brake_pads_rear", label: "Klocki tylne" },
  { id: "brake_disc_rear", label: "Tarcze i klocki tylne" },
];

/** Server-rendered, descriptive local copy for /hamulce. No invented case studies or availability. */
export function BrakesLocalContent() {
  const { locale } = useI18n();
  const tr = (pl: string, ru: string, en: string, uk: string) => ({ pl, ru, en, uk })[locale];
  const localizedLabels: Partial<Record<ServicePriceId, string>> = {
    brake_pads_front: tr("Klocki przednie", "Передние колодки", "Front brake pads", "Передні колодки"),
    brake_disc_front: tr("Tarcze i klocki przednie", "Передние диски и колодки", "Front discs and pads", "Передні диски та колодки"),
    brake_pads_rear: tr("Klocki tylne", "Задние колодки", "Rear brake pads", "Задні колодки"),
    brake_disc_rear: tr("Tarcze i klocki tylne", "Задние диски и колодки", "Rear discs and pads", "Задні диски та колодки"),
  };
  const prices = brakeItems.flatMap(({ id, label }) => {
    const price = getServicePrice(id);
    return price ? [{ id, label: localizedLabels[id] ?? label, value: formatServicePricePl(price), promo: price.promoPrice !== undefined }] : [];
  });
  return (
    <section className="bg-[#0c0e13] pb-20 text-white" aria-labelledby="brakes-local-heading">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-bm-accent">BESS MOTORS • Warszawa Włochy / Okęcie</p>
          <h2 id="brakes-local-heading" className="mt-3 font-display text-2xl font-bold sm:text-3xl">
            {tr("Naprawa i wymiana hamulców w Warszawie — jak wygląda wizyta?", "Ремонт и замена тормозов в Варшаве — как проходит визит?", "Brake repair and replacement in Warsaw — what to expect", "Ремонт і заміна гальм у Варшаві — як проходить візит?")}
          </h2>
          <p className="mt-4 max-w-4xl leading-7 text-bm-copy">
            {tr("W naszym warsztacie przy Alei Krakowskiej 48/52 wykonujemy kontrolę układu hamulcowego, wymianę przednich i tylnych klocków, tarcz oraz płynu hamulcowego. Zgłoś piski, wibracje przy hamowaniu, słabsze działanie hamulców lub komunikat na desce rozdzielczej. Wycena zależy od modelu samochodu, stanu elementów i doboru części.", "В сервисе на Aleja Krakowska 48/52 проверяем тормоза, меняем передние и задние колодки, диски и тормозную жидкость. Сообщите о скрипе, вибрациях, снижении эффективности торможения или предупреждении на панели. Цена зависит от модели, состояния и деталей.", "At Aleja Krakowska 48/52 we inspect brakes and replace front and rear pads, discs and brake fluid. Report squealing, vibration, reduced braking or dashboard warnings. Quotes depend on the model, condition and parts.", "У сервісі на Aleja Krakowska 48/52 перевіряємо гальма, замінюємо передні й задні колодки, диски та гальмівну рідину. Повідомте про скрип, вібрації, зниження ефективності або попередження на панелі. Ціна залежить від моделі, стану та деталей.")}
          </p>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 p-5">
              <h3 className="font-semibold">{tr("1. Ocena stanu hamulców", "1. Проверка тормозов", "1. Brake inspection", "1. Перевірка гальм")}</h3>
              <p className="mt-2 text-sm leading-6 text-bm-copy">{tr("Weryfikujemy objawy i wskazujemy, które elementy wymagają naprawy, a które nadal nadają się do użytkowania.", "Проверяем симптомы и определяем, какие детали требуют ремонта, а какие ещё пригодны.", "We assess symptoms and identify which components need repair and which remain usable.", "Перевіряємо симптоми та визначаємо, які деталі потребують ремонту, а які ще придатні.")}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-5">
              <h3 className="font-semibold">{tr("2. Wycena przed naprawą", "2. Смета до ремонта", "2. Quote before repair", "2. Кошторис до ремонту")}</h3>
              <p className="mt-2 text-sm leading-6 text-bm-copy">{tr("Ustalamy osobno robociznę, części oraz ewentualne dodatkowe czynności. Bez uzgodnienia nie rozszerzamy zakresu prac.", "Отдельно согласовываем работу, детали и дополнительные операции. Не расширяем объём без согласования.", "We quote labour, parts and extra work separately. We do not extend the scope without approval.", "Окремо погоджуємо роботу, деталі та додаткові операції. Не розширюємо обсяг без погодження.")}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-5">
              <h3 className="font-semibold">{tr("3. Wymiana i kontrola", "3. Замена и контроль", "3. Replacement and checks", "3. Заміна та контроль")}</h3>
              <p className="mt-2 text-sm leading-6 text-bm-copy">{tr("Po wymianie sprawdzamy poprawność wykonanych prac zgodnie z wymaganiami danego pojazdu.", "После замены проверяем работу согласно требованиям автомобиля.", "After replacement we check the work against vehicle requirements.", "Після заміни перевіряємо роботу відповідно до вимог автомобіля.")}</p>
            </div>
          </div>
          <h2 className="mt-10 text-xl font-bold">{tr("Ile kosztuje wymiana klocków i tarcz?", "Сколько стоит замена колодок и дисков?", "How much does pad and disc replacement cost?", "Скільки коштує заміна колодок і дисків?")}</h2>
          <p className="mt-3 max-w-4xl leading-7 text-bm-copy">
            {tr("Poniższe stawki dotyczą robocizny na jedną oś w typowym samochodzie osobowym. Części, czujniki zużycia i dodatkowe czynności wyceniamy osobno. Ostateczny koszt potwierdzamy przed rozpoczęciem naprawy.", "Цены указаны за работу на одной оси обычного легкового автомобиля. Детали, датчики износа и дополнительные операции оплачиваются отдельно. Итог согласовываем до ремонта.", "Rates cover labour on one axle of a typical passenger car. Parts, wear sensors and additional work are quoted separately. Final cost is confirmed before repair.", "Ціни вказані за роботу на одній осі звичайного легкового авто. Деталі, датчики зносу та додаткові операції оцінюємо окремо. Остаточну вартість погоджуємо до ремонту.")}
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {prices.map(({ id, label, value, promo }) => (
              <div key={id} className="rounded-xl border border-white/10 p-4">
                <dt className="text-sm text-bm-copy">{label}</dt>
                <dd className="mt-1 text-lg font-bold">{value}</dd>
                {promo ? <p className="mt-1 text-xs text-bm-copy">{tr("Kod", "Код", "Code", "Код")} {OIL_BRAKE_PROMO_CODE}, {tr("do", "до", "until", "до")} {OIL_BRAKE_PROMO_VALID_UNTIL}</p> : null}
              </div>
            ))}
          </dl>
          <h2 className="mt-10 text-xl font-bold">{tr("Kiedy wymienić klocki, a kiedy również tarcze?", "Когда менять колодки, а когда и диски?", "When should pads and discs be replaced?", "Коли міняти колодки, а коли й диски?")}</h2>
          <p className="mt-3 max-w-4xl leading-7 text-bm-copy">
            {tr("Nie ma jednego przebiegu odpowiedniego dla wszystkich samochodów. Decydują pomiar grubości okładziny i tarczy, granica zużycia określona przez producenta, stan powierzchni oraz działanie zacisków. Kontrolę warto wykonać przy komunikacie o zużyciu, piskach lub drganiach przy hamowaniu. Tarcze wymienia się parami na osi; zakres naprawy ustalamy po oględzinach.", "Единого интервала пробега нет. Важны толщина накладок и дисков, пределы износа производителя, состояние поверхности и суппортов. При предупреждении об износе, скрипе или вибрациях нужна проверка. Диски меняют парами на оси; объём определяем после осмотра.", "There is no universal mileage interval. Pad and disc thickness, manufacturer wear limits, surface condition and caliper operation determine replacement. Arrange an inspection for wear warnings, squealing or vibration. Discs are replaced in axle pairs; scope follows inspection.", "Єдиного інтервалу пробігу немає. Важливі товщина накладок і дисків, межі зносу виробника, стан поверхні та супортів. За попередження про знос, скрипу чи вібрацій потрібна перевірка. Диски замінюють парами на осі; обсяг визначаємо після огляду.")}
          </p>
          <h2 className="mt-10 text-xl font-bold">{tr("Czy wymieniacie płyn hamulcowy i czujniki zużycia?", "Меняете тормозную жидкость и датчики износа?", "Do you replace brake fluid and wear sensors?", "Замінюєте гальмівну рідину та датчики зносу?")}</h2>
          <p className="mt-3 max-w-4xl leading-7 text-bm-copy">
            {tr("Tak. Dobieramy płyn według specyfikacji pojazdu i sprawdzamy wymagany przez producenta interwał wymiany. W samochodach z elektronicznym hamulcem postojowym lub czujnikami zużycia zakres obsługi zależy od wyposażenia i procedury serwisowej. Podaj model, rocznik oraz VIN przy zapytaniu o wycenę; części i robociznę potwierdzimy przed wizytą.", "Да. Подбираем жидкость по спецификации автомобиля и проверяем интервал производителя. При электронном ручнике или датчиках износа объём зависит от комплектации и процедуры. Для расчёта сообщите модель, год и VIN; детали и работу согласуем до визита.", "Yes. We select fluid to vehicle specifications and check the manufacturer interval. Electronic parking brakes and wear sensors require equipment-specific procedures. Provide model, year and VIN for a quote; parts and labour are confirmed before the visit.", "Так. Підбираємо рідину за специфікацією авто та перевіряємо інтервал виробника. За електронного ручника чи датчиків зносу обсяг залежить від комплектації та процедури. Для розрахунку повідомте модель, рік і VIN; деталі та роботу погодимо до візиту.")}
          </p>
          <h2 className="mt-10 text-xl font-bold">{tr("Czy można jechać z uszkodzonymi hamulcami?", "Можно ли ехать с неисправными тормозами?", "Can you drive with faulty brakes?", "Чи можна їхати з несправними гальмами?")}</h2>
          <p className="mt-3 max-w-4xl leading-7 text-bm-copy">
            {tr("Jeżeli pedał hamulca zachowuje się nieprawidłowo, pojawia się wyciek płynu lub samochód wyraźnie traci skuteczność hamowania, nie kontynuuj jazdy. Skontaktuj się z warsztatem w celu ustalenia bezpiecznego sposobu dostarczenia pojazdu.", "При неправильной работе педали, утечке жидкости или заметном снижении эффективности торможения не продолжайте движение. Свяжитесь с сервисом для безопасной доставки автомобиля.", "If the pedal behaves abnormally, fluid leaks or braking effectiveness drops noticeably, do not continue driving. Contact the workshop to arrange safe vehicle transport.", "За неправильної роботи педалі, витоку рідини чи помітного зниження ефективності гальмування не продовжуйте рух. Зв’яжіться із сервісом для безпечного доставлення авто.")}
          </p>
          <p className="mt-8 text-sm leading-6 text-bm-copy">
            {tr("BESS MOTORS, Aleja Krakowska 48/52, Warszawa Włochy, okolice Okęcia. Termin wizyty potwierdzamy po kontakcie.", "BESS MOTORS, Aleja Krakowska 48/52, Варшава Włochy, район Okęcie. Время визита подтверждаем после обращения.", "BESS MOTORS, Aleja Krakowska 48/52, Warsaw Włochy, near Okęcie. Appointment times are confirmed after contact.", "BESS MOTORS, Aleja Krakowska 48/52, Варшава Włochy, район Okęcie. Час візиту підтверджуємо після звернення.")}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <BookingLink trackSource="brakes_local" className="bm-btn-primary inline-flex min-h-12 items-center justify-center rounded-lg px-6 font-bold">{tr("Poproś o termin", "Записаться", "Request an appointment", "Записатися")}</BookingLink>
            <PhoneLink trackSource="brakes_local" className="inline-flex min-h-12 items-center rounded-lg border border-white/20 px-6 font-bold">{tr("Zadzwoń:", "Позвонить:", "Call:", "Зателефонувати:")} {siteConfig.phone}</PhoneLink>
            <Link href="/diagnostyka-komputerowa-warszawa" className="inline-flex min-h-12 items-center font-semibold underline underline-offset-4">{tr("Diagnostyka komputerowa samochodu", "Компьютерная диагностика", "Vehicle computer diagnostics", "Комп’ютерна діагностика")}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
