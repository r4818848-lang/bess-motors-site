import {
  KNOWN_CRM_SCREENSHOTS,
  parseMotowarsztatCrmScreenshotText,
} from "../src/lib/motowarsztat-crm-screenshot-parser.ts";
import { enrichWorkOrderFromScreenshot } from "../src/lib/enrich-work-order-from-screenshot.ts";
import { storeUnitPriceFromDisplay } from "../src/lib/crm-display-price.ts";

const snap = KNOWN_CRM_SCREENSHOTS["ZL 16/06/2026"];
const order = {
  id: "wo-test",
  number: "ZL 16/06/2026",
  userId: "u1",
  vehicleId: "v1",
  status: "delivered",
  vatEnabled: true,
  orderDiscount: 0,
  services: [
    { id: "s1", name: "Wymiana przewodu hamulcowego", qty: 1, price: storeUnitPriceFromDisplay(200, "gross", 23, true), discount: 0 },
    { id: "s2", name: "Naprawa przebitej opony", qty: 1, price: storeUnitPriceFromDisplay(80, "gross", 23, true), discount: 0 },
  ],
  parts: [
    {
      id: "p1",
      name: "Przewód hamulcowy elastyczny",
      qty: 1,
      sellPrice: storeUnitPriceFromDisplay(150, "gross", 23, true),
      purchasePrice: 0,
      discount: 0,
    },
  ],
  mechanicId: "m1",
  mechanicLaborPercent: -1,
  mechanicPartsPercent: -1,
  internalNotes: "",
  clientNotes: "",
  files: [],
  createdAt: "2026-06-15",
  updatedAt: "2026-06-15",
  confirmationStatus: "confirmed",
};

const result = enrichWorkOrderFromScreenshot(order, snap, 23);
console.log(JSON.stringify(result, null, 2));
console.assert(result.updates.some((u) => u.fields.includes("partNumber")), "part number");
console.assert(result.updates.some((u) => u.fields.includes("purchasePrice")), "purchase");
console.log("enrich test ok");

const parsed = parseMotowarsztatCrmScreenshotText("ZL 20/06/2026 Volkswagen");
console.assert(parsed.orderNumber === "ZL 20/06/2026", "known order parse");
console.assert(parsed.parts.length === 4, "known parts");
