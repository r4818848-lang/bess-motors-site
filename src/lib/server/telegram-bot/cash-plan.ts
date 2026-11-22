import { getSupabaseConfig } from "@/lib/server/supabase-config";
import { formatWarsawDateKey } from "@/lib/date-key";
import { addDateKeyDays } from "@/lib/staff-calendar";
import { esc } from "./format";

type Kind = "balance" | "in" | "out" | "wage" | "settle";
export type CashEntry = { id: number; kind: Kind; cents: number; due: string; label: string; settles: number | null };
const amount = (cents: number) => (cents / 100).toFixed(2) + " zł";
const sign = (entry: CashEntry) => entry.kind === "in" ? entry.cents : -entry.cents;
const usage = [
  "/cash — остаток и прогноз на 30 дней",
  "/balance 3200,50 — фактический остаток на сейчас",
  "/debt 2026-12-10 10300 Аренда — запланировать выплату",
  "/income 2026-12-03 500 Заказ — запланировать поступление",
  "/wage 2026-12-05 750 Сергей — запланировать выплату зарплаты",
  "/settle 123 — отметить полную оплату по номеру записи",
].join("\n");

export function cashForecast(rows: CashEntry[], today: string): string {
  const balance = rows.filter(r => r.kind === "balance").at(-1);
  const plans = rows.filter(r => ["in","out","wage"].includes(r.kind));
  const byId = new Map(plans.map(p => [p.id,p]));
  const settled = rows.filter(r => r.kind === "settle");
  const paid = new Set(settled.map(r => r.settles));
  const pending = plans.filter(r => !paid.has(r.id)).sort((a,b) => a.due.localeCompare(b.due) || a.id-b.id);
  const current = (balance?.cents || 0) + settled.filter(r => balance && r.id > balance.id)
    .reduce((sum,r) => { const plan=byId.get(r.settles!); return sum + (plan ? sign(plan) : 0); },0);
  const lines = [balance ? "Расчётный остаток: " + amount(current) : "Для расчёта остатка введи /balance."];
  const end = addDateKeyDays(today,30)!;
  const days = new Map<string,number>();
  for (const p of pending.filter(p => p.due <= end)) {
    const day = p.due < today ? today : p.due;
    days.set(day,(days.get(day) || 0) + sign(p));
  }
  if (balance) {
    let running = current, low = current, first = current < 0 ? today : "";
    for (const [day,net] of days) { running += net; low=Math.min(low,running); if (!first && running<0) first=day; }
    lines.push("Прогноз к " + end + ": " + amount(running),first ? "Первый дефицит " + first + ", максимум " + amount(-low) : "По внесённым платежам дефицита на конец дня нет.");
  }
  lines.push("Открытые обязательства: " + amount(pending.filter(p=>p.kind!=="in").reduce((n,p)=>n+p.cents,0)));
  for (const p of pending.slice(0,15)) lines.push("#"+p.id+" · "+p.due+" · "+amount(sign(p))+" · "+esc(p.label));
  lines.push("Учтены внесённые планы и их оплаты. Сверяй фактическую кассу через /balance.", usage);
  return lines.join("\n");
}

export async function cashCommand(text: string, key: string): Promise<string> {
  const cfg = getSupabaseConfig();
  if (!cfg) return "Supabase недоступен.";
  const url = cfg.url+"/rest/v1/workshop_cash_plan";
  const headers = { apikey: cfg.key, Authorization: "Bearer "+cfg.key, "Content-Type":"application/json" };
  const today = formatWarsawDateKey();
  if (text === "/cash") {
    const rows: CashEntry[] = [];
    for (;;) {
      const page = await fetch(url+"?select=id,kind,cents,due,label,settles&order=id.asc&id=gt."+(rows.at(-1)?.id || 0)+"&limit=500",{ headers,cache:"no-store" });
      if (!page.ok) return "Не удалось загрузить план платежей.";
      const batch: CashEntry[] = await page.json();
      rows.push(...batch);
      if (batch.length < 500) break;
    }
    return cashForecast(rows,today);
  }
  const [command,...tokens] = text.split(/\s+/);
  let kind: Kind, cents = 0, due=today, label="", settles: number | null = null;
  if (command === "/settle") {
    if (tokens.length !== 1 || !/^[1-9]\d{0,12}$/.test(tokens[0])) return usage;
    settles = Number(tokens[0]);
    const check = await fetch(url+"?select=id&id=eq."+settles+"&kind=in.(in,out,wage)",{headers,cache:"no-store"});
    if (!check.ok || !(await check.json()).length) return "План платежа не найден.";
    kind="settle";
  } else {
    kind = command === "/balance" ? "balance" : command === "/income" ? "in" : command === "/debt" ? "out" : "wage";
    if (kind !== "balance") due=tokens.shift() || "";
    const raw = tokens.shift() || "";
    label=tokens.join(" ");
    if (!/^\d{4}-\d\d-\d\d$/.test(due) || addDateKeyDays(due,0)!==due || !/^-?\d{1,9}([.,]\d{1,2})?$/.test(raw) || label.length>100 || (kind !== "balance" && !label)) return usage;
    cents=Math.round(Number(raw.replace(",","."))*100);
    if (kind !== "balance" && cents<=0) return usage;
  }
  const res=await fetch(url+"?on_conflict=request_key", {method:"POST",headers:{...headers,Prefer:"resolution=ignore-duplicates"},body:JSON.stringify({request_key:key,kind,cents,due,label,settles})});
  if (res.status===409 && kind==="settle") return "Эта оплата уже отмечена.";
  return res.ok ? "Сохранено. /cash — остаток и прогноз." : "Не удалось сохранить операцию.";
}
