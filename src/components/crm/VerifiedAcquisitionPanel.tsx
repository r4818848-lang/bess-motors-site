"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useDbSync } from "@/hooks/useDbSync";
import { loadDb } from "@/lib/store";
import { pullCrmFromCloud } from "@/lib/cloud-crm-db";
import { staffCrmFetch } from "@/lib/crm-staff-fetch";
import {
  ACQUISITION_CHANNELS, ACQUISITION_NATURES, ACQUISITION_EVIDENCES,
  type VerifiedChannel, type VerifiedNature, type VerifiedEvidence,
} from "@/lib/verified-acquisition";

const translations = {
  ru: {
    title:"Подтвердить источник клиента и связать с заказ-нарядом",
    intro:"Работает для Direct, Messenger, WhatsApp, звонков, сайта и лид-форм Meta. Не связывает клиентов автоматически по телефону или имени.",
    order:"Заказ-наряд",chooseOrder:"Выбери заказ",channel:"Канал обращения",
    nature:"Источник привлечения",evidence:"Основание подтверждения",
    campaign:"ID кампании Meta (если точно известен)",lead:"Заявка CRM (необязательно)",
    selectLead:"Без связи с заявкой",confirmation:"Я проверил источник и то, что эта заявка относится к выбранному заказу. Не делаю предположений только по имени или телефону.",
    submit:"Сохранить подтверждённый источник",saving:"Сохраняю…",done:"Сохранено в облачной CRM.",
    err:"Не удалось сохранить. Проверь источник, ID кампании, связанную заявку и повтори.",
    old:"Уже указано",paid:"Оплачено",unpaid:"Не оплачено",
    meta_paid:"Подтверждённое обращение из рекламы Meta",organic:"Органический источник, не реклама",unknown:"Источник неизвестен",
    instagram_direct:"Instagram Direct",facebook_messenger:"Facebook Messenger",whatsapp:"WhatsApp",phone:"Телефонный звонок",website:"Форма сайта",meta_instant_form:"Лид-форма Meta",google_maps:"Google Карты",google_search:"Поиск Google",
    client_confirmed:"Клиент подтвердил источник",conversation:"Проверено по переписке/звонку",meta_form:"Есть подтверждение формы Meta",tagged_link:"Подтверждённая UTM-ссылка",
    warning:"Отметка «реклама Meta» создаётся только после проверки. Если не уверен — выбери «Источник неизвестен». Имя кампании не угадываем. Заказ считается в выручке только после статуса «оплачено».",
  },
  pl: {
    title:"Potwierdź źródło klienta i przypisz je do zlecenia",
    intro:"Dotyczy Direct, Messengera, WhatsApp, telefonu, strony i formularzy Meta. Nie dopasowuje osób po telefonie ani nazwisku.",
    order:"Zlecenie",chooseOrder:"Wybierz zlecenie",channel:"Kanał kontaktu",nature:"Źródło pozyskania",evidence:"Dowód potwierdzenia",
    campaign:"ID kampanii Meta (jeśli sprawdzony)",lead:"Zgłoszenie CRM (opcjonalnie)",selectLead:"Bez powiązanego zgłoszenia",
    confirmation:"Sprawdziłem źródło oraz zgodność zgłoszenia ze zleceniem. Nie wnioskuję tylko na podstawie telefonu lub nazwiska.",
    submit:"Zapisz potwierdzone źródło",saving:"Zapisuję…",done:"Zapisano w CRM.",err:"Nie udało się zapisać. Sprawdź dane i spróbuj ponownie.",
    old:"Aktualne źródło",paid:"Opłacone",unpaid:"Nieopłacone",
    meta_paid:"Potwierdzona reklama Meta",organic:"Źródło organiczne, bez reklamy",unknown:"Nieznane",
    instagram_direct:"Instagram Direct",facebook_messenger:"Facebook Messenger",whatsapp:"WhatsApp",phone:"Telefon",website:"Formularz strony",meta_instant_form:"Formularz Meta",google_maps:"Mapy Google",google_search:"Wyszukiwarka Google",
    client_confirmed:"Klient potwierdził",conversation:"Sprawdzona rozmowa lub połączenie",meta_form:"Potwierdzony formularz Meta",tagged_link:"Sprawdzony link UTM",
    warning:"Reklamę Meta oznacz tylko na podstawie potwierdzonego źródła. W razie wątpliwości wybierz «Nieznane». Nie zgaduj kampanii. Wartość zlecenia liczymy dopiero po opłaceniu.",
  },
  en: {
    title:"Verify customer acquisition and link to a work order",
    intro:"Supports Direct, Messenger, WhatsApp, phone, site and Meta lead forms. No automatic joining by name or phone.",
    order:"Work order",chooseOrder:"Select order",channel:"Contact channel",nature:"Acquisition type",evidence:"Verification basis",
    campaign:"Exact Meta campaign ID (optional)",lead:"CRM enquiry (optional)",selectLead:"No linked enquiry",
    confirmation:"I verified the source and that this enquiry belongs to this order. I did not infer a match from name or phone alone.",
    submit:"Save verified source",saving:"Saving…",done:"Saved to cloud CRM.",err:"Failed to save. Check the evidence, campaign ID and linked lead.",
    old:"Current",paid:"Paid",unpaid:"Unpaid",
    meta_paid:"Verified Meta advertisement",organic:"Organic, not paid",unknown:"Unknown",
    instagram_direct:"Instagram Direct",facebook_messenger:"Facebook Messenger",whatsapp:"WhatsApp",phone:"Phone call",website:"Website form",meta_instant_form:"Meta Instant Form",google_maps:"Google Maps",google_search:"Google Search",
    client_confirmed:"Customer confirmed",conversation:"Conversation or call checked",meta_form:"Meta form confirmed",tagged_link:"Confirmed UTM URL",
    warning:"Only select Meta Ads if confirmed. Otherwise select Unknown. Never guess a campaign. Revenue requires paid status.",
  },
  uk: {
    title:"Підтверди джерело клієнта та прив’яжи замовлення",
    intro:"Direct, Messenger, WhatsApp, дзвінки, сайт і форми Meta. Без автоматичного зіставлення імен або телефонів.",
    order:"Замовлення",chooseOrder:"Обери замовлення",channel:"Канал звернення",nature:"Джерело",evidence:"Підтвердження",
    campaign:"Точний ID кампанії Meta (за наявності)",lead:"Заявка CRM (необов’язково)",selectLead:"Без заявки",
    confirmation:"Я перевірив джерело та відповідність заявки замовленню, не покладаючись лише на ім’я чи телефон.",
    submit:"Зберегти підтверджене джерело",saving:"Збереження…",done:"Збережено у CRM.",err:"Не вдалося зберегти. Перевір дані.",
    old:"Поточне",paid:"Оплачено",unpaid:"Не оплачено",
    meta_paid:"Підтверджена реклама Meta",organic:"Органічне джерело",unknown:"Невідомо",
    instagram_direct:"Instagram Direct",facebook_messenger:"Facebook Messenger",whatsapp:"WhatsApp",phone:"Телефон",website:"Форма сайту",meta_instant_form:"Форма Meta",google_maps:"Карти Google",google_search:"Пошук Google",
    client_confirmed:"Клієнт підтвердив",conversation:"Перевірено за розмовою",meta_form:"Підтверджено форму Meta",tagged_link:"Підтверджена UTM",
    warning:"Вибирай рекламу Meta лише після перевірки. Інакше — «Невідомо». Кампанію не вгадуємо. Виручка — тільки після оплати.",
  },
} as const;

