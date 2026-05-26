"use client";

import { useState } from "react";
import { Phone, Car, PenLine } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb } from "@/lib/store";
import type { User, Vehicle, WorkOrder } from "@/lib/store";
import {
  setSignOrderAccess,
  verifyLocalSignAccess,
} from "@/lib/sign-order-access";
import { Button } from "@/components/ui/Button";

type Props = {
  orderId: string;
  orderNumber: string;
  onVerified: (
    order: WorkOrder,
    mode: "local" | "cloud",
    cloud?: { client: User; vehicle: Vehicle | null; phone: string; plate?: string }
  ) => void;
};

export function SignOrderGuestForm({ orderId, orderNumber, onVerified }: Props) {
  const { t } = useI18n();
  const s = t.document;
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const db = loadDb();
      if (verifyLocalSignAccess(db, orderId, phone, plate)) {
        const order = db.workOrders.find((o) => o.id === orderId);
        if (order) {
          setSignOrderAccess(orderId);
          onVerified(order, "local");
          return;
        }
      }

      const res = await fetch("/api/sign-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          orderId,
          phone,
          plate: plate.trim() || undefined,
        }),
      });

      if (!res.ok) {
        setError(s.signVerifyFailed);
        return;
      }

      const data = (await res.json()) as {
        ok?: boolean;
        order?: WorkOrder;
        client?: User;
        vehicle?: Vehicle | null;
      };
      if (!data.ok || !data.order || !data.client) {
        setError(s.signVerifyFailed);
        return;
      }

      setSignOrderAccess(orderId);
      onVerified(data.order, "cloud", {
        client: data.client,
        vehicle: data.vehicle ?? null,
        phone,
        plate: plate.trim() || undefined,
      });
    } catch {
      setError(s.signVerifyFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <PenLine className="w-12 h-12 text-bm-red mx-auto mb-4" />
        <h1 className="font-display text-xl uppercase text-glow">{s.signGuestTitle}</h1>
        <p className="text-sm text-bm-muted mt-2">{s.signGuestHint}</p>
        <p className="text-sm text-bm-muted mt-1 font-mono">{orderNumber}</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-red rounded-xl p-6 neon-border space-y-4">
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bm-muted" />
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            className="input-premium pl-10 w-full"
            placeholder={t.cabinet.phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="relative">
          <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bm-muted" />
          <input
            type="text"
            autoCapitalize="characters"
            className="input-premium pl-10 w-full font-mono"
            placeholder={t.cabinet.registrationPlate}
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
          />
        </div>
        <p className="text-[10px] text-bm-muted">{s.signGuestPlateHint}</p>

        {error && <p className="text-sm text-bm-red text-center">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t.auth.loading : s.signGuestContinue}
        </Button>
      </form>
    </div>
  );
}
