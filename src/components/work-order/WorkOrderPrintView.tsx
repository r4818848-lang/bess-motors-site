"use client";

import type { WorkOrder, Vehicle, User } from "@/lib/store";
import type { WorkOrderDocVariant } from "@/lib/work-order-document";
import type { DocLocale } from "@/lib/work-order-locale";
import { PremiumWorkOrderDocument } from "./PremiumWorkOrderDocument";

interface Props {
  order: WorkOrder;
  vehicle: Vehicle;
  client: User;
  vatRate?: number;
  variant?: WorkOrderDocVariant;
  docLocale?: DocLocale;
}

/** Premium layout for print / PDF capture */
export function WorkOrderPrintView({
  order,
  vehicle,
  client,
  vatRate = 23,
  variant = "color",
  docLocale,
}: Props) {
  return (
    <div
      className={
        variant === "bw"
          ? "bg-white min-h-screen py-6 print:py-0"
          : "bg-bm-black min-h-screen py-6 print:py-0"
      }
    >
      <PremiumWorkOrderDocument
        id="work-order-print"
        order={order}
        vehicle={vehicle}
        client={client}
        vatRate={vatRate}
        mode="print"
        variant={variant}
        docLocale={docLocale}
        className="max-w-[794px] mx-auto"
      />
    </div>
  );
}
