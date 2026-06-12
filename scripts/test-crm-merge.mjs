import { mergeCloudDocuments, mergeServerCloudMutation } from "../src/lib/crm-db-merge.ts";

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

console.log("crm-merge ok");
