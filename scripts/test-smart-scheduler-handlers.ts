import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { evaluateArrivalTime } from "../src/lib/arrival-window";
import { issueTokenForUser } from "../src/lib/auth";
import type { Database, User } from "../src/lib/store";
import { connectLiveCrmCopy } from "../src/lib/smart-scheduler/live-crm";
import { POST, DELETE } from "../src/app/api/appointments/route";
import { commitStaffAppointment } from "../src/lib/server/staff-calendar-commit";
import { createQuickAppointment } from "../src/lib/server/telegram-bot/admin-quick-apt";
import { createTelegramBooking } from "../src/lib/server/telegram-bot/client-booking";
import { rescheduleAppointment } from "../src/lib/server/telegram-bot/client-apt-reschedule";

delete process.env.VERCEL_ENV;
delete process.env.SUPABASE_URL;
delete process.env.JWT_SECRET;
delete process.env.SCHEDULER_COPY_FAILPOINT;

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

  const off = await createTelegramBooking({
    serviceId: "diagnostic",
    date,
    time: "09:00",
    clientName: "Off Switch",
    clientPhone: "48111000000",
    workStart: "11:20",
    workMinutes: 60,
  });
  assert.equal(off.ok, false);
  assert.equal(await countId(admin, "missing-off"), 0);
  const beforeOn = await admin.query<{ n: number }>("select count(*)::int as n from appointments");
  assert.equal(beforeOn.rows[0].n, 0);
  results.switchOff = "прежний отказ, копия не изменена";

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
