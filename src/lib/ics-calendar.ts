export function buildIcsEvent(opts: {
  title: string;
  date: string;
  time: string;
  durationMinutes?: number;
  description?: string;
  location?: string;
}): string {
  const [hh, mm] = opts.time.split(":").map(Number);
  const start = new Date(`${opts.date}T12:00:00`);
  start.setHours(hh || 10, mm || 0, 0, 0);
  const end = new Date(start.getTime() + (opts.durationMinutes ?? 60) * 60 * 1000);
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z/, "Z");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BESS MOTORS//Booking//EN",
    "BEGIN:VEVENT",
    `UID:bess-${opts.date}-${opts.time}@bess-motors.com`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${opts.title.replace(/\n/g, " ")}`,
    opts.description ? `DESCRIPTION:${opts.description.replace(/\n/g, "\\n")}` : "",
    opts.location ? `LOCATION:${opts.location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

export function buildBookingIcs(opts: {
  title: string;
  description?: string;
  location?: string;
  date: string;
  time: string;
}): string {
  return buildIcsEvent({
    title: opts.title,
    date: opts.date,
    time: opts.time,
    description: opts.description,
    location: opts.location,
  });
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadIcsFile(content: string, filename = "bess-motors-wizyta.ics"): void {
  downloadIcs(filename, content);
}
