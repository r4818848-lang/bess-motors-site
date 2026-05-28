export type SymptomEntry = {
  id: string;
  tag: "brakes" | "diagnostic" | "chip" | "detailing";
  questionPl: string;
  questionRu: string;
  answerPl: string;
  answerRu: string;
  serviceIds: string[];
};

export const symptomFaq: SymptomEntry[] = [
  {
    id: "knock-left",
    tag: "diagnostic",
    questionPl: "Stuk z lewej strony na nierównościach",
    questionRu: "Стук слева на неровностях",
    answerPl: "Często zawieszenie lub łącznik stabilizatora — zalecamy diagnostykę.",
    answerRu: "Часто подвеска или стойка стабилизатора — нужна диагностика.",
    serviceIds: ["diagnostic", "suspension"],
  },
  {
    id: "check-engine",
    tag: "diagnostic",
    questionPl: "Świeci Check Engine",
    questionRu: "Горит Check Engine",
    answerPl: "Komputerowa diagnostyka + odczyt błędów przed naprawą.",
    answerRu: "Компьютерная диагностика и считывание ошибок.",
    serviceIds: ["diagnostic"],
  },
  {
    id: "brake-squeal",
    tag: "brakes",
    questionPl: "Pisk przy hamowaniu",
    questionRu: "Писк при торможении",
    answerPl: "Sprawdź klocki i tarcze — bezpieczeństwo przede wszystkim.",
    answerRu: "Проверьте колодки и диски — безопасность важнее всего.",
    serviceIds: ["brakePads", "brakesFull"],
  },
  {
    id: "ac-warm",
    tag: "detailing",
    questionPl: "Klima nie chłodzi",
    questionRu: "Кондиционер не холодит",
    answerPl: "Nabijanie, szczelność lub odgrzybianie układu.",
    answerRu: "Заправка, герметичность или антибактериальная обработка.",
    serviceIds: ["acRefill", "acRepair"],
  },
];
