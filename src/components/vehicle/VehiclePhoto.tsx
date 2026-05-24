"use client";

import { useState } from "react";
import Image from "next/image";
import type { Vehicle } from "@/lib/store";
import { enrichVehicleMedia, resolveVehicleImage } from "@/lib/vehicle-image";
import { getVehicleVisualProfile } from "@/lib/vehicle-visual";
import { CarSilhouetteSvg } from "./CarSilhouetteSvg";

interface Props {
  vehicle: Partial<Vehicle>;
  compact?: boolean;
  className?: string;
  priority?: boolean;
  wheelSpin?: boolean;
}

/**
 * Vehicle visual: stock photo (Wikimedia, no watermark) or
 * premium SVG render in decoded color when no photo exists.
 */
export function VehiclePhoto({
  vehicle,
  compact = false,
  className = "",
  priority = false,
  wheelSpin = false,
}: Props) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const enriched = enrichVehicleMedia(vehicle);
  const profile = getVehicleVisualProfile(enriched);
  const imageInfo = resolveVehicleImage(enriched);
  const usePhoto = imageInfo.source === "stock" && imageInfo.url && !photoFailed;

  if (!usePhoto) {
    return (
      <CarSilhouetteSvg
        bodyType={profile.bodyType}
        colors={profile}
        wheelSpin={wheelSpin}
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
        src={imageInfo.url!}
        alt={`${enriched.make ?? ""} ${enriched.model ?? ""}`.trim() || "Vehicle"}
        width={900}
        height={height}
        priority={priority}
        className="w-full h-auto object-contain drop-shadow-2xl"
        style={{
          filter: `drop-shadow(0 12px 28px ${profile.glow})`,
          maxHeight: height,
        }}
        onError={() => setPhotoFailed(true)}
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
