/** Insert line breaks so section/table parsers work when OCR returns few newlines. */
export function reflowImportOcrText(text: string): string {
  let t = text.replace(/\r/g, "\n");

  const headers = [
    "dane klienta",
    "dane kienta",
    "dane pojazdu",
    "dane pojazd",
    "kosztorys",
    "usługi",
    "uslugi",
    "towary",
    "podsumowanie",
    "łącznie",
    "lacznie",
    "razem",
    "udzielono rabatu",
  ];

  for (const h of headers) {
    const re = new RegExp(`(\\s)(${h}\\b)`, "gi");
    t = t.replace(re, "\n$2");
  }

  t = t.replace(/\b(ZL\s*\d+\/\d+\/\d{4})\b/gi, "\n$1\n");
  t = t.replace(
    /\b(telefon|numer telefonu|e-?mail|vin|nip|stan licznika|marka i model|numer rejestracyjny|imię i nazwisko)\s*:/gi,
    "\n$&"
  );

  // Split glued table rows: «… 1 oper 200,00 zł 200,00 zł 2 Naprawa…»
  t = t.replace(
    /(\d[\d\s]*[.,]\d{2})\s*(?:zł|zl)\s+(?=\d+\s+[A-Za-zÀ-ž])/gi,
    "$1 zł\n"
  );

  // Legacy rows without Lp.: «Name 1 szt 100,00 zł 100,00 zł»
  t = t.replace(
    /([^\n]{8,}?\s+\d+(?:[.,]\d+)?\s+(?:oper|szt\.?|aper|apt)\s+\d[\d\s]*[.,]\d{2}\s*(?:zł|zl)?\s+\d[\d\s]*[.,]\d{2}\s*(?:zł|zl)?)/gi,
    "\n$1\n"
  );

  // Tab-separated PDF rows pasted as one line
  t = t.replace(/\t(\d+)\t/g, "\n$1\t");

  return t.replace(/\n{3,}/g, "\n\n");
}
