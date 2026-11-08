import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
import { sendTelegramMessage, type InlineKeyboardMarkup } from "@/lib/server/telegram-api";
import { leadStatusLabel, missingText, siteLocaleLabel } from "@/lib/service-leads";
import type { LeadStatus, ServiceLead } from "@/lib/store";
import { loadCrmFromCloud } from "./crm-actions";
import { calendarAppUrl } from "./staff-calendar-bot";

const STATUSES: LeadStatus[] = ["new", "processing", "booked", "no_answer", "declined", "done"];

function isStatus(value: string): value is LeadStatus {
  return (STATUSES as string[]).includes(value);
}

function leadName(lead: ServiceLead): string {
  return missingText([lead.firstName, lead.lastName].filter(Boolean).join(" "));
}

function statusKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "Новые", callback_data: "leads:new" },
        { text: "В обработке", callback_data: "leads:processing" },
      ],
      [
        { text: "Записаны", callback_data: "leads:booked" },
        { text: "Не дозвонились", callback_data: "leads:no_answer" },
      ],
      [
        { text: "Отказались", callback_data: "leads:declined" },
        { text: "Обработанные", callback_data: "leads:done" },
      ],
    ],
  };
}

function leadKeyboard(lead: ServiceLead): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "Позвонил", callback_data: `lc:${lead.id}` },
        { text: "Написал SMS", callback_data: `ls:${lead.id}` },
      ],
      [
        { text: "Не отвечает", callback_data: `ln:${lead.id}` },
        { text: "Перезвонить позже", callback_data: `ll:${lead.id}` },
      ],
      [{ text: "Записать", web_app: { url: calendarAppUrl(undefined, { leadId: lead.id }) } }],
      [
        { text: "Отказ", callback_data: `lx:${lead.id}` },
        { text: "Обработана", callback_data: `ld:${lead.id}` },
      ],
      [
        { text: "Звонок был", callback_data: `ly:${lead.id}:call` },
        { text: "SMS отправлено", callback_data: `ly:${lead.id}:sms` },
      ],
    ],
  };
}

function leadText(lead: ServiceLead): string {
  const car = [lead.make, lead.model].filter(Boolean).join(" ");
  const services = lead.services.length
    ? lead.services.map((item) => `${item.label}: ${item.priceText}`).join("\n")
    : "Не указано";
  return [
    `<b>${leadStatusLabel(lead.status)}</b>`,
    `ID: <code>${lead.id}</code>`,
    `Поступила: ${lead.createdAt}`,
    `Клиент: <b>${leadName(lead)}</b>`,
    `Телефон: <b>${missingText(lead.phone)}</b>`,
    `Авто: ${missingText(car)}`,
    `Номер: ${missingText(lead.plate)}`,
    `VIN: ${lead.vin ? `<code>${lead.vin}</code>` : "Не указано"}`,
    `Услуги:\n${services}`,
    `Предварительно: ${lead.totalText || "требует расчёта"}`,
    `Желаемое: ${missingText(lead.desiredDate)} ${lead.desiredTime}`.trim(),
    `Язык сайта: ${siteLocaleLabel(lead.siteLocale)}`,
    `Источник: ${missingText(lead.source)}`,
    `Форма: ${missingText(lead.sourceUrl)}`,
    `Менеджер: ${missingText(lead.managerId)}`,
    lead.appointmentId ? `Запись: ${lead.appointmentId}` : "Запись: Не указано",
    "",
    "Кнопки «Позвонил» и «Написал SMS» открывают номер. Результат сохраняется только после «Звонок был» или «SMS отправлено».",
  ].join("\n");
}

export async function sendLeadInbox(chatId: number, status: LeadStatus = "new"): Promise<void> {
  const db = await loadCrmFromCloud();
  if (!db) {
    await sendTelegramMessage(chatId, "☁️ CRM недоступна.", statusKeyboard());
    return;
  }
  const rows = (db.leads ?? []).filter((lead) => lead.status === status).slice(-20).reverse();
  const lines = [`📥 <b>${leadStatusLabel(status)}</b>`, ""];
  if (!rows.length) lines.push("В этой категории заявок нет.");
  const keyboard = statusKeyboard();
  for (const lead of rows) {
    lines.push(`${leadName(lead)} · ${missingText(lead.phone)}`);
    keyboard.inline_keyboard.push([{ text: leadName(lead), callback_data: `lo:${lead.id}` }]);
  }
  await sendTelegramMessage(chatId, lines.join("\n").slice(0, 3900), keyboard);
}

async function mutateLead(
  id: string,
  change: (lead: ServiceLead, now: Date) => void
): Promise<ServiceLead | null> {
  let saved: ServiceLead | null = null;
  const result = await cloudMutateCrmStore((db) => {
    const lead = (db.leads ?? []).find((item) => item.id === id);
    if (!lead) return;
    change(lead, new Date());
    lead.updatedAt = new Date().toISOString();
    saved = lead;
  });
  return result.ok ? saved : null;
}

export async function handleLeadCallback(chatId: number, data: string): Promise<boolean> {
  if (data.startsWith("leads:") && isStatus(data.slice(6))) {
    await sendLeadInbox(chatId, data.slice(6) as LeadStatus);
    return true;
  }
  const open = /^lo:([A-Za-z0-9_-]{1,80})$/.exec(data);
  if (open) {
    const db = await loadCrmFromCloud();
    const lead = db?.leads?.find((item) => item.id === open[1]);
    if (!lead) {
      await sendTelegramMessage(chatId, "Заявка не найдена.", statusKeyboard());
      return true;
    }
    await sendTelegramMessage(chatId, leadText(lead), leadKeyboard(lead));
    return true;
  }
  const confirm = /^ly:([A-Za-z0-9_-]{1,64}):(call|sms)$/.exec(data);
  if (confirm) {
    const kind = confirm[2] === "sms" ? "sms" : "call";
    const lead = await mutateLead(confirm[1], (item, now) => {
      item.status = item.status === "new" ? "processing" : item.status;
      item.contacts.push({ id: `contact-${now.getTime()}`, kind, at: now.toISOString() });
    });
    await sendTelegramMessage(chatId, lead ? "Контакт записан в заявку." : "Не удалось сохранить.");
    return true;
  }
  const simple = /^l([nldx]):([A-Za-z0-9_-]{1,80})$/.exec(data);
  if (simple) {
    const code = simple[1];
    const lead = await mutateLead(simple[2], (item, now) => {
      if (code === "n") item.status = "no_answer";
      if (code === "l") {
        item.status = "processing";
        item.contacts.push({ id: `contact-${now.getTime()}`, kind: "callback", at: now.toISOString() });
      }
      if (code === "x") item.status = "declined";
      if (code === "d") item.status = "done";
    });
    await sendTelegramMessage(chatId, lead ? `Статус: ${leadStatusLabel(lead.status)}` : "Не удалось сохранить.");
    return true;
  }
  if (data.startsWith("lc:") || data.startsWith("ls:")) {
    const id = data.slice(3);
    const db = await loadCrmFromCloud();
    const lead = db?.leads?.find((item) => item.id === id);
    if (!lead) {
      await sendTelegramMessage(chatId, "Заявка не найдена.");
      return true;
    }
    const phone = missingText(lead.phone);
    await sendTelegramMessage(
      chatId,
      data.startsWith("lc:")
        ? `Позвоните: ${phone}\nНа телефоне нажмите номер. Затем подтвердите «Звонок был».`
        : `SMS: ${phone}\nОткройте сообщения на телефоне и подтвердите «SMS отправлено».`,
      leadKeyboard(lead)
    );
    return true;
  }
  return false;
}
