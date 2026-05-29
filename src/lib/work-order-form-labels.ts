import type { DocLocale } from "./work-order-document";

export type FormDocLabels = ReturnType<typeof getFormDocLabels>;

export function getFormDocLabels(locale: DocLocale) {
  const base = locale === "ru"
    ? {
        title: "ЗАКАЗ-НАРЯД",
        titleNo: "ЗАКАЗ-НАРЯД №",
        receptionDate: "Дата приема",
        completionDate: "Дата окончания",
        vehicleData: "ДАННЫЕ АВТОМОБИЛЯ",
        clientData: "ДАННЫЕ КЛИЕНТА",
        makeModel: "Марка / модель",
        year: "Год выпуска",
        plate: "Гос. номер",
        vin: "VIN",
        mileage: "Пробег",
        fullName: "ФИО",
        phone: "Телефон",
        email: "E-mail",
        workList: "ПЕРЕЧЕНЬ РАБОТ",
        partsMaterials: "ЗАПАСНЫЕ ЧАСТИ И МАТЕРИАЛЫ",
        numberCol: "№",
        workName: "Наименование работ",
        partName: "Наименование",
        qty: "Кол-во",
        cost: "Стоимость, zł",
        additionalInfo: "ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ / КОММЕНТАРИИ",
        worksCost: "Стоимость работ",
        partsCost: "Стоимость запчастей и материалов",
        totalToPay: "ИТОГО К ОПЛАТЕ",
        orderDiscount: "Скидка",
        vat: "НДС",
        executor: "Исполнитель (мастер-приемщик)",
        clientSign: "Клиент",
        signLabel: "Подпись",
        dateLabel: "Дата",
        physicalSignNote: "Подпись при приёме / выдаче автомобиля",
        electronicSignNote: "Электронная подпись клиента",
        currency: "zł",
        website: "bess-motors.pl",
      }
    : locale === "en"
      ? {
          title: "WORK ORDER",
          titleNo: "WORK ORDER No.",
          receptionDate: "Reception date",
          completionDate: "Completion date",
          vehicleData: "VEHICLE DATA",
          clientData: "CLIENT DATA",
          makeModel: "Make / model",
          year: "Year",
          plate: "Registration",
          vin: "VIN",
          mileage: "Mileage",
          fullName: "Full name",
          phone: "Phone",
          email: "E-mail",
          workList: "LABOUR LIST",
          partsMaterials: "PARTS & MATERIALS",
          numberCol: "No.",
          workName: "Description of work",
          partName: "Description",
          qty: "Qty",
          cost: "Cost, PLN",
          additionalInfo: "ADDITIONAL INFO / COMMENTS",
          worksCost: "Labour cost",
          partsCost: "Parts & materials cost",
          totalToPay: "TOTAL DUE",
          orderDiscount: "Discount",
          vat: "VAT",
          executor: "Service advisor",
          clientSign: "Client",
          signLabel: "Signature",
          dateLabel: "Date",
          physicalSignNote: "Signature on vehicle handover",
          electronicSignNote: "Client electronic signature",
          currency: "PLN",
          website: "bess-motors.pl",
        }
      : {
          title: "ZLECENIE NAPRAWCZE",
          titleNo: "ZLECENIE NAPRAWCZE Nr",
          receptionDate: "Data przyjęcia",
          completionDate: "Data zakończenia",
          vehicleData: "DANE POJAZDU",
          clientData: "DANE KLIENTA",
          makeModel: "Marka / model",
          year: "Rok produkcji",
          plate: "Nr rejestracyjny",
          vin: "VIN",
          mileage: "Przebieg",
          fullName: "Imię i nazwisko",
          phone: "Telefon",
          email: "E-mail",
          workList: "WYKAZ PRAC",
          partsMaterials: "CZĘŚCI I MATERIAŁY",
          numberCol: "Lp.",
          workName: "Nazwa pracy",
          partName: "Nazwa",
          qty: "Ilość",
          cost: "Koszt, zł",
          additionalInfo: "INFORMACJE DODATKOWE / UWAGI",
          worksCost: "Koszt prac",
          partsCost: "Koszt części i materiałów",
          totalToPay: "RAZEM DO ZAPŁATY",
          orderDiscount: "Rabat",
          vat: "VAT",
          executor: "Wykonawca (master)",
          clientSign: "Klient",
          signLabel: "Podpis",
          dateLabel: "Data",
          physicalSignNote: "Podpis przy odbiorze / wydaniu pojazdu",
          electronicSignNote: "Podpis elektroniczny klienta",
          currency: "zł",
          website: "bess-motors.pl",
        };

  return base;
}

export function getFormFooterContent(locale: DocLocale) {
  if (locale === "ru") {
    return {
      slogan: "BESS MOTORS — ДВИЖЕНИЕ К СОВЕРШЕНСТВУ",
      benefits: [
        { title: "ГАРАНТИЯ", desc: "на все виды работ и запчасти" },
        { title: "СОВРЕМЕННОЕ", desc: "оборудование и технологии" },
        { title: "ОПЫТНЫЕ", desc: "специалисты с опытом от 5 лет" },
        { title: "ЧЕСТНЫЕ", desc: "сроки и фиксированные цены" },
      ],
    };
  }
  if (locale === "en") {
    return {
      slogan: "BESS MOTORS — DRIVING TOWARD PERFECTION",
      benefits: [
        { title: "WARRANTY", desc: "on all labour and parts" },
        { title: "MODERN", desc: "equipment and technology" },
        { title: "EXPERIENCED", desc: "specialists with 5+ years" },
        { title: "HONEST", desc: "deadlines and fixed prices" },
      ],
    };
  }
  return {
    slogan: "BESS MOTORS — RUCH W STRONĘ DOSKONAŁOŚCI",
    benefits: [
      { title: "GWARANCJA", desc: "na wszystkie prace i części" },
      { title: "NOWOCZESNY", desc: "sprzęt i technologie" },
      { title: "DOŚWIADCZENI", desc: "specjaliści z 5+ lat doświadczenia" },
      { title: "UCZCIWE", desc: "terminy i stałe ceny" },
    ],
  };
}

/** Pad rows for classic blank appearance (min rows on print form) */
export function padFormRows<T>(rows: T[], min = 10): T[] {
  const out = [...rows];
  while (out.length < min) out.push({} as T);
  return out;
}

/** Format date for printed work order (DD.MM.YYYY) */
export function formatDocDate(value?: string | null): string {
  if (!value) return "";
  const raw = value.slice(0, 10);
  const [y, m, d] = raw.split("-");
  if (y && m && d) return `${d}.${m}.${y}`;
  return value;
}
