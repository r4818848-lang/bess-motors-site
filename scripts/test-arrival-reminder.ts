import assert from "node:assert/strict";
import { mergeCloudDocuments, mergeServerCloudMutation } from "../src/lib/crm-db-merge";
import {
  planArrivalReminder,
  arrivalReminderKey,
} from "../src/lib/arrival-reminder";
import { deliverAdminArrivalReminders } from "../src/lib/server/telegram-cron/admin-arrival-reminders";
import { calendarOpenKeyboard } from "../src/lib/server/telegram-bot/staff-calendar-bot";
import { mergeStoredDb, type Appointment, type Database } from "../src/lib/store";
import { warsawCivilToUtc, warsawParts } from "../src/lib/workshop-schedule";

function visit(patch: Partial<Appointment> = {}): Appointment {
  return {
    id: "apt-opel",
    userId: "client-1",
    vehicleId: "v-1",
    serviceIds: ["tire_change"],
    date: "2026-07-13",
    time: "09:00",
    mechanicId: "mech-1",
    repairStatus: "received",
    appointmentStatus: "scheduled",
    visitState: "expected",
    comment: "test",
    clientName: "Secret Client",
    clientPhone: "+49999111222",
    clientPlate: "WX99999",
    source: "telegram",
    createdAt: "2026-07-01T08:00:00.000Z",
    ...patch,
  };
}

function crm(apt: Appointment): Database {
  return mergeStoredDb({
    appointments: [apt],
    users: [],
    vehicles: [{
      id: "v-1",
      userId: "client-1",
      vin: "",
      plate: "WX99999",
      mileage: 0,
      make: "Opel",
      model: "Astra",
      engine: "",
      trim: "",
      power: "",
      transmission: "",
      year: "2004",
    }],
    mechanics: [{ id: "mech-1", name: "Piotr", laborPercent: 50, partsPercent: 50, bonusPerOrder: 0 }],
  });
}

function casStore(initial: Database) {
  let doc = structuredClone(initial);
  let version = 0;
  return {
    current: () => doc,
    load: async () => structuredClone(doc),
    mutate: async (change: (db: Database) => void) => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const seen = version;
        const next = structuredClone(doc);
        change(next);
        await Promise.resolve();
        if (version !== seen) continue;
        doc = next;
        version += 1;
        return true;
      }
      return false;
    },
  };
}

async function sendCount(
  store: ReturnType<typeof casStore>,
  now: Date,
  send: (chatId: string) => Promise<boolean> | boolean = async () => true
): Promise<number> {
  let calls = 0;
  await deliverAdminArrivalReminders({
    now,
    adminChatIds: ["1001"],
    store,
    send: async (chatId) => {
      calls += 1;
      return send(chatId);
    },
  });
  return calls;
}

function claimStatus(store: ReturnType<typeof casStore>, apt: Appointment): string | undefined {
  const key = arrivalReminderKey(apt.id, apt.date, apt.time);
  return store.current().settings.arrivalReminderClaims?.[key]?.status;
}

