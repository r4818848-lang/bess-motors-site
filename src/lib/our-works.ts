import type { ServiceId } from "@/lib/services-catalog";
import {
  AC_RECHARGE_BMW_POSTER_SRC,
  AC_RECHARGE_LEXUS_PHOTO_SRC,
  AC_RECHARGE_VIDEO_SRC,
  AC_RECHARGE_VIAKEN_POSTER_SRC,
  AC_REPAIR_WELD_PROMO_SRC,
} from "@/lib/ac-media";
import {
  TIRE_SERVICE_POSTER_SRC,
  TIRE_SERVICE_VIDEO_SRC,
} from "@/lib/tire-media";
import { BRAKE_PADS_CHANGE_PHOTO_SRC } from "@/lib/brake-media";
import {
  OIL_CHANGE_DRAIN_PHOTO_SRC,
  OIL_CHANGE_DRAIN_POSTER_SRC,
  OIL_CHANGE_VIDEO_SRC,
} from "@/lib/oil-media";
import {
  ALTERNATOR_INSTALL_PHOTO_SRC,
  ALTERNATOR_PARTS_PHOTO_SRC,
} from "@/lib/alternator-media";
import {
  RADIATOR_REPLACEMENT_POSTER_SRC,
  RADIATOR_REPLACEMENT_VIDEO_SRC,
  RADIATOR_WASH_POSTER_SRC,
  RADIATOR_WASH_VIDEO_SRC,
} from "@/lib/radiator-media";

export type OurWorkVideo = {
  id: string;
  serviceIds: ServiceId[];
  /** Photo-only case study (no video file) */
  imageOnly?: boolean;
  videoSrc?: string;
  posterSrc: string;
  title: { pl: string; ru: string; en: string };
  description: { pl: string; ru: string; en: string };
  instagramShortcode?: string;
  instagramUrl?: string;
};

