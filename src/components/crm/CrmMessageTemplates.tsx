"use client";

import { useState } from "react";
import { adminQuickTemplates } from "@/lib/admin-message-templates";
import { buildCarReadyWhatsAppUrl } from "@/lib/client-notifications";
import { useI18n } from "@/lib/i18n/context";

const TG_TEMPLATE_MAP: Record<string, string> = {
  ready: "ready",
  parts: "parts",
  delay: "delay",
};

export function CrmMessageTemplates({
  clientPhone,
  orderNumber,
  vehicleLabel,
  locale,
}: {
  clientPhone?: string;
  orderNumber?: string;
  vehicleLabel?: string;
  locale: "pl" | "ru" | "uk" | "en";
}) {
  const c = useI18n().t.crm;
  const [tgStatus, setTgStatus] = useState("");

  if (!clientPhone) return null;

  const tplLabels: Record<string, string> = {
    ready: c.messageTplReady,
    parts: c.messageTplParts,
    delay: c.messageTplDelay,
    sign: c.messageTplSign,
  };

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
  };

  const msgLocale = locale === "pl" ? "pl" : locale === "en" ? "en" : locale === "uk" ? "uk" : "ru";

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

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-2">
        {adminQuickTemplates.map((tpl) => {
          const tgTpl = TG_TEMPLATE_MAP[tpl.id];
          return (
            <span key={tpl.id} className="inline-flex gap-1">
              <button
                type="button"
                className="btn-outline text-[10px] py-1"
                onClick={() => copy(msgLocale === "pl" ? tpl.pl : tpl.ru)}
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
            </span>
          );
        })}
        {orderNumber && vehicleLabel && (
          <a
            className="btn-outline text-[10px] py-1 inline-flex items-center"
            href={buildCarReadyWhatsAppUrl(clientPhone, orderNumber, vehicleLabel, locale)}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        )}
      </div>
      {tgStatus && <p className="text-[10px] text-bm-muted">{tgStatus}</p>}
    </div>
  );
}
