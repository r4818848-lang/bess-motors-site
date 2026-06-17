import assert from "node:assert/strict";

function callbackPage(data, prefix) {
  if (!data.startsWith(prefix)) return 0;
  return Number.parseInt(data.slice(prefix.length), 10) || 0;
}

// Bug: slice(10) on "parts:delp:1" → ":1" → NaN → page 0
assert.equal(callbackPage("parts:delp:1", "parts:delp:"), 1);
assert.equal(callbackPage("parts:delp:0", "parts:delp:"), 0);
assert.equal(callbackPage("cons:delp:2", "cons:delp:"), 2);

const wrong = Number.parseInt("parts:delp:1".slice(10), 10) || 0;
assert.equal(wrong, 0, "old slice(10) must stay broken (regression guard)");

console.log("test-telegram-callback-parse: ok");