async function main(): Promise<void> {
  const arrival = warsawCivilToUtc("2026-07-13", "09:00");
  assert.ok(arrival);
  const due = new Date(arrival.getTime() - 2 * 60 * 60 * 1000);
  const logs: string[] = [];
  const original = console.info;
  console.info = (...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  };

  try {
    const apt = visit();
    const store = casStore(crm(apt));
    let total = 0;
    for (let i = 0; i < 10; i += 1) total += await sendCount(store, due);
    assert.equal(total, 1);
    assert.equal(claimStatus(store, apt), "sent");

    const parallel = casStore(crm(visit({ id: "apt-parallel" })));
    const together = await Promise.all([
      sendCount(parallel, due),
      sendCount(parallel, due),
    ]);
    assert.equal(together.reduce((sum, n) => sum + n, 0), 1);
    assert.equal(Object.keys(parallel.current().settings.arrivalReminderClaims ?? {}).length, 1);

    for (const [label, patch] of [
      ["arrived", { visitState: "arrived" as const }],
      ["in_progress", { appointmentStatus: "in_progress" as const }],
      ["completed", { appointmentStatus: "completed" as const }],
      ["cancelled", { appointmentStatus: "cancelled" as const }],
      ["no_show", { visitState: "no_show" as const }],
      ["work_started", { repairStatus: "repair" as const }],
    ] as const) {
      const blocked = casStore(crm(visit({ id: `apt-${label}`, ...patch })));
      assert.equal(await sendCount(blocked, due), 0, label);
      assert.equal(claimStatus(blocked, visit({ id: `apt-${label}` })), undefined, label);
    }

    const moved = visit({ id: "apt-move" });
    const moveStore = casStore(crm(moved));
    assert.equal(await sendCount(moveStore, due), 1);
    const oldKey = arrivalReminderKey(moved.id, moved.date, moved.time);
    moveStore.current().appointments[0].time = "12:00";
    moveStore.current().appointments[0].comment = "перенос";
    assert.equal(await sendCount(moveStore, due), 0);
    assert.equal(moveStore.current().settings.arrivalReminderClaims?.[oldKey]?.status, "sent");
    const newArrival = warsawCivilToUtc("2026-07-13", "12:00");
    assert.ok(newArrival);
    const newDue = new Date(newArrival.getTime() - 2 * 60 * 60 * 1000);
    assert.equal(await sendCount(moveStore, newDue), 1);
    assert.equal(await sendCount(moveStore, newDue), 0);
    assert.equal(await sendCount(moveStore, new Date(newDue.getTime() + 5 * 60 * 1000)), 0);

    const late = casStore(crm(visit({
      id: "apt-late",
      createdAt: new Date(due.getTime() + 60 * 1000).toISOString(),
    })));
    assert.equal(await sendCount(late, new Date(due.getTime() + 2 * 60 * 1000)), 0);
    assert.equal(claimStatus(late, visit({ id: "apt-late" })), undefined);

    const edited = casStore(crm(visit({ id: "apt-edit" })));
    assert.equal(await sendCount(edited, due), 1);
    const beforeKeys = Object.keys(edited.current().settings.arrivalReminderClaims ?? {}).sort();
    edited.current().appointments[0].comment = "other field";
    edited.current().appointments[0].clientName = "Another Name";
    edited.current().appointments[0].clientPhone = "+48000000000";
    edited.current().appointments[0].adminReminder = undefined;
    assert.equal(await sendCount(edited, due), 0);
    assert.deepEqual(Object.keys(edited.current().settings.arrivalReminderClaims ?? {}).sort(), beforeKeys);

    const restarted = casStore(structuredClone(edited.current()));
    assert.equal(await sendCount(restarted, due), 0);

    let timeoutCalls = 0;
    const timedOut = casStore(crm(visit({ id: "apt-timeout" })));
    const timeoutStore = timedOut;
    await deliverAdminArrivalReminders({
      now: due,
      adminChatIds: ["1001"],
      store: timeoutStore,
      send: async () => {
        timeoutCalls += 1;
        throw new Error("telegram timeout");
      },
    });
    assert.equal(timeoutCalls, 1);
    assert.equal(claimStatus(timeoutStore, visit({ id: "apt-timeout" })), "failed");
    assert.equal(await sendCount(timeoutStore, due, async () => true), 0);
    assert.equal(await sendCount(timeoutStore, new Date(due.getTime() + 5 * 60 * 1000), async () => true), 0);
    assert.equal(timeoutCalls, 1);

    const lost = casStore(crm(visit({ id: "apt-lost" })));
    let lostCalls = 0;
    await deliverAdminArrivalReminders({
      now: due,
      adminChatIds: ["1001"],
      store: lost,
      send: async () => {
        lostCalls += 1;
        return false;
      },
    });
    assert.equal(lostCalls, 1);
    assert.equal(await sendCount(lost, due), 0);
    assert.equal(lostCalls, 1);

    const opelDue = warsawCivilToUtc("2026-11-11", "09:00");
    const opelArrival = warsawCivilToUtc("2026-11-11", "11:00");
    assert.ok(opelDue && opelArrival);
    assert.equal(opelArrival.getTime() - opelDue.getTime(), 2 * 60 * 60 * 1000);
    const opel = casStore(crm(visit({
      id: "apt-astra",
      date: "2026-11-11",
      time: "11:00",
      createdAt: "2026-11-01T08:00:00.000Z",
    })));
    for (const clock of ["10:20", "10:25", "10:30", "10:35"]) {
      const instant = warsawCivilToUtc("2026-11-11", clock);
      assert.ok(instant);
      assert.equal(await sendCount(opel, instant), 0, clock);
    }
    opel.current().appointments[0].visitState = "arrived";
    assert.equal(await sendCount(opel, opelDue), 0);

    const springArrival = warsawCivilToUtc("2026-03-30", "11:00");
    const springDue = warsawCivilToUtc("2026-03-30", "09:00");
    const autumnArrival = warsawCivilToUtc("2026-10-26", "11:00");
    const autumnDue = warsawCivilToUtc("2026-10-26", "09:00");
    assert.ok(springArrival && springDue && autumnArrival && autumnDue);
    assert.equal(springArrival.getTime() - springDue.getTime(), 2 * 60 * 60 * 1000);
    assert.equal(autumnArrival.getTime() - autumnDue.getTime(), 2 * 60 * 60 * 1000);
    assert.equal(warsawCivilToUtc("2026-03-29", "02:30"), null);
    const gapVisit = {
      id: "apt-gap",
      date: "2026-03-29",
      time: "04:00",
      appointmentStatus: "scheduled",
      createdAt: "2026-03-01T00:00:00.000Z",
    };
    const gapArrival = warsawCivilToUtc("2026-03-29", "04:00");
    assert.ok(gapArrival);
    const gapDue = new Date(gapArrival.getTime() - 2 * 60 * 60 * 1000);
    assert.equal(planArrivalReminder(gapVisit, gapDue).reason, null);
    assert.equal(planArrivalReminder(gapVisit, new Date(gapDue.getTime() + 10 * 60 * 1000)).reason, "window_passed");
    assert.equal(warsawParts(gapDue).dateKey, "2026-03-29");
    assert.notEqual(warsawParts(gapDue).minutes, 2 * 60 + 30);
    assert.ok(warsawCivilToUtc("2026-10-25", "02:30"));

    const remembered = mergeStoredDb({});
    remembered.settings.arrivalReminderClaims = {
      "apt-keep|admin_two_hour|2026-07-13|09:00": {
        key: "apt-keep|admin_two_hour|2026-07-13|09:00",
        appointmentId: "apt-keep",
        reminderType: "admin_two_hour",
        scheduledAt: due.toISOString(),
        date: "2026-07-13",
        time: "09:00",
        status: "sent",
        claimedAt: due.toISOString(),
        sentAt: due.toISOString(),
        attemptCount: 1,
      },
    };
    const browser = mergeStoredDb({});
    browser.appointments = [visit({ id: "apt-keep", comment: "phone only" })];
    const fromBrowser = mergeCloudDocuments(remembered, browser);
    assert.equal(
      fromBrowser.settings.arrivalReminderClaims?.["apt-keep|admin_two_hour|2026-07-13|09:00"]?.status,
      "sent"
    );
    const editor = structuredClone(remembered);
    editor.settings = { ...editor.settings, morningDigestDate: "2026-11-11" };
    delete editor.settings.arrivalReminderClaims;
    const fromServer = mergeServerCloudMutation(remembered, editor);
    assert.equal(fromServer.settings.morningDigestDate, "2026-11-11");
    assert.equal(
      fromServer.settings.arrivalReminderClaims?.["apt-keep|admin_two_hour|2026-07-13|09:00"]?.status,
      "sent"
    );

    const blob = logs.join("\n");
    assert.equal(blob.includes("+49999111222"), false);
    assert.equal(blob.includes("Secret Client"), false);
    assert.equal(blob.includes("WX99999"), false);
    assert.match(blob, /"reminderType":"admin_two_hour"/);
    assert.match(blob, /"dedupeReason":"telegram_uncertain_no_retry"/);

    const buttons = JSON.stringify(calendarOpenKeyboard("apt-opel"));
    assert.match(buttons, /Открыть запись/);
    assert.match(buttons, /Календарь/);
  } finally {
    console.info = original;
  }

  console.log("arrival reminder ok");
}

void main();
