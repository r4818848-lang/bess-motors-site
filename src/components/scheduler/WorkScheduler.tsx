"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Operation } from "@/lib/smart-scheduler/catalog";
import { emptyLiveSnapshot, type SchedulerSnapshot } from "@/lib/smart-scheduler/fixture";
import { searchOperations } from "@/lib/smart-scheduler/search";
import {
  breakHolds,
  explainOverlap,
  findHoldConflict,
  planOperationMinutes,
  resolveDuration,
  splitWorkBlocks,
  suggestSlots,
  type Hold,
  type OverlapRule,
} from "@/lib/smart-scheduler/schedule";
import { canAutoBook } from "@/lib/smart-scheduler/policy";
import { scheduledBreaks, type ResourceStatus, type SchedulerSettings } from "@/lib/smart-scheduler/settings";
import { addDateKeyDays } from "@/lib/staff-calendar";
import { bindTelegramViewport, calendarFrame, type CalendarFrame } from "@/lib/telegram-webapp-client";
import { clockToMinutes, weekdayIndexFromDateKey, type WorkshopHours } from "@/lib/workshop-schedule";

const OPEN = 9 * 60;
const SPAN = 9 * 60;
const COLORS: Record<string, string> = {
  MA: "bg-red-950",
  BR: "bg-sky-950",
  SU: "bg-emerald-950",
  AC: "bg-cyan-950",
  DI: "bg-amber-950",
  TY: "bg-violet-950",
};

function place(start: string, end: string): { top: string; height: string } {
  const startMin = clockToMinutes(start) ?? OPEN;
  const endMin = clockToMinutes(end) ?? startMin + 30;
  return { top: `${((startMin - OPEN) / SPAN) * 100}%`, height: `${Math.max(4, ((endMin - startMin) / SPAN) * 100)}%` };
}

function weekDates(date: string): string[] {
  const weekday = weekdayIndexFromDateKey(date) ?? 1;
  const monday = addDateKeyDays(date, weekday === 0 ? -6 : 1 - weekday) ?? date;
  return Array.from({ length: 6 }, (_, index) => addDateKeyDays(monday, index) ?? monday);
}

const STATUS: Record<ResourceStatus, string> = {
  available: "Доступен",
  broken: "Не работает",
  maintenance: "На обслуживании",
};

