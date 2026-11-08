import assert from "node:assert/strict";
import { workshopHours } from "../src/lib/businessConfig";
import {
  bookingStartTimes,
  evaluateBookingStart,
  isOpenAt,
  resolveBookingDurationMinutes,
  warsawParts,
} from "../src/lib/workshop-schedule";

const hours = workshopHours();

function at(iso: string): Date {
  return new Date(iso);
}

function check(
  date: string,
  time: string,
  durationMinutes: number | undefined,
  now: string,
  error?: string
) {
  const result = evaluateBookingStart({
    date,
    time,
    durationMinutes,
    now: at(now),
    hours,
  });
  if (error) {
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, error);
    return;
  }
  assert.equal(result.ok, true, `${date} ${time} duration ${durationMinutes}`);
}

const quietMonday = "2026-11-09T06:00:00.000Z";

check("2026-11-09", "09:00", 60, quietMonday);
check("2026-11-09", "17:00", 60, quietMonday);
check("2026-11-09", "18:00", 60, quietMonday, "after_close");
check("2026-11-09", "08:00", 60, quietMonday, "before_open");
check("2026-11-09", "16:00", 120, quietMonday);
check("2026-11-09", "17:00", 120, quietMonday, "after_close");
check("2026-11-14", "09:00", 60, quietMonday);
check("2026-11-14", "13:00", 60, quietMonday);
check("2026-11-14", "14:00", 60, quietMonday, "after_close");
check("2026-11-14", "15:00", 60, quietMonday, "after_close");
check("2026-11-14", "12:00", 120, quietMonday);
check("2026-11-14", "13:00", 120, quietMonday, "after_close");
check("2026-11-15", "10:00", 60, quietMonday, "closed_sunday");
check("2026-11-09", "09:00", 600, quietMonday, "duration_exceeds_hours");
check("2026-11-09", "11:00", 60, "2026-11-09T10:30:00.000Z", "slot_in_past");
check("2026-11-09", "12:00", 60, "2026-11-09T10:30:00.000Z");

assert.equal(resolveBookingDurationMinutes({ serviceIds: ["brakePads"] }), 120);
assert.equal(
  resolveBookingDurationMinutes({ serviceIds: ["oil"], durationMinutes: 30 }),
  60
);
assert.equal(
  resolveBookingDurationMinutes({ serviceIds: ["oil"], durationMinutes: 180 }),
  180
);

const weekdayStarts = bookingStartTimes("2026-11-10", hours, 60, at(quietMonday));
assert.deepEqual(weekdayStarts[0], "09:00");
assert.equal(weekdayStarts.includes("17:00"), true);
assert.equal(weekdayStarts.includes("18:00"), false);
assert.equal(weekdayStarts.includes("08:00"), false);

const saturdayStarts = bookingStartTimes("2026-11-14", hours, 60, at(quietMonday));
assert.deepEqual(saturdayStarts, ["09:00", "10:00", "11:00", "12:00", "13:00"]);
assert.deepEqual(bookingStartTimes("2026-11-15", hours, 60, at(quietMonday)), []);

const longSaturday = bookingStartTimes("2026-11-14", hours, 120, at(quietMonday));
assert.equal(longSaturday.includes("12:00"), true);
assert.equal(longSaturday.includes("13:00"), false);

assert.equal(isOpenAt(at("2026-01-12T08:00:00.000Z"), hours), true);
assert.equal(isOpenAt(at("2026-01-12T07:59:00.000Z"), hours), false);
assert.equal(isOpenAt(at("2026-07-13T07:00:00.000Z"), hours), true);
assert.equal(isOpenAt(at("2026-07-13T06:59:00.000Z"), hours), false);
assert.equal(isOpenAt(at("2026-07-13T16:00:00.000Z"), hours), false);
assert.equal(isOpenAt(at("2026-03-30T07:00:00.000Z"), hours), true);
assert.equal(isOpenAt(at("2026-10-26T08:00:00.000Z"), hours), true);
assert.equal(isOpenAt(at("2026-11-14T12:30:00.000Z"), hours), true);
assert.equal(isOpenAt(at("2026-11-14T13:00:00.000Z"), hours), false);
assert.equal(isOpenAt(at("2026-11-15T10:00:00.000Z"), hours), false);

const winterOpen = warsawParts(at("2026-01-12T08:00:00.000Z"));
assert.equal(winterOpen.dateKey, "2026-01-12");
assert.equal(winterOpen.minutes, 9 * 60);
const summerOpen = warsawParts(at("2026-07-13T07:00:00.000Z"));
assert.equal(summerOpen.dateKey, "2026-07-13");
assert.equal(summerOpen.minutes, 9 * 60);
const beforeSpring = warsawParts(at("2026-03-29T00:30:00.000Z"));
assert.equal(beforeSpring.minutes, 1 * 60 + 30);
const afterFall = warsawParts(at("2026-10-25T01:30:00.000Z"));
assert.equal(afterFall.minutes, 2 * 60 + 30);

console.log("workshop schedule ok");
