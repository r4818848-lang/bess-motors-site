"use client";

import { clsx } from "clsx";
import { useI18n } from "@/lib/i18n/context";
import { useCrmDisplay } from "@/contexts/CrmDisplayContext";

type Props = {
  children?: React.ReactNode;
  actions?: React.ReactNode;
  showPriceToggle?: boolean;
  className?: string;
};

export function CrmListToolbar({
  children,
  actions,
  showPriceToggle = true,
  className,
}: Props) {
  const { t } = useI18n();
  const c = t.crm;
  const { priceMode, setPriceMode } = useCrmDisplay();

  return (
    <div className={clsx("crm-list-toolbar", className)}>
      <div className="flex-1 min-w-[200px]">{children}</div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {showPriceToggle && (
          <div className="crm-price-toggle" role="group" aria-label={c.priceDisplayMode}>
            <button
              type="button"
              className={priceMode === "net" ? "active" : ""}
              onClick={() => setPriceMode("net")}
            >
              {c.netto}
            </button>
            <button
              type="button"
              className={priceMode === "gross" ? "active" : ""}
              onClick={() => setPriceMode("gross")}
            >
              {c.brutto}
            </button>
          </div>
        )}
        {actions}
      </div>
    </div>
  );
}
