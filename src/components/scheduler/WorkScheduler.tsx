"use client";

import { useEffect, useMemo, useState } from "react";
import type { Operation } from "@/lib/smart-scheduler/catalog";
import type { SchedulerSnapshot } from "@/lib/smart-scheduler/fixture";
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
import { addDateKeyDays } from "@/lib/staff-calendar";
import { bindTelegramViewport, calendarFrame, type CalendarFrame } from "@/lib/telegram-webapp-client";
import { clockToMinutes, minutesToClock, weekdayIndexFromDateKey, type WorkshopHours } from "@/lib/workshop-schedule";

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

export function WorkScheduler({
  catalog,
  hours,
  snapshot,
  rules,
}: {
  catalog: Operation[];
  hours: WorkshopHours;
  snapshot: SchedulerSnapshot;
  rules: OverlapRule[];
}) {
  const [frame, setFrame] = useState<CalendarFrame>(() => calendarFrame({}));
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
  const planned = operation ? planOperationMinutes(operation, { reservePct: snapshot.settings.reservePct }) : null;
  const found = useMemo(() => searchOperations(catalog, query), [catalog, query]);
  const visibleMechanics = snapshot.mechanics.filter((mechanic) => filter === "all" || mechanic.id === filter);
  const days = view === "week" ? weekDates(date) : [date];

  useEffect(() => bindTelegramViewport(setFrame) ?? undefined, []);

  function cardsFor(day: string, mechanic: string) {
    return snapshot.appointments.filter((item) => item.date === day && item.mechanicId === mechanic && item.workStart && item.workMinutes > 0);
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
    const permission = canAutoBook({ operation, parts, resources: snapshot.settings.resources, resourceIds: [lift] });
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
    const occupied = [...snapshot.crmHolds, ...breakHolds({ date, breaks: snapshot.settings.breaks })];
    const conflict = split.blocks.map((block) => findHoldConflict(occupied, block)).find(Boolean);
    const end = split.blocks.map((block) => `${block.date} ${block.start}–${block.end}`).join(", ");
    if (!conflict) {
      setNotice(`${permission.auto ? "AUTO доступен." : `AUTO выключен: ${permission.reason}.`} Окончание: ${end}. Приезд ${arrival} механика не занимает. ${leavesCar ? "Стоянка отдельно." : ""}`);
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
    setNotice(conflict.code === "resource" ? `Подъёмник занят. Другие варианты: ${names || "нет"}` : `Мастер занят. Другие варианты: ${names || "нет"}`);
  }

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
      <p className="mt-1 max-w-3xl text-sm text-zinc-400">Тестовые записи без персональных данных. Боевая CRM только читается отдельным серверным режимом и здесь не изменяется.</p>
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
      </div>

      {view === "day" && (
        <div className="mt-4 hidden gap-3 md:grid" style={{ gridTemplateColumns: `4rem repeat(${visibleMechanics.length}, minmax(0, 1fr))` }}>
          <div className="relative h-[720px] text-xs text-zinc-500">
            {Array.from({ length: 10 }, (_, index) => <span key={index} className="absolute left-0" style={{ top: `${(index / 9) * 100}%` }}>{`${String(9 + index).padStart(2, "0")}:00`}</span>)}
          </div>
          {visibleMechanics.map((mechanic) => (
            <section key={mechanic.id} data-testid={`scheduler-column-${mechanic.id}`} className="relative h-[720px] rounded-2xl bg-zinc-900">
              <h2 className="border-b border-zinc-800 px-3 py-2 text-sm font-semibold">{mechanic.label}</h2>
              {snapshot.settings.breaks.filter((item) => item.mechanicId === mechanic.id).map((item) => (
                <div key={item.start} className="absolute inset-x-2 rounded bg-zinc-800/80 text-[10px] text-zinc-400" style={place(item.start, item.end)}>Перерыв</div>
              ))}
              {cardsFor(date, mechanic.id).map((item) => {
                const endMin = (clockToMinutes(item.workStart) ?? 0) + item.workMinutes;
                const box = place(item.workStart, minutesToClock(endMin));
                return (
                  <article key={item.id} data-testid={`scheduler-card-${item.id}`} className={`absolute inset-x-2 overflow-hidden rounded-xl px-2 py-1 text-[11px] leading-tight ${COLORS[item.category] ?? "bg-zinc-800"}`} style={box}>
                    <p className="font-semibold">{item.workStart}–{minutesToClock(endMin)} · {item.lift}</p>
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
            {snapshot.appointments.filter((item) => item.date === day && (filter === "all" || item.mechanicId === filter)).map((item) => (
              <article key={item.id} className={`mb-2 rounded-2xl p-3 ${COLORS[item.category] ?? "bg-zinc-900"}`}>
                <p className="text-lg font-semibold">{item.workStart} · {item.workMinutes} мин</p>
                <p>{item.vehicle} · {item.plate}</p>
                <p className="text-sm">{item.operationName}</p>
                <p className="text-sm text-zinc-300">{snapshot.mechanics.find((mechanic) => mechanic.id === item.mechanicId)?.label} · {item.lift}</p>
                <p className="text-xs text-zinc-400">Приезд {item.arrivalTime}. {item.leavesCar ? `Стоянка до ${item.pickupDate}, мастера не держит.` : "Без стоянки."}</p>
              </article>
            ))}
          </section>
        ))}
      </div>

      {open && operation && planned && (
        <form className="mt-4 space-y-3 rounded-2xl bg-zinc-900 p-4" data-testid="scheduler-form" onSubmit={(event) => { event.preventDefault(); setNotice("Тестовый модуль не создаёт клиента, заказ-наряд и не пишет в боевую CRM."); }}>
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
          <p className="text-sm text-zinc-300">Норма {planned.minutes ?? "вручную"} мин. Рекомендуемое окончание считается от начала работы, не от приезда. {planned.explanation}</p>
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
              {snapshot.settings.resources.filter((resource) => resource.kind === "lift").map((resource) => <option key={resource.id} value={resource.id}>{resource.label}</option>)}
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
