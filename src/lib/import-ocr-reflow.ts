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
  ];

  for (const h of headers) {
    const re = new RegExp(`(\\s)(${h}\\b)`, "gi");
    t = t.replace(re, "\n$2");
  }

  t = t.replace(/\b(ZL\s*\d+\/\d+\/\d{4})\b/gi, "\n$1\n");
  t = t.replace(/\b(telefon|e-?mail|vin|nip|stan licznika|marka)\s*:/gi, "\n$&");

  return t.replace(/\n{3,}/g, "\n\n");
}
