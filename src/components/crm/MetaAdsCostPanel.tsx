"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb } from "@/lib/store";
import { buildPaidMarketingFunnel } from "@/lib/paid-marketing-funnel";
import { summarizeMetaAds, type MetaAdsPayload } from "@/lib/meta-ads-costs";
import { summarizeVerifiedAcquisition } from "@/lib/verified-acquisition";
import { useDbSync } from "@/hooks/useDbSync";

const copy = {
  pl: {
    heading: "Meta Ads — wydatki Facebook i Instagram",
    cost: "Wydatki na reklamę",
    leads: "Zdarzenia lead wg Meta",
    cpl: "Koszt leada wg Meta",
    clicks: "Kliknięcia reklamy",
    verified: "Zlecenia przypisane ręcznie po potwierdzeniu reklamy Meta",
    campaignPaid: "Opłacone zlecenia z potwierdzonym ID kampanii",
    campaignRevenue: "Ich wartość w CRM",
    account: "Konto",
    campaign: "Kampania",
    costPerLead: "Koszt leada",
    loading: "Pobieranie kosztów Meta Ads…",
    failure: "Nie udało się pobrać danych. Nic nie zostało zmienione w kampaniach.",
    snapshot: "Brak WINDSOR_API_KEY w Vercel. Po bezpiecznym dodaniu klucza raport pobierze bieżące dane Meta Ads automatycznie.",
    outdated: "Odczyt Windsor.ai nie powiódł się; pokazano historyczny zapis, nie bieżące koszty.",
    live: "Odczyt przez Windsor.ai API po stronie serwera. Dane mogą być opóźnione przez Meta.",
    comparison: "CRM: opłacone zlecenia z etykietą Facebook / Instagram / Meta",
    warning: "To orientacyjna liczba z CRM dla tej samej kohorty dat, a nie udowodniony efekt reklamy. Ruch organiczny i brakujące znaczniki UTM mogą zniekształcić przypisanie. Nie wyliczamy ROAS bez jednoznacznego powiązania kampanii z opłaconym zleceniem.",
    interval: "Zakres danych",
    captured: "Pobrano",
    partial: "Wydatki Meta nie są dodawane do księgowych kosztów CRM, aby uniknąć podwójnego liczenia.",
  },
  ru: {
    heading: "Meta Ads — расходы Facebook и Instagram",
    cost: "Расходы на рекламу",
    leads: "Лиды по данным Meta",
    cpl: "Цена лида Meta",
    clicks: "Клики по рекламе",
    verified: "Оплаченные заказы с вручную подтверждённым источником Meta Ads",
    campaignPaid: "Оплачено по подтверждённому ID кампании",
    campaignRevenue: "Их стоимость в CRM",
    account: "Кабинет",
    campaign: "Кампания",
    costPerLead: "Цена лида",
    loading: "Загружаю расходы Meta Ads…",
    failure: "Не удалось получить данные. Рекламные кампании не изменены.",
    snapshot: "В Vercel пока нет WINDSOR_API_KEY. После безопасного добавления ключа расходы Meta Ads начнут обновляться через сервер.",
    outdated: "Обновить данные Windsor.ai не удалось; показывается исторический снимок, не текущие расходы.",
    live: "Чтение Windsor.ai API на сервере. Данные Meta могут поступать с задержкой.",
    comparison: "CRM: оплаченные заказы с меткой Facebook / Instagram / Meta",
    warning: "Это ориентир по CRM за такой же период создания заявки, а не доказанная выручка именно от платной рекламы. Органические переходы и отсутствующие UTM мешают точной атрибуции. ROAS по кампаниям не рассчитываем без подтверждённой связи с оплаченной работой.",
    interval: "Период данных",
    captured: "Снимок",
    partial: "Расходы Meta здесь не прибавляются к бухгалтерским расходам CRM, чтобы не считать их дважды.",
  },
  en: {
    heading: "Meta Ads — Facebook and Instagram spend",
    cost: "Ad spend",
    leads: "Meta-reported leads",
    cpl: "Meta cost per lead",
    clicks: "Ad clicks",
    verified: "Orders manually verified as Meta advertising",
    campaignPaid: "Paid orders with confirmed campaign ID",
    campaignRevenue: "Their CRM order value",
    account: "Account",
    campaign: "Campaign",
    costPerLead: "Cost per lead",
    loading: "Loading Meta Ads costs…",
    failure: "Could not load Meta data. Campaigns were not modified.",
    snapshot: "WINDSOR_API_KEY is not configured in Vercel. Adding it securely enables automatic Meta Ads data retrieval.",
    outdated: "Windsor.ai request failed. Historical costs are shown, not current spend.",
    live: "Read through the server-side Windsor.ai API. Meta data can be delayed.",
    comparison: "CRM: paid work orders with Facebook / Instagram / Meta labels",
    warning: "This is a CRM cohort estimate, not proven paid-ad revenue. Organic traffic and missing UTMs can affect attribution. No campaign ROAS is claimed without a verified link to paid work orders.",
    interval: "Data window",
    captured: "Fetched",
    partial: "Meta spend is not added to CRM accounting expenses to avoid double-counting.",
  },
  uk: {
    heading: "Meta Ads — витрати Facebook та Instagram",
    cost: "Витрати на рекламу",
    leads: "Ліди за даними Meta",
    cpl: "Вартість ліда Meta",
    clicks: "Кліки реклами",
    account: "Кабінет",
    campaign: "Кампанія",
    costPerLead: "Вартість ліда",
    loading: "Завантаження витрат Meta Ads…",
    failure: "Не вдалося отримати дані. Рекламні кампанії не змінено.",
    snapshot: "WINDSOR_API_KEY у Vercel ще не налаштовано. Безпечне додавання ключа увімкне автоматичне отримання витрат Meta Ads.",
    outdated: "Оновлення Windsor.ai не вдалося. Показано історичні витрати, не поточні.",
    live: "Дані із серверного Windsor.ai API. Meta може оновлювати показники із затримкою.",
    comparison: "CRM: оплачені замовлення з міткою Facebook / Instagram / Meta",
    warning: "Це орієнтир CRM за датою створення звернень, не доведена виручка з платної реклами. Органічний трафік та відсутні UTM заважають атрибуції. ROAS кампаній без підтвердженого зв’язку не рахуємо.",
    interval: "Період даних",
    captured: "Знімок",
    partial: "Витрати Meta не додаються до бухгалтерських витрат CRM, щоб уникнути подвійного обліку.",
  },
} as const;

