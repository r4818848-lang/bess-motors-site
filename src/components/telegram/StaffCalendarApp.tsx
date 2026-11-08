"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addDateKeyDays } from "@/lib/staff-calendar";

type Role = "owner" | "admin" | "mechanic";
type View = "day" | "week" | "month";
type Status = "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";

type Card = {
  id: string;
  date: string;
  time: string;
  durationMinutes: number;
  holdUntil: string | null;
  multiDay: boolean;
  clientName: string;
  clientPhone: string;
  plate: string;
  vin: string;
  make: string;
  model: string;
  vehicleId: string;
  userId: string;
  serviceIds: string[];
  problemText: string;
  mechanicId: string;
  mechanicName: string;
  comment: string;
  appointmentStatus: Status;
  notifyMechanic: boolean;
  updatedAt: string | null;
};

type CallCard = {
  id: string;
  phone: string;
  clientName: string;
  serviceLabel: string;
  comment: string;
  status: string;
  createdAt: string;
};

type Mechanic = { id: string; name: string };
type ClientHit = {
  id: string;
  name: string;
  phone: string;
  vehicles: { id: string; make: string; model: string; plate: string; vin: string }[];
};

type Session = {
  role: Role;
  canEdit: boolean;
  seeAll: boolean;
  mechanicId: string | null;
  today: string;
  tomorrow: string;
  mechanics: Mechanic[];
};

const COPY = {
  ru: {
    title: "Календарь",
    day: "День",
    week: "Неделя",
    month: "Месяц",
    today: "Сегодня",
    tomorrow: "Завтра",
    neu: "Новая запись",
    search: "Авто, телефон или номер",
    closed: "Выходной",
    calls: "Заявки на звонок",
    appointments: "Записи",
    empty: "На этот день записей нет",
    save: "Сохранить",
    cancelApt: "Отменить запись",
    edit: "Изменить",
    back: "Назад",
    name: "Имя клиента",
    phone: "Телефон",
    make: "Марка",
    model: "Модель",
    plate: "Госномер",
    vin: "VIN",
    service: "Услуга",
    problem: "Описание проблемы",
    date: "Дата приезда",
    time: "Время приезда",
    duration: "Длительность, мин",
    hold: "Оставить автомобиль до",
    multi: "Ремонт на несколько дней",
    mechanic: "Механик",
    comment: "Комментарий",
    status: "Статус",
    notify: "Напомнить механику",
    gate: "Календарь открывается из Telegram сотрудником сервиса.",
    forbidden: "Нет доступа. Привяжите Telegram сотрудника.",
    loading: "Загрузка…",
    saved: "Сохранено в CRM",
    conflict: "Это время уже занято у выбранного механика",
    hours: "Пн–пт 09:00–18:00, сб 09:00–14:00",
  },
  pl: {
    title: "Kalendarz",
    day: "Dzień",
    week: "Tydzień",
    month: "Miesiąc",
    today: "Dziś",
    tomorrow: "Jutro",
    neu: "Nowa wizyta",
    search: "Auto, telefon lub rejestracja",
    closed: "Nieczynne",
    calls: "Prośby o telefon",
    appointments: "Wizyty",
    empty: "Brak wizyt w tym dniu",
    save: "Zapisz",
    cancelApt: "Anuluj wizytę",
    edit: "Edytuj",
    back: "Wróć",
    name: "Imię klienta",
    phone: "Telefon",
    make: "Marka",
    model: "Model",
    plate: "Rejestracja",
    vin: "VIN",
    service: "Usługa",
    problem: "Opis problemu",
    date: "Data przyjazdu",
    time: "Godzina przyjazdu",
    duration: "Czas prac, min",
    hold: "Auto zostaje do",
    multi: "Naprawa na kilka dni",
    mechanic: "Mechanik",
    comment: "Komentarz",
    status: "Status",
    notify: "Przypomnij mechanikowi",
    gate: "Kalendarz otwiera się z Telegrama dla pracownika serwisu.",
    forbidden: "Brak dostępu. Powiąż Telegram pracownika.",
    loading: "Ładowanie…",
    saved: "Zapisano w CRM",
    conflict: "Ten termin jest już zajęty u wybranego mechanika",
    hours: "Pn–pt 09:00–18:00, sb 09:00–14:00",
  },
} as const;

