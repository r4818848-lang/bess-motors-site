"use client";

import { useCallback, useEffect, useState } from "react";
import { addDateKeyDays } from "@/lib/staff-calendar";

type Role = "owner" | "admin" | "mechanic";
type View = "today" | "week" | "month" | "add";

type Card = {
  id: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  plate: string;
  make: string;
  model: string;
  problemText: string;
  serviceIds: string[];
  mechanicName: string;
  mechanicId: string;
  appointmentStatus: string;
  visitState: "expected" | "arrived" | "no_show";
  leavesCar: boolean;
  pickupDate: string;
  updatedAt: string | null;
};

type Session = {
  role: Role;
  canEdit: boolean;
  today: string;
  mechanics: { id: string; name: string }[];
};

const SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30"];

const COPY = {
  ru: {
    title: "BESS MOTORS",
    today: "Сегодня",
    week: "Неделя",
    month: "Месяц",
    add: "Добавить",
    empty: "На сегодня записей нет",
    arrived: "Прибыл",
    missed: "Не приехал",
    move: "Перенести",
    remove: "Удалить",
    confirm: "Удалить эту запись из календаря?",
    save: "Сохранить",
    back: "Назад",
    name: "Имя",
    phone: "Телефон",
    car: "Марка и модель",
    plate: "Госномер",
    service: "Услуга",
    mechanic: "Механик",
    date: "День приезда",
    time: "Время приезда",
    drop: "Оставляет автомобиль",
    pickup: "Дата выдачи",
    gate: "Календарь открывается из Telegram сотрудником сервиса.",
    loading: "Загрузка…",
    saved: "Сохранено",
    status: { expected: "Ожидается", arrived: "Прибыл", no_show: "Не приехал" },
  },
  pl: {
    title: "BESS MOTORS",
    today: "Dziś",
    week: "Tydzień",
    month: "Miesiąc",
    add: "Dodaj",
    empty: "Na dziś nie ma wizyt",
    arrived: "Przyjechał",
    missed: "Nie przyjechał",
    move: "Przenieś",
    remove: "Usuń",
    confirm: "Usunąć tę wizytę z kalendarza?",
    save: "Zapisz",
    back: "Wróć",
    name: "Imię",
    phone: "Telefon",
    car: "Marka i model",
    plate: "Rejestracja",
    service: "Usługa",
    mechanic: "Mechanik",
    date: "Dzień przyjazdu",
    time: "Godzina przyjazdu",
    drop: "Zostawia samochód",
    pickup: "Data odbioru",
    gate: "Kalendarz otwiera się z Telegrama pracownika.",
    loading: "Ładowanie…",
    saved: "Zapisano",
    status: { expected: "Oczekiwany", arrived: "Przyjechał", no_show: "Nie przyjechał" },
  },
  uk: {
    title: "BESS MOTORS",
    today: "Сьогодні",
    week: "Тиждень",
    month: "Місяць",
    add: "Додати",
    empty: "На сьогодні записів немає",
    arrived: "Прибув",
    missed: "Не приїхав",
    move: "Перенести",
    remove: "Видалити",
    confirm: "Прибрати цей запис з календаря?",
    save: "Зберегти",
    back: "Назад",
    name: "Ім'я",
    phone: "Телефон",
    car: "Марка і модель",
    plate: "Номер",
    service: "Послуга",
    mechanic: "Механік",
    date: "День приїзду",
    time: "Час приїзду",
    drop: "Залишає автомобіль",
    pickup: "Дата видачі",
    gate: "Календар відкривається з Telegram співробітника.",
    loading: "Завантаження…",
    saved: "Збережено",
    status: { expected: "Очікується", arrived: "Прибув", no_show: "Не приїхав" },
  },
  en: {
    title: "BESS MOTORS",
    today: "Today",
    week: "Week",
    month: "Month",
    add: "Add",
    empty: "No arrivals today",
    arrived: "Arrived",
    missed: "No-show",
    move: "Reschedule",
    remove: "Delete",
    confirm: "Remove this visit from the calendar?",
    save: "Save",
    back: "Back",
    name: "Name",
    phone: "Phone",
    car: "Make and model",
    plate: "Plate",
    service: "Service",
    mechanic: "Mechanic",
    date: "Arrival day",
    time: "Arrival time",
    drop: "Leaves the car",
    pickup: "Pickup date",
    gate: "The calendar opens from a staff Telegram chat.",
    loading: "Loading…",
    saved: "Saved",
    status: { expected: "Expected", arrived: "Arrived", no_show: "No-show" },
  },
};

