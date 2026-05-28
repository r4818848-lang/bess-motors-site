import type { Database } from "@/lib/store";

/** Extra seasonal lines for morning report (Warsaw month) */
export function formatSeasonalCampaignHint(_db: Database): string {
  const m = new Date().getMonth() + 1;
  const lines: string[] = [];

  if (m >= 3 && m <= 5) {
    lines.push("🌸 Wiosna: przypomnij klientom serwis klimatyzacji i wymianę płynów.");
  }
  if (m >= 6 && m <= 8) {
    lines.push("☀️ Lato: kontrola klimatyzacji, płyn chłodzący, opony.");
  }
  if (m >= 9 && m <= 11) {
    lines.push("🍂 Jesień: hamulce, oświetlenie, przygotowanie do zimy.");
  }

  return lines.filter(Boolean).join("\n");
}