const STATUS_LABEL = {
  ru: {
    scheduled: "Ожидается",
    confirmed: "Подтверждён",
    in_progress: "В работе",
    completed: "Завершён",
    cancelled: "Отменён",
  },
  pl: {
    scheduled: "Oczekuje",
    confirmed: "Potwierdzona",
    in_progress: "W trakcie",
    completed: "Zakończona",
    cancelled: "Anulowana",
  },
} as const;

const SERVICES = [
  ["diagnostic", "Диагностика", "Diagnostyka"],
  ["oil", "Масло", "Olej"],
  ["brakePads", "Колодки", "Klocki"],
  ["brakesFull", "Тормоза", "Hamulce"],
  ["tires", "Шины", "Opony"],
  ["acRefill", "Кондиционер", "Klimatyzacja"],
  ["acRepair", "Ремонт кондиционера", "Naprawa klimatyzacji"],
  ["suspension", "Подвеска", "Zawieszenie"],
  ["filters", "Фильтры", "Filtry"],
  ["electric", "Электрика", "Elektryka"],
  ["timingBelt", "ГРМ", "Rozrząd"],
  ["otherReason", "Другое", "Inne"],
] as const;

function shift(dateKey: string, days: number): string {
  return addDateKeyDays(dateKey, days) ?? dateKey;
}

function weekday(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

function weekStart(dateKey: string): string {
  const day = weekday(dateKey);
  return shift(dateKey, day === 0 ? -6 : 1 - day);
}

function monthGrid(dateKey: string): string[] {
  const [year, month] = dateKey.split("-").map(Number);
  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  const start = weekStart(first);
  return Array.from({ length: 42 }, (_, index) => shift(start, index));
}

function serviceLabel(id: string, lang: "ru" | "pl"): string {
  const row = SERVICES.find((item) => item[0] === id);
  if (!row) return id;
  return lang === "pl" ? row[2] : row[1];
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        initData: string;
        initDataUnsafe?: { user?: { language_code?: string } };
      };
    };
  }
}

const EMPTY_FORM = {
  clientName: "",
  clientPhone: "",
  make: "",
  model: "",
  plate: "",
  vin: "",
  vehicleId: "",
  userId: "",
  serviceId: "diagnostic",
  problemText: "",
  date: "",
  time: "09:00",
  durationMinutes: 60,
  holdUntil: "",
  multiDay: false,
  mechanicId: "",
  comment: "",
  appointmentStatus: "scheduled" as Status,
  notifyMechanic: false,
};

