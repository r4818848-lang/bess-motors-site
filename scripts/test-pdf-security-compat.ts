import assert from "node:assert/strict";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Security patch compatibility: invoice/work-order PDFs must still be valid.
const doc = new jsPDF({ unit: "mm", format: "a4" });
doc.setFontSize(14);
doc.text("BESS MOTORS - test PDF", 14, 16);
autoTable(doc, {
  startY: 24,
  head: [["Service", "Qty", "Price"]],
  body: [["Oil change", "1", "80.00 PLN"], ["Brake pads", "1", "140.00 PLN"]],
});
const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
assert.ok(typeof finalY === "number" && finalY > 24, "autotable should report final position");
const buffer = Buffer.from(doc.output("arraybuffer"));
assert.ok(buffer.length > 1000, "PDF must have nonempty pages");
assert.equal(buffer.subarray(0, 5).toString("ascii"), "%PDF-", "PDF signature");
assert.ok(buffer.toString("latin1").includes("%%EOF"), "PDF trailer");
console.log("pdf-security-compat OK");