function zł(value: number): string {
  return new Intl.NumberFormat("pl-PL",{style:"currency",currency:"PLN"}).format(value);
}
function isMetaLabel(source: string): boolean {
  return /^(?:facebook|instagram|meta|fb|ig|facebook_ads|instagram_ads|meta_ads)(?:\s*\/|$)/i.test(source.trim());
}

export function MetaAdsCostPanel() {
  const {locale} = useI18n();
  const t = copy[locale as keyof typeof copy] ?? copy.pl;
  const [report,setReport]=useState<MetaAdsPayload|null>(null);
  const [failed,setFailed]=useState(false);
  const [missingKey,setMissingKey]=useState(false);

  useEffect(()=>{
    const abort = new AbortController();
    async function getCosts(){
      try{
        const token=localStorage.getItem("bess-jwt");
        if(!token) throw Error("not_authenticated");
        const res=await fetch("/api/crm/meta-ads",{headers:{Authorization:`Bearer ${token}`},cache:"no-store",signal:abort.signal});
        if(res.status===503) { if(!abort.signal.aborted) setMissingKey(true); return; }
        if(!res.ok) throw Error("meta_report_unavailable");
        const body=(await res.json()) as MetaAdsPayload;
        if(!Array.isArray(body.rows)||!body.dateFrom||!body.dateTo||body.currency!=="PLN") throw Error("invalid_report");
        if(!abort.signal.aborted) setReport(body);
      }catch{
        if(!abort.signal.aborted) setFailed(true);
      }
    }
    void getCosts();
    return ()=>abort.abort();
  },[]);

  const totals=useMemo(()=>report?summarizeMetaAds(report.rows):null,[report]);
  const paidCrm=useMemo(()=>{
    if(!report) return {orders:0,revenue:0};
    const funnel=buildPaidMarketingFunnel(loadDb(),createdAt=>{
      const date=createdAt.slice(0,10);
      return date>=report.dateFrom&&date<=report.dateTo;
    });
    const matched=funnel.filter(row=>isMetaLabel(row.source));
    return {orders:matched.reduce((s,row)=>s+row.paidOrders,0),revenue:matched.reduce((s,row)=>s+row.paidRevenue,0)};
  },[report]);

  return (
    <section className="glass-red rounded-xl p-6 neon-border space-y-4 overflow-x-auto" aria-labelledby="meta-ads-report-heading">
      <h3 id="meta-ads-report-heading" className="font-display text-base uppercase text-bm-red font-bold">{t.heading}</h3>
      {!report ? (
        <p className="text-sm text-bm-muted">{missingKey?t.snapshot:failed?t.failure:t.loading}</p>
      ) : (
        <>
          <p className="text-xs text-bm-muted">{t.interval}: {report.dateFrom} — {report.dateTo} · {t.captured}: {report.capturedAt.slice(0,10)}</p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              [t.cost,zł(totals?.spend??0)],
              [t.leads,String(totals?.leads??0)],
              [t.cpl,totals?.costPerMetaLead==null?"—":zł(totals.costPerMetaLead)],
              [t.clicks,String(totals?.clicks??0)],
            ].map(([name,value])=><div key={name} className="rounded-lg border border-white/10 bg-white/5 p-3"><p className="text-xs text-bm-muted">{name}</p><p className="mt-2 text-xl font-bold text-white">{value}</p></div>)}
          </div>
          <p role="status" className="text-xs leading-5 text-amber-300">{t.live}</p>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold">{t.comparison}</p>
            <p className="mt-2 text-xl font-bold">{paidCrm.orders} · {zł(paidCrm.revenue)}</p>
            <p className="mt-2 text-xs leading-5 text-bm-muted">{t.warning}</p>
          </div>
          <table className="dashboard-table min-w-[690px]">
            <thead><tr><th>{t.account}</th><th>{t.campaign}</th><th>{t.cost}</th><th>{t.leads}</th><th>{t.costPerLead}</th></tr></thead>
            <tbody>{(totals?.campaigns??[]).map(row=><tr key={row.id+"-"+row.account}>
              <td className="text-xs">{row.account}</td>
              <td>{row.name}</td>
              <td className="font-mono">{zł(row.spend)}</td>
              <td>{row.leads}</td>
              <td className="font-mono">{row.costPerMetaLead===null?"—":zł(row.costPerMetaLead)}</td>
            </tr>)}</tbody>
          </table>
          <p className="text-xs leading-5 text-bm-muted">{t.partial}</p>
        </>
      )}
    </section>
  );
}