export function StaffCalendarApp() {
  const [lang, setLang] = useState<"ru" | "pl">("ru");
  const [initData, setInitData] = useState("");
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [view, setView] = useState<View>("day");
  const [cursor, setCursor] = useState("");
  const [items, setItems] = useState<Card[]>([]);
  const [calls, setCalls] = useState<CallCard[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Card | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [clients, setClients] = useState<ClientHit[]>([]);
  const [busy, setBusy] = useState(false);
  const text = COPY[lang];

  const post = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/staff/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string } & Record<string, unknown>;
      return { res, data };
    },
    [initData]
  );

  useEffect(() => {
    const boot = () => {
      const webApp = window.Telegram?.WebApp;
      webApp?.ready();
      webApp?.expand();
      const code = webApp?.initDataUnsafe?.user?.language_code ?? "";
      if (code.startsWith("pl")) setLang("pl");
      setInitData(webApp?.initData ?? "");
      setReady(true);
    };
    if (window.Telegram?.WebApp) {
      boot();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.onload = boot;
    script.onerror = () => setReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!initData) return;
    void post({ action: "session" }).then(({ res, data }) => {
      if (!res.ok || !data.ok) {
        setError(res.status === 403 ? COPY[lang].forbidden : COPY[lang].gate);
        return;
      }
      const next = data as unknown as Session;
      setSession(next);
      setCursor(next.today);
      setForm((prev) => ({ ...prev, mechanicId: next.mechanicId || next.mechanics[0]?.id || "" }));
    });
  }, [ready, initData, post, lang]);

  const range = useMemo(() => {
    if (!cursor) return { from: "", to: "" };
    if (view === "week") {
      const from = weekStart(cursor);
      return { from, to: shift(from, 6) };
    }
    if (view === "month") {
      const days = monthGrid(cursor);
      return { from: days[0], to: days[days.length - 1] };
    }
    return { from: cursor, to: cursor };
  }, [cursor, view]);

  const load = useCallback(async () => {
    if (!session || !range.from) return;
    const { data } = await post({ action: "list", from: range.from, to: range.to });
    if (!data.ok) return;
    setItems((data.appointments as Card[]) ?? []);
    setCalls((data.calls as CallCard[]) ?? []);
  }, [post, range.from, range.to, session]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const apt = new URLSearchParams(window.location.search).get("apt");
    if (!apt || !items.length) return;
    const found = items.find((item) => item.id === apt);
    if (found) setSelected(found);
  }, [items]);

  const shown = items.filter((item) => item.appointmentStatus !== "cancelled" || view === "day");
  const dayItems = shown.filter((item) => item.date === cursor);

  function openCreate() {
    if (!session?.canEdit) return;
    setSelected(null);
    setEditing(true);
    setForm({
      ...EMPTY_FORM,
      date: cursor,
      mechanicId: session.mechanicId || session.mechanics[0]?.id || "",
    });
    setClients([]);
  }

  function openEdit(card: Card) {
    setSelected(card);
    setEditing(true);
    setForm({
      clientName: card.clientName,
      clientPhone: card.clientPhone,
      make: card.make,
      model: card.model,
      plate: card.plate,
      vin: card.vin,
      vehicleId: card.vehicleId,
      userId: card.userId,
      serviceId: card.serviceIds[0] || "diagnostic",
      problemText: card.problemText,
      date: card.date,
      time: card.time,
      durationMinutes: card.durationMinutes,
      holdUntil: card.holdUntil ?? "",
      multiDay: card.multiDay,
      mechanicId: card.mechanicId,
      comment: card.comment,
      appointmentStatus: card.appointmentStatus,
      notifyMechanic: card.notifyMechanic,
    });
  }

  async function save() {
    if (!session) return;
    setBusy(true);
    setNotice("");
    setError("");
    const payload = {
      action: selected ? "update" : "create",
      id: selected?.id,
      expectedUpdatedAt: selected?.updatedAt,
      clientRequestId: selected ? undefined : `req-${Date.now()}`,
      clientName: form.clientName,
      clientPhone: form.clientPhone,
      make: form.make,
      model: form.model,
      plate: form.plate,
      vin: form.vin,
      vehicleId: form.vehicleId,
      userId: form.userId,
      serviceIds: [form.serviceId],
      problemText: form.problemText,
      date: form.date,
      time: form.time,
      durationMinutes: Number(form.durationMinutes),
      holdUntil: form.multiDay ? form.holdUntil : "",
      multiDay: form.multiDay,
      mechanicId: form.mechanicId,
      comment: form.comment,
      appointmentStatus: form.appointmentStatus,
      notifyMechanic: form.notifyMechanic,
    };
    const { res, data } = await post(payload);
    setBusy(false);
    if (!res.ok || !data.ok) {
      setError(data.error === "mechanic_conflict" ? text.conflict : String(data.error || "error"));
      return;
    }
    setNotice(text.saved);
    setEditing(false);
    setSelected((data.appointment as Card) ?? null);
    setCursor(form.date);
    await load();
  }

  async function cancelSelected() {
    if (!selected) return;
    setBusy(true);
    const { res, data } = await post({
      action: "cancel",
      id: selected.id,
      expectedUpdatedAt: selected.updatedAt,
    });
    setBusy(false);
    if (!res.ok || !data.ok) {
      setError(String(data.error || "error"));
      return;
    }
    setSelected(null);
    setEditing(false);
    await load();
  }

  async function lookupClients(value: string) {
    setForm((prev) => ({ ...prev, clientName: value }));
    if (value.trim().length < 2) {
      setClients([]);
      return;
    }
    const { data } = await post({ action: "clients", q: value.trim() });
    setClients((data.clients as ClientHit[]) ?? []);
  }

  if (!ready) {
    return <Shell lang={lang} setLang={setLang} title={text.title}><p>{text.loading}</p></Shell>;
  }
  if (!initData || error === text.gate || (!session && error)) {
    return (
      <Shell lang={lang} setLang={setLang} title="BESS MOTORS">
        <p className="text-sm text-neutral-300">{error || text.gate}</p>
      </Shell>
    );
  }
  if (!session || !cursor) {
    return <Shell lang={lang} setLang={setLang} title={text.title}><p>{text.loading}</p></Shell>;
  }

  const closed = weekday(cursor) === 0;

  return (
    <Shell lang={lang} setLang={setLang} title={text.title}>
      <p className="text-[11px] text-neutral-400">{text.hours}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["day", "week", "month"] as View[]).map((item) => (
          <button key={item} className={chip(view === item)} onClick={() => setView(item)} type="button">
            {text[item]}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button className={chip(false)} type="button" onClick={() => setCursor(shift(cursor, view === "month" ? -30 : view === "week" ? -7 : -1))}>←</button>
        <button className={chip(cursor === session.today)} type="button" onClick={() => setCursor(session.today)}>{text.today}</button>
        <button className={chip(cursor === session.tomorrow)} type="button" onClick={() => setCursor(session.tomorrow)}>{text.tomorrow}</button>
        <button className={chip(false)} type="button" onClick={() => setCursor(shift(cursor, view === "month" ? 30 : view === "week" ? 7 : 1))}>→</button>
        <span className="ml-auto font-mono text-xs text-white">{cursor}</span>
      </div>
      <form
        className="mt-3"
        onSubmit={(event) => {
          event.preventDefault();
          void post({ action: "search", q: query }).then(({ data }) => {
            if (data.ok) setItems((data.appointments as Card[]) ?? []);
          });
        }}
      >
        <input
          className={field}
          value={query}
          placeholder={text.search}
          onChange={(event) => setQuery(event.target.value)}
        />
      </form>
      {session.canEdit && (
        <button className="mt-3 w-full rounded-xl bg-[#e10600] px-4 py-3 text-sm font-semibold" type="button" onClick={openCreate}>
          {text.neu}
        </button>
      )}
      {notice && <p className="mt-2 text-xs text-emerald-300">{notice}</p>}
      {error && error !== text.gate && <p className="mt-2 text-xs text-[#ffb4b0]">{error}</p>}

      {view === "month" && (
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px]">
          {monthGrid(cursor).map((day) => {
            const count = shown.filter((item) => item.date === day && item.appointmentStatus !== "cancelled").length;
            const inMonth = day.slice(5, 7) === cursor.slice(5, 7);
            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  setCursor(day);
                  setView("day");
                }}
                className={`rounded-lg py-2 ${day === session.today ? "ring-1 ring-[#e10600]" : ""} ${inMonth ? "bg-white/5" : "opacity-40"}`}
              >
                <span className="block">{day.slice(8)}</span>
                {count > 0 && <span className="text-[#e10600]">{count}</span>}
              </button>
            );
          })}
        </div>
      )}

      {view === "week" && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 7 }, (_, index) => shift(weekStart(cursor), index)).map((day) => (
            <button key={day} type="button" onClick={() => { setCursor(day); setView("day"); }} className="min-w-28 rounded-xl border border-white/10 bg-white/5 p-2 text-left">
              <span className={`block text-xs ${day === session.today ? "text-[#e10600]" : "text-neutral-400"}`}>{day.slice(5)}</span>
              {shown.filter((item) => item.date === day && item.appointmentStatus !== "cancelled").map((item) => (
                <span key={item.id} className="mt-1 block truncate text-[11px]">{item.time} {item.make}</span>
              ))}
            </button>
          ))}
        </div>
      )}

      {view === "day" && (
        <section className="mt-4">
          <h2 className="text-xs uppercase tracking-wide text-neutral-500">{text.appointments}</h2>
          {closed && <p className="mt-2 text-sm text-neutral-400">{text.closed}</p>}
          {!dayItems.length && <p className="mt-2 text-sm text-neutral-400">{text.empty}</p>}
          <div className="mt-2 space-y-2">
            {dayItems.map((item) => (
              <button key={item.id} type="button" onClick={() => { setSelected(item); setEditing(false); }} className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm text-[#e10600]">{item.time}</span>
                  <span className="text-[11px] text-neutral-400">{STATUS_LABEL[lang][item.appointmentStatus]}</span>
                </div>
                <p className="mt-1 text-sm">{item.make} {item.model} {item.plate}</p>
                <p className="text-xs text-neutral-400">{serviceLabel(item.serviceIds[0] || "", lang)} · {item.mechanicName}</p>
                <p className="text-xs text-neutral-300">{item.clientName}</p>
              </button>
            ))}
          </div>
          {!!calls.length && (
            <div className="mt-5">
              <h2 className="text-xs uppercase tracking-wide text-neutral-500">{text.calls}</h2>
              {calls.map((call) => (
                <article key={call.id} className="mt-2 rounded-2xl border border-dashed border-white/15 p-3 text-sm">
                  <p>{call.clientName || call.phone}</p>
                  <p className="text-xs text-neutral-400">{call.serviceLabel} · {call.status}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {selected && !editing && (
        <article className="mt-4 rounded-2xl border border-[#e10600]/40 bg-black/40 p-4">
          <p className="font-mono text-[#e10600]">{selected.time} · {selected.date}</p>
          <p className="mt-1">{selected.clientName} · {selected.clientPhone}</p>
          <p>{selected.make} {selected.model} · {selected.plate}</p>
          {selected.vin && <p className="text-xs text-neutral-400">VIN {selected.vin}</p>}
          <p className="text-sm text-neutral-300">{selected.problemText || serviceLabel(selected.serviceIds[0] || "", lang)}</p>
          <p className="text-xs text-neutral-400">{selected.mechanicName} · {selected.durationMinutes} min{selected.holdUntil ? ` → ${selected.holdUntil}` : ""}</p>
          <p className="text-sm">{STATUS_LABEL[lang][selected.appointmentStatus]}</p>
          {selected.comment && <p className="mt-1 text-sm text-neutral-300">{selected.comment}</p>}
          {session.canEdit && (
            <div className="mt-3 flex gap-2">
              <button className={chip(true)} type="button" onClick={() => openEdit(selected)}>{text.edit}</button>
              <button className={chip(false)} type="button" onClick={() => void cancelSelected()}>{text.cancelApt}</button>
            </div>
          )}
        </article>
      )}

      {editing && session.canEdit && (
        <form
          className="mt-4 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <input className={field} placeholder={text.name} value={form.clientName} onChange={(event) => void lookupClients(event.target.value)} required />
          {clients.map((client) => (
            <button
              key={client.id}
              type="button"
              className="block w-full rounded-lg bg-white/5 px-3 py-2 text-left text-xs"
              onClick={() => {
                const vehicle = client.vehicles[0];
                setForm((prev) => ({
                  ...prev,
                  clientName: client.name,
                  clientPhone: client.phone,
                  userId: client.id,
                  vehicleId: vehicle?.id || "",
                  make: vehicle?.make || prev.make,
                  model: vehicle?.model || prev.model,
                  plate: vehicle?.plate || prev.plate,
                  vin: vehicle?.vin || prev.vin,
                }));
                setClients([]);
              }}
            >
              {client.name} · {client.phone}
              {client.vehicles[0] ? ` · ${client.vehicles[0].make} ${client.vehicles[0].plate}` : ""}
            </button>
          ))}
          <input className={field} placeholder={text.phone} value={form.clientPhone} onChange={(event) => setForm({ ...form, clientPhone: event.target.value })} required />
          <div className="grid grid-cols-2 gap-2">
            <input className={field} placeholder={text.make} value={form.make} onChange={(event) => setForm({ ...form, make: event.target.value })} />
            <input className={field} placeholder={text.model} value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className={field} placeholder={text.plate} value={form.plate} onChange={(event) => setForm({ ...form, plate: event.target.value })} />
            <input className={field} placeholder={text.vin} value={form.vin} onChange={(event) => setForm({ ...form, vin: event.target.value })} />
          </div>
          <label className="block text-[11px] text-neutral-500">{text.service}</label>
          <select className={field} value={form.serviceId} onChange={(event) => setForm({ ...form, serviceId: event.target.value })}>
            {SERVICES.map((item) => (
              <option key={item[0]} value={item[0]}>{lang === "pl" ? item[2] : item[1]}</option>
            ))}
          </select>
          <textarea className={field} placeholder={text.problem} value={form.problemText} onChange={(event) => setForm({ ...form, problemText: event.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className={field} type="date" aria-label={text.date} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
            <input className={field} type="time" aria-label={text.time} value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} required />
          </div>
          <input className={field} type="number" min={15} max={3780} aria-label={text.duration} value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.multiDay} onChange={(event) => setForm({ ...form, multiDay: event.target.checked })} />
            {text.multi}
          </label>
          {form.multiDay && (
            <input className={field} type="date" aria-label={text.hold} value={form.holdUntil} onChange={(event) => setForm({ ...form, holdUntil: event.target.value })} />
          )}
          <label className="block text-[11px] text-neutral-500">{text.mechanic}</label>
          <select className={field} value={form.mechanicId} onChange={(event) => setForm({ ...form, mechanicId: event.target.value })}>
            {session.mechanics.map((mechanic) => (
              <option key={mechanic.id} value={mechanic.id}>{mechanic.name}</option>
            ))}
          </select>
          <textarea className={field} placeholder={text.comment} value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />
          <label className="block text-[11px] text-neutral-500">{text.status}</label>
          <select className={field} value={form.appointmentStatus} onChange={(event) => setForm({ ...form, appointmentStatus: event.target.value as Status })}>
            {(Object.keys(STATUS_LABEL.ru) as Status[]).map((status) => (
              <option key={status} value={status}>{STATUS_LABEL[lang][status]}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.notifyMechanic} onChange={(event) => setForm({ ...form, notifyMechanic: event.target.checked })} />
            {text.notify}
          </label>
          <button className="w-full rounded-xl bg-[#e10600] py-3 text-sm font-semibold disabled:opacity-50" disabled={busy} type="submit">
            {text.save}
          </button>
          <button className={chip(false)} type="button" onClick={() => setEditing(false)}>{text.back}</button>
        </form>
      )}
    </Shell>
  );
}

function Shell({
  title,
  lang,
  setLang,
  children,
}: {
  title: string;
  lang: "ru" | "pl";
  setLang: (lang: "ru" | "pl") => void;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#070707] px-4 py-4 text-white">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#e10600]">BESS MOTORS</p>
          <h1 className="font-display text-xl">{title}</h1>
        </div>
        <div className="flex gap-1">
          <button className={chip(lang === "ru")} type="button" onClick={() => setLang("ru")}>RU</button>
          <button className={chip(lang === "pl")} type="button" onClick={() => setLang("pl")}>PL</button>
        </div>
      </header>
      {children}
    </main>
  );
}

function chip(active: boolean): string {
  return `rounded-full px-3 py-1 text-xs ${active ? "bg-[#e10600] text-white" : "bg-white/10 text-neutral-200"}`;
}

const field = "w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none";