/** Append new entries at the end; UI shows newest first. */
const OUR_WORK_VIDEOS_SOURCE: OurWorkVideo[] = [
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
    id: "ac-repair-weld",
    serviceIds: ["acRefill", "acRepair"],
    imageOnly: true,
    posterSrc: AC_REPAIR_WELD_PROMO_SRC,
    title: {
      pl: "Naprawa klimatyzacji — spawanie przewodu",
      ru: "Ремонт кондиционера — сварка трубки",
      en: "A/C repair — pipe welding",
    },
    description: {
      pl: `NAPRAWA KLIMATYZACJI — zaspawaliśmy przewód z dziurą!

W BESS MOTORS naprawiamy nie tylko nieszczelności — przywracamy pełną sprawność układu klimatyzacji bez kosztownej wymiany całego przewodu.

✅ Spawanie przewodów klimatyzacji
✅ Pełna szczelność układu
✅ Skuteczne chłodzenie po naprawie
✅ Kontrola ciśnienia i próżnia
✅ Nabijanie R134a i R1234yf

Klimatyzacja działa jak nowa — gwarancja na usługę, doświadczenie i uczciwe ceny.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Umów diagnostykę lub naprawę klimatyzacji online! ❄️`,
      ru: `РЕМОНТ КОНДИЦИОНЕРА — заварили трубку с дырой!

В BESS MOTORS мы не только заправляем кондиционер — устраняем утечки и восстанавливаем герметичность без дорогой замены всей трубки.

✅ Сварка трубок кондиционера
✅ Полная герметичность системы
✅ Эффективное охлаждение после ремонта
✅ Контроль давления и вакуум
✅ Заправка R134a и R1234yf

Кондиционер работает как новый — гарантия на работу, опыт и честные цены.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Запишитесь на диагностику или ремонт кондиционера онлайн! ❄️`,
      en: `A/C REPAIR — we welded a pipe with a hole!

At BESS MOTORS we fix leaks and restore full system tightness without replacing the entire line.

✅ A/C line welding
✅ Full system leak-tightness
✅ Effective cooling after repair
✅ Pressure check and vacuum
✅ R134a and R1234yf recharge

Your A/C works like new — service guarantee, experience and fair pricing.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warsaw
📞 +48 791 257 229

Book A/C diagnostics or repair online! ❄️`,
    },
  },
  {
    id: "ac-recharge-viaken",
    serviceIds: ["acRefill", "acRepair"],
    videoSrc: AC_RECHARGE_VIDEO_SRC,
    posterSrc: AC_RECHARGE_VIAKEN_POSTER_SRC,
    title: {
      pl: "Nabijanie klimatyzacji — stacja Viaken",
      ru: "Заправка кондиционера — станция Viaken",
      en: "A/C recharge — Viaken station",
    },
    description: {
      pl: `Profesjonalne nabijanie klimatyzacji na nowoczesnej stacji Viaken.

W BESS MOTORS podłączamy układ klimatyzacji do automatycznej stacji serwisowej — próżnia, kontrola szczelności i precyzyjne dozowanie czynnika R134a lub R1234yf.

✅ Podłączenie i próżniowanie układu
✅ Nabijanie R134a i R1234yf
✅ Kontrola ciśnienia i szczelności
✅ Uzupełnienie oleju i barwnika UV
✅ Diagnostyka przed i po serwisie

🔥 PROMOCJA −50%: podłączenie 80 zł, gaz certyfikowany 50 zł/100 g (R134a i R1234yf)

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Umów nabijanie klimatyzacji online! ❄️`,
      ru: `Профессиональная заправка кондиционера на современной станции Viaken.

В BESS MOTORS подключаем систему к автоматической сервисной станции — вакуум, проверка герметичности и точная дозировка фреона R134a или R1234yf.

✅ Подключение и вакуумирование
✅ Заправка R134a и R1234yf
✅ Контроль давления и герметичности
✅ Долив масла и UV-красителя
✅ Диагностика до и после сервиса

🔥 АКЦИЯ −50%: подключение 80 zł, сертифицированный газ 50 zł/100 г (R134a и R1234yf)

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Запишитесь на заправку кондиционера онлайн! ❄️`,
      en: `Professional A/C recharge on a modern Viaken service station.

At BESS MOTORS we connect the system to an automated station — vacuum, leak check and precise R134a or R1234yf dosing.

✅ Hook-up and vacuum
✅ R134a and R1234yf refill
✅ Pressure and leak check
✅ Oil and UV dye top-up
✅ Diagnostics before and after service

🔥 −50% PROMO: hook-up 80 PLN, certified gas 50 PLN/100g (R134a and R1234yf)

📍 BESS MOTORS
Aleja Krakowska 48/52, Warsaw
📞 +48 791 257 229

Book your A/C recharge online! ❄️`,
    },
  },
  {
    id: "ac-recharge-bmw",
    serviceIds: ["acRefill", "acRepair"],
    imageOnly: true,
    posterSrc: AC_RECHARGE_BMW_POSTER_SRC,
    title: {
      pl: "Nabijanie klimy — BMW na stacji Viaken",
      ru: "Заправка кондиционера BMW — Viaken",
      en: "BMW A/C recharge — Viaken",
    },
    description: {
      pl: `Kolejna klimatyzacja zrobiona na naszej stacji Viaken.

Pod maską BMW — pełny serwis układu: podłączenie, próżnia i nabijanie czynnikiem. Stacja robi pomiary automatycznie, a my kontrolujemy szczelność i skuteczność chłodzenia.

✅ Obsługa aut osobowych i SUV
✅ R134a i R1234yf
✅ Olej i barwnik UV w razie potrzeby

📍 BESS MOTORS · Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229`,
      ru: `Ещё одна заправка кондиционера на нашей станции Viaken.

BMW на подъёмнике — полный сервис: подключение, вакуум и заправка фреоном. Станция считает объём автоматически, мы проверяем герметичность и эффективность охлаждения.

✅ Легковые и SUV
✅ R134a и R1234yf
✅ Масло и UV-краситель при необходимости

📍 BESS MOTORS · Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229`,
      en: `Another A/C job on our Viaken station.

BMW in the bay — full service: hook-up, vacuum and refrigerant refill. The station measures automatically; we verify leaks and cooling performance.

✅ Passenger cars and SUVs
✅ R134a and R1234yf
✅ Oil and UV dye when needed

📍 BESS MOTORS · Aleja Krakowska 48/52, Warsaw
📞 +48 791 257 229`,
    },
  },
  {
    id: "ac-recharge-lexus",
    serviceIds: ["acRefill", "acRepair"],
    imageOnly: true,
    posterSrc: AC_RECHARGE_LEXUS_PHOTO_SRC,
    title: {
      pl: "Serwis klimatyzacji Lexus",
      ru: "Сервис кондиционера Lexus",
      en: "Lexus A/C service",
    },
    description: {
      pl: `Lexus na stacji Viaken — nabijanie i diagnostyka klimatyzacji.

Nowoczesne auta wymagają precyzyjnego serwisu: prawidłowa ilość czynnika, kontrola szczelności i sprawna sprężarka. W BESS MOTORS robimy to zgodnie ze specyfikacją producenta.

✅ Stacja Viaken — automatyczne dawkowanie
✅ R1234yf i R134a
✅ Kontrola po serwisie

📍 BESS MOTORS · Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229`,
      ru: `Lexus на станции Viaken — заправка и диагностика кондиционера.

Современным авто нужен точный сервис: правильный объём фреона, герметичность и исправный компрессор. В BESS MOTORS работаем по спецификации производителя.

✅ Станция Viaken — автоматическая дозировка
✅ R1234yf и R134a
✅ Контроль после сервиса

📍 BESS MOTORS · Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229`,
      en: `Lexus on the Viaken station — A/C refill and diagnostics.

Modern cars need precise service: correct refrigerant amount, leak-tightness and a healthy compressor. At BESS MOTORS we follow manufacturer specs.

✅ Viaken station — automatic dosing
✅ R1234yf and R134a
✅ Post-service check

📍 BESS MOTORS · Aleja Krakowska 48/52, Warsaw
📞 +48 791 257 229`,
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
      pl: `🔥 LETNIA PROMOCJA −50% NA KLIMATYZACJĘ!

💰 Podłączenie układu (próżnia) — 80 zł zamiast 160 zł
💰 Freon R134a — 50 zł/100 g zamiast 100 zł
💰 Freon R1234yf — 50 zł/100 g zamiast 100 zł

W BESS MOTORS wykonujemy:

✅ Nabijanie klimatyzacji R134a i R1234yf
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
      ru: `🔥 ЛЕТНЯЯ АКЦИЯ −50% НА ЗАПРАВКУ КОНДИЦИОНЕРА!

Вместо полной цены — скидка −50%:
💰 Подключение системы (вакуум) — 80 zł вместо 160 zł
💰 Фреон R134a — 50 zł/100 г вместо 100 zł
💰 Фреон R1234yf — 50 zł/100 г вместо 100 zł

В BESS MOTORS выполняем:

✅ Заправку кондиционеров R134a и R1234yf
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
      en: `🔥 SUMMER −50% A/C PROMO!

−50% off full price:
💰 System hook-up (vacuum) — 80 PLN instead of 160
💰 R134a refrigerant — 50 PLN/100g instead of 100
💰 R1234yf refrigerant — 50 PLN/100g instead of 100

At BESS MOTORS we offer:

✅ R134a and R1234yf refrigerant recharge
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
  {
    id: "oil-change",
    serviceIds: ["oil", "filters"],
    videoSrc: OIL_CHANGE_VIDEO_SRC,
    posterSrc: OIL_CHANGE_DRAIN_POSTER_SRC,
    title: {
      pl: "Wymiana oleju silnikowego",
      ru: "Замена моторного масла",
      en: "Engine oil change",
    },
    description: {
      pl: `Wymiana oleju to podstawa długiej żywotności silnika.

W BESS MOTORS wykonujemy pełny serwis olejowy — nie tylko wlewanie nowego oleju:

✅ Spuszczenie starego oleju z podnośnika
✅ Wymiana filtra oleju
✅ Zalanie olejem według specyfikacji producenta (VIN)
✅ Kontrola poziomu i szczelności
✅ Naklejka serwisowa z datą i przebiegiem

Oleje Castrol, Motul, Shell, Liqui Moly — dobieramy normę pod Twój silnik.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Umów wymianę oleju online — zwykle gotowe w ok. 1 godzinę! 🛢️`,
      ru: `Замена масла — основа долгой жизни двигателя.

В BESS MOTORS делаем полный масляный сервис, а не просто заливку:

✅ Слив старого масла на подъёмнике
✅ Замена масляного фильтра
✅ Залив масла по спецификации производителя (VIN)
✅ Контроль уровня и герметичности
✅ Наклейка о прохождении ТО с датой и пробегом

Масла Castrol, Motul, Shell, Liqui Moly — подбираем норму под ваш двигатель.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Запишитесь на замену масла онлайн — обычно готово за ~1 час! 🛢️`,
      en: `Oil change is the foundation of a long-lasting engine.

At BESS MOTORS we do a full oil service — not just topping up:

✅ Draining old oil on the lift
✅ New oil filter
✅ Refill to manufacturer spec (VIN)
✅ Level and leak check
✅ Service sticker with date and mileage

Castrol, Motul, Shell, Liqui Moly — we match the right spec for your engine.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warsaw
📞 +48 791 257 229

Book your oil change online — usually done in about 1 hour! 🛢️`,
    },
  },
  {
    id: "oil-drain-photo",
    serviceIds: ["oil", "filters"],
    imageOnly: true,
    posterSrc: OIL_CHANGE_DRAIN_PHOTO_SRC,
    title: {
      pl: "Spuszczanie oleju — warsztat BESS MOTORS",
      ru: "Слив масла — сервис BESS MOTORS",
      en: "Oil drain — BESS MOTORS workshop",
    },
    description: {
      pl: `Zobacz, jak wygląda profesjonalna wymiana oleju w naszym warsztacie.

Auto na podnośniku, pełne spuszczenie starego oleju, czysta praca i sprawdzone procedury — tak dbamy o silnik każdego klienta.

✅ Podnośnik i bezpieczny dostęp do miski olejowej
✅ Kompletny zlew starego oleju
✅ Wymiana filtra i zalanie świeżym olejem
✅ Kontrola po serwisie

📍 BESS MOTORS · Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229`,
      ru: `Посмотрите, как проходит профессиональная замена масла в нашем сервисе.

Авто на подъёмнике, полный слив старого масла, аккуратная работа и проверенные процедуры — так мы заботимся о двигателе каждого клиента.

✅ Подъёмник и безопасный доступ к поддону
✅ Полный слив отработки
✅ Замена фильтра и залив свежего масла
✅ Контроль после обслуживания

📍 BESS MOTORS · Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229`,
      en: `See how a professional oil change looks in our workshop.

Car on the lift, full drain of old oil, clean work and proven procedures — that's how we care for every customer's engine.

✅ Lift access to the oil pan
✅ Complete old oil drain
✅ Filter replacement and fresh oil refill
✅ Post-service check

📍 BESS MOTORS · Aleja Krakowska 48/52, Warsaw
📞 +48 791 257 229`,
    },
  },
  {
    id: "tire-service",
    serviceIds: ["tires", "alignment"],
    videoSrc: TIRE_SERVICE_VIDEO_SRC,
    posterSrc: TIRE_SERVICE_POSTER_SRC,
    title: {
      pl: "Wulkanizacja i wyważanie opon",
      ru: "Шиномонтаж и балансировка",
      en: "Tire mounting and balancing",
    },
    description: {
      pl: `Sezonowa wymiana opon w BESS MOTORS — szybko i bez kolejek.

Profesjonalny montaż, wyważanie kół i kontrola ciśnienia. Obsługujemy auta osobowe i SUV, w tym opony RunFlat.

✅ Wymiana kół / montaż opon
✅ Wyważanie na nowoczesnej maszynie
✅ Naprawa opony (wkręt, przebicie)
✅ Sezonowe przechowanie opon
✅ Geometria kół (zbieżność)

Zimówka czy lato — umów termin online i przyjedź bez czekania.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Zadbaj o bezpieczeństwo na drodze! 🛞`,
      ru: `Сезонная замена шин в BESS MOTORS — быстро и без очередей.

Профессиональный монтаж, балансировка колёс и проверка давления. Обслуживаем легковые авто и SUV, в том числе RunFlat.

✅ Замена колёс / монтаж шин
✅ Балансировка на современном станке
✅ Ремонт шины (гвоздь, прокол)
✅ Сезонное хранение шин
✅ Развал-схождение

Зима или лето — запишитесь онлайн и приезжайте без ожидания.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Безопасность на дороге начинается с шин! 🛞`,
      en: `Seasonal tire change at BESS MOTORS — fast, no long queues.

Professional mounting, wheel balancing and pressure check. We service passenger cars and SUVs, including RunFlat tires.

✅ Wheel / tire change
✅ Balancing on modern equipment
✅ Tire repair (nail, puncture)
✅ Seasonal tire storage
✅ Wheel alignment

Winter or summer — book online and skip the wait.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warsaw
📞 +48 791 257 229

Stay safe on the road! 🛞`,
    },
  },
  {
    id: "brake-pads-change",
    serviceIds: ["brakePads", "brakesFull"],
    imageOnly: true,
    posterSrc: BRAKE_PADS_CHANGE_PHOTO_SRC,
    title: {
      pl: "Wymiana klocków hamulcowych",
      ru: "Замена тормозных колодок",
      en: "Brake pad replacement",
    },
    description: {
      pl: `Bezpieczne hamowanie zaczyna się od sprawnych klocków.

W BESS MOTORS wymieniamy klocki hamulcowe na jakościowe części (m.in. Delphi) — z pomiarem tarcz, kontrolą zacisków i jazdą testową po serwisie.

✅ Wymiana klocków przód / tył
✅ Pomiar grubości tarcz
✅ Kontrola zacisków i przewodów
✅ Jazda testowa po naprawie
✅ Przejrzysta wycena przed montażem

Klocki na jedną oś od 120 zł — umów wizytę online.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Hamuj pewnie — zadbaj o bezpieczeństwo! 🛑`,
      ru: `Безопасное торможение начинается с исправных колодок.

В BESS MOTORS меняем тормозные колодки на качественные детали (в т.ч. Delphi) — с замером дисков, проверкой суппортов и тест-драйвом после работ.

✅ Замена колодок перед / зад
✅ Замер толщины дисков
✅ Проверка суппортов и шлангов
✅ Тест-драйв после ремонта
✅ Прозрачная смета до начала работ

Колодки на одну ось от 120 zł — запишитесь онлайн.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Тормозите уверенно — заботьтесь о безопасности! 🛑`,
      en: `Safe braking starts with healthy brake pads.

At BESS MOTORS we fit quality pads (including Delphi) — measure discs, check calipers and take a test drive after service.

✅ Front / rear pad replacement
✅ Disc thickness measurement
✅ Caliper and hose inspection
✅ Post-service test drive
✅ Clear quote before work starts

Pads per axle from 120 zł — book online.

📍 BESS MOTORS
Aleja Krakowska 48/52, Warsaw
📞 +48 791 257 229

Brake with confidence! 🛑`,
    },
  },
  {
    id: "alternator-replacement",
    serviceIds: ["starterGen", "electric"],
    imageOnly: true,
    posterSrc: ALTERNATOR_INSTALL_PHOTO_SRC,
    title: {
      pl: "Wymiana alternatora",
      ru: "Замена генератора",
      en: "Alternator replacement",
    },
    description: {
      pl: `Słaba ładowanie, kontrolka akumulatora lub światła gasnące przy niskich obrotach? Często winny jest alternator.

W BESS MOTORS diagnozujemy układ ładowania i wymieniamy alternator na sprawdzone części (m.in. Bosch) — z montażem pasów, kontrolą napięcia i testem po naprawie.

✅ Diagnostyka ładowania i akumulatora
✅ Wymiana alternatora
✅ Montaż i regulacja pasa napędowego
✅ Kontrola napięcia po serwisie
✅ Naprawa od 450 zł — wycena po diagnozie

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Przywróć pewne ładowanie — umów wizytę online! ⚡`,
      ru: `Слабая зарядка, лампочка АКБ или меркнущий свет на холостых? Часто виноват генератор.

В BESS MOTORS диагностируем систему зарядки и меняем генератор на проверенные детали (в т.ч. Bosch) — с установкой ремней, контролем напряжения и тестом после ремонта.

✅ Диагностика зарядки и аккумулятора
✅ Замена генератора
✅ Установка и регулировка приводного ремня
✅ Контроль напряжения после сервиса
✅ Ремонт от 450 zł — смета после диагностики

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Верните уверенную зарядку — запишитесь онлайн! ⚡`,
      en: `Weak charging, battery warning light or dim lights at idle? Often the alternator is at fault.

At BESS MOTORS we diagnose the charging system and fit quality alternators (including Bosch) — belt setup, voltage check and post-repair test.

✅ Charging and battery diagnostics
✅ Alternator replacement
✅ Drive belt installation and tension
✅ Voltage check after service
✅ Repair from 450 zł — quote after diagnosis

📍 BESS MOTORS
Aleja Krakowska 48/52, Warsaw
📞 +48 791 257 229

Restore reliable charging — book online! ⚡`,
    },
  },
  {
    id: "alternator-parts",
    serviceIds: ["starterGen", "electric"],
    imageOnly: true,
    posterSrc: ALTERNATOR_PARTS_PHOTO_SRC,
    title: {
      pl: "Alternator Bosch — części do montażu",
      ru: "Генератор Bosch — детали для установки",
      en: "Bosch alternator — parts ready to fit",
    },
    description: {
      pl: `Przed montażem pokazujemy nowy alternator i komplet elementów montażowych — przejrzyście i bez niespodzianek.

✅ Sprawdzone części OEM/OES
✅ Komplet śrub i węży do montażu
✅ Wycena przed rozpoczęciem pracy

📍 BESS MOTORS · Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229`,
      ru: `Перед установкой показываем новый генератор и комплект крепежа — прозрачно и без сюрпризов.

✅ Проверенные детали OEM/OES
✅ Комплект болтов и шлангов
✅ Смета до начала работ

📍 BESS MOTORS · Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229`,
      en: `Before fitting we show the new alternator and mounting hardware — clear and no surprises.

✅ Proven OEM/OES parts
✅ Full bolt and hose kit
✅ Quote before work starts

📍 BESS MOTORS · Aleja Krakowska 48/52, Warsaw
📞 +48 791 257 229`,
    },
  },
  {
    id: "radiator-wash",
    serviceIds: ["radiators", "acRefill", "acRepair"],
    videoSrc: RADIATOR_WASH_VIDEO_SRC,
    posterSrc: RADIATOR_WASH_POSTER_SRC,
    title: {
      pl: "Mycie chłodnicy klimatyzacji",
      ru: "Мойка радиатора кондиционера",
      en: "A/C condenser cleaning",
    },
    description: {
      pl: `Zanieczyszczona chłodnica to słabsze chłodzenie i większe obciążenie sprężarki.

W BESS MOTORS myjemy chłodnicę klimatyzacji i układu chłodzenia — usuwamy kurz, owady i osady, żeby układ znów pracował wydajnie.

✅ Mycie chłodnicy klimatyzacji
✅ Czyszczenie wnęki pod maską
✅ Kontrola przepływu powietrza
✅ Diagnostyka przed i po serwisie
✅ Nabijanie R134a i R1234yf po naprawie

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Umów mycie chłodnicy i serwis klimatyzacji online! ❄️`,
      ru: `Загрязнённый радиатор — слабое охлаждение и лишняя нагрузка на компрессор.

В BESS MOTORS моем радиатор кондиционера и системы охлаждения — убираем пыль, насекомых и отложения, чтобы система снова работала эффективно.

✅ Мойка радиатора кондиционера
✅ Очистка подкапотного пространства
✅ Контроль обдува
✅ Диагностика до и после сервиса
✅ Заправка R134a и R1234yf после ремонта

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Запишитесь на мойку радиатора и сервис кондиционера онлайн! ❄️`,
      en: `A clogged condenser means weaker cooling and extra load on the compressor.

At BESS MOTORS we clean the A/C condenser and cooling radiator — removing dust, insects and debris so the system works efficiently again.

✅ A/C condenser cleaning
✅ Engine bay cleanup
✅ Airflow check
✅ Diagnostics before and after service
✅ R134a and R1234yf recharge after repair

📍 BESS MOTORS
Aleja Krakowska 48/52, Warsaw
📞 +48 791 257 229

Book condenser cleaning and A/C service online! ❄️`,
    },
  },
  {
    id: "radiator-replacement",
    serviceIds: ["radiators", "acRefill", "acRepair"],
    videoSrc: RADIATOR_REPLACEMENT_VIDEO_SRC,
    posterSrc: RADIATOR_REPLACEMENT_POSTER_SRC,
    title: {
      pl: "Wymiana chłodnicy klimatyzacji",
      ru: "Замена радиатора кондиционера",
      en: "A/C condenser replacement",
    },
    description: {
      pl: `Przebita lub nieszczelna chłodnica? Wymiana to szybki powrót do skutecznego chłodzenia.

W BESS MOTORS wymieniamy chłodnicę klimatyzacji — od demontażu starej części, przez próżniowanie układu, po nabijanie czynnikiem i kontrolę szczelności.

✅ Wymiana chłodnicy klimatyzacji
✅ Próżnia i kontrola szczelności
✅ Nabijanie R134a i R1234yf
✅ Test skuteczności chłodzenia
✅ Wymiana od 350 zł — wycena po diagnozie

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Przywróć moc klimatyzacji — umów wizytę online! ❄️`,
      ru: `Пробитый или негерметичный радиатор? Замена — быстрый возврат эффективного охлаждения.

В BESS MOTORS меняем радиатор кондиционера — от демонтажа старой детали до вакуумирования, заправки фреоном и проверки герметичности.

✅ Замена радиатора кондиционера
✅ Вакуум и контроль герметичности
✅ Заправка R134a и R1234yf
✅ Тест эффективности охлаждения
✅ Замена от 350 zł — смета после диагностики

📍 BESS MOTORS
Aleja Krakowska 48/52, Warszawa
📞 +48 791 257 229

Верните мощность кондиционера — запишитесь онлайн! ❄️`,
      en: `A punctured or leaking condenser? Replacement restores effective cooling quickly.

At BESS MOTORS we replace A/C condensers — from removing the old unit through vacuum, refrigerant recharge and leak testing.

✅ A/C condenser replacement
✅ Vacuum and leak check
✅ R134a and R1234yf recharge
✅ Cooling performance test
✅ Replacement from 350 zł — quote after diagnosis

📍 BESS MOTORS
Aleja Krakowska 48/52, Warsaw
📞 +48 791 257 229

Restore your A/C — book online! ❄️`,
    },
  },
];

export const OUR_WORK_VIDEOS: OurWorkVideo[] = [...OUR_WORK_VIDEOS_SOURCE].reverse();

export function getOurWorkVideosForService(serviceId: ServiceId): OurWorkVideo[] {
  return OUR_WORK_VIDEOS.filter((work) => work.serviceIds.includes(serviceId));
}

export function getOurWorkVideoById(id: string): OurWorkVideo | undefined {
  return OUR_WORK_VIDEOS.find((work) => work.id === id);
}
