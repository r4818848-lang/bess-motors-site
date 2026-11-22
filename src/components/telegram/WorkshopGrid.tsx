"use client";

import { Fragment, useEffect, useRef, useState, type PointerEvent } from "react";
import { addDateKeyDays } from "@/lib/staff-calendar";
import { arrivalTimesForDate } from "@/lib/arrival-window";

export type GridVisit = {
  id: string; date: string; time: string; mechanicId: string; resourceIds?: string[];
  workStart?: string; workMinutes?: number; durationMinutes?: number; clientName: string; make: string; model: string;
};
export type GridSlot = { date: string; time: string; mechanicId?: string; lift?: string };
type Column = { key: string; label: string; date: string; mechanicId?: string; lift?: string };
type Props<T> = {
  date: string; week: boolean; rows: T[]; mechanics: { id: string; name: string }[];
  canEdit: boolean; lang: "ru" | "pl" | "en" | "uk"; select: (visit: T) => void;
  create: (slot: GridSlot) => void; move: (visit: T, slot: GridSlot) => void;
  resize: (visit: T, minutes: number) => void;
};
const labels = {
  ru: ["Механики", "Подъёмники", "Без подъёмника", "Подъёмник", "Длительность"],
  uk: ["Механіки", "Підйомники", "Без підйомника", "Підйомник", "Тривалість"],
  en: ["Mechanics", "Lifts", "No lift", "Lift", "Duration"],
  pl: ["Mechanicy", "Podnośniki", "Bez podnośnika", "Podnośnik", "Czas naprawy"],
};

export function WorkshopGrid<T extends GridVisit>(props: Props<T>) {
  const { date, week, rows, mechanics, canEdit, select, create, move, resize } = props;
  const [lifts, setLifts] = useState(false);
  const [highlight, setHighlight] = useState("");
  const gesture = useRef<{ id: number; x: number; y: number; active: boolean; timer: ReturnType<typeof setTimeout> } | null>(null);
  const words = labels[props.lang] ?? labels.ru;
  const monday = addDateKeyDays(date, -((new Date(date + "T12:00:00Z").getUTCDay() + 6) % 7)) || date;
  const columns: Column[] = week ? Array.from({ length: 7 }, (_, i) => {
    const day = addDateKeyDays(monday, i) || date;
    return { key: day, label: day.slice(5), date: day };
  }) : lifts ? ["lift-1", "lift-2", ""].map((lift, i) => ({
    key: lift || "none", label: lift ? words[3] + " " + (i + 1) : words[2], date, lift,
  })) : mechanics.map(m => ({ key: m.id, label: m.name, date, mechanicId: m.id }));
  const times = [...new Set(columns.flatMap(c => arrivalTimesForDate(c.date)).concat(rows.map(r => r.workStart || r.time)))].sort();
  function clear() {
    if (gesture.current) clearTimeout(gesture.current.timer);
    gesture.current = null;
    setHighlight("");
  }
  useEffect(() => () => { if (gesture.current) clearTimeout(gesture.current.timer); }, []);
  function start(e: PointerEvent<HTMLElement>, activate: () => void) {
    if (!canEdit || !e.isPrimary || e.button !== 0) return;
    clear();
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, active: false, timer: setTimeout(() => {
      if (!gesture.current) return;
      gesture.current.active = true;
      activate();
    }, 450) };
  }
  function target(e: PointerEvent) {
    const cell = document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>("[data-grid-slot]");
    const column = columns.find(c => c.key === cell?.dataset.column);
    return column && cell?.dataset.time && arrivalTimesForDate(column.date).includes(cell.dataset.time)
      ? { ...column, time: cell.dataset.time } : null;
  }
  function moving(e: PointerEvent) {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    if (!g.active && Math.hypot(e.clientX-g.x,e.clientY-g.y)>9) clear();
    else if (g.active) { const slot = target(e); setHighlight(slot ? slot.key+slot.time : ""); }
  }
  return <div onPointerCancel={clear} onPointerMove={moving} onContextMenu={e => e.preventDefault()}>
    {!week && <div className="mb-2 flex gap-2">{words.slice(0,2).map((name,i) => <button key={name} type="button" aria-pressed={lifts === Boolean(i)} onClick={() => setLifts(Boolean(i))} className="min-h-11 rounded-xl bg-zinc-900 px-3 aria-pressed:bg-sky-900">{name}</button>)}</div>}
    <div className="overflow-auto"><div className="grid gap-px bg-zinc-800" style={{gridTemplateColumns: `42px repeat(${Math.max(1,columns.length)},minmax(80px,1fr))`}}>
      <div/>{columns.map(c => <div key={c.key} className="bg-zinc-950 p-2 text-xs">{c.label}</div>)}
      {times.map(time => <Fragment key={time}><div className="bg-zinc-950 text-xs">{time}</div>
        {columns.map(c => <div key={c.key} data-grid-slot="" data-column={c.key} data-time={time}
          className={`min-h-12 p-1 ${highlight === c.key+time ? "bg-sky-800" : "bg-zinc-950"}`}
          onPointerDown={e => { if (e.target === e.currentTarget && arrivalTimesForDate(c.date).includes(time)) start(e, () => create({...c,time})); }}
          onPointerUp={clear}>
          {rows.filter(r => r.date === c.date && (r.workStart || r.time) === time && (!c.mechanicId || r.mechanicId === c.mechanicId)
            && (c.lift === undefined || (c.lift ? r.resourceIds?.includes(c.lift) : !r.resourceIds?.some(id => id.startsWith("lift-"))))).map(r => {
            const minutes = r.workMinutes || r.durationMinutes || 60;
            return <div key={r.id} className="mb-1 rounded-md border-l-2 border-sky-400 bg-sky-950 p-1 text-xs">
              <button type="button" className="w-full touch-none text-left" onClick={e => { if (!e.detail || !canEdit) select(r); }}
                onPointerDown={e => start(e, () => setHighlight(c.key+time))}
                onPointerUp={e => { e.stopPropagation(); const g = gesture.current; const slot = target(e); clear();
                  if (g?.active && slot && (slot.key !== c.key || slot.time !== time)) move(r,slot);
                  else if (g && !g.active) select(r);
                }}>{time} {r.make} {r.model} {r.clientName}<span className="block">{minutes} min</span></button>
              {canEdit && <button type="button" aria-label={words[4]} className="block h-6 w-full touch-none text-sky-300"
                onPointerDown={e => { start(e, () => {}); if (gesture.current) gesture.current.active = true; }}
                onKeyDown={e => { if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); resize(r, Math.max(15,minutes + (e.key === "ArrowDown" ? 15 : -15))); } }}
                onPointerUp={e => { e.stopPropagation(); const g=gesture.current; clear(); if (!g) return;
                  const change = Math.round((e.clientY-g.y)/24)*15;
                  if (change) resize(r,Math.max(15,minutes+change));
                }}>━</button>}
            </div>;
          })}
        </div>)}
      </Fragment>)}
    </div></div>
  </div>;
}
