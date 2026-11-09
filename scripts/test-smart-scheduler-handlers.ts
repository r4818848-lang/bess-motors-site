import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { evaluateArrivalTime } from "../src/lib/arrival-window";
import { issueTokenForUser } from "../src/lib/auth";
import type { Database, User } from "../src/lib/store";
import { workshopHours } from "../src/lib/businessConfig";
import { connectLiveCrmCopy } from "../src/lib/smart-scheduler/live-crm";
import { openActorSession } from "../src/lib/smart-scheduler/postgres";
import { retryPendingNotifications } from "../src/lib/smart-scheduler/notification-outbox";
import { splitWorkBlocks } from "../src/lib/smart-scheduler/schedule";
import { POST, DELETE } from "../src/app/api/appointments/route";
import { commitStaffAppointment } from "../src/lib/server/staff-calendar-commit";
import { createQuickAppointment } from "../src/lib/server/telegram-bot/admin-quick-apt";
import { createTelegramBooking } from "../src/lib/server/telegram-bot/client-booking";
import { rescheduleAppointment } from "../src/lib/server/telegram-bot/client-apt-reschedule";

delete process.env.VERCEL_ENV;
delete process.env.SUPABASE_URL;
delete process.env.JWT_SECRET;
delete process.env.SCHEDULER_COPY_FAILPOINT;
delete process.env.SCHEDULER_UNIFIED_CALENDAR;
delete process.env.SCHEDULER_CRM_COPY_URL;
delete process.env.SCHEDULER_CRM_URL;
delete process.env.SCHEDULER_PRODUCTION_DB_PERMIT;

const results: Record<string, string> = {};

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function staffPlan(): { date: string; now: Date } {
  const today = new Date().toISOString().slice(0, 10);
  const weekday = new Date(`${today}T12:00:00.000Z`).getUTCDay();
  const date = weekday === 0 ? addDays(today, 1) : today;
  return { date, now: new Date(`${date}T07:00:00.000Z`) };
}

function publicSlot(): { date: string; time: string } | null {
  const today = new Date().toISOString().slice(0, 10);
  for (let offset = 0; offset < 2; offset++) {
    const date = addDays(today, offset);
    for (const time of ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30"]) {
      if (evaluateArrivalTime({ date, time }).ok) return { date, time };
    }
  }
  return null;
}

async function bootstrap(): Promise<void> {
  const admin = new Client({ connectionString: "postgresql://ubuntu@/postgres?host=/var/run/postgresql" });
  await admin.connect();
  await admin.query("select pg_terminate_backend(pid) from pg_stat_activity where datname = 'bess_crm_copy_test' and pid <> pg_backend_pid()");
  await admin.query("drop database if exists bess_crm_copy_test");
  await admin.query("create database bess_crm_copy_test");
  await admin.end();
}

async function load(client: Client): Promise<Database> {
  const row = await client.query<{ doc: Database }>("select doc from crm_store where id = 'main'");
  return row.rows[0].doc;
}

async function countId(client: Client, id: string): Promise<number> {
  const store = await client.query<{ n: number }>(
    "select count(*)::int as n from crm_store, lateral jsonb_array_elements(doc->'appointments') item where item->>'id' = $1",
    [id]
  );
  const row = await client.query<{ n: number }>("select count(*)::int as n from appointments where id = $1", [id]);
  assert.equal(store.rows[0].n, row.rows[0].n, id);
  return store.rows[0].n;
}

