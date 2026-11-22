import ICAL from "ical.js";
import { createHash } from "node:crypto";
import { createDAVClient } from "tsdav";
import { formatWarsawDateKey } from "@/lib/date-key";
import { minutesToClock, warsawCivilToUtc, warsawParts } from "@/lib/workshop-schedule";
import { getSupabaseConfig } from "./supabase-config";
import { cloudGetCrmStore } from "./crm-cloud";
import { commitStaffAppointment } from "./staff-calendar-commit";
import type { Appointment } from "@/lib/store";

type Slot = { date: string; time: string; minutes: number; title: string };
type Link = { appointment_id: string; href: string; signature: string };
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
const signature = (slot: Slot | null) => slot ? digest(JSON.stringify([slot.date,slot.time,slot.minutes,slot.title])) : "cancelled";
function slotOf(a: Appointment): Slot | null {
  if (a.calendarHidden || a.appointmentStatus==="cancelled" || a.visitState==="no_show") return null;
  return { date:a.date,time:a.workStart || a.time,minutes:a.workMinutes || a.durationMinutes || 60,title:a.problemText || "BESS MOTORS" };
}
export function calendarDecision(base: string, local: string, remote: string) {
  if (local === remote) return "equal";
  if (base === local) return "import";
  if (base === remote) return "export";
  return "conflict";
}
function newCalendar() {
  const cal = new ICAL.Component("vcalendar");
  cal.updatePropertyWithValue("version","2.0");
  cal.updatePropertyWithValue("prodid","-//BESS MOTORS//ERP//PL");
  cal.addSubcomponent(new ICAL.Component("vevent"));
  return cal;
}
export function encodeVisit(slot: Slot, uid: string, original?: string) {
  const cal = original ? new ICAL.Component(ICAL.parse(original)) : newCalendar();
  const event = new ICAL.Event(cal.getFirstSubcomponent("vevent")!);
  const start = warsawCivilToUtc(slot.date, slot.time);
  if (!start) throw new Error("invalid_time");
  event.uid = uid;
  event.summary = slot.title;
  event.startDate = ICAL.Time.fromJSDate(start,true);
  event.endDate = ICAL.Time.fromJSDate(new Date(+start + slot.minutes*60000),true);
  event.component.updatePropertyWithValue("dtstamp",ICAL.Time.fromJSDate(new Date(),true));
  return cal.toString();
}
export function decodeVisit(raw: string) {
  const cal = new ICAL.Component(ICAL.parse(raw));
  const events = cal.getAllSubcomponents("vevent");
  if (events.length !== 1) throw new Error("single_event_required");
  const event = new ICAL.Event(events[0]);
  if (!event.uid || event.isRecurring() || event.isRecurrenceException() || event.startDate.isDate || events[0].hasProperty("attendee") || events[0].hasProperty("organizer")) throw new Error("unsupported_event");
  function instant(time: ICAL.Time, key: string) {
    const tz = events[0].getFirstProperty(key)?.getParameter("tzid");
    if (tz === "Europe/Warsaw" || (!tz && time.zone.tzid === "floating")) {
      const [date,clock] = time.toString().split("T");
      const result = warsawCivilToUtc(date,clock.slice(0,5));
      if (!result) throw new Error("invalid_time");
      return result;
    }
    if (time.zone.tzid==="floating") throw new Error("unknown_timezone");
    return time.toJSDate();
  }
  const start = instant(event.startDate,"dtstart"), end = instant(event.endDate,"dtend");
  const local = warsawParts(start);
  const minutes = (+end-+start)/60000;
  if (!Number.isInteger(minutes) || minutes <=0 || minutes>3780 || minutes%15) throw new Error("invalid_duration");
  const slot: Slot = { date: local.dateKey,time:minutesToClock(local.minutes),minutes,title:event.summary || "BESS MOTORS" };
  return { uid:event.uid, slot, notes:event.description || "", cancelled: events[0].getFirstPropertyValue("status")==="CANCELLED" };
}

