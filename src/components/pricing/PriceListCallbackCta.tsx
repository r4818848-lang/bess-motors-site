"use client";

import { useI18n } from "@/lib/i18n/context";
import { CallbackRequestCta } from "@/components/callback/CallbackRequestCta";

export function PriceListCallbackCta() {
  const { t } = useI18n();
  return (
    <CallbackRequestCta
      labels={t.priceList.callback}
      source="price_list_callback"
      serviceId="diagnostic"
      serviceLabel={t.priceList.callback.title}
      className="mb-10"
    />
  );
}