async function main(): Promise<void> {
  await bootstrap();
  const admin = await connectLiveCrmCopy();
  await admin.query("set time zone 'UTC'");
  await admin.query(readFileSync(join(process.cwd(), "supabase/crm_store.sql"), "utf8"));
  await admin.query(readFileSync(join(process.cwd(), "supabase/appointments.sql"), "utf8"));
  await admin.query(readFileSync(join(process.cwd(), "supabase/drafts/smart-scheduler.sql"), "utf8"));
  const seed: Database = {
    users: [],
    vehicles: [],
    workOrders: [],
    appointments: [],
    callRequests: [],
    leads: [],
    vehicleHistory: [],
    warehouse: [],
    monthlyParts: [],
    monthlyInvoiceParts: [],
    monthlyConsumables: [],
    expenses: [],
    mechanics: [
      { id: "mech-1", name: "Сергей", laborPercent: 50, partsPercent: 50, bonusPerOrder: 0 },
      { id: "mech-2", name: "Piotr Nowak", laborPercent: 50, partsPercent: 50, bonusPerOrder: 0 },
    ],
    settings: {
      defaultLaborPercent: 50,
      defaultPartsPercent: 50,
      vatRate: 23,
      vatEnabledByDefault: true,
      autoCreateWorkOrderFromBooking: true,
    },
    passwordResets: [],
    currentUserId: null,
    notifications: [],
    clientRatings: [],
  };
  await admin.query("insert into crm_store (id, doc) values ('main', $1::jsonb)", [JSON.stringify(seed)]);
  const { date, now } = staffPlan();
  const morning = new Date(now.getTime());

  const offTelegram = await createTelegramBooking({
    serviceId: "diagnostic",
    date,
    time: "09:00",
    clientName: "Off Switch",
    clientPhone: "48111000000",
    workStart: "11:20",
    workMinutes: 60,
  });
  const offQuick = await createQuickAppointment({ phone: "+48111000090", date, time: "10:00", comment: "off", clientName: "Off Quick" });
  const offMove = await rescheduleAppointment("apt-missing", 1);
  const offStaff = await commitStaffAppointment({
    mode: "create",
    clientRequestId: "req-off",
    clientName: "Off Staff",
    clientPhone: "48111000091",
    date,
    time: "09:00",
    mechanicId: "mech-1",
  }, morning);
  const offPost = await POST(new Request("http://127.0.0.1/api/appointments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id: "apt-off-web",
      userId: "",
      vehicleId: "",
      serviceIds: ["diagnostic"],
      date,
      time: "10:30",
      mechanicId: "mech-1",
      repairStatus: "received",
      appointmentStatus: "scheduled",
      comment: "off",
      clientName: "Off Web",
      clientPhone: "48111000092",
      source: "website",
      createdAt: new Date().toISOString(),
    }),
  }));
  const offToken = await issueTokenForUser({ id: "admin-test", role: "admin", name: "Admin", phone: "" } as User);
  const offDelete = await DELETE(new Request("http://127.0.0.1/api/appointments?id=apt-off-web", {
    method: "DELETE",
    headers: { authorization: `Bearer ${offToken}` },
  }));
  assert.equal(offTelegram.ok, false);
  assert.equal(offQuick.ok, false);
  assert.equal(offMove.ok, false);
  assert.equal(offStaff.ok, false);
  assert.notEqual(offPost.status, 200);
  assert.notEqual(offDelete.status, 200);
  assert.equal(await countId(admin, "apt-off-web"), 0);
  const beforeOn = await admin.query<{ n: number }>("select count(*)::int as n from appointments");
  assert.equal(beforeOn.rows[0].n, 0);
  results.switchOff = "шесть путей при выключенном флаге не пишут копию";

  const sentinel = {
    id: "apt-sentinel",
    userId: "client-kept",
    vehicleId: "v-kept",
    serviceIds: ["diagnostic"],
    date: "2020-01-02",
    time: "09:00",
    clientName: "Sentinel",
    clientPhone: "+48000000099",
    mechanicId: "mech-1",
    repairStatus: "received",
    appointmentStatus: "completed",
    comment: "не трогать",
    source: "manual",
    createdAt: "2020-01-01T00:00:00.000Z",
  };
  const sentinelJson = JSON.stringify(sentinel);
  await admin.query("update crm_store set doc = jsonb_set(doc, '{appointments}', $1::jsonb) where id = 'main'", [JSON.stringify([sentinel])]);
  await admin.query(
    "insert into appointments (id, client_phone, user_id, doc, created_at) values ($1, $2, $3, $4::jsonb, $5::timestamptz)",
    [sentinel.id, sentinel.clientPhone, sentinel.userId, sentinelJson, "2020-01-01T00:00:00.000Z"]
  );
  const sentinelBefore = await admin.query<{ ctid: string; created_at: Date }>("select ctid::text as ctid, created_at from appointments where id = 'apt-sentinel'");

  process.env.SCHEDULER_UNIFIED_CALENDAR = "on";
  await admin.query("select scheduler_set_unified_calendar(true)");

  const created = await commitStaffAppointment({
    mode: "create",
    clientRequestId: "req-arrival",
    clientName: "Anna Testowa",
    clientPhone: "48111000001",
    make: "Volkswagen",
    model: "Golf",
    plate: "WX0001",
    vin: "WVWZZZTEST000001",
    serviceIds: ["diagnostic"],
    date,
    time: "09:00",
    workStart: "11:20",
    workMinutes: 60,
    pickupDate: addDays(date, 1),
    leavesCar: true,
    mechanicId: "mech-1",
    durationMinutes: 30,
    comment: "przyjazd rano",
  }, morning);
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const arrivalId = created.appointment.id;
  let doc = await load(admin);
  const arrival = doc.appointments.find((item) => item.id === arrivalId);
  assert.ok(arrival);
  assert.equal(arrival.time, "09:00");
  assert.equal(arrival.workStart, "11:20");
  assert.equal(arrival.workMinutes, 60);
  assert.equal(arrival.pickupDate, addDays(date, 1));
  assert.equal(arrival.clientPhone, "+48111000001");
  assert.equal(arrival.clientName, "Anna Testowa");
  assert.notEqual(arrival.userId, "guest");
  assert.ok(arrival.userId);
  const vehicle = doc.vehicles.find((item) => item.id === arrival.vehicleId);
  assert.equal(vehicle?.vin, "WVWZZZTEST000001");
  assert.equal(vehicle?.plate, "WX0001");
  assert.ok(arrival.workOrderId);
  assert.equal(await countId(admin, arrivalId), 1);
  const row = await admin.query<{ client_phone: string; user_id: string }>("select client_phone, user_id from appointments where id = $1", [arrivalId]);
  assert.equal(row.rows[0].client_phone, "+48111000001");
  assert.notEqual(row.rows[0].user_id, "guest");
  assert.ok((doc.notifications ?? []).length > 0 || arrival.adminReminder);
  results.staff = "09:00 приезд, 11:20 ремонт, клиент и заказ-наряд сохранены";

  const parallel = await commitStaffAppointment({
    mode: "create",
    clientRequestId: "req-parallel",
    clientName: "Bartek Testowy",
    clientPhone: "48111000002",
    plate: "WX0002",
    serviceIds: ["diagnostic"],
    date,
    time: "09:00",
    workStart: "11:20",
    workMinutes: 60,
    mechanicId: "mech-2",
    durationMinutes: 30,
  }, new Date(morning.getTime() + 1));
  assert.equal(parallel.ok, true);
  results.parallel = "два механика в 11:20";

  const earlyWork = await commitStaffAppointment({
    mode: "create",
    clientRequestId: "req-early",
    clientName: "Celina Testowa",
    clientPhone: "48111000003",
    plate: "WX0003",
    serviceIds: ["diagnostic"],
    date,
    time: "09:30",
    workStart: "09:00",
    workMinutes: 60,
    mechanicId: "mech-1",
    durationMinutes: 30,
  }, new Date(morning.getTime() + 2));
  assert.equal(earlyWork.ok, true);
  results.parking = "ремонт 09:00 не пересекается с ремонтом 11:20";

  const parked = await commitStaffAppointment({
    mode: "create",
    clientRequestId: "req-parked",
    clientName: "Dawid Testowy",
    clientPhone: "48111000004",
    plate: "WX0004",
    serviceIds: ["diagnostic"],
    date,
    time: "10:00",
    leavesCar: true,
    pickupDate: addDays(date, 2),
    mechanicId: "mech-1",
    durationMinutes: 30,
  }, new Date(morning.getTime() + 3));
  assert.equal(parked.ok, true);
  if (parked.ok) assert.equal(parked.appointment.workStart, undefined);

  const moved = await rescheduleAppointment(arrivalId, 1);
  assert.equal(moved.ok, true);
  doc = await load(admin);
  const movedApt = doc.appointments.find((item) => item.id === arrivalId);
  assert.ok(movedApt);
  assert.notEqual(movedApt.date, date);
  assert.equal(movedApt.time, "09:00");
  assert.equal(movedApt.workStart, "11:20");
  assert.equal(movedApt.clientPhone, "+48111000001");
  results.reschedule = "дата сдвинута, приезд 09:00 и ремонт 11:20 на месте";

  const cancelled = await commitStaffAppointment({ mode: "cancel", id: arrivalId }, new Date(morning.getTime() + 4));
  assert.equal(cancelled.ok, true);
  const replacement = await commitStaffAppointment({
    mode: "create",
    clientRequestId: "req-after-cancel",
    clientName: "Ewa Testowa",
    clientPhone: "48111000005",
    plate: "WX0005",
    serviceIds: ["diagnostic"],
    date: movedApt.date,
    time: "09:00",
    workStart: "11:20",
    workMinutes: 60,
    mechanicId: "mech-1",
    durationMinutes: 30,
  }, new Date(morning.getTime() + 5));
  assert.equal(replacement.ok, true);
  results.cancel = "отмена освободила 11:20";

  const [left, right] = await Promise.all([
    commitStaffAppointment({
      mode: "create",
      clientRequestId: "req-race-left",
      clientName: "Filip Testowy",
      clientPhone: "48111000006",
      plate: "WX0006",
      serviceIds: ["diagnostic"],
      date,
      time: "12:00",
      workStart: "12:30",
      workMinutes: 60,
      mechanicId: "mech-1",
      durationMinutes: 30,
    }, new Date(morning.getTime() + 6)),
    commitStaffAppointment({
      mode: "create",
      clientRequestId: "req-race-right",
      clientName: "Gosia Testowa",
      clientPhone: "48111000007",
      plate: "WX0007",
      serviceIds: ["diagnostic"],
      date,
      time: "12:30",
      workStart: "12:30",
      workMinutes: 60,
      mechanicId: "mech-1",
      durationMinutes: 30,
    }, new Date(morning.getTime() + 7)),
  ]);
  const race = [left, right];
  assert.equal(race.filter((item) => item.ok).length, 1);
  assert.equal(race.filter((item) => !item.ok && item.status === 409).length, 1);
  const digests = await admin.query<{ store: string; row: string }>("select scheduler_live_digest('store') as store, scheduler_live_digest('row') as row");
  assert.equal(digests.rows[0].store, digests.rows[0].row);
  results.race = "одна запись принята, вторая 409";

  const replay = await commitStaffAppointment({
    mode: "create",
    clientRequestId: "req-arrival",
    clientName: "Anna Testowa",
    clientPhone: "48111000001",
    date,
    time: "09:00",
    workStart: "11:20",
    workMinutes: 60,
    mechanicId: "mech-1",
  }, new Date(morning.getTime() + 8));
  assert.equal(replay.ok, true);
  const sends = await admin.query<{ send_count: number }>("select send_count from scheduler_notification_log where event_key = 'staff-create:req-arrival'");
  assert.equal(sends.rows.length, 1);
  assert.equal(sends.rows[0].send_count, 1);
  results.notify = "повтор того же ключа не отправил уведомление второй раз";

  const slot = publicSlot();
  assert.ok(slot, "в ближайшие два дня нет открытого времени приезда");
  if (!slot) return;
  const weekday = new Date(`${slot.date}T12:00:00.000Z`).getUTCDay();
  const websiteWork = weekday === 6 ? {} : { workStart: "16:00", workMinutes: 45 };
  const website = await POST(new Request("http://127.0.0.1/api/appointments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id: "apt-web-1",
      userId: "",
      vehicleId: "",
      serviceIds: ["diagnostic"],
      date: slot.date,
      time: slot.time,
      ...websiteWork,
      mechanicId: "mech-2",
      repairStatus: "received",
      appointmentStatus: "scheduled",
      comment: "strona",
      clientName: "Hania Testowa",
      clientPhone: "48111000008",
      clientPlate: "WX0008",
      source: "website",
      createdAt: new Date().toISOString(),
    }),
  }));
  const websiteBody = await website.json() as { ok?: boolean; error?: string; reason?: string };
  assert.equal(website.status, 200, JSON.stringify(websiteBody));
  doc = await load(admin);
  const webApt = doc.appointments.find((item) => item.id === "apt-web-1");
  assert.equal(webApt?.time, slot.time);
  assert.equal(webApt?.clientPhone, "+48111000008");
  assert.notEqual(webApt?.userId, "guest");
  assert.equal(await countId(admin, "apt-web-1"), 1);
  results.website = `POST ${slot.date} ${slot.time}`;

  const token = await issueTokenForUser({ id: "admin-test", role: "admin", name: "Admin", phone: "" } as User);
  const removed = await DELETE(new Request("http://127.0.0.1/api/appointments?id=apt-web-1", {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  }));
  assert.equal(removed.status, 200);
  assert.equal(await countId(admin, "apt-web-1"), 0);
  results.remove = "DELETE убрал JSON и строку вместе";

  const telegram = await createTelegramBooking({
    serviceId: "diagnostic",
    date: slot.date,
    time: slot.time,
    clientName: "Iga Testowa",
    clientPhone: "48111000009",
    workStart: weekday === 6 ? undefined : "16:45",
    workMinutes: weekday === 6 ? undefined : 45,
    pickupDate: addDays(slot.date, 1),
  });
  assert.equal(telegram.ok, true, telegram.error);
  doc = await load(admin);
  const telegramApt = doc.appointments.find((item) => item.clientPhone === "48111000009");
  assert.equal(telegramApt?.time, slot.time);
  assert.notEqual(telegramApt?.userId, "guest");
  if (weekday !== 6) assert.equal(telegramApt?.workStart, "16:45");
  results.telegram = "createTelegramBooking сохранил телефон и приезд";

  const quickTime = slot.time === "13:30" ? null : "13:30";
  const quick = quickTime
    ? await createQuickAppointment({
      phone: "+48111000010",
      date: slot.date,
      time: quickTime,
      comment: "szybko",
      clientName: "Jan Testowy",
      workStart: weekday === 6 ? undefined : "17:30",
      workMinutes: weekday === 6 ? undefined : 15,
    })
    : null;
  if (quick?.ok) {
    doc = await load(admin);
    const quickApt = doc.appointments.find((item) => item.id === quick.id);
    assert.equal(quickApt?.clientPhone, "+48111000010");
    assert.notEqual(quickApt?.userId, "guest");
    assert.equal(quickApt?.time, quickTime);
    results.quick = "createQuickAppointment";
  } else {
    results.quick = quick ? `отказ ${quick.error}` : "последний слот дня уже занят проверкой других путей";
  }

  const snapshot = await admin.query<{ n: number }>("select count(*)::int as n from appointments");
  process.env.SCHEDULER_COPY_FAILPOINT = "after-store";
  const rolled = await commitStaffAppointment({
    mode: "create",
    clientRequestId: "req-rollback",
    clientName: "Kasia Testowa",
    clientPhone: "48111000011",
    plate: "WX0011",
    serviceIds: ["diagnostic"],
    date,
    time: "13:00",
    workStart: "13:00",
    workMinutes: 45,
    mechanicId: "mech-2",
    durationMinutes: 30,
  }, new Date(morning.getTime() + 9));
  delete process.env.SCHEDULER_COPY_FAILPOINT;
  assert.equal(rolled.ok, false);
  if (!rolled.ok) assert.match(rolled.error, /rolled_back/);
  const afterRollback = await admin.query<{ n: number }>("select count(*)::int as n from appointments");
  assert.equal(afterRollback.rows[0].n, snapshot.rows[0].n);
  assert.equal(await countId(admin, "req-rollback"), 0);
  results.rollback = "after-store откатился, число строк не изменилось";

  const sentinelAfter = await admin.query<{ ctid: string; created_at: Date; client_phone: string; user_id: string; comment: string }>(
    "select ctid::text as ctid, created_at, client_phone, user_id, doc->>'comment' as comment from appointments where id = 'apt-sentinel'"
  );
  assert.equal(sentinelAfter.rows[0].ctid, sentinelBefore.rows[0].ctid);
  assert.equal(sentinelAfter.rows[0].created_at.toISOString(), sentinelBefore.rows[0].created_at.toISOString());
  assert.equal(sentinelAfter.rows[0].client_phone, "+48000000099");
  assert.equal(sentinelAfter.rows[0].user_id, "client-kept");
  assert.equal(sentinelAfter.rows[0].comment, "не трогать");
  results.preserve = "чужая строка, created_at и телефон не перезаписаны";

  const resourceDate = "2026-12-01";
  const shared = await commitStaffAppointment({
    mode: "create",
    clientRequestId: "req-two-resources",
    clientName: "Nina Testowa",
    clientPhone: "48111000021",
    plate: "WX0021",
    serviceIds: ["diagnostic"],
    date: resourceDate,
    time: "09:00",
    workStart: "10:00",
    workMinutes: 60,
    mechanicId: "mech-1",
    resourceIds: ["lift-1", "tyre-1"],
    durationMinutes: 30,
  }, new Date(morning.getTime() + 20));
  assert.equal(shared.ok, true);
  if (shared.ok) {
    const stored = shared.appointment as typeof shared.appointment & { resourceId?: string; resourceIds?: string[] };
    assert.equal(stored.resourceId, "lift-1");
    assert.deepEqual(stored.resourceIds, ["lift-1", "tyre-1"]);
  }
  const blockedResource = await commitStaffAppointment({
    mode: "create",
    clientRequestId: "req-shared-tyre",
    clientName: "Ola Testowa",
    clientPhone: "48111000022",
    plate: "WX0022",
    serviceIds: ["diagnostic"],
    date: resourceDate,
    time: "09:30",
    workStart: "10:00",
    workMinutes: 60,
    mechanicId: "mech-2",
    resourceIds: ["tyre-1"],
    durationMinutes: 30,
  }, new Date(morning.getTime() + 21));
  assert.equal(blockedResource.ok, false);
  const otherResource = await commitStaffAppointment({
    mode: "create",
    clientRequestId: "req-balancer",
    clientName: "Piotr Testowy",
    clientPhone: "48111000023",
    plate: "WX0023",
    serviceIds: ["diagnostic"],
    date: resourceDate,
    time: "10:00",
    workStart: "11:00",
    workMinutes: 60,
    mechanicId: "mech-2",
    resourceId: "balancer-1",
    durationMinutes: 30,
  }, new Date(morning.getTime() + 22));
  assert.equal(otherResource.ok, true);
  results.resources = "два ресурса пересекаются, третий ресурс свободен";

  const parkedWork = await commitStaffAppointment({
    mode: "create",
    clientRequestId: "req-hold-update",
    clientName: "Roma Testowa",
    clientPhone: "48111000024",
    plate: "WX0024",
    serviceIds: ["diagnostic"],
    date: resourceDate,
    time: "12:00",
    workStart: "16:00",
    workMinutes: 60,
    mechanicId: "mech-2",
    durationMinutes: 30,
  }, new Date(morning.getTime() + 23));
  assert.equal(parkedWork.ok, true);
  if (!parkedWork.ok) return;
  const hold = splitWorkBlocks({
    id: "hold-existing",
    date: resourceDate,
    start: "14:00",
    minutes: 60,
    hours: workshopHours(),
    mechanicId: "mech-2",
    resourceIds: ["lift-2"],
    operationCode: "MA-001",
  });
  assert.equal(hold.ok, true);
  if (!hold.ok) return;
  const actor = await openActorSession(admin, { role: "owner", staffId: "owner-1", canEdit: true });
  await admin.query("select set_config('app.actor_session', $1, false)", [actor.sessionId]);
  await admin.query(
    "insert into scheduler_reservations (id, idempotency_key, request_fingerprint, operation_code, mechanic_id, parts_status) values ('res-existing', 'res-existing', 'res-existing', 'MA-001', 'mech-2', 'available')"
  );
  await admin.query(
    "insert into scheduler_holds (id, reservation_id, mechanic_id, operation_code, start_at, end_at, active) values ('hold-existing', 'res-existing', 'mech-2', 'MA-001', to_timestamp($1 / 1000.0), to_timestamp($2 / 1000.0), true)",
    [hold.blocks[0].startMs, hold.blocks[0].endMs]
  );
  const movedIntoHold = await commitStaffAppointment({
    mode: "update",
    id: parkedWork.appointment.id,
    clientName: "Roma Testowa",
    clientPhone: "48111000024",
    date: resourceDate,
    time: "12:00",
    workStart: "14:00",
    workMinutes: 60,
    mechanicId: "mech-2",
    durationMinutes: 30,
  }, new Date(morning.getTime() + 24));
  assert.equal(movedIntoHold.ok, false);
  const commentOnly = await commitStaffAppointment({
    mode: "update",
    id: parkedWork.appointment.id,
    clientName: "Roma Testowa",
    clientPhone: "48111000024",
    comment: "комментарий без переноса",
    date: resourceDate,
    time: "12:00",
    workStart: "16:00",
    workMinutes: 60,
    mechanicId: "mech-2",
    durationMinutes: 30,
  }, new Date(morning.getTime() + 25));
  assert.equal(commentOnly.ok, true);
  const holdStill = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_holds where id = 'hold-existing' and active");
  assert.equal(holdStill.rows[0].n, 1);
  results.schedulerHold = "перенос в бронь планировщика отклонён, комментарий сохранён";

  await admin.query("insert into scheduler_notification_log (event_key, status) values ('retry-demo', 'pending')");
  let attempts = 0;
  const firstRetry = await retryPendingNotifications(admin, async () => {
    attempts += 1;
    throw new Error("provider down");
  });
  assert.equal(firstRetry, 0);
  assert.equal(attempts, 1);
  const pending = await admin.query<{ status: string; attempt_count: number; history: number }>(
    "select status, attempt_count, jsonb_array_length(error_history) as history from scheduler_notification_log where event_key = 'retry-demo'"
  );
  assert.equal(pending.rows[0].status, "pending");
  assert.equal(pending.rows[0].attempt_count, 1);
  assert.equal(pending.rows[0].history, 1);
  await admin.query("update scheduler_notification_log set next_attempt_at = now() where event_key = 'retry-demo'");
  const secondRetry = await retryPendingNotifications(admin, async () => {
    attempts += 1;
  });
  assert.equal(secondRetry, 1);
  const sent = await admin.query<{ status: string; send_count: number }>("select status, send_count from scheduler_notification_log where event_key = 'retry-demo'");
  assert.equal(sent.rows[0].status, "sent");
  assert.equal(sent.rows[0].send_count, 1);
  const third = await retryPendingNotifications(admin, async () => {
    attempts += 1;
  });
  assert.equal(third, 0);
  assert.equal(attempts, 2);
  results.notifyRetry = "повтор после сбоя один раз, затем статус sent";

  await admin.query(
    "insert into scheduler_notification_log (event_key, status, attempt_count, locked_until) values ('retry-stale', 'sending', 1, now() - interval '1 minute')"
  );
  const recovered = await retryPendingNotifications(admin, async () => undefined);
  assert.equal(recovered, 1);
  const stale = await admin.query<{ status: string }>("select status from scheduler_notification_log where event_key = 'retry-stale'");
  assert.equal(stale.rows[0].status, "sent");
  results.restart = "просроченная отправка подхвачена после перезапуска";

  await admin.query("insert into scheduler_notification_log (event_key, status) values ('race-note', 'pending')");
  const claimLeft = new Client({ connectionString: "postgresql://ubuntu@/bess_crm_copy_test?host=/var/run/postgresql" });
  const claimRight = new Client({ connectionString: "postgresql://ubuntu@/bess_crm_copy_test?host=/var/run/postgresql" });
  await claimLeft.connect();
  await claimRight.connect();
  const [claimedLeft, claimedRight] = await Promise.all([
    claimLeft.query("select event_key from scheduler_claim_notification('left', 'race-note')"),
    claimRight.query("select event_key from scheduler_claim_notification('right', 'race-note')"),
  ]);
  assert.equal((claimedLeft.rowCount ?? 0) + (claimedRight.rowCount ?? 0), 1);
  await claimLeft.end();
  await claimRight.end();
  results.claim = "два соединения забрали одно уведомление";

  await admin.query("begin");
  await admin.query("set local role scheduler_reader");
  const readable = await admin.query<{ n: number }>("select count(*)::int as n from appointments");
  const visibleResources = await admin.query<{ n: number }>("select count(*)::int as n from scheduler_resources");
  assert.ok(readable.rows[0].n > 0);
  assert.ok(visibleResources.rows[0].n >= 6);
  let readerDenied = false;
  try {
    await admin.query("insert into appointments (id, client_phone, user_id, doc) values ('apt-reader', '', '', '{}'::jsonb)");
  } catch (error) {
    readerDenied = typeof error === "object" && error !== null && "code" in error && error.code === "42501";
  }
  await admin.query("rollback");
  assert.equal(readerDenied, true);
  results.readOnly = "роль чтения видит расписание и не может писать";

  process.env.SCHEDULER_CRM_COPY_URL = "postgresql://ubuntu@127.0.0.1:1/bess_crm_copy_test";
  const disconnected = await commitStaffAppointment({
    mode: "create",
    clientRequestId: "req-down",
    clientName: "Disconnect",
    clientPhone: "48111000031",
    date: resourceDate,
    time: "13:00",
    workStart: "13:00",
    workMinutes: 30,
    mechanicId: "mech-1",
  }, new Date(morning.getTime() + 31));
  delete process.env.SCHEDULER_CRM_COPY_URL;
  assert.equal(disconnected.ok, false);
  if (!disconnected.ok) assert.equal(disconnected.status, 503);
  const disconnectedDoc = await load(admin);
  assert.equal(disconnectedDoc.appointments.some((item) => item.clientRequestId === "req-down"), false);
  results.disconnect = "при включённом режиме сбой базы вернул 503 и ничего не записал";

  await admin.query("update appointments set doc = jsonb_set(doc, '{workStart}', '\"12:05\"') where client_phone like '%111000002'");
  const refused = await commitStaffAppointment({
    mode: "create",
    clientRequestId: "req-diverged",
    clientName: "Lena Testowa",
    clientPhone: "48111000012",
    plate: "WX0012",
    serviceIds: ["diagnostic"],
    date,
    time: "13:30",
    workStart: "13:30",
    workMinutes: 15,
    mechanicId: "mech-2",
    durationMinutes: 30,
  }, new Date(morning.getTime() + 10));
  assert.equal(refused.ok, false);
  if (!refused.ok) assert.match(refused.error, /расходятся/);
  assert.equal(await countId(admin, "req-diverged"), 0);
  results.diverge = "сохранение запрещено, причина показана";

  delete process.env.SCHEDULER_UNIFIED_CALENDAR;
  await admin.query("select scheduler_set_unified_calendar(false)");
  const offAgain = await createTelegramBooking({
    serviceId: "diagnostic",
    date: slot.date,
    time: slot.time,
    clientName: "Maja Testowa",
    clientPhone: "48111000013",
  });
  assert.equal(offAgain.ok, false);
  doc = await load(admin);
  assert.equal(doc.appointments.some((item) => item.clientPhone === "48111000013"), false);
  results.switchOffAgain = "после выключения новый путь не пишет";

  console.log(JSON.stringify(results, null, 2));
  console.log("smart scheduler handlers ok");
  await admin.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
