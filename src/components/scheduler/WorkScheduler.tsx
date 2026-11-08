"use client";

import { useMemo, useState } from "react";
import type { Operation } from "@/lib/smart-scheduler/catalog";
import { searchOperations } from "@/lib/smart-scheduler/search";
import {
  explainOverlap,
  findHoldConflict,
  planOperationMinutes,
  splitWorkBlocks,
  type Hold,
} from "@/lib/smart-scheduler/schedule";
import type { WorkshopHours } from "@/lib/workshop-schedule";

const DAY = "2026-11-09";
const OPEN = 9 * 60;
const SPAN = 9 * 60;
const MECHANICS = [
  { id: "mech-1", name: "Сергей" },
  { id: "mech-2", name: "Андрей" },
] as const;

function place(start: string, end: string): { top: string; height: string } {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const from = sh * 60 + sm;
  const to = eh * 60 + em;
  return { top: `${((from - OPEN) / SPAN) * 100}%`, height: `${((to - from) / SPAN) * 100}%` };
}

export function WorkScheduler({ catalog, hours }: { catalog: Operation[]; hours: WorkshopHours }) {
  const [filter, setFilter] = useState<"all" | "mech-1" | "mech-2">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("MA-001");
  const [mechanicId, setMechanicId] = useState("mech-1");
  const [arrival, setArrival] = useState("11:00");
  const [start, setStart] = useState("11:00");
  const [lift, setLift] = useState("lift-1");
  const [leavesCar, setLeavesCar] = useState(false);
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const operation = catalog.find((item) => item.operationCode === selected) ?? catalog[0];
  const planned = operation ? planOperationMinutes(operation) : null;
  const found = useMemo(() => searchOperations(catalog, query), [catalog, query]);
  const demo = useMemo(() => {
    const oil = splitWorkBlocks({ id: "demo-oil", date: DAY, start: "11:00", minutes: 45, hours, mechanicId: "mech-1", resourceIds: ["lift-1"], operationCode: "MA-001" });
    const pads = splitWorkBlocks({ id: "demo-pads", date: DAY, start: "11:20", minutes: 60, hours, mechanicId: "mech-2", resourceIds: ["lift-2"], operationCode: "BR-001" });
    return [...(oil.ok ? oil.blocks : []), ...(pads.ok ? pads.blocks : [])];
  }, [hours]);
  const visible = MECHANICS.filter((mechanic) => filter === "all" || filter === mechanic.id);

  function check() {
    if (!operation || !planned?.minutes) {
      setNotice("Для этой операции нет подтверждённой нормы.");
      return;
    }
    const split = splitWorkBlocks({
      id: "draft",
      date: DAY,
      start,
      minutes: planned.minutes,
      hours,
      mechanicId,
      resourceIds: [lift],
      operationCode: operation.operationCode,
    });
    if (!split.ok) {
      setNotice("Это время вне рабочей смены.");
      return;
    }
    const conflict = split.blocks
      .map((item) => findHoldConflict(demo, item as Hold))
      .find(Boolean);
    const overlap = explainOverlap([operation.operationCode], catalog);
    if (conflict?.code === "resource") setNotice("Подъёмник уже занят. Можно выбрать другой или другой час.");
    else if (conflict?.code === "mechanic") setNotice("У этого мастера уже есть работа в это время.");
    else setNotice(`Свободно: ${split.blocks.map((item) => `${item.date} ${item.start}–${item.end}`).join(", ")}. ${overlap[0]?.explanation ?? "В CRM ничего не записано."}`);
  }

  return (
    <main className="mx-auto box-border w-full max-w-6xl overflow-x-hidden bg-zinc-950 px-3 py-4 text-zinc-100 md:px-6">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-zinc-400">BESS MOTORS</p>
      <h1 className="text-xl font-semibold">План работ</h1>
      <p className="mt-1 max-w-3xl text-sm text-zinc-400">Предпросмотр на {DAY}. Приезд и ремонт разделены. Запись в CRM не создаётся, цены из нормативов не считаются.</p>
      <p className="mt-2 text-xs text-amber-200">Колонки «Сергей» и «Андрей» — пример из задания. Новые учётки не создаются: в CRM остаются mech-1 и mech-2, имя второго подтверждает владелец.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["all", "mech-1", "mech-2"] as const).map((item) => (
          <button key={item} type="button" data-testid={`scheduler-filter-${item}`} className={`min-h-12 rounded-xl px-3 text-sm font-semibold ${filter === item ? "bg-white text-black" : "bg-zinc-900"}`} onClick={() => setFilter(item)}>
            {item === "all" ? "Все" : MECHANICS.find((mechanic) => mechanic.id === item)?.name}
          </button>
        ))}
        <button type="button" data-testid="scheduler-new" className="min-h-12 rounded-xl bg-red-700 px-4 text-sm font-semibold" onClick={() => setOpen(true)}>Новая запись</button>
      </div>

      <div className="mt-4 hidden gap-3 md:grid" style={{ gridTemplateColumns: `4rem repeat(${visible.length}, minmax(0, 1fr))` }}>
        <div className="relative h-[720px] text-xs text-zinc-500">
          {Array.from({ length: 10 }, (_, index) => (
            <span key={index} className="absolute left-0" style={{ top: `${(index / 9) * 100}%` }}>{`${String(9 + index).padStart(2, "0")}:00`}</span>
          ))}
        </div>
        {visible.map((mechanic) => (
          <section key={mechanic.id} data-testid={`scheduler-column-${mechanic.id}`} className="relative h-[720px] rounded-2xl bg-zinc-900">
            <h2 className="sticky top-0 border-b border-zinc-800 px-3 py-2 text-sm font-semibold">{mechanic.name}</h2>
            {demo.filter((item) => item.mechanicId === mechanic.id).map((item) => {
              const name = catalog.find((operationItem) => operationItem.operationCode === item.operationCode);
              const box = place(item.start, item.end);
              return (
                <article key={item.id} data-testid={`scheduler-card-${item.id}`} className="absolute inset-x-2 overflow-hidden rounded-xl bg-red-950 p-2 text-xs" style={box}>
                  <p className="font-semibold">{item.start}–{item.end}</p>
                  <p>{name?.operationNameRu}</p>
                  <p className="text-zinc-300">WX0000 · {item.resourceIds[0]}</p>
                </article>
              );
            })}
          </section>
        ))}
      </div>

      <div className="mt-4 space-y-2 md:hidden">
        {demo.filter((item) => filter === "all" || item.mechanicId === filter).map((item) => (
          <article key={item.id} className="rounded-2xl bg-zinc-900 p-3">
            <p className="text-lg font-semibold">{item.start}–{item.end}</p>
            <p>{MECHANICS.find((mechanic) => mechanic.id === item.mechanicId)?.name}</p>
            <p className="text-sm text-zinc-300">{catalog.find((operationItem) => operationItem.operationCode === item.operationCode)?.operationNameRu}</p>
          </article>
        ))}
      </div>

      {open && operation && planned && (
        <form className="mt-4 space-y-3 rounded-2xl bg-zinc-900 p-4" data-testid="scheduler-form" onSubmit={(event) => { event.preventDefault(); setNotice("В CRM не записано. Планировщик не пишет в боевую базу."); }}>
          <label className="block text-sm">Время приезда
            <input data-testid="scheduler-arrival" className="mt-1 h-12 w-full rounded-xl bg-zinc-950 px-3 text-base" value={arrival} onChange={(event) => setArrival(event.target.value)} />
          </label>
          <label className="block text-sm">Найти работу
            <input data-testid="scheduler-search" className="mt-1 h-12 w-full rounded-xl bg-zinc-950 px-3 text-base" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="колодки, масло, замена" />
          </label>
          {query && found.mode === "groups" && (
            <div className="flex flex-wrap gap-2">
              {found.groups.map((group) => (
                <button key={group.label} type="button" className="min-h-12 rounded-xl bg-zinc-800 px-3 text-sm" onClick={() => setSelected(group.codes[0] ?? selected)}>{group.label}</button>
              ))}
            </div>
          )}
          {query && found.mode === "operations" && (
            <div className="space-y-2">
              {found.hits.map((hit) => (
                <button key={hit.code} type="button" className="block min-h-12 w-full rounded-xl bg-zinc-800 px-3 text-left text-sm" onClick={() => setSelected(hit.code)}>{hit.nameRu}</button>
              ))}
            </div>
          )}
          <p className="text-sm">{operation.operationNameRu}</p>
          <p className="text-sm text-zinc-300">Нормо-часы: {operation.baseLaborHours ?? "не заданы"}. Бронь: {planned.minutes ?? "вручную"} мин. Режим: {planned.bookingMode}. Ресурсы: {operation.requiredResources.join(", ") || "нет"}.</p>
          {planned.discrepancy && <p className="text-sm text-amber-200">{planned.explanation}</p>}
          <label className="block text-sm">Начало ремонта
            <input className="mt-1 h-12 w-full rounded-xl bg-zinc-950 px-3 text-base" value={start} onChange={(event) => setStart(event.target.value)} />
          </label>
          <label className="block text-sm">Исполнитель
            <select className="mt-1 h-12 w-full rounded-xl bg-zinc-950 px-3 text-base" value={mechanicId} onChange={(event) => setMechanicId(event.target.value)}>
              {MECHANICS.map((mechanic) => <option key={mechanic.id} value={mechanic.id}>{mechanic.name}</option>)}
            </select>
          </label>
          <label className="block text-sm">Подъёмник
            <select data-testid="scheduler-lift" className="mt-1 h-12 w-full rounded-xl bg-zinc-950 px-3 text-base" value={lift} onChange={(event) => setLift(event.target.value)}>
              <option value="lift-1">Подъёмник 1</option>
              <option value="lift-2">Подъёмник 2</option>
            </select>
          </label>
          <label className="flex min-h-12 items-center gap-3 text-base"><input className="h-5 w-5" type="checkbox" checked={leavesCar} onChange={(event) => setLeavesCar(event.target.checked)} />Оставляет автомобиль</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" data-testid="scheduler-check" className="min-h-12 rounded-xl bg-zinc-800 font-semibold" onClick={check}>Проверить доступность</button>
            <button type="submit" className="min-h-12 rounded-xl bg-white font-semibold text-black">Забронировать</button>
          </div>
          {notice && <p data-testid="scheduler-notice" className="text-sm">{notice}</p>}
          {leavesCar && <p className="text-sm text-zinc-400">Машина может остаться в сервисе. Это не занимает мастера после окончания работы.</p>}
        </form>
      )}
    </main>
  );
}
