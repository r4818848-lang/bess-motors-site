import {
  displayClientFacingTotal,
  grossToNet,
  storeUnitPriceFromDisplay,
  usesGrossEntry,
} from "../src/lib/crm-display-price.ts";

console.assert(usesGrossEntry("net", true) === true, "VAT on => brutto entry");
console.assert(usesGrossEntry("gross", false) === false, "VAT off => netto entry");

const stored = storeUnitPriceFromDisplay(650, "net", 23, true);
console.assert(stored === grossToNet(650, 23), "650 brutto stores as netto");

const order = {
  vatEnabled: true,
  orderDiscount: 0,
  services: [{ name: "Work", qty: 1, price: stored, discount: 0 }],
  parts: [],
};
const clientTotal = displayClientFacingTotal(order, 23);
console.assert(
  Math.abs(clientTotal - 650) < 0.02,
  `client total ~ entered brutto (got ${clientTotal})`
);

import { calcGrossClientTotal } from "../src/lib/workorder-calc.ts";

const twoJobs = {
  vatEnabled: true,
  orderDiscount: 0,
  services: [
    {
      name: "A",
      qty: 1,
      price: storeUnitPriceFromDisplay(150, "gross", 23, true),
      discount: 0,
    },
    {
      name: "B",
      qty: 1,
      price: storeUnitPriceFromDisplay(500, "gross", 23, true),
      discount: 0,
    },
  ],
  parts: [],
};
console.assert(
  calcGrossClientTotal(twoJobs, 23) === 650,
  `150 + 500 brutto must be 650 (got ${calcGrossClientTotal(twoJobs, 23)})`
);

console.log("crm-display-price ok");
