import { mergeCloudDocuments } from "../src/lib/crm-db-merge.ts";

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

console.log("crm-merge ok");