export async function syncICloud() {
  const login=process.env.BESS_ICLOUD_USER, password=process.env.BESS_ICLOUD_APP_PASSWORD;
  if (!login || !password) throw new Error("icloud_authorization_required");
  const cfg = getSupabaseConfig();
  const snap = await cloudGetCrmStore();
  if (!cfg || !snap) throw new Error("crm_unavailable");
  const safeFetch: typeof fetch = (input,init) => {
    const url=new URL(input instanceof Request ? input.url : input.toString());
    if (url.protocol !== "https:" || !url.hostname.endsWith(".icloud.com") || url.port || url.username || url.password) throw new Error("invalid_calendar_host");
    return fetch(input,{...init,redirect:init?.redirect === "manual" ? "manual" : "error",cache:"no-store",signal:AbortSignal.timeout(10000)});
  };
  const dav=await createDAVClient({serverUrl:"https://caldav.icloud.com",credentials:{username:login,password},authMethod:"Basic",defaultAccountType:"caldav",fetch:safeFetch});
  const calendars=(await dav.fetchCalendars()).filter(c=>c.displayName==="BESS MOTORS");
  if (calendars.length!==1) throw new Error("dedicated_calendar_required");
  const calendar=calendars[0], calendarKey=digest(login.toLowerCase()+"\n"+calendar.url);
  const headers={apikey:cfg.key,Authorization:"Bearer "+cfg.key,"Content-Type":"application/json"};
  const linksUrl=cfg.url+"/rest/v1/workshop_calendar_links";
  const links: Link[]=[];
  for (;;) {
    const page=await fetch(linksUrl+"?calendar_key=eq."+calendarKey+"&select=appointment_id,href,signature&order=appointment_id&limit=500&offset="+links.length,{headers,cache:"no-store"});
    if (!page.ok) throw new Error("calendar_link_read");
    const items: Link[]=await page.json(); links.push(...items);
    if (items.length<500) break;
  }
  const objects=await dav.fetchCalendarObjects({calendar});
  const byUrl=new Map(objects.map(o=>[o.url,o]));
  const known=new Map(links.map(l=>[l.appointment_id,l]));
  const claimed=new Set(links.map(l=>l.href));
  const stats={exported:0, imported:0, conflicts:0, invalid:0, failed:0};
  const today=formatWarsawDateKey();
  async function remember(id:string,href:string,sig:string,previous?:Link) {
    const query=previous ? "?calendar_key=eq."+calendarKey+"&appointment_id=eq."+encodeURIComponent(id)+"&signature=eq."+previous.signature : "";
    const res=await fetch(linksUrl+query,{method:previous?"PATCH":"POST",headers:{...headers,Prefer:"return=representation"},body:JSON.stringify({calendar_key:calendarKey,appointment_id:id,href,signature:sig})});
    if (!res.ok || !(await res.json()).length) throw new Error("link_changed");
  }
  for (const a of snap.doc.appointments) {
    const link=known.get(a.id), local=slotOf(a);
    if (a.date<today && !link) continue;
    // Recover an interrupted native import via its deterministic request id.
    if (!link && a.clientRequestId?.startsWith("icloud-")) continue;
    const uid=digest(a.id)+"@bess-motors.com", filename=digest(a.id)+".ics";
    const href=link?.href || new URL(filename,calendar.url.replace(/\/?$/,"/")).href;
    claimed.add(href);
    const object=byUrl.get(href);
    try {
      const remote=object ? decodeVisit(object.data) : null;
      if (a.date<today && (!remote || remote.slot.date<today)) continue;
      if (!link && object && remote?.uid!==uid) { stats.conflicts++; continue; }
      const remoteSig=signature(remote && !remote.cancelled ? remote.slot : null), localSig=signature(local);
      const action=calendarDecision(link?.signature || "cancelled",localSig,remoteSig);
      if (action==="conflict") { stats.conflicts++; continue; }
      if (action==="equal") {
        if ((!link && object) || (link && link.signature!==localSig)) await remember(a.id,href,localSig,link);
        continue;
      }
      if (action==="export") {
        if (object && !object.etag) throw new Error("missing_etag");
        const response=local
          ? object ? await dav.updateCalendarObject({calendarObject:{...object,data:encodeVisit(local,remote!.uid,object.data)}})
                   : await dav.createCalendarObject({calendar,filename:decodeURIComponent(new URL(href).pathname.split("/").pop()!),iCalString:encodeVisit(local,uid)})
          : await dav.deleteCalendarObject({calendarObject:object!});
        if (!response.ok) throw new Error("dav_write");
        await remember(a.id,href,localSig,link); stats.exported++;
      } else {
        if (!link) { stats.conflicts++; continue; }
        if (!object) {
          // Confirm a real deletion separately from a partial REPORT response.
          const proof=await safeFetch(href,{method:"HEAD",headers:{Authorization:"Basic "+Buffer.from(login+":"+password).toString("base64")}});
          if (proof.status!==404 && proof.status!==410) throw new Error("absence_unconfirmed");
        }
        const next=remote?.slot;
        const result=await commitStaffAppointment({mode:!next || remote?.cancelled ? "cancel":"update",id:a.id,expectedUpdatedAt:a.updatedAt ?? null,
          ...(next ? {date:next.date,time:a.workStart ? a.time : next.time,workStart:next.time,workMinutes:next.minutes,durationMinutes:next.minutes,problemText:next.title} : {})},new Date(),false);
        if (!result.ok) { stats.conflicts++; continue; }
        await remember(a.id,href,remoteSig,link); stats.imported++;
      }
    } catch { stats.failed++; }
  }
  for (const object of objects.filter(o=>!claimed.has(o.url))) {
    try {
      const event=decodeVisit(object.data);
      if (event.cancelled || event.slot.date<today) continue;
      const phone=event.notes.match(/^TEL:\s*(\+?[\d ()-]{9,20})$/im)?.[1];
      const name=event.notes.match(/^NAME:\s*(.{1,100})$/im)?.[1]?.trim();
      const mechanicId=event.notes.match(/^MECH:\s*([\w-]+)$/im)?.[1] || process.env.BESS_ICLOUD_MECHANIC_ID || (snap.doc.mechanics.length===1 ? snap.doc.mechanics[0].id : "");
      if (!name || !phone || !mechanicId) { stats.invalid++; continue; }
      const {slot}=event;
      const res=await commitStaffAppointment({mode:"create",clientRequestId:"icloud-"+digest(calendarKey+event.uid),clientName:name,clientPhone:phone,mechanicId,
        date:slot.date,time:slot.time,workStart:slot.time,workMinutes:slot.minutes,durationMinutes:slot.minutes,problemText:slot.title},new Date(),false);
      if (!res.ok) { stats.conflicts++; continue; }
      await remember(res.appointment.id,object.url,signature(slot)); stats.imported++;
    } catch { stats.failed++; }
  }
  return stats;
}
