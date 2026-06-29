import {
  mergeCloudDocuments,
  mergeCloudPullIntoLocal,
  mergeServerCloudMutation,
} from "../src/lib/crm-db-merge.ts";
import { bruttoToNetto, normalizePartPrices } from "../src/lib/monthly-parts.ts";

const cloud = {
  users: [{ id: "u1", name: "A", phone: "+48111111111", role: "client", createdAt: "2026-01-01" }],
  vehicles: [],
  workOrders: [],
  appointments: [
    {
      id: "apt-tg",
      userId: "u1",
      date: "2026-06-10",
      time: "10:00",
      createdAt: "2026-06-05T10:00:00Z",
    },
  ],
  mechanics: [],
  expenses: [],
  warehouse: [],
  monthlyParts: [
    {
      id: "mp-old",
      month: "2026-06",
      name: "Old part",
      partNumber: "",
      purchasePrice: 10,
      sellPrice: 20,
      qty: 1,
      createdAt: "2026-06-01T10:00:00Z",
    },
  ],
  monthlyInvoiceParts: [],
  settings: {},
};

const staleBrowser = {
  ...cloud,
  appointments: [],
};

const withoutMarker = mergeCloudDocuments(cloud, staleBrowser);
console.assert(
  withoutMarker.appointments.some((a) => a.id === "apt-tg"),
  "without sync marker must keep cloud appointment"
);

const withMarker = mergeCloudDocuments(cloud, staleBrowser, {
  lastCloudSyncedAt: "2026-06-04T12:00:00Z",
});
console.assert(
  withMarker.appointments.some((a) => a.id === "apt-tg"),
  "with sync marker must keep appointment created after last sync"
);

const newApt = {
  id: "apt-new-web",
  userId: "u1",
  date: "2026-06-15",
  time: "11:00",
  createdAt: "2026-06-12T10:00:00Z",
};
const serverMutated = {
  ...cloud,
  appointments: [...cloud.appointments, newApt],
};
const serverMerged = mergeServerCloudMutation(cloud, serverMutated);
console.assert(
  serverMerged.appointments.some((a) => a.id === "apt-new-web"),
  "server mutation must keep newly inserted appointment"
);

const deletedPart = {
  ...cloud,
  monthlyParts: [],
};
const afterDelete = mergeServerCloudMutation(cloud, deletedPart);
console.assert(
  !afterDelete.monthlyParts?.some((p) => p.id === "mp-old"),
  "server mutation must apply deletions"
);

const guestCall = {
  ...cloud,
  callRequests: [
    {
      id: "call-1",
      phone: "+48123456789",
      clientName: "Test",
      userId: "guest",
      serviceId: "x",
      serviceLabel: "x",
      comment: "",
      status: "needs_call",
      source: "website",
      createdAt: "2026-06-12T10:00:00Z",
    },
  ],
};
const callMerged = mergeServerCloudMutation(cloud, guestCall);
console.assert(
  callMerged.callRequests?.some((c) => c.id === "call-1"),
  "server mutation must keep guest call requests"
);

const withoutCall = { ...guestCall, callRequests: [] };
const afterCallDelete = mergeCloudDocuments(guestCall, withoutCall, {
  lastCloudSyncedAt: "2026-06-04T12:00:00Z",
});
console.assert(
  !afterCallDelete.callRequests?.some((c) => c.id === "call-1"),
  "browser delete must remove call request from cloud"
);

const recentGuestCall = {
  ...guestCall,
  callRequests: [
    {
      ...guestCall.callRequests[0],
      createdAt: "2026-06-20T10:00:00Z",
    },
  ],
};
const afterRecentCallDelete = mergeCloudDocuments(recentGuestCall, withoutCall, {
  lastCloudSyncedAt: "2026-06-04T12:00:00Z",
});
console.assert(
  !afterRecentCallDelete.callRequests?.some((c) => c.id === "call-1"),
  "browser delete must remove recently created call request"
);

const pullLocal = {
  ...cloud,
  monthlyParts: [
    ...cloud.monthlyParts,
    {
      id: "mp-deleted-remote",
      month: "2026-06",
      name: "Gone",
      partNumber: "",
      purchaseBrutto: 50,
      purchaseNetto: 40.65,
      sellBrutto: 80,
      sellNetto: 65.04,
      qty: 1,
      createdAt: "2026-06-02T10:00:00Z",
    },
  ],
  monthlyConsumables: [
    {
      id: "mc-1",
      month: "2026-06",
      name: "Oil",
      partNumber: "",
      purchaseBrutto: 30,
      purchaseNetto: 24.39,
      qty: 1,
      createdAt: "2026-06-03T10:00:00Z",
    },
    {
      id: "mc-gone",
      month: "2026-06",
      name: "Filter",
      partNumber: "",
      purchaseBrutto: 20,
      purchaseNetto: 16.26,
      qty: 1,
      createdAt: "2026-06-03T11:00:00Z",
    },
  ],
};
const pullRemote = {
  ...cloud,
  monthlyConsumables: [pullLocal.monthlyConsumables[0]],
};
const afterPull = mergeCloudPullIntoLocal(pullLocal, pullRemote, {
  lastCloudSyncedAt: "2026-06-04T12:00:00Z",
  remoteUpdatedAt: "2026-06-05T12:00:00Z",
});
console.assert(
  !afterPull.monthlyParts?.some((p) => p.id === "mp-deleted-remote"),
  "pull must drop monthly parts removed in cloud"
);
console.assert(
  !afterPull.monthlyConsumables?.some((p) => p.id === "mc-gone"),
  "pull must drop monthly consumables removed in cloud"
);

const browserWipe = mergeCloudDocuments(
  cloud,
  { ...cloud, monthlyParts: [], monthlyInvoiceParts: [], monthlyConsumables: [] },
  { lastCloudSyncedAt: "2026-06-04T12:00:00Z" }
);
console.assert(
  browserWipe.monthlyParts?.some((p) => p.id === "mp-old"),
  "browser push with empty parts must not wipe cloud monthly parts"
);
console.assert(
  browserWipe.monthlyInvoiceParts?.length === 0,
  "browser push must preserve cloud monthly invoice parts list shape"
);

const firstPull = mergeCloudPullIntoLocal(pullLocal, pullRemote, {
  remoteUpdatedAt: "2026-06-05T12:00:00Z",
});
console.assert(
  !firstPull.monthlyParts?.some((p) => p.id === "mp-deleted-remote"),
  "first pull without sync marker must drop orphan monthly parts"
);

console.assert(bruttoToNetto(123) === 100, "123 brutto -> 100 netto");
const legacy = normalizePartPrices({
  id: "x",
  month: "2026-06",
  name: "x",
  partNumber: "",
  purchasePrice: 100,
  sellPrice: 150,
  qty: 1,
  createdAt: "2026-06-01",
});
console.assert(legacy.purchaseNetto === 100 && legacy.sellNetto === 150, "legacy netto preserved");
const bruttoRow = normalizePartPrices({
  id: "y",
  month: "2026-06",
  name: "y",
  partNumber: "",
  purchaseBrutto: 123,
  purchaseNetto: 99,
  sellBrutto: 246,
  sellNetto: 200,
  qty: 1,
  createdAt: "2026-06-01",
});
console.assert(
  bruttoRow.purchaseNetto === 100 && bruttoRow.sellNetto === 200,
  "brutto input wins over stale stored netto"
);

console.log("crm-merge ok");
