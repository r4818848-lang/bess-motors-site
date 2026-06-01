"use client";

import { useState } from "react";
import { adminQuickTemplates } from "@/lib/admin-message-templates";
import { useI18n } from "@/lib/i18n/context";
import {
  adminQuickTemplateToWaMaster,
  buildAdminQuickMessage,
  buildAdminQuickWhatsAppUrl,
  buildCarReadyWhatsAppUrl,
  buildMasterTemplateWhatsAppUrl,
  buildSignRemindWhatsAppUrl,
  CRM_EXTRA_WA_TEMPLATES,
  type WaMsgLocale,
  type WaMasterTemplate,
} from "@/lib/whatsapp-messages";
import { getSignUrl, workOrderLegalLocaleFromUi } from "@/lib/work-order-share";

const TG_TEMPLATE_MAP: Record<string, string> = {
  ready: "ready",
  parts: "parts",
  delay: "delay",
};

export function CrmMessageTemplates({
  clientPhone,
  orderNumber,
  orderId,
  vehicleLabel,
  locale,
}: {
  clientPhone?: string;
  orderNumber?: string;
  orderId?: string;
  vehicleLabel?: string;
  locale: WaMsgLocale;
}) {
  const c = useI18n().t.crm;
  const [tgStatus, setTgStatus] = useState("");
  const [waStatus, setWaStatus] = useState("");

  if (!clientPhone) return null;

  const msgLocale: WaMsgLocale =
    locale === "pl" ? "pl" : locale === "en" ? "en" : locale === "uk" ? "uk" : "ru";

  const docLang = workOrderLegalLocaleFromUi(locale);

  const tplLabels: Record<string, string> = {
    ready: c.messageTplReady,
    parts: c.messageTplParts,
    delay: c.messageTplDelay,
    sign: c.messageTplSign,
    diagnostic: c.messageTplDiagnostic,
    partsArrived: c.messageTplPartsArrived,
    pickup: c.messageTplPickup,
    callme: c.messageTplCallme,
    prepay: c.messageTplPrepay,
  };

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
  };

  const waUrlForMaster = (template: WaMasterTemplate): string | null => {
    if (!vehicleLabel || !orderNumber) return null;
    return buildMasterTemplateWhatsAppUrl(
      clientPhone,
      template,
      msgLocale,
      vehicleLabel,
      orderNumber
    );
  };

  const waUrlForQuick = (templateId: string): string | null => {
    return buildAdminQuickWhatsAppUrl(clientPhone, templateId, msgLocale, {
      car: vehicleLabel,
      orderNumber,
      orderId,
      docLang,
    });
  };

  const sendWhatsAppAuto = async (action: "template" | "sign_remind", template?: string) => {
    if (!orderNumber) return;
    const token = localStorage.getItem("bess-jwt");
    if (!token) {
      setWaStatus(c.telegramLoginRequired);
      return;
    }
    setWaStatus(c.whatsappSending);
    try {
      const res = await fetch("/api/crm/whatsapp-client", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderNumber, action, template }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (data.ok) setWaStatus(c.whatsappSent);
      else setWaStatus(data.message ?? c.whatsappSendFailed);
    } catch {
      setWaStatus(c.whatsappSendFailed);
    }
  };

  const sendTelegram = async (action: "template" | "sign_remind", template?: string) => {
    if (!orderNumber) return;
    const token = localStorage.getItem("bess-jwt");
    if (!token) {
      setTgStatus(c.telegramLoginRequired);
      return;
    }
    setTgStatus(c.telegramSending);
    try {
      const res = await fetch("/api/crm/telegram-client", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderNumber, action, template }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (data.ok) setTgStatus(c.telegramSent);
      else if (data.message === "no_telegram") setTgStatus(c.telegramNoClient);
      else setTgStatus(c.telegramSendFailed);
    } catch {
      setTgStatus(c.telegramSendFailed);
    }
  };

  const WaBtn = ({ href, title }: { href: string | null; title: string }) => {
    if (!href) return null;
    return (
      <a
        className="btn-outline text-[10px] py-1 px-2 inline-flex items-center border-green-600/50 text-green-400 hover:bg-green-500/10"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={title}
      >
        WA
      </a>
    );
  };

  const signWaUrl =
    orderId && orderNumber && vehicleLabel
      ? buildSignRemindWhatsAppUrl(
          clientPhone,
          msgLocale,
          orderId,
          orderNumber,
          vehicleLabel,
          docLang
        )
      : orderId && orderNumber
        ? buildSignRemindWhatsAppUrl(clientPhone, msgLocale, orderId, orderNumber, orderNumber, docLang)
        : waUrlForQuick("sign");

  const readyWaUrl =
    orderNumber && vehicleLabel
      ? buildCarReadyWhatsAppUrl(clientPhone, orderNumber, vehicleLabel, msgLocale)
      : null;

  return (
    <div className="mt-2 space-y-2">
      <p className="text-[10px] uppercase text-bm-muted tracking-wide">{c.clientMessaging}</p>
      <div className="flex flex-wrap gap-2">
        {adminQuickTemplates.map((tpl) => {
          const tgTpl = TG_TEMPLATE_MAP[tpl.id];
          const waMaster = adminQuickTemplateToWaMaster(tpl.id);
          const signUrlForCopy =
            tpl.id === "sign" && orderId
              ? getSignUrl(orderId, docLang)
              : undefined;
          const quickText =
            buildAdminQuickMessage(tpl.id, msgLocale, {
              car: vehicleLabel,
              orderNumber,
              signUrl: signUrlForCopy,
            }) ?? (msgLocale === "pl" ? tpl.pl : tpl.ru);

          const waHref =
            tpl.id === "sign"
              ? signWaUrl
              : waMaster && vehicleLabel && orderNumber
                ? waUrlForMaster(waMaster)
                : waUrlForQuick(tpl.id);

          return (
            <span key={tpl.id} className="inline-flex gap-1">
              <button
                type="button"
                className="btn-outline text-[10px] py-1"
                onClick={() => copy(quickText)}
              >
                {tplLabels[tpl.id] ?? tpl.label}
              </button>
              {orderNumber && tgTpl && (
                <button
                  type="button"
                  className="btn-primary text-[10px] py-1 px-2"
                  title={c.sendViaTelegram}
                  onClick={() => void sendTelegram("template", tgTpl)}
                >
                  TG
                </button>
              )}
              {orderNumber && tpl.id === "sign" && (
                <button
                  type="button"
                  className="btn-primary text-[10px] py-1 px-2"
                  title={c.sendSignViaTelegram}
                  onClick={() => void sendTelegram("sign_remind")}
                >
                  TG
                </button>
              )}
              <WaBtn href={waHref} title={c.sendViaWhatsApp} />
              {orderNumber && waMaster && (
                <button
                  type="button"
                  className="btn-primary text-[10px] py-1 px-2 bg-green-700 hover:bg-green-600"
                  title={c.sendViaWhatsAppAuto}
                  onClick={() => void sendWhatsAppAuto("template", waMaster)}
                >
                  WA↑
                </button>
              )}
              {orderNumber && tpl.id === "sign" && (
                <button
                  type="button"
                  className="btn-primary text-[10px] py-1 px-2 bg-green-700 hover:bg-green-600"
                  title={c.sendSignViaWhatsApp}
                  onClick={() => void sendWhatsAppAuto("sign_remind")}
                >
                  WA↑
                </button>
              )}
            </span>
          );
        })}
        {readyWaUrl && (
          <WaBtn href={readyWaUrl} title={c.whatsAppReadyLong} />
        )}
      </div>

      {orderNumber && vehicleLabel && (
        <details className="text-[10px]">
          <summary className="cursor-pointer text-bm-muted hover:text-green-400">
            {c.moreWhatsAppTemplates}
          </summary>
          <div className="flex flex-wrap gap-1 mt-2">
            {CRM_EXTRA_WA_TEMPLATES.map(({ id }) => (
              <span key={id} className="inline-flex items-center gap-1 rounded border border-bm-border/60 px-1">
                <span className="text-bm-muted px-1">{tplLabels[id] ?? id}</span>
                <WaBtn href={waUrlForMaster(id)} title={`${c.sendViaWhatsApp}: ${tplLabels[id] ?? id}`} />
              </span>
            ))}
          </div>
        </details>
      )}

      {(tgStatus || waStatus) && (
        <p className="text-[10px] text-bm-muted">
          {tgStatus}
          {tgStatus && waStatus ? " · " : ""}
          {waStatus}
        </p>
      )}
      <p className="text-[10px] text-bm-muted/80">{c.whatsAppHint}</p>
    </div>
  );
}
