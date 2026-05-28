/** Generate .ics file for calendar apps (no external APIs). */

export function buildBookingIcs(params: {
  title: string;
  description: string;
  location: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes?: number;
}): string {
  const start = parseLocalDateTime(params.date, params.time);
  const end = new Date(start.getTime() + (params.durationMinutes ?? 60) * 60_000);
  const uid = `bess-booking-${params.date}-${params.time}@bess-motors.com`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BESS MOTORS//Booking//PL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsUtc(new Date())}`,
    `DTSTART:${formatIcsUtc(start)}`,
    `DTEND:${formatIcsUtc(end)}`,
    `SUMMARY:${escapeIcs(params.title)}`,
    `DESCRIPTION:${escapeIcs(params.description)}`,
    `LOCATION:${escapeIcs(params.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

function parseLocalDateTime(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0);
}

function formatIcsUtc(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function downloadIcsFile(icsContent: string, filename = "bess-motors-wizyta.ics"): void {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
