"use client";

import { useState } from "react";
import { ScanLine } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { decodeVin } from "@/lib/vin";

type Props = {
  onDecoded: (info: { make: string; model: string; year: string }) => void;
};

export function BookingVinLookup({ onDecoded }: Props) {
  const { t } = useI18n();
  const v = t.bookingVin;
  const [vin, setVin] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");

  const run = async () => {
    const code = vin.trim().toUpperCase();
    if (code.length !== 17) {
      setStatus("err");
      return;
    }
    setStatus("loading");
    try {
      const decoded = await decodeVin(code);
      if (decoded.make || decoded.model) {
        onDecoded({
          make: decoded.make,
          model: decoded.model,
          year: decoded.year,
        });
        setStatus("ok");
      } else {
        setStatus("err");
      }
    } catch {
      setStatus("err");
    }
  };

  return (
    <div className="rounded-xl border border-bm-border/50 bg-bm-card/40 p-4 mb-6">
      <div className="flex items-center gap-2 text-bm-red mb-2">
        <ScanLine size={18} />
        <span className="text-xs font-bold uppercase">{v.title}</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className="input-premium flex-1 font-mono uppercase"
          placeholder={v.placeholder}
          value={vin}
          maxLength={17}
          onChange={(e) => {
            setVin(e.target.value.toUpperCase());
            setStatus("idle");
          }}
        />
        <button type="button" className="btn-outline text-xs shrink-0" onClick={run}>
          {status === "loading" ? "…" : v.decode}
        </button>
      </div>
      {status === "ok" && <p className="text-xs text-green-400 mt-2">{v.success}</p>}
      {status === "err" && <p className="text-xs text-bm-red mt-2">{v.error}</p>}
    </div>
  );
}
