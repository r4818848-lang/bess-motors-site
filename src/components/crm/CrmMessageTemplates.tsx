"use client";

import { adminQuickTemplates } from "@/lib/admin-message-templates";
import { buildCarReadyWhatsAppUrl } from "@/lib/client-notifications";
import { useI18n } from "@/lib/i18n/context";

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

  const msgLocale = locale === "pl" ? "pl" : "ru";

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {adminQuickTemplates.map((tpl) => (
        <button
          key={tpl.id}
          type="button"
          className="btn-outline text-[10px] py-1"
          onClick={() => copy(msgLocale === "pl" ? tpl.pl : tpl.ru)}
        >
          {tplLabels[tpl.id] ?? tpl.label}
        </button>
      ))}
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
  );
}
