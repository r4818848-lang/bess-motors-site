import assert from "node:assert/strict";

function currentMonthKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function shiftMonthKey(month, delta) {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return currentMonthKey(date);
}

// June 1 local must stay June (old UTC bug used May)
const june = new Date(2026, 5, 1, 12, 0, 0);
assert.equal(currentMonthKey(june), "2026-06");

assert.equal(shiftMonthKey("2026-06", -1), "2026-05");
assert.equal(shiftMonthKey("2026-06", 1), "2026-07");
assert.equal(shiftMonthKey("2026-01", -1), "2025-12");

console.log("test-month-key: ok");
