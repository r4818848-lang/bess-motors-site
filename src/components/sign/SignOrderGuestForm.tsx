"use client";

import { useState } from "react";
import { Phone, Car, PenLine } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { User, Vehicle, WorkOrder } from "@/lib/store";
import type { ClientPortalSlice } from "@/lib/client-sign";
import {
  establishClientSessionFromToken,
  loginWithPhonePassword,
} from "@/lib/auth";
import { saveClientCredentials } from "@/lib/client-credentials";
import {
  localClientPortalAccess,
  mergeClientPortalIntoDb,
} from "@/lib/client-portal";
import { setSignOrderAccess } from "@/lib/sign-order-access";
import { Button } from "@/components/ui/Button";

type Props = {
  orderId: string;
  orderNumber: string;
  onVerified: (
    order: WorkOrder,
    mode: "local" | "cloud",
    cloud?: {
      client: User;
      vehicle: Vehicle | null;
      phone: string;
      plate: string;
      portal?: ClientPortalSlice;
    }
  ) => void;
};

export function SignOrderGuestForm({ orderId, orderNumber, onVerified }: Props) {
  const { t } = useI18n();
  const s = t.document;
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const finishAccess = async (
    order: WorkOrder,
    slice: ClientPortalSlice,
    mode: "local" | "cloud",
    token?: string
  ) => {
    mergeClientPortalIntoDb(slice);
    saveClientCredentials(phone, plate);

    if (token) {
      await establishClientSessionFromToken(token);
    } else {
      await loginWithPhonePassword(phone, plate);
    }

    setSignOrderAccess(order.id);
    const vehicle =
      slice.vehicles.find((v) => v.id === order.vehicleId) ?? slice.vehicles[0] ?? null;

    onVerified(order, mode, {
      client: slice.user,
      vehicle,
      phone,
      plate: plate.trim(),
      portal: slice,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!plate.trim() || plate.trim().length < 2) {
      setError(t.auth.plateRequired);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/sign-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "access",
          orderId: orderId || undefined,
          phone,
          plate: plate.trim(),
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          ok?: boolean;
          token?: string;
          order?: WorkOrder;
          portal?: ClientPortalSlice;
        };
        if (data.ok && data.order && data.portal) {
          await finishAccess(data.order, data.portal, "cloud", data.token);
          return;
        }
      }

      if (process.env.NODE_ENV === "development" && res.status === 503) {
        const local = await localClientPortalAccess(phone, plate, orderId || undefined);
        if (local) {
          await finishAccess(local.order, local.slice, "local");
          return;
        }
      }

      setError(s.signVerifyFailed);
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
            required
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
