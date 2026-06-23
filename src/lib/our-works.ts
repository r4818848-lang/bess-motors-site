import type { ServiceId } from "@/lib/services-catalog";

export type OurWorkVideo = {
  id: string;
  serviceIds: ServiceId[];
  videoSrc: string;
  posterSrc: string;
  title: { pl: string; ru: string; en: string };
  description: { pl: string; ru: string; en: string };
  instagramShortcode?: string;
  instagramUrl?: string;
};

export const OUR_WORK_VIDEOS: OurWorkVideo[] = [
  {
    id: "valve-adjustment",
    serviceIds: ["engine"],
    videoSrc: "/videos/works/valve-adjustment.mov",
    posterSrc: "/images/works/valve-adjustment-cover.png",
    title: {
      pl: "Regulacja zaworów",
      ru: "Регулировка клапанов",
      en: "Valve adjustment",
    },
    description: {
      pl: `Regulacja zaworów to jedna z najważniejszych procedur serwisowych silnika.

Nieprawidłowe luz zaworów może powodować utratę mocy, większe zużycie paliwa, nierówną pracę silnika i kosztowny remont w przyszłości.

W tym samochodzie wykonujemy precyzyjną regulację zaworów według parametrów producenta — silnik pracuje cicho, równo i wydajnie.

✅ Pomiar i ustawienie luzów zaworowych
✅ Kontrola pracy silnika po regulacji
✅ Serwis według specyfikacji producenta

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Zapisz się wcześniej i dbaj o silnik na lata! 🔧`,
      ru: `Регулировка клапанов — одна из самых важных процедур обслуживания двигателя.

Неправильные зазоры клапанов могут вызывать потерю мощности, повышенный расход топлива, нестабильную работу двигателя и дорогостоящий ремонт в будущем.

В этом автомобиле выполняем точную регулировку клапанов по заводским параметрам, чтобы двигатель работал тихо, ровно и эффективно.

✅ Измерение и настройка зазоров клапанов
✅ Контроль работы двигателя после регулировки
✅ Обслуживание по спецификации производителя

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Запишитесь заранее и берегите двигатель на годы! 🔧`,
      en: `Valve adjustment is one of the most important engine maintenance procedures.

Incorrect valve clearances can cause power loss, higher fuel consumption, rough running and expensive repairs later.

On this car we perform precise valve adjustment to factory specs so the engine runs quietly, smoothly and efficiently.

✅ Valve clearance measurement and setup
✅ Engine run check after adjustment
✅ Service to manufacturer specification

📍 BESS MOTORS
Aleja Krakowska 48/52, Warsaw
📞 +48 791 257 229

Book ahead and keep your engine healthy for years! 🔧`,
    },
    instagramShortcode: "DZpIslgqM7J",
    instagramUrl:
      "https://www.instagram.com/reel/DZpIslgqM7J/?utm_source=ig_web_copy_link",
  },
  {
    id: "exhaust-muffler",
    serviceIds: ["exhaust"],
    videoSrc: "/videos/works/exhaust-muffler.mov",
    posterSrc: "/images/works/exhaust-muffler-cover.png",
    title: {
      pl: "Spawanie tłumika",
      ru: "Замена глушителя",
      en: "Muffler repair",
    },
    description: {
      pl: `Kolejny zadowolony klient wyjechał od nas bez zbędnego hałasu!

Tym razem usunęliśmy problem z układem wydechowym i przespawaliśmy tłumik. Teraz wszystko jest szczelne, niezawodne i działa jak należy.

✅ Spawanie tłumików
✅ Naprawa układu wydechowego
✅ Wymiana giętkiej rury (gofry)
✅ Usunięcie niepożądanych dźwięków
✅ Szybka naprawa w dniu zgłoszenia

Jeśli auto stało się głośniejsze, pojawił się nieprzyjemny dźwięk lub przepalił się tłumik — nie odkładaj naprawy.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Przywrócimy ciszę Twojemu samochodowi! 🔧🚗`,
      ru: `Ещё один довольный клиент уехал от нас без лишнего шума!

В этот раз устранили проблему с выхлопной системой и переварили глушитель. Теперь всё герметично, надёжно и работает как должно.

✅ Сварка глушителей
✅ Ремонт выхлопной системы
✅ Замена гофры
✅ Устранение посторонних шумов
✅ Быстрый ремонт в день обращения

Если ваш автомобиль стал громче работать, появился неприятный звук или прогорел глушитель — не откладывайте ремонт.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Вернём тишину вашему автомобилю! 🔧🚗`,
      en: `Another happy customer left us without extra noise!

This time we fixed the exhaust system and welded the muffler. Everything is sealed, reliable and working as it should.

✅ Muffler welding
✅ Exhaust system repair
✅ Flex pipe replacement
✅ Unwanted noise elimination
✅ Same-day repair when possible

If your car got louder, you hear an unpleasant sound or the muffler burned through — don't delay the repair.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warsaw
📞 +48 791 257 229

We'll bring silence back to your car! 🔧🚗`,
    },
  },
  {
    id: "clutch-citroen",
    serviceIds: ["clutch"],
    videoSrc: "/videos/works/clutch-citroen.mov",
    posterSrc: "/images/works/clutch-citroen-cover.png",
    title: {
      pl: "Wymiana sprzęgła",
      ru: "Замена сцепления",
      en: "Clutch replacement",
    },
    description: {
      pl: `Klient zgłosił się z awarią — sprzęgło całkowicie odmówiło posłuszeństwa.

Po diagnostyce potwierdziliśmy usterkę kompletu sprzęgła i przystąpiliśmy do naprawy.

✅ Demontaż skrzyni biegów
✅ Wymiana kompletu sprzęgła
✅ Kontrola powiązanych elementów
✅ Montaż i test kontrolny

Terminowa wymiana sprzęgła pozwala uniknąć poważniejszych awarii i dodatkowych kosztów.

Jeśli auto szarpie, są problemy ze zmianą biegów lub sprzęgło ślizga się — nie odkładaj diagnostyki.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Zaufaj naprawę profesjonalistom! 🔥`,
      ru: `Клиент приехал с жалобой — сцепление полностью вышло из строя.

После диагностики подтвердили неисправность комплекта сцепления и приступили к ремонту.

✅ Демонтаж коробки передач
✅ Замена комплекта сцепления
✅ Проверка сопутствующих узлов
✅ Сборка и контрольный тест

Своевременная замена сцепления позволяет избежать более серьёзных поломок и дополнительных расходов.

Если автомобиль начал дёргаться, появились проблемы с переключением передач или сцепление пробуксовывает — не откладывайте диагностику.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Доверяйте ремонт профессионалам! 🔥`,
      en: `The customer came in with a failed clutch — it had completely stopped working.

After diagnostics we confirmed the clutch kit fault and started the repair.

✅ Gearbox removal
✅ Clutch kit replacement
✅ Related components inspection
✅ Reassembly and test drive

Replacing the clutch in time helps avoid more serious damage and extra costs.

If the car jerks, gears are hard to shift or the clutch slips — don't delay diagnostics.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warsaw
📞 +48 791 257 229

Trust the repair to professionals! 🔥`,
    },
  },
  {
    id: "timing-belt-passat",
    serviceIds: ["timingBelt"],
    videoSrc: "/videos/works/timing-belt-passat.mov",
    posterSrc: "/images/works/timing-belt-passat-cover.png",
    title: {
      pl: "Wymiana rozrządu",
      ru: "Замена ГРМ",
      en: "Timing belt replacement",
    },
    description: {
      pl: `Rozrząd to jeden z najważniejszych elementów silnika. Jego zerwanie może oznaczać kosztowny remont głowicy i układu zaworowego. Terminowa wymiana to inwestycja w niezawodność auta — nie zbędny koszt.

W BESS MOTORS wykonujemy:

✅ Demontaż i montaż rozrządu
✅ Precyzyjną ustawienie faz silnika
✅ Wymianę rolek, pomp i elementów zestawu
✅ Kontrolę pracy silnika po złożeniu

🚗 Volkswagen Passat B7
⚙️ Silnik CFFB 2.0 TDI

Dziękujemy klientowi za zaufanie!

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Zapisuj i obserwuj — przed nami więcej realnych napraw i praktycznych materiałów z warsztatu.`,
      ru: `ГРМ — один из важнейших узлов двигателя. Его обрыв может привести к дорогостоящему ремонту головки блока и клапанного механизма. Поэтому своевременная замена — это не расход, а инвестиция в надёжность автомобиля.

В BESS MOTORS выполняем:

✅ Демонтаж и сборку ГРМ
✅ Точную установку фаз двигателя
✅ Замену роликов, помпы и комплектующих
✅ Проверку работы двигателя после сборки

🚗 Volkswagen Passat B7
⚙️ Двигатель CFFB 2.0 TDI

Спасибо клиенту за доверие!

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Сохраняйте и подписывайтесь — впереди ещё больше реальных ремонтов и полезного контента из жизни автосервиса.`,
      en: `The timing belt is one of the engine's most critical components. If it snaps, head and valve train repairs can be very expensive. Replacing it on schedule is an investment in reliability — not an optional expense.

At BESS MOTORS we offer:

✅ Timing belt removal and installation
✅ Precise engine timing setup
✅ Replacement of tensioners, water pump and kit parts
✅ Post-assembly engine run check

🚗 Volkswagen Passat B7
⚙️ Engine CFFB 2.0 TDI

Thank you to our customer for trusting us!

📍 BESS MOTORS
Aleja Krakowska 48/52, Warsaw
📞 +48 791 257 229

Save and follow — more real workshop repairs and useful content coming soon.`,
    },
  },
  {
    id: "ac-service",
    serviceIds: ["acRefill", "acRepair"],
    videoSrc: "/videos/works/ac-service.mov",
    posterSrc: "/images/works/ac-service-cover.png",
    title: {
      pl: "Serwis klimatyzacji",
      ru: "Заправка кондиционера",
      en: "AC recharge",
    },
    description: {
      pl: `Lato już się zaczęło — to najlepszy moment, żeby sprawdzić klimatyzację i uzupełnić czynnik przed upałami.

W BESS MOTORS wykonujemy:

✅ Nabijanie klimatyzacji R134a
✅ Próżniowanie układu
✅ Kontrolę szczelności
✅ Uzupełnienie oleju i barwnika w razie potrzeby
✅ Kontrolę ciśnienia przed i po serwisie

Nawet gdy klimatyzacja jeszcze chłodzi, część czynnika naturalnie ubywa — spada skuteczność chłodzenia i rośnie obciążenie sprężarki.

🚗 Obsługujemy większość samochodów osobowych.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Zapisz się wcześniej i wita lato w komforcie! ❄️☀️`,
      ru: `Лето уже началось, а значит самое время проверить систему кондиционирования и заправить её перед жаркими днями.

В BESS MOTORS выполняем:

✅ Заправку кондиционеров R134a
✅ Вакуумирование системы
✅ Проверку герметичности
✅ Долив масла и красителя при необходимости
✅ Контроль давления до и после обслуживания

Даже если кондиционер ещё работает, со временем часть хладагента уходит естественным образом, из-за чего снижается эффективность охлаждения и увеличивается нагрузка на компрессор.

🚗 Заправляем большинство легковых автомобилей.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Запишитесь заранее и встречайте лето с комфортом! ❄️☀️`,
      en: `Summer is here — the right time to check your A/C and recharge before the heat.

At BESS MOTORS we offer:

✅ R134a refrigerant recharge
✅ System vacuum
✅ Leak check
✅ Oil and dye top-up when needed
✅ Pressure check before and after service

Even if the A/C still cools, refrigerant slowly leaks over time — cooling gets weaker and the compressor works harder.

🚗 We service most passenger cars.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warsaw
📞 +48 791 257 229

Book ahead and enjoy summer in comfort! ❄️☀️`,
    },
    instagramShortcode: "DZ8LHh8KZXS",
    instagramUrl:
      "https://www.instagram.com/reel/DZ8LHh8KZXS/?utm_source=ig_web_copy_link",
  },
];

export function getOurWorkVideosForService(serviceId: ServiceId): OurWorkVideo[] {
  return OUR_WORK_VIDEOS.filter((work) => work.serviceIds.includes(serviceId));
}

export function getOurWorkVideoById(id: string): OurWorkVideo | undefined {
  return OUR_WORK_VIDEOS.find((work) => work.id === id);
}
