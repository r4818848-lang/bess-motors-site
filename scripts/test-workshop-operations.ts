import assert from "node:assert/strict";
import { calendarDecision, decodeVisit, encodeVisit } from "../src/lib/server/icloud-calendar";
import { cashForecast, type CashEntry } from "../src/lib/server/telegram-bot/cash-plan";
import { findMechanicConflict } from "../src/lib/staff-calendar";
import { workshopHours } from "../src/lib/businessConfig";
for (const date of ["2026-01-12","2026-07-13"]) {
  const slot = {date,time:"10:30",minutes:90,title:"Диагностика, Audi"};
  assert.deepEqual(decodeVisit(encodeVisit(slot,"sample")).slot, slot);
}
assert.equal(calendarDecision("a","a","b"),"import");
assert.equal(calendarDecision("a","b","a"),"export");
assert.equal(calendarDecision("a","b","c"),"conflict");
assert.equal(calendarDecision("a","b","b"),"equal");
const rows: CashEntry[]=[
  {id:1,kind:"balance",cents:10000,due:"2026-11-23",label:"",settles:null},
  {id:2,kind:"out",cents:12000,due:"2026-11-25",label:"Аренда",settles:null}
];
assert.match(cashForecast(rows,"2026-11-23"),/Первый дефицит 2026-11-25, максимум 20.00/);
rows.push({id:3,kind:"settle",cents:0,due:"2026-11-23",label:"",settles:2});
assert.match(cashForecast(rows,"2026-11-23"),/Расчётный остаток: -20.00/);
const booking={id:"a",date:"2026-11-23",time:"17:30",mechanicId:"m1",serviceIds:[],appointmentStatus:"scheduled" as const,workStart:"17:30",workMinutes:90,resourceId:"lift-1"};
assert.equal(findMechanicConflict([booking],{...booking,id:"b",mechanicId:"m2",date:"2026-11-24",workStart:"09:00"},workshopHours(),{start:"13:00",end:"14:00"}),"a");
console.log("Workshop calendar, cash plan and iCalendar checks passed");
