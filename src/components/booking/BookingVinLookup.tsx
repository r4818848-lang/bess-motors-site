"use client";

import { useState } from "react";
import { ScanLine } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { decodeVin } from "@/lib/vin";

type Props = {
  /** Always called with the current 17-char VIN (or "" when cleared). */
  onVinChange: (vin: string) => void;
  onDecoded: (info: { make: string; model: string; year: string }) => void;
};

export function BookingVinLookup({ onVinChange, onDecoded }: Props) {
  const { t } = useI18n();
  const v = t.bookingVin;
  const [vin, setVin] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");

  const setVinValue = (raw: string) => {
    const next = raw.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17);
    setVin(next);
    setStatus("idle");
    onVinChange(next.length === 17 ? next : "");
  };

  const run = async () => {
    const code = vin.trim().toUpperCase();
    if (code.length !== 17) {
      setStatus("err");
      onVinChange("");
      return;
    }
    onVinChange(code);
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
        // VIN still kept for the workshop even if decode fails
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
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setVinValue(e.target.value)}
        />
        <button type="button" className="btn-outline text-xs shrink-0" onClick={run}>
          {status === "loading" ? "…" : v.decode}
        </button>
      </div>
      {status === "ok" && <p className="text-xs text-green-400 mt-2">{v.success}</p>}
      {status === "err" && <p className="text-xs text-bm-red mt-2">{v.error}</p>}
      {vin.length === 17 && status !== "loading" && (
        <p className="text-[10px] text-bm-muted mt-2 font-mono">VIN: {vin}</p>
      )}
    </div>
  );
}
