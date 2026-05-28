"use client";

import { adminQuickTemplates } from "@/lib/admin-message-templates";
import { buildCarReadyWhatsAppUrl } from "@/lib/client-notifications";

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
  if (!clientPhone) return null;

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {adminQuickTemplates.map((tpl) => (
        <button
          key={tpl.id}
          type="button"
          className="btn-outline text-[10px] py-1"
          onClick={() => copy(locale === "pl" ? tpl.pl : tpl.ru)}
        >
          {tpl.label}
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
