"use client";

import { useState } from "react";
import { Check, FileText, Shield } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { WorkOrder, Database, OrderSignature } from "@/lib/store";
import { loadDb, saveDb } from "@/lib/store";
import {
  calcClientTotal,
  calcServiceLine,
  calcPartLine,
  calcOrderDiscountAmount,
  calcSubtotal,
} from "@/lib/workorder-calc";
import { SignaturePad } from "@/components/signature/SignaturePad";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Props {
  order: WorkOrder;
  db: Database;
  onDone: () => void;
  onCancel: () => void;
}

export function WorkOrderSignatureFlow({ order, db, onDone, onCancel }: Props) {
  const { t } = useI18n();
  const s = t.signature;
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [priceOk, setPriceOk] = useState(false);
  const [repairOk, setRepairOk] = useState(false);
  const [worksOk, setWorksOk] = useState(false);

  const subtotal = calcSubtotal(order);
  const discount = calcOrderDiscountAmount(order);
  const total = calcClientTotal(order);
  const client = db.users.find((u) => u.id === order.userId);

  const submit = () => {
    if (!signatureData || !priceOk || !repairOk || !worksOk) return;

    const meta: OrderSignature = {
      dataUrl: signatureData,
      signedAt: new Date().toISOString(),
      signedBy: client?.name ?? "Client",
      ip: "browser",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      priceAgreed: priceOk,
      repairAgreed: repairOk,
    };

    const fresh = loadDb();
    const wo = fresh.workOrders.find((o) => o.id === order.id);
    if (wo) {
      wo.confirmationStatus = "confirmed";
      wo.signature = meta;
      wo.clientSignature = signatureData;
      wo.updatedAt = new Date().toISOString().slice(0, 10);
      saveDb(fresh);
    }
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 overflow-y-auto">
      <Card glow className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-bm-red" />
          <div>
            <h2 className="font-display text-xl font-bold uppercase text-glow">{s.title}</h2>
            <p className="text-sm text-bm-muted font-mono">{order.number}</p>
          </div>
        </div>

        <section className="mb-6">
          <h3 className="text-xs uppercase text-bm-red mb-3 flex items-center gap-2">
            <FileText size={14} /> {s.worksReview}
          </h3>
          <ul className="text-sm space-y-1 max-h-32 overflow-y-auto glass rounded p-3">
            {order.services.map((line) => (
              <li key={line.id} className="flex justify-between">
                <span>{line.name}</span>
                <span className="text-bm-red font-mono">{calcServiceLine(line).toFixed(2)} zł</span>
              </li>
            ))}
            {order.parts.map((line) => (
              <li key={line.id} className="flex justify-between">
                <span>{line.name}</span>
                <span className="text-bm-red font-mono">{calcPartLine(line).toFixed(2)} zł</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-display text-2xl font-bold text-bm-red">
            {s.total}: {total.toFixed(2)} zł
          </p>
          {discount > 0 && (
            <p className="text-xs text-bm-muted">
              {subtotal.toFixed(2)} zł − {discount.toFixed(2)} zł
            </p>
          )}
        </section>

        <div className="space-y-3 mb-6">
          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <input type="checkbox" checked={worksOk} onChange={(e) => setWorksOk(e.target.checked)} className="mt-1 accent-bm-red" />
            {s.agreeWorks}
          </label>
          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <input type="checkbox" checked={priceOk} onChange={(e) => setPriceOk(e.target.checked)} className="mt-1 accent-bm-red" />
            {s.agreePrice}
          </label>
          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <input type="checkbox" checked={repairOk} onChange={(e) => setRepairOk(e.target.checked)} className="mt-1 accent-bm-red" />
            {s.agreeRepair}
          </label>
        </div>

        <h3 className="text-xs uppercase text-bm-red mb-2">{s.signHere}</h3>
        <SignaturePad onChange={setSignatureData} />

        <div className="flex flex-wrap gap-3 mt-8">
          <Button className="flex-1" onClick={submit} disabled={!signatureData || !priceOk || !repairOk || !worksOk}>
            <Check size={16} /> {s.confirm}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            {t.common.cancel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