export function VerifiedAcquisitionPanel() {
  const { locale } = useI18n();
  const t = translations[locale as keyof typeof translations] ?? translations.pl;
  const tick = useDbSync();
  const db = useMemo(() => loadDb(), [tick]);
  const orders = useMemo(() => [...db.workOrders]
    .sort((a,b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0,250), [db]);
  const leads = useMemo(() => [...(db.leads ?? [])]
    .sort((a,b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0,250), [db]);
  const [orderId,setOrderId] = useState("");
  const [channel,setChannel] = useState<VerifiedChannel>("instagram_direct");
  const [nature,setNature] = useState<VerifiedNature>("unknown");
  const [evidence,setEvidence] = useState<VerifiedEvidence>("client_confirmed");
  const [campaignId,setCampaignId] = useState("");
  const [leadId,setLeadId] = useState("");
  const [confirmed,setConfirmed] = useState(false);
  const [busy,setBusy] = useState(false);
  const [result,setResult] = useState("");

  const chosen = db.workOrders.find(x => x.id === orderId);

  function chooseOrder(id: string) {
    setOrderId(id);
    const a = db.workOrders.find(x => x.id === id)?.verifiedAcquisition;
    setChannel(a?.channel ?? "instagram_direct");
    setNature(a?.nature ?? "unknown");
    setEvidence(a?.evidence ?? "client_confirmed");
    setCampaignId(a?.campaignId ?? "");
    setLeadId(a?.leadId ?? "");
    setConfirmed(false);
    setResult("");
  }

  async function submit() {
    if (!orderId || !confirmed || busy) return;
    setBusy(true);
    setResult("");
    try {
      const res = await staffCrmFetch("/api/crm/verified-acquisition", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          orderId,channel,nature,evidence,campaignId: nature==="meta_paid" ? campaignId.trim() : "",
          leadId,manuallyConfirmed:true,confirmLeadMatch:leadId ? confirmed : undefined,
        }),
      });
      if (!res?.ok) throw Error("save_failed");
      await pullCrmFromCloud({force:true});
      setResult(t.done);
      setConfirmed(false);
    } catch {
      setResult(t.err);
    } finally { setBusy(false); }
  }

  return (
    <section className="glass-red rounded-xl p-6 neon-border space-y-4" aria-labelledby="verified-acquisition-title">
      <h3 id="verified-acquisition-title" className="font-display text-base uppercase text-bm-red font-bold">{t.title}</h3>
      <p className="text-xs leading-5 text-bm-muted">{t.intro}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-white">
          {t.order}
          <select className="input-premium mt-2 w-full" value={orderId} onChange={e=>chooseOrder(e.target.value)}>
            <option value="">{t.chooseOrder}</option>
            {orders.map(o=><option key={o.id} value={o.id}>{o.number} · {o.createdAt.slice(0,10)} · {o.paymentStatus==="paid" ? t.paid : t.unpaid}</option>)}
          </select>
        </label>
        <label className="block text-sm text-white">
          {t.channel}
          <select className="input-premium mt-2 w-full" value={channel} onChange={event => {
            const next = event.target.value as VerifiedChannel;
            setChannel(next);
            if ((next === "google_maps" || next === "google_search") && nature === "meta_paid") setNature("unknown");
            setConfirmed(false);
          }}>
            {ACQUISITION_CHANNELS.map(k=><option key={k} value={k}>{t[k]}</option>)}
          </select>
        </label>
        <label className="block text-sm text-white">
          {t.nature}
          <select className="input-premium mt-2 w-full" value={nature} onChange={e=>{setNature(e.target.value as VerifiedNature);setConfirmed(false)}}>
            {ACQUISITION_NATURES.map(k => <option key={k} value={k} disabled={k === "meta_paid" && (channel === "google_maps" || channel === "google_search")}>{t[k]}</option>)}
          </select>
        </label>
        <label className="block text-sm text-white">
          {t.evidence}
          <select className="input-premium mt-2 w-full" value={evidence} onChange={e=>{setEvidence(e.target.value as VerifiedEvidence);setConfirmed(false)}}>
            {ACQUISITION_EVIDENCES.map(k=><option key={k} value={k}>{t[k]}</option>)}
          </select>
        </label>
        {nature==="meta_paid" && (
          <label className="block text-sm text-white">
            {t.campaign}
            <input className="input-premium mt-2 w-full" type="text" inputMode="numeric"
              placeholder="120252549849110706" value={campaignId}
              onChange={e=>{setCampaignId(e.target.value.slice(0,25));setConfirmed(false)}} />
          </label>
        )}
        <label className="block text-sm text-white">
          {t.lead}
          <select className="input-premium mt-2 w-full" value={leadId} onChange={e=>{setLeadId(e.target.value);setConfirmed(false)}}>
            <option value="">{t.selectLead}</option>
            {leads.map(l=><option key={l.id} value={l.id}>{l.firstName} {l.lastName} · {l.createdAt.slice(0,10)} · {l.source}</option>)}
          </select>
        </label>
      </div>
      {chosen?.verifiedAcquisition && (
        <p className="text-xs text-amber-300">{t.old}: {t[chosen.verifiedAcquisition.channel]} / {t[chosen.verifiedAcquisition.nature]}</p>
      )}
      <p className="text-xs leading-5 text-bm-muted">{t.warning}</p>
      <label className="flex items-start gap-3 text-sm text-white">
        <input type="checkbox" className="mt-1 accent-red-600" checked={confirmed}
          onChange={e=>setConfirmed(e.target.checked)} />
        <span>{t.confirmation}</span>
      </label>
      <button type="button" disabled={!orderId || !confirmed || busy}
        className="btn-primary disabled:opacity-50"
        onClick={()=>void submit()}>{busy?t.saving:t.submit}</button>
      {result && <p role="status" className="text-sm text-amber-300">{result}</p>}
    </section>
  );
}