export function WorkScheduler({
  catalog,
  hours,
  rules,
}: {
  catalog: Operation[];
  hours: WorkshopHours;
  rules: OverlapRule[];
}) {
  const [frame, setFrame] = useState<CalendarFrame>(() => calendarFrame({}));
  const [mode, setMode] = useState<"live" | "test">("live");
  const [snapshot, setSnapshot] = useState<SchedulerSnapshot>(() => emptyLiveSnapshot(new Date()));
  const [settings, setSettings] = useState<SchedulerSettings>(snapshot.settings);
  const [message, setMessage] = useState("Реальные записи не подключены. Синтетические автомобили не показаны.");
  const [canConfigure, setCanConfigure] = useState(false);
  const [date, setDate] = useState(snapshot.date);
  const [view, setView] = useState<"day" | "week">("day");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("MA-001");
  const [mechanicId, setMechanicId] = useState(snapshot.mechanics[0]?.id ?? "mech-1");
  const [arrival, setArrival] = useState("11:00");
  const [start, setStart] = useState("15:00");
  const [lift, setLift] = useState("lift-1");
  const [parts, setParts] = useState<"available" | "unknown">("unknown");
  const [leavesCar, setLeavesCar] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const operation = catalog.find((item) => item.operationCode === selected) ?? catalog[0];
  const planned = operation ? planOperationMinutes(operation, { reservePct: settings.reservePct }) : null;
  const found = useMemo(() => searchOperations(catalog, query), [catalog, query]);
  const visibleMechanics = snapshot.mechanics.filter((mechanic) => filter === "all" || mechanic.id === filter);
  const days = view === "week" ? weekDates(date) : [date];

  useEffect(() => bindTelegramViewport(setFrame) ?? undefined, []);

  useEffect(() => {
    let stop = false;
    fetch(`/api/internal/schedule/board?mode=${mode}`)
      .then((response) => response.json())
      .then((body: { snapshot?: SchedulerSnapshot; message?: string; canConfigure?: boolean }) => {
        if (stop || !body.snapshot) return;
        setSnapshot(body.snapshot);
        setSettings(body.snapshot.settings);
        setMessage(body.message ?? "");
        setCanConfigure(Boolean(body.canConfigure));
        setDate(body.snapshot.appointments[0]?.date ?? body.snapshot.date);
      })
      .catch(() => {
        if (!stop) setMessage("Сервер расписания не ответил. Синтетические автомобили не показаны.");
      });
    return () => {
      stop = true;
    };
  }, [mode]);

  function blocksFor(day: string, mechanic: string) {
    return snapshot.appointments.flatMap((item) => {
      if (item.mechanicId !== mechanic || !item.workStart || item.workMinutes <= 0) return [];
      const split = splitWorkBlocks({
        id: item.id,
        date: item.date,
        start: item.workStart,
        minutes: item.workMinutes,
        hours,
        mechanicId: item.mechanicId,
        resourceIds: item.lift ? [item.lift] : [],
        operationCode: item.operationCode || "legacy",
      });
      if (!split.ok) return [];
      return split.blocks.filter((block) => block.date === day).map((block) => ({ item, block }));
    });
  }

  function check() {
    if (!operation || !planned?.minutes) {
      setNotice("Для этой операции нет подтверждённой нормы.");
      return;
    }
    const duration = resolveDuration(planned.minutes, customMinutes ? { minutes: Number(customMinutes), reason } : undefined);
    if (!duration.ok) {
      setNotice("Для ручной длительности нужна причина.");
      return;
    }
    const permission = canAutoBook({ operation, parts, resources: settings.resources, resourceIds: [lift] });
    const split = splitWorkBlocks({
      id: "draft",
      date,
      start,
      minutes: duration.minutes,
      hours,
      mechanicId,
      resourceIds: [lift],
      operationCode: operation.operationCode,
    });
    if (!split.ok) {
      setNotice("Начало вне рабочей смены или день закрыт.");
      return;
    }
    const occupied = [...snapshot.crmHolds, ...breakHolds({ date, breaks: scheduledBreaks(settings) })];
    const conflict = split.blocks.map((block) => findHoldConflict(occupied, block)).find(Boolean);
    const end = split.blocks.map((block) => `${block.date} ${block.start}–${block.end}`).join(", ");
    const release = split.blocks[split.blocks.length - 1];
    if (!conflict) {
      setNotice(`Начало ${split.blocks[0]?.start}, окончание ${end}. Пост свободен с ${release?.end}. ${permission.auto ? "AUTO доступен после подтверждения ресурса." : `AUTO выключен: ${permission.reason}.`} Приезд ${arrival} механика не занимает. ${leavesCar ? "Стоянка отдельно." : ""} Занятость подтверждает сервер.`);
      return;
    }
    const ideas = suggestSlots({
      date,
      start,
      minutes: duration.minutes,
      mechanicId,
      mechanicIds: snapshot.mechanics.map((item) => item.id),
      resourceIds: [lift],
      hours,
      occupied,
    });
    const names = ideas.map((idea) => `${snapshot.mechanics.find((item) => item.id === idea.mechanicId)?.label ?? idea.mechanicId} ${idea.start}`).join(", ");
    setNotice(conflict.code === "resource" ? `Подъёмник занят. Свободный мастер или другое время: ${names || "нет"}` : `Мастер занят. Свободный мастер или другое время: ${names || "нет"}`);
  }

  async function book(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/internal/schedule/reservations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "create",
        idempotencyKey: crypto.randomUUID(),
        date,
        start,
        mechanicId,
        operationCode: operation?.operationCode,
        resourceIds: [lift],
        parts,
        durationMinutes: customMinutes ? Number(customMinutes) : undefined,
        reason,
      }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (response.status === 409) setNotice(`Сервер отказал: ${body?.error ?? "conflict"}. Запись не создана.`);
    else if (response.status === 403) setNotice("Запись в боевую CRM выключена.");
    else if (response.status === 503) setNotice("Нужна отдельная тестовая база. Боевая база не используется.");
    else if (response.ok) setNotice("Бронь записана только в тестовую базу. Клиент и заказ-наряд не создавались.");
    else setNotice("Сервер не принял бронь.");
  }

  async function saveSettings() {
    const response = await fetch("/api/internal/schedule/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (response.ok) setNotice("Отображаемые имена и ресурсы сохранены в тестовой базе. Внутренние ID не изменились.");
    else if (response.status === 503) setNotice("Локальная тестовая база не подключена. Боевая база не изменяется.");
    else setNotice("Сохранить настройки может только владелец.");
  }

  const pauses = scheduledBreaks(settings);
  const draft = operation && planned?.minutes
    ? splitWorkBlocks({ id: "draft", date, start, minutes: customMinutes ? Number(customMinutes) || planned.minutes : planned.minutes, hours, mechanicId, resourceIds: [lift], operationCode: operation.operationCode })
    : null;

  return (
    <main
      data-testid="scheduler-root"
      className="mx-auto box-border w-full max-w-6xl overflow-x-hidden bg-zinc-950 text-zinc-100"
      style={{
        paddingTop: frame.paddingTop,
        paddingRight: Math.max(12, frame.paddingRight),
        paddingBottom: frame.paddingBottom,
        paddingLeft: Math.max(12, frame.paddingLeft),
        minHeight: frame.minHeight,
        maxHeight: frame.maxHeight,
        overflowY: frame.maxHeight ? "auto" : undefined,
      }}
    >
      <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400">BESS MOTORS</p>
      <h1 className="text-xl font-semibold">План работ</h1>
      <p className="mt-1 max-w-3xl text-sm text-zinc-400" data-testid={snapshot.source === "fixture" ? "scheduler-test-banner" : "scheduler-live-banner"}>{message}</p>
      {weekdayIndexFromDateKey(date) === 0 && <p className="mt-2 text-sm text-zinc-300">Воскресенье закрыто.</p>}
      {snapshot.mechanics.some((mechanic) => !mechanic.confirmed) && (
        <p className="mt-2 text-xs text-amber-200">{snapshot.mechanics.find((mechanic) => !mechanic.confirmed)?.note}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="min-h-12 rounded-xl bg-zinc-900 px-3 text-sm" onClick={() => setDate(addDateKeyDays(date, -1) ?? date)}>Предыдущий</button>
        <label className="min-h-12 rounded-xl bg-zinc-900 px-3 text-sm">
          <span className="sr-only">Дата</span>
          <input data-testid="scheduler-date" className="h-12 bg-transparent text-base" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <button type="button" className="min-h-12 rounded-xl bg-zinc-900 px-3 text-sm" onClick={() => setDate(addDateKeyDays(date, 1) ?? date)}>Следующий</button>
        <button type="button" className={`min-h-12 rounded-xl px-3 text-sm ${view === "day" ? "bg-white text-black" : "bg-zinc-900"}`} onClick={() => setView("day")}>День</button>
        <button type="button" className={`min-h-12 rounded-xl px-3 text-sm ${view === "week" ? "bg-white text-black" : "bg-zinc-900"}`} onClick={() => setView("week")}>Неделя</button>
        <button type="button" data-testid="scheduler-filter-all" className={`min-h-12 rounded-xl px-3 text-sm ${filter === "all" ? "bg-white text-black" : "bg-zinc-900"}`} onClick={() => setFilter("all")}>Все</button>
        {snapshot.mechanics.map((mechanic) => (
          <button key={mechanic.id} type="button" data-testid={`scheduler-filter-${mechanic.id}`} className={`min-h-12 rounded-xl px-3 text-sm ${filter === mechanic.id ? "bg-white text-black" : "bg-zinc-900"}`} onClick={() => setFilter(mechanic.id)}>{mechanic.label}</button>
        ))}
        <button type="button" data-testid="scheduler-new" className="min-h-12 rounded-xl bg-red-700 px-4 text-sm font-semibold" onClick={() => setOpen(true)}>Новая запись</button>
        <button type="button" data-testid="scheduler-mode-live" className={`min-h-12 rounded-xl px-3 text-sm ${mode === "live" ? "bg-white text-black" : "bg-zinc-900"}`} onClick={() => setMode("live")}>Реальные записи</button>
        <button type="button" data-testid="scheduler-mode-test" className={`min-h-12 rounded-xl px-3 text-sm ${mode === "test" ? "bg-white text-black" : "bg-zinc-900"}`} onClick={() => setMode("test")}>TEST</button>
      </div>
      {canConfigure && (
        <section className="mt-4 space-y-3 rounded-2xl bg-zinc-900 p-4" data-testid="scheduler-settings">
          <h2 className="text-sm font-semibold">Настройки владельца</h2>
          <p className="text-xs text-zinc-400">Имена только для экрана. ID mech-1 и mech-2 и история заказов не меняются. Ресурс без подтверждения не считается исправным.</p>
          {snapshot.mechanics.map((mechanic) => {
            const schedule = settings.schedules.find((item) => item.mechanicId === mechanic.id);
            const pause = schedule?.breaks[0];
            return (
              <div key={mechanic.id} className="grid gap-2 md:grid-cols-4">
                <label className="text-xs">Имя на экране, {mechanic.id}
                  <input className="mt-1 h-12 w-full rounded-xl bg-zinc-950 px-3 text-base" value={settings.displayNames[mechanic.id] ?? ""} placeholder={mechanic.label} onChange={(event) => setSettings((current) => ({ ...current, displayNames: { ...current.displayNames, [mechanic.id]: event.target.value } }))} />
                </label>
                <label className="text-xs">Начало смены
                  <input className="mt-1 h-12 w-full rounded-xl bg-zinc-950 px-3 text-base" value={schedule?.shiftStart ?? ""} placeholder="не задано" onChange={(event) => setSettings((current) => ({ ...current, schedules: current.schedules.map((item) => item.mechanicId === mechanic.id ? { ...item, shiftStart: event.target.value || null } : item) }))} />
                </label>
                <label className="text-xs">Перерыв
                  <input className="mt-1 h-12 w-full rounded-xl bg-zinc-950 px-3 text-base" value={pause ? `${pause.start}-${pause.end}` : ""} placeholder="не задан" onChange={(event) => {
                    const [startAt, endAt] = event.target.value.split("-");
                    setSettings((current) => ({ ...current, schedules: current.schedules.map((item) => item.mechanicId === mechanic.id ? { ...item, breaks: startAt && endAt ? [{ start: startAt, end: endAt }] : [] } : item) }));
                  }} />
                </label>
                <label className="text-xs">Отпуск или отсутствие
                  <input className="mt-1 h-12 w-full rounded-xl bg-zinc-950 px-3 text-base" value={schedule?.vacation[0] ? `${schedule.vacation[0].from}:${schedule.vacation[0].to}` : schedule?.absent[0] ?? ""} placeholder="не задано" onChange={(event) => {
                    const value = event.target.value;
                    setSettings((current) => ({ ...current, schedules: current.schedules.map((item) => {
                      if (item.mechanicId !== mechanic.id) return item;
                      if (value.includes(":")) {
                        const [from, to] = value.split(":");
                        return { ...item, vacation: from && to ? [{ from, to }] : [], absent: [] };
                      }
                      return { ...item, vacation: [], absent: value ? [value] : [] };
                    }) }));
                  }} />
                </label>
              </div>
            );
          })}
          <div className="grid gap-2 md:grid-cols-2">
            {settings.resources.map((resource) => (
              <label key={resource.id} className="text-xs">{resource.label}
                <span className="mt-1 flex gap-2">
                  <select className="h-12 flex-1 rounded-xl bg-zinc-950 px-3 text-base" value={resource.status} onChange={(event) => setSettings((current) => ({ ...current, resources: current.resources.map((item) => item.id === resource.id ? { ...item, status: event.target.value as ResourceStatus } : item) }))}>
                    {Object.entries(STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-sm"><input className="h-5 w-5" type="checkbox" checked={resource.confirmed} onChange={(event) => setSettings((current) => ({ ...current, resources: current.resources.map((item) => item.id === resource.id ? { ...item, confirmed: event.target.checked } : item) }))} />AUTO</label>
                </span>
              </label>
            ))}
          </div>
          <button type="button" className="min-h-12 rounded-xl bg-white px-4 text-sm font-semibold text-black" onClick={() => void saveSettings()}>Сохранить настройки</button>
        </section>
      )}

      {view === "day" && (
        <div className="mt-4 hidden gap-3 md:grid" style={{ gridTemplateColumns: `4rem repeat(${visibleMechanics.length}, minmax(0, 1fr))` }}>
          <div className="relative h-[720px] text-xs text-zinc-500">
            {Array.from({ length: 10 }, (_, index) => <span key={index} className="absolute left-0" style={{ top: `${(index / 9) * 100}%` }}>{`${String(9 + index).padStart(2, "0")}:00`}</span>)}
          </div>
          {visibleMechanics.map((mechanic) => (
            <section key={mechanic.id} data-testid={`scheduler-column-${mechanic.id}`} className="relative h-[720px] rounded-2xl bg-zinc-900">
              <h2 className="border-b border-zinc-800 px-3 py-2 text-sm font-semibold">{mechanic.label}</h2>
              {pauses.filter((item) => item.mechanicId === mechanic.id).map((item) => (
                <div key={item.start} className="absolute inset-x-2 rounded bg-zinc-800/80 text-[10px] text-zinc-400" style={place(item.start, item.end)}>Перерыв</div>
              ))}
              {blocksFor(date, mechanic.id).map(({ item, block }) => {
                const box = place(block.start, block.end);
                return (
                  <article key={block.id} data-testid={`scheduler-card-${item.id}`} className={`absolute inset-x-2 overflow-hidden rounded-xl px-2 py-1 text-[11px] leading-tight ${COLORS[item.category] ?? "bg-zinc-800"}`} style={box}>
                    <p className="font-semibold">{block.start}–{block.end} · {item.lift || "пост"}</p>
                    <p>{item.vehicle} · {item.plate}</p>
                    <p>{item.operationName}</p>
                    <p className="text-zinc-300">{mechanic.label}</p>
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      )}

      <div className={view === "day" ? "mt-4 space-y-2 md:hidden" : "mt-4 space-y-3"}>
        {days.map((day) => (
          <section key={day}>
            {view === "week" && <h2 className="mb-2 text-sm font-semibold">{day}</h2>}
            {snapshot.mechanics.filter((mechanic) => filter === "all" || mechanic.id === filter).flatMap((mechanic) => blocksFor(day, mechanic.id).map(({ item, block }) => (
              <article key={block.id} className={`mb-2 rounded-2xl p-3 ${COLORS[item.category] ?? "bg-zinc-900"}`}>
                <p className="text-lg font-semibold">{block.date} {block.start}–{block.end}</p>
                <p>{item.vehicle} · {item.plate}</p>
                <p className="text-sm">{item.operationName}</p>
                <p className="text-sm text-zinc-300">{mechanic.label} · {item.lift || "пост"}</p>
                <p className="text-xs text-zinc-400">Приезд {item.arrivalTime}. Пост свободен с {block.end}. {item.leavesCar ? `Стоянка до ${item.pickupDate}, мастера не держит.` : "Без стоянки."}</p>
              </article>
            )))}
          </section>
        ))}
      </div>

      {open && operation && planned && (
        <form className="mt-4 space-y-3 rounded-2xl bg-zinc-900 p-4" data-testid="scheduler-form" onSubmit={(event) => void book(event)}>
          <label className="block text-sm">Время приезда
            <input className="mt-1 h-12 w-full rounded-xl bg-zinc-950 px-3 text-base" value={arrival} onChange={(event) => setArrival(event.target.value)} />
          </label>
          <label className="block text-sm">Найти работу
            <input data-testid="scheduler-search" className="mt-1 h-12 w-full rounded-xl bg-zinc-950 px-3 text-base" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="колодки, olej, klock" />
          </label>
          {query && found.mode === "groups" && (
            <div className="flex flex-wrap gap-2">
              {found.groups.map((group) => <button key={group.label} type="button" className="min-h-12 rounded-xl bg-zinc-800 px-3 text-sm" onClick={() => setSelected(group.codes[0] ?? selected)}>{group.label}</button>)}
            </div>
          )}
          {query && found.mode === "operations" && (
            <div className="space-y-2">
              {found.hits.map((hit) => <button key={hit.code} type="button" className="block min-h-12 w-full rounded-xl bg-zinc-800 px-3 text-left text-sm" onClick={() => setSelected(hit.code)}>{hit.nameRu}</button>)}
            </div>
          )}
          <p className="text-sm">{operation.operationNameRu} / {operation.operationNamePl}</p>
          <p className="text-sm text-zinc-300">Норма {planned.minutes ?? "вручную"} мин. Источник: {planned.source}. {planned.explanation} Ручное изменение только с причиной.</p>
          {draft && draft.ok && <p className="text-sm">Рекомендуемое начало {draft.blocks[0]?.start}, окончание {draft.blocks[draft.blocks.length - 1]?.end}. Пост свободен с {draft.blocks[draft.blocks.length - 1]?.end}.</p>}
          {explainOverlap([operation.operationCode], catalog, rules)[0] && <p className="text-sm text-amber-200">{explainOverlap([operation.operationCode], catalog, rules)[0]?.explanation}</p>}
          <label className="block text-sm">Начало ремонта, шаг 5 минут
            <input data-testid="scheduler-start" className="mt-1 h-12 w-full rounded-xl bg-zinc-950 px-3 text-base" value={start} onChange={(event) => setStart(event.target.value)} />
          </label>
          <label className="block text-sm">Исполнитель
            <select className="mt-1 h-12 w-full rounded-xl bg-zinc-950 px-3 text-base" value={mechanicId} onChange={(event) => setMechanicId(event.target.value)}>
              {snapshot.mechanics.map((mechanic) => <option key={mechanic.id} value={mechanic.id}>{mechanic.label}</option>)}
            </select>
          </label>
          <label className="block text-sm">Подъёмник
            <select data-testid="scheduler-lift" className="mt-1 h-12 w-full rounded-xl bg-zinc-950 px-3 text-base" value={lift} onChange={(event) => setLift(event.target.value)}>
              {settings.resources.filter((resource) => resource.kind === "lift").map((resource) => <option key={resource.id} value={resource.id}>{resource.label} · {STATUS[resource.status]}{resource.confirmed ? "" : ", не подтверждён"}</option>)}
            </select>
          </label>
          <label className="block text-sm">Запчасти
            <select className="mt-1 h-12 w-full rounded-xl bg-zinc-950 px-3 text-base" value={parts} onChange={(event) => setParts(event.target.value as "available" | "unknown")}>
              <option value="unknown">Неизвестно</option>
              <option value="available">В наличии</option>
            </select>
          </label>
          <label className="block text-sm">Ручная длительность, минуты
            <input data-testid="scheduler-custom" className="mt-1 h-12 w-full rounded-xl bg-zinc-950 px-3 text-base" value={customMinutes} onChange={(event) => setCustomMinutes(event.target.value)} />
          </label>
          <label className="block text-sm">Причина изменения
            <input data-testid="scheduler-reason" className="mt-1 h-12 w-full rounded-xl bg-zinc-950 px-3 text-base" value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <label className="flex min-h-12 items-center gap-3 text-base"><input className="h-5 w-5" type="checkbox" checked={leavesCar} onChange={(event) => setLeavesCar(event.target.checked)} />Оставляет автомобиль</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" data-testid="scheduler-check" className="min-h-12 rounded-xl bg-zinc-800 font-semibold" onClick={check}>Проверить доступность</button>
            <button type="submit" className="min-h-12 rounded-xl bg-white font-semibold text-black">Забронировать</button>
          </div>
          {notice && <p data-testid="scheduler-notice" className="text-sm">{notice}</p>}
        </form>
      )}
    </main>
  );
}