type Lang = keyof typeof COPY;

function langOf(code: string): Lang {
  if (code.startsWith("pl")) return "pl";
  if (code.startsWith("uk") || code.startsWith("ua")) return "uk";
  if (code.startsWith("en")) return "en";
  return "ru";
}

function monthEnd(dateKey: string): string {
  const [year, month] = dateKey.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${dateKey.slice(0, 8)}${String(last).padStart(2, "0")}`;
}

export function StaffCalendarApp() {
  const [initData, setInitData] = useState("");
  const [ready, setReady] = useState(false);
  const [lang, setLang] = useState<Lang>("ru");
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<View>("today");
  const [rows, setRows] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Card | null>(null);
  const [moving, setMoving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    clientName: "",
    clientPhone: "",
    car: "",
    plate: "",
    problemText: "",
    date: "",
    time: "09:00",
    mechanicId: "",
    leavesCar: false,
    pickupDate: "",
    leadId: "",
    clientRequestId: "",
  });
  const text = COPY[lang];

  const post = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch("/api/staff/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-telegram-init-data": initData },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "error");
      return data as Record<string, unknown>;
    },
    [initData]
  );

  useEffect(() => {
    const webApp = (window as unknown as { Telegram?: { WebApp?: { initData?: string; initDataUnsafe?: { user?: { language_code?: string } }; ready?: () => void; expand?: () => void } } }).Telegram?.WebApp;
    webApp?.ready?.();
    webApp?.expand?.();
    setLang(langOf(webApp?.initDataUnsafe?.user?.language_code ?? ""));
    setInitData(webApp?.initData ?? "");
    setReady(true);
  }, []);

  const load = useCallback(
    async (next: Session, nextView: View) => {
      const from = nextView === "week" ? next.today : nextView === "month" ? `${next.today.slice(0, 8)}01` : next.today;
      const to = nextView === "week" ? addDateKeyDays(next.today, 6) : nextView === "month" ? monthEnd(next.today) : next.today;
      const data = await post({ action: "list", from, to });
      const appointments = (data.appointments as Card[]) ?? [];
      setRows(nextView === "today" ? appointments.filter((row) => row.date === next.today) : appointments);
    },
    [post]
  );

  useEffect(() => {
    if (!ready || !initData) return;
    let cancelled = false;
    post({ action: "session" })
      .then(async (data) => {
        if (cancelled) return;
        const next: Session = {
          role: data.role as Role,
          canEdit: Boolean(data.canEdit),
          today: String(data.today),
          mechanics: (data.mechanics as Session["mechanics"]) ?? [],
        };
        setSession(next);
        setForm((prev) => ({ ...prev, date: next.today, mechanicId: next.mechanics[0]?.id ?? "" }));
        const params = new URLSearchParams(window.location.search);
        const leadId = params.get("lead") ?? "";
        if (leadId) {
          const leadData = await post({ action: "lead", leadId });
          const lead = leadData.lead as {
            id: string;
            firstName: string;
            lastName: string;
            phone: string;
            make: string;
            model: string;
            plate: string;
            desiredDate: string;
            desiredTime: string;
            services: { label: string }[];
          };
          setForm((prev) => ({
            ...prev,
            clientName: [lead.firstName, lead.lastName].filter(Boolean).join(" "),
            clientPhone: lead.phone,
            car: [lead.make, lead.model].filter(Boolean).join(" "),
            plate: lead.plate,
            problemText: lead.services.map((item) => item.label).join(", "),
            date: lead.desiredDate || next.today,
            time: SLOTS.includes(lead.desiredTime) ? lead.desiredTime : "09:00",
            leadId: lead.id,
            clientRequestId: lead.id,
          }));
          setView("add");
          return;
        }
        await load(next, "today");
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, initData, post, load]);

  async function openView(nextView: View) {
    setSelected(null);
    setMoving(false);
    setConfirmDelete(false);
    setView(nextView);
    if (nextView !== "add" && session) await load(session, nextView).catch((err: Error) => setError(err.message));
  }

  async function mutate(action: string, extra: Record<string, unknown> = {}) {
    if (!selected) return;
    const data = await post({ action, id: selected.id, expectedUpdatedAt: selected.updatedAt, ...extra });
    if (action === "remove" || action === "cancel") {
      setRows((current) => current.filter((row) => row.id !== selected.id));
      setSelected(null);
      return;
    }
    const appointment = data.appointment as Card;
    setRows((current) => current.map((row) => (row.id === appointment.id ? appointment : row)).filter((row) => !session || row.date === session.today || view !== "today"));
    setSelected(appointment);
    setMoving(false);
    setNotice(text.saved);
  }

  async function saveNew() {
    const [make, ...modelParts] = form.car.trim().split(/\s+/);
    await post({
      action: "create",
      clientName: form.clientName,
      clientPhone: form.clientPhone,
      make,
      model: modelParts.join(" "),
      plate: form.plate,
      problemText: form.problemText,
      date: form.date,
      time: form.time,
      mechanicId: form.mechanicId,
      leavesCar: form.leavesCar,
      pickupDate: form.leavesCar ? form.pickupDate : "",
      holdUntil: form.leavesCar ? form.pickupDate : "",
      leadId: form.leadId || undefined,
      clientRequestId: form.clientRequestId || undefined,
      serviceIds: ["otherReason"],
    });
    setNotice(text.saved);
    if (session) {
      setView("today");
      await load(session, "today");
    }
  }

  if (!ready) return <main className="p-6 text-sm"><h1 className="text-xl font-semibold">BESS MOTORS</h1><p>{COPY.ru.loading}</p></main>;
  if (!initData) {
    return (
      <main className="mx-auto max-w-md p-6 text-sm">
        <h1 className="mb-3 text-xl font-semibold">BESS MOTORS</h1>
        <p>{text.gate}</p>
      </main>
    );
  }
  if (!session) return <main className="p-6 text-sm">{error || text.loading}</main>;

  const grouped = rows.reduce<Record<string, Card[]>>((acc, row) => {
    acc[row.date] = [...(acc[row.date] ?? []), row];
    return acc;
  }, {});

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-zinc-950 px-4 py-4 text-zinc-100">
      <header className="mb-4">
        <p className="text-xs tracking-[0.2em] text-zinc-500">{text.title}</p>
        <h1 className="text-xl font-semibold">{session.today}</h1>
      </header>
      <nav className="mb-4 grid grid-cols-4 gap-1 text-xs">
        {(["today", "week", "month", "add"] as View[]).map((item) => (
          <button key={item} type="button" onClick={() => void openView(item)} className={`rounded-lg px-2 py-2 ${view === item ? "bg-white text-black" : "bg-zinc-900"}`}>
            {text[item]}
          </button>
        ))}
      </nav>
      {notice && <p className="mb-3 text-sm text-emerald-300">{notice}</p>}
      {error && <p className="mb-3 text-sm text-red-300">{error}</p>}

      {view === "add" ? (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            saveNew().catch((err: Error) => setError(err.message));
          }}
        >
          <input className="w-full rounded-lg bg-zinc-900 px-3 py-2" placeholder={text.name} value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} required />
          <input className="w-full rounded-lg bg-zinc-900 px-3 py-2" placeholder={text.phone} value={form.clientPhone} onChange={(event) => setForm({ ...form, clientPhone: event.target.value })} required />
          <input className="w-full rounded-lg bg-zinc-900 px-3 py-2" placeholder={text.car} value={form.car} onChange={(event) => setForm({ ...form, car: event.target.value })} />
          <input className="w-full rounded-lg bg-zinc-900 px-3 py-2" placeholder={text.plate} value={form.plate} onChange={(event) => setForm({ ...form, plate: event.target.value })} />
          <input className="w-full rounded-lg bg-zinc-900 px-3 py-2" placeholder={text.service} value={form.problemText} onChange={(event) => setForm({ ...form, problemText: event.target.value })} />
          <label className="block text-xs text-zinc-400">{text.date}<input type="date" className="mt-1 w-full rounded-lg bg-zinc-900 px-3 py-2" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></label>
          <label className="block text-xs text-zinc-400">{text.time}
            <select className="mt-1 w-full rounded-lg bg-zinc-900 px-3 py-2" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })}>
              {SLOTS.map((slot) => <option key={slot}>{slot}</option>)}
            </select>
          </label>
          <label className="block text-xs text-zinc-400">{text.mechanic}
            <select className="mt-1 w-full rounded-lg bg-zinc-900 px-3 py-2" value={form.mechanicId} onChange={(event) => setForm({ ...form, mechanicId: event.target.value })}>
              {session.mechanics.map((mechanic) => <option key={mechanic.id} value={mechanic.id}>{mechanic.name}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.leavesCar} onChange={(event) => setForm({ ...form, leavesCar: event.target.checked })} />{text.drop}</label>
          {form.leavesCar && <label className="block text-xs text-zinc-400">{text.pickup}<input type="date" className="mt-1 w-full rounded-lg bg-zinc-900 px-3 py-2" value={form.pickupDate} onChange={(event) => setForm({ ...form, pickupDate: event.target.value })} /></label>}
          <button className="w-full rounded-lg bg-white py-3 font-semibold text-black" type="submit">{text.save}</button>
        </form>
      ) : selected ? (
        <section className="rounded-2xl bg-zinc-900 p-4">
          <button type="button" className="mb-3 text-xs text-zinc-400" onClick={() => setSelected(null)}>{text.back}</button>
          <p className="text-2xl font-semibold">{selected.time}</p>
          <p className="mt-2">{selected.clientName}</p>
          <a className="text-sky-300" href={`tel:${selected.clientPhone}`}>{selected.clientPhone}</a>
          <p className="mt-2">{[selected.make, selected.model, selected.plate].filter(Boolean).join(" ")}</p>
          <p>{selected.problemText || selected.serviceIds.join(", ")}</p>
          {selected.mechanicName && <p>{selected.mechanicName}</p>}
          <p>{text.status[selected.visitState] ?? selected.appointmentStatus}</p>
          {selected.leavesCar && <p>{text.drop}{selected.pickupDate ? ` · ${selected.pickupDate}` : ""}</p>}
          {session.canEdit && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <button type="button" className="rounded-lg bg-white py-2 text-black" onClick={() => mutate("arrive").catch((err: Error) => setError(err.message))}>{text.arrived}</button>
              <button type="button" className="rounded-lg bg-zinc-800 py-2" onClick={() => mutate("noshow").catch((err: Error) => setError(err.message))}>{text.missed}</button>
              <button type="button" className="rounded-lg bg-zinc-800 py-2" onClick={() => setMoving(true)}>{text.move}</button>
              <button type="button" className="rounded-lg bg-red-950 py-2" onClick={() => setConfirmDelete(true)}>{text.remove}</button>
            </div>
          )}
          {moving && (
            <form className="mt-3 space-y-2" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); mutate("update", { date: data.get("date"), time: data.get("time"), clientName: selected.clientName, clientPhone: selected.clientPhone, mechanicId: selected.mechanicId }).catch((err: Error) => setError(err.message)); }}>
              <input name="date" type="date" defaultValue={selected.date} className="w-full rounded-lg bg-zinc-950 px-3 py-2" required />
              <select name="time" defaultValue={selected.time} className="w-full rounded-lg bg-zinc-950 px-3 py-2">{SLOTS.map((slot) => <option key={slot}>{slot}</option>)}</select>
              <button className="w-full rounded-lg bg-white py-2 text-black" type="submit">{text.save}</button>
            </form>
          )}
          {confirmDelete && (
            <div className="mt-3 rounded-lg bg-red-950 p-3 text-sm">
              <p>{text.confirm}</p>
              <button type="button" className="mt-2 w-full rounded-lg bg-white py-2 text-black" onClick={() => mutate("remove").catch((err: Error) => setError(err.message))}>{text.remove}</button>
            </div>
          )}
        </section>
      ) : rows.length === 0 ? (
        <p className="text-sm text-zinc-400">{text.empty}</p>
      ) : (
        <div className="space-y-4">
          {Object.keys(grouped).sort().map((date) => (
            <section key={date}>
              {view !== "today" && <h2 className="mb-2 text-sm text-zinc-400">{date}</h2>}
              <div className="space-y-2">
                {grouped[date].sort((a, b) => a.time.localeCompare(b.time)).map((row) => (
                  <button key={row.id} type="button" onClick={() => { setSelected(row); setConfirmDelete(false); setMoving(false); }} className="block w-full rounded-2xl bg-zinc-900 p-3 text-left">
                    <span className="text-lg font-semibold">{row.time}</span>
                    <span className="mt-1 block">{row.clientName}</span>
                    <span className="block text-sm text-zinc-400">{row.clientPhone}</span>
                    <span className="block text-sm">{[row.make, row.model, row.plate].filter(Boolean).join(" · ")}</span>
                    <span className="block text-sm text-zinc-300">{row.problemText || row.serviceIds.join(", ")}</span>
                    {row.mechanicName && <span className="block text-sm">{row.mechanicName}</span>}
                    <span className="block text-xs uppercase tracking-wide text-zinc-500">{text.status[row.visitState] ?? row.appointmentStatus}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
