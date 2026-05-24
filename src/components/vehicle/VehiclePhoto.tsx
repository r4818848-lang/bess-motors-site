"use client";

import { useState } from "react";
import Image from "next/image";
import type { Vehicle } from "@/lib/store";
import { buildVehicleImageUrl, enrichVehicleMedia } from "@/lib/vehicle-image";
import { getVehicleVisualProfile } from "@/lib/vehicle-visual";
import { CarSilhouetteSvg } from "./CarSilhouetteSvg";

interface Props {
  vehicle: Partial<Vehicle>;
  compact?: boolean;
  className?: string;
  priority?: boolean;
}

/** Photo render from VIN data (make, model, year, color) with SVG fallback */
export function VehiclePhoto({ vehicle, compact = false, className = "", priority = false }: Props) {
  const [failed, setFailed] = useState(false);
  const enriched = enrichVehicleMedia(vehicle);
  const profile = getVehicleVisualProfile(enriched);
  const src = buildVehicleImageUrl(enriched, compact ? 480 : 900);

  if (failed || !enriched.make?.trim()) {
    return (
      <CarSilhouetteSvg
        bodyType={profile.bodyType}
        colors={profile}
        className={className}
      />
    );
  }

  const height = compact ? 120 : 220;

  return (
    <div
      className={`relative w-full mx-auto ${compact ? "max-w-[200px]" : "max-w-2xl"} ${className}`}
      style={{ minHeight: height }}
    >
      <Image
        src={src}
        alt={`${enriched.make ?? ""} ${enriched.model ?? ""}`.trim() || "Vehicle"}
        width={900}
        height={height}
        priority={priority}
        unoptimized
        className="w-full h-auto object-contain drop-shadow-2xl"
        style={{
          filter: `drop-shadow(0 12px 28px ${profile.glow})`,
          maxHeight: height,
        }}
        onError={() => setFailed(true)}
      />
      {enriched.color && !compact && (
        <span
          className="absolute bottom-1 right-1 px-2 py-0.5 rounded text-[9px] uppercase tracking-wide bg-black/60 border border-white/10 text-bm-muted"
          title={enriched.color}
        >
          {enriched.color}
        </span>
      )}
    </div>
  );
}
