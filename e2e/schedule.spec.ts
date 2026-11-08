import { expect, test } from "@playwright/test";

type Slot = { date: string; time: string; available: boolean };

function weekday(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

function nextDate(targetWeekday: number): string {
  const start = new Date();
  for (let add = 2; add < 21; add += 1) {
    const day = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + add, 12));
    if (day.getUTCDay() === targetWeekday) return day.toISOString().slice(0, 10);
  }
  throw new Error(`no weekday ${targetWeekday}`);
}

async function slots(request: import("@playwright/test").APIRequestContext, query = "days=21"): Promise<Slot[]> {
  const res = await request.get(`/api/appointments/availability?${query}`);
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { slots?: Slot[] };
  return body.slots ?? [];
}

test("arrival slots are Monday to Saturday 09:00-13:30", async ({ request }) => {
  const rows = await slots(request);
  const dates = [...new Set(rows.map((row) => row.date))];
  for (const date of dates) {
    expect(weekday(date)).not.toBe(0);
  }

  const saturday = [...dates].reverse().find((date) => weekday(date) === 6);
  const monday = [...dates].reverse().find((date) => weekday(date) === 1);
  expect(saturday).toBeTruthy();
  expect(monday).toBeTruthy();

  const saturdayTimes = rows.filter((row) => row.date === saturday).map((row) => row.time);
  expect(saturdayTimes).toContain("09:00");
  expect(saturdayTimes).toContain("13:30");
  expect(saturdayTimes).not.toContain("14:00");

  const weekdayTimes = rows.filter((row) => row.date === monday).map((row) => row.time);
  expect(weekdayTimes).toEqual([
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
  ]);
});

test("a long repair does not remove later arrival slots", async ({ request }) => {
  const rows = await slots(request, "days=21&duration=120");
  const dates = [...new Set(rows.map((row) => row.date))];
  const monday = [...dates].reverse().find((date) => weekday(date) === 1);
  expect(monday).toBeTruthy();
  const weekdayTimes = rows.filter((row) => row.date === monday).map((row) => row.time);
  expect(weekdayTimes).toContain("13:30");
});

test("API rejects closed and overrun times", async ({ request }) => {
  const monday = nextDate(1);
  const saturday = nextDate(6);
  const sunday = nextDate(0);

  const cases: { date: string; time: string; durationMinutes?: number; error: string }[] = [
    { date: monday, time: "08:00", error: "before_open" },
    { date: monday, time: "14:00", error: "after_close" },
    { date: monday, time: "17:00", durationMinutes: 120, error: "after_close" },
    { date: saturday, time: "14:00", error: "after_close" },
    { date: sunday, time: "10:00", error: "closed_sunday" },
  ];

  for (const item of cases) {
    const res = await request.post("/api/appointments", {
      data: {
        id: `apt-schedule-reject-${item.date}-${item.time}`,
        date: item.date,
        time: item.time,
        durationMinutes: item.durationMinutes,
        clientPhone: "+48111222333",
        clientName: "Schedule test",
        serviceIds: ["diagnostic"],
        comment: "schedule rejection test",
      },
    });
    expect(res.status(), `${item.date} ${item.time}`).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe(item.error);
  }
});
