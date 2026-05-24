"use client";

import type { Vehicle } from "@/lib/store";
import {
  getVehicleVisualProfile,
  vehicleDisplayTitle,
} from "@/lib/vehicle-visual";
import { VehiclePhoto } from "./VehiclePhoto";
import { enrichVehicleMedia } from "@/lib/vehicle-image";

interface Props {
  vehicle: Vehicle | undefined | null;
  showLabel?: boolean;
  className?: string;
}

/** Compact car preview for CRM tables and lists */
export function VehicleThumbnail({ vehicle, showLabel = true, className = "" }: Props) {
  if (!vehicle?.make && !vehicle?.model) {
    return <span className="text-bm-muted text-xs">—</span>;
  }

  const enriched = enrichVehicleMedia(vehicle) as Vehicle;
  const profile = getVehicleVisualProfile(enriched);
  const title = vehicleDisplayTitle(enriched);

  return (
    <div className={`flex items-center gap-3 min-w-[140px] ${className}`}>
      <div
        className="shrink-0 w-[88px] rounded-lg overflow-hidden border border-white/10 p-1"
        style={{
          background: `linear-gradient(160deg, #0c0c0e, ${profile.primary}22)`,
          boxShadow: `0 0 12px ${profile.glow}`,
        }}
      >
        <VehiclePhoto vehicle={enriched} compact className="scale-110 -my-1" />
      </div>
      {showLabel && (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate leading-tight">{title}</p>
          <p className="text-[10px] text-bm-muted font-mono truncate">
            {vehicle.plate || enriched.trim || enriched.year || ""}
          </p>
        </div>
      )}
    </div>
  );
}
