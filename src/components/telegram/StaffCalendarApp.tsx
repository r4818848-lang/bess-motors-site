"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { arrivalTimesForDate } from "@/lib/arrival-window";
import { addDateKeyDays } from "@/lib/staff-calendar";
import {
  bindTelegramViewport,
  markTelegramWebAppReady,
  readTelegramWebApp,
  telegramLanguageCode,
  telegramLaunchStatus,
  waitForTelegramInitData,
  type CalendarFrame,
  type TelegramWebAppSnapshot,
} from "@/lib/telegram-webapp-client";

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

function arrivalChoices(date: string, current?: string): string[] {
  const slots = arrivalTimesForDate(date);
  if (current && !slots.includes(current)) return [current, ...slots];
  return slots;
}

const COPY = {
  ru: {
    title: "BESS MOTORS",
    today: "Сегодня",
    week: "Неделя",
    month: "Месяц",
    add: "Добавить",
    empty: "На сегодня записей нет",
    emptyAny: "Записей нет",
    newVisit: "Новая запись",
    arrived: "Прибыл",
    missed: "Не приехал",
    move: "Перенести",
    remove: "Удалить",
    confirm: "Удалить эту запись из календаря?",
    archive: "Архив",
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
    sdkReady: "Официальный модуль Telegram загружен.",
    sdkMissing: "Официальный модуль Telegram ещё не загрузился.",
    launchMissing: "Подпись запуска не получена. Данные CRM не запрашивались.",
    hint: "Откройте кнопку «📅 Календарь» под сообщением бота, команду /calendar или персональную кнопку меню. Нижняя клавиатура эту подпись не передаёт.",
    retry: "Повторить",
    rejected: "Подпись Telegram не прошла проверку. Откройте календарь заново из бота.",
    forbidden: "Этот Telegram не подключён как сотрудник сервиса.",
    failed: "Календарь сейчас недоступен. Повторите открытие из бота.",
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
    emptyAny: "Brak wizyt",
    newVisit: "Nowa wizyta",
    arrived: "Przyjechał",
    missed: "Nie przyjechał",
    move: "Przenieś",
    remove: "Usuń",
    confirm: "Usunąć tę wizytę z kalendarza?",
    archive: "Archiwum",
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
    sdkReady: "Oficjalny moduł Telegram jest załadowany.",
    sdkMissing: "Oficjalny moduł Telegram jeszcze się nie załadował.",
    launchMissing: "Brak podpisu uruchomienia. Dane CRM nie zostały pobrane.",
    hint: "Użyj przycisku «📅 Календарь» pod wiadomością bota, komendy /calendar albo osobistego przycisku menu.",
    retry: "Ponów",
    rejected: "Podpis Telegram nie został zaakceptowany. Otwórz kalendarz ponownie z bota.",
    forbidden: "Ten Telegram nie jest podłączony jako pracownik.",
    failed: "Kalendarz jest teraz niedostępny. Otwórz go ponownie z bota.",
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
    emptyAny: "Записів немає",
    newVisit: "Новий запис",
    arrived: "Прибув",
    missed: "Не приїхав",
    move: "Перенести",
    remove: "Видалити",
    confirm: "Прибрати цей запис з календаря?",
    archive: "Архів",
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
    sdkReady: "Офіційний модуль Telegram завантажено.",
    sdkMissing: "Офіційний модуль Telegram ще не завантажився.",
    launchMissing: "Підпис запуску не отримано. Дані CRM не запитувались.",
    hint: "Відкрийте кнопку «📅 Календарь» під повідомленням бота, команду /calendar або персональну кнопку меню.",
    retry: "Повторити",
    rejected: "Підпис Telegram не пройшов перевірку. Відкрийте календар знову з бота.",
    forbidden: "Цей Telegram не підключений як співробітник.",
    failed: "Календар зараз недоступний. Відкрийте його знову з бота.",
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
    emptyAny: "No visits",
    newVisit: "New visit",
    arrived: "Arrived",
    missed: "No-show",
    move: "Reschedule",
    remove: "Delete",
    confirm: "Remove this visit from the calendar?",
    archive: "Archive",
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
    sdkReady: "The official Telegram module is loaded.",
    sdkMissing: "The official Telegram module has not loaded yet.",
    launchMissing: "The launch signature was not received. CRM data was not requested.",
    hint: "Use the «📅 Календарь» button under the bot message, the /calendar command, or the personal menu button.",
    retry: "Retry",
    rejected: "The Telegram signature was rejected. Open the calendar from the bot again.",
    forbidden: "This Telegram account is not connected as staff.",
    failed: "The calendar is unavailable. Open it from the bot again.",
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

const fieldClass = "mt-1 box-border h-12 w-full max-w-full rounded-xl bg-zinc-900 px-3 text-base";
const tabClass = "flex min-h-12 items-center justify-center rounded-xl px-1 text-center text-[13px] font-semibold leading-tight";
const actionClass = "min-h-12 rounded-xl px-2 text-sm font-semibold";

function useCalendarFrame(): CalendarFrame {
  const [frame, setFrame] = useState(() => bindFrame());
  useEffect(() => {
    let detach: (() => void) | undefined;
    const bind = () => {
      if (detach) return;
      detach = bindTelegramViewport((next) => setFrame(next)) ?? undefined;
    };
    bind();
    const timer = window.setInterval(bind, 150);
    const stop = window.setTimeout(() => window.clearInterval(timer), 5000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(stop);
      detach?.();
    };
  }, []);
  return frame;
}

function bindFrame(): CalendarFrame {
  return {
    paddingTop: 8,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    minHeight: "100dvh",
    keyboard: false,
  };
}

function CalendarShell({ frame, children }: { frame: CalendarFrame; children: ReactNode }) {
  return (
    <main
      data-testid="telegram-calendar-shell"
      className="mx-auto box-border w-full max-w-lg bg-zinc-950 text-zinc-100"
      style={{
        paddingTop: frame.paddingTop,
        paddingRight: frame.paddingRight,
        paddingBottom: frame.paddingBottom,
        paddingLeft: frame.paddingLeft,
        minHeight: frame.minHeight,
        maxHeight: frame.maxHeight,
        overflow: frame.maxHeight ? "auto" : undefined,
      }}
    >
      {children}
    </main>
  );
}

function staffFailureText(code: string, text: (typeof COPY)["ru"]): string {
  if (code === "forbidden") return text.forbidden;
  if (code === "bad_signature" || code === "stale" || code === "missing" || code === "no_user") return text.rejected;
  return text.failed;
}

export function StaffCalendarApp() {
  const [initData, setInitData] = useState("");
  const [ready, setReady] = useState(false);
  const [launch, setLaunch] = useState<TelegramWebAppSnapshot | null>(null);
  const [lang, setLang] = useState<Lang>("ru");
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<View>("today");
  const [archive, setArchive] = useState(false);
  const [rows, setRows] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Card | null>(null);
  const [moving, setMoving] = useState(false);
  const [moveDate, setMoveDate] = useState("");
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
  const frame = useCalendarFrame();

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
    let cancelled = false;
    waitForTelegramInitData(() => readTelegramWebApp(window)).then((snapshot) => {
      if (cancelled) return;
      markTelegramWebAppReady(window);
      setLang(langOf(telegramLanguageCode(window)));
      setLaunch(snapshot);
      setInitData(snapshot.initData);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(
    async (next: Session, nextView: View, showArchive = false) => {
      const from = nextView === "week" ? next.today : nextView === "month" ? `${next.today.slice(0, 8)}01` : next.today;
      const to = nextView === "week" ? addDateKeyDays(next.today, 6) : nextView === "month" ? monthEnd(next.today) : next.today;
      const data = await post({ action: "list", from, to, includeArchive: showArchive && next.role === "owner" });
      const appointments = (data.appointments as Card[]) ?? [];
      setRows(showArchive || nextView !== "today" ? appointments : appointments.filter((row) => row.date === next.today));
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
            time: arrivalTimesForDate(lead.desiredDate || next.today).includes(lead.desiredTime) ? lead.desiredTime : (arrivalTimesForDate(lead.desiredDate || next.today)[0] ?? "09:00"),
            leadId: lead.id,
            clientRequestId: lead.id,
          }));
          setView("add");
          return;
        }
        await load(next, "today");
      })
      .catch((err: Error) => {
        if (!cancelled) setError(staffFailureText(err.message, text));
      });
    return () => {
      cancelled = true;
    };
  }, [ready, initData, post, load, text]);

  async function openView(nextView: View) {
    setSelected(null);
    setMoving(false);
    setConfirmDelete(false);
    setView(nextView);
    if (nextView !== "add" && session) await load(session, nextView, archive).catch((err: Error) => setError(err.message));
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

  if (!ready) {
    return (
      <CalendarShell frame={frame}>
        <h1 className="text-sm font-semibold tracking-[0.16em] text-zinc-400">BESS MOTORS</h1>
        <p className="mt-2 text-sm">{COPY.ru.loading}</p>
      </CalendarShell>
    );
  }
  if (!initData) {
    const status = telegramLaunchStatus(launch ?? { sdkReady: false, initData: "", platform: "" });
    return (
      <CalendarShell frame={frame}>
      <div data-testid="telegram-calendar-gate">
        <h1 className="mb-3 text-sm font-semibold tracking-[0.16em] text-zinc-400">BESS MOTORS</h1>
        <p>{text.gate}</p>
        <p className="mt-3">{status.sdkReady ? text.sdkReady : text.sdkMissing}</p>
        <p className="mt-2">{text.launchMissing}</p>
        {status.platform && status.platform !== "unknown" ? <p className="mt-2">Telegram: {status.platform}</p> : null}
        <p className="mt-3 text-zinc-600">{text.hint}</p>
        <button type="button" className="mt-4 min-h-12 rounded-xl bg-white px-4 font-semibold text-black" onClick={() => window.location.reload()}>
          {text.retry}
        </button>
      </div>
      </CalendarShell>
    );
  }
  if (!session) {
    return (
      <CalendarShell frame={frame}>
      <div data-testid="telegram-calendar-denied">
        <h1 className="mb-3 text-sm font-semibold tracking-[0.16em] text-zinc-400">BESS MOTORS</h1>
        <p>{error || text.loading}</p>
        <button type="button" className="mt-4 min-h-12 rounded-xl bg-white px-4 font-semibold text-black" onClick={() => window.location.reload()}>
          {text.retry}
        </button>
      </div>
      </CalendarShell>
    );
  }

  const grouped = rows.reduce<Record<string, Card[]>>((acc, row) => {
    acc[row.date] = [...(acc[row.date] ?? []), row];
    return acc;
  }, {});

  return (
    <CalendarShell frame={frame}>
      <div className="mb-3">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400">{text.title}</p>
        <h1 className="text-lg font-semibold leading-tight">{session.today}</h1>
      </div>
      <nav className="mb-3 grid grid-cols-4 gap-1.5">
        {(["today", "week", "month", "add"] as View[]).map((item) => (
          <button key={item} type="button" data-testid={`telegram-tab-${item}`} onClick={() => void openView(item)} className={`${tabClass} ${view === item ? "bg-white text-black" : "bg-zinc-900 text-zinc-100"}`}>
            {text[item]}
          </button>
        ))}
      </nav>
      {session.role === "owner" && (
        <button
          type="button"
          data-testid="telegram-calendar-archive"
          className="mb-3 min-h-12 w-full rounded-xl bg-zinc-900 px-3 text-sm font-semibold"
          onClick={() => {
            const nextArchive = !archive;
            setArchive(nextArchive);
            setSelected(null);
            const nextView = view === "add" ? "today" : view;
            if (view === "add") setView("today");
            load(session, nextView, nextArchive).catch((err: Error) => setError(err.message));
          }}
        >
          {archive ? text.today : text.archive}
        </button>
      )}
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
          <input className={fieldClass} placeholder={text.name} value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} required />
          <input className={fieldClass} inputMode="tel" placeholder={text.phone} value={form.clientPhone} onChange={(event) => setForm({ ...form, clientPhone: event.target.value })} required />
          <input className={fieldClass} placeholder={text.car} value={form.car} onChange={(event) => setForm({ ...form, car: event.target.value })} />
          <input className={fieldClass} placeholder={text.plate} value={form.plate} onChange={(event) => setForm({ ...form, plate: event.target.value })} />
          <input className={fieldClass} placeholder={text.service} value={form.problemText} onChange={(event) => setForm({ ...form, problemText: event.target.value })} />
          <label className="block text-xs text-zinc-400">{text.date}<input type="date" className={fieldClass} value={form.date} onChange={(event) => {
            const date = event.target.value;
            const slots = arrivalTimesForDate(date);
            setForm({ ...form, date, time: slots.includes(form.time) ? form.time : slots[0] ?? "" });
          }} required /></label>
          <label className="block text-xs text-zinc-400">{text.time}
            <select className={fieldClass} value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })}>
              {arrivalChoices(form.date, form.time).map((slot) => <option key={slot}>{slot}</option>)}
            </select>
          </label>
          <label className="block text-xs text-zinc-400">{text.mechanic}
            <select className={fieldClass} value={form.mechanicId} onChange={(event) => setForm({ ...form, mechanicId: event.target.value })}>
              {session.mechanics.map((mechanic) => <option key={mechanic.id} value={mechanic.id}>{mechanic.name}</option>)}
            </select>
          </label>
          <label className="flex min-h-12 items-center gap-3 text-base"><input className="h-5 w-5" type="checkbox" checked={form.leavesCar} onChange={(event) => setForm({ ...form, leavesCar: event.target.checked })} />{text.drop}</label>
          {form.leavesCar && <label className="block text-xs text-zinc-400">{text.pickup}<input type="date" className={fieldClass} value={form.pickupDate} onChange={(event) => setForm({ ...form, pickupDate: event.target.value })} /></label>}
          <button className="min-h-12 w-full rounded-xl bg-white font-semibold text-black" type="submit">{text.save}</button>
        </form>
      ) : selected ? (
        <section className="rounded-2xl bg-zinc-900 p-4">
          <button type="button" className="mb-3 min-h-12 text-sm font-semibold text-zinc-300" onClick={() => setSelected(null)}>{text.back}</button>
          <p className="text-2xl font-semibold">{selected.time}</p>
          <p className="mt-2">{selected.clientName}</p>
          <a className="text-sky-300" href={`tel:${selected.clientPhone}`}>{selected.clientPhone}</a>
          <p className="mt-2">{[selected.make, selected.model, selected.plate].filter(Boolean).join(" ")}</p>
          <p>{selected.problemText || selected.serviceIds.join(", ")}</p>
          {selected.mechanicName && <p>{selected.mechanicName}</p>}
          <p>{text.status[selected.visitState] ?? selected.appointmentStatus}</p>
          {selected.leavesCar && <p>{text.drop}{selected.pickupDate ? ` · ${selected.pickupDate}` : ""}</p>}
          {session.canEdit && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className={`${actionClass} bg-white text-black`} onClick={() => mutate("arrive").catch((err: Error) => setError(err.message))}>{text.arrived}</button>
              <button type="button" className={`${actionClass} bg-zinc-800`} onClick={() => mutate("noshow").catch((err: Error) => setError(err.message))}>{text.missed}</button>
              <button type="button" data-testid="telegram-move" className={`${actionClass} bg-zinc-800`} onClick={() => { setMoveDate(selected.date); setMoving(true); }}>{text.move}</button>
              <button type="button" data-testid="telegram-remove" className={`${actionClass} bg-red-950`} onClick={() => setConfirmDelete(true)}>{text.remove}</button>
            </div>
          )}
          {moving && (
            <form className="mt-3 space-y-2" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); mutate("update", { date: data.get("date"), time: data.get("time"), clientName: selected.clientName, clientPhone: selected.clientPhone, mechanicId: selected.mechanicId }).catch((err: Error) => setError(err.message)); }}>
              <input name="date" type="date" value={moveDate || selected.date} className={fieldClass} required onChange={(event) => setMoveDate(event.target.value)} />
              <select key={moveDate || selected.date} name="time" defaultValue={arrivalTimesForDate(moveDate || selected.date).includes(selected.time) ? selected.time : arrivalTimesForDate(moveDate || selected.date)[0]} className={fieldClass}>{arrivalTimesForDate(moveDate || selected.date).map((slot) => <option key={slot}>{slot}</option>)}</select>
              <button className="min-h-12 w-full rounded-xl bg-white font-semibold text-black" type="submit">{text.save}</button>
            </form>
          )}
          {confirmDelete && (
            <div className="mt-3 rounded-lg bg-red-950 p-3 text-sm">
              <p>{text.confirm}</p>
              <button type="button" className="mt-2 min-h-12 w-full rounded-xl bg-white font-semibold text-black" onClick={() => mutate("remove").catch((err: Error) => setError(err.message))}>{text.remove}</button>
            </div>
          )}
        </section>
      ) : rows.length === 0 ? (
        <div data-testid="telegram-calendar-empty" className="rounded-2xl bg-zinc-900 px-4 py-4">
          <p className="text-sm">{view === "today" ? text.empty : text.emptyAny}</p>
          <button type="button" data-testid="telegram-calendar-new" className="mt-3 min-h-12 w-full rounded-xl bg-white font-semibold text-black" onClick={() => void openView("add")}>
            {text.newVisit}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.keys(grouped).sort().map((date) => (
            <section key={date}>
              {view !== "today" && <h2 className="mb-2 text-sm text-zinc-400">{date}</h2>}
              <div className="space-y-2">
                {grouped[date].sort((a, b) => a.time.localeCompare(b.time)).map((row) => (
                  <button key={row.id} type="button" onClick={() => { setSelected(row); setConfirmDelete(false); setMoving(false); }} className="block min-h-12 w-full max-w-full rounded-2xl bg-zinc-900 p-3 text-left">
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
    </CalendarShell>
  );
}
