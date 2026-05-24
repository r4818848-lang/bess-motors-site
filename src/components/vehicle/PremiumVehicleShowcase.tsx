"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import type { Vehicle } from "@/lib/store";
import {
  getVehicleVisualProfile,
  vehicleDisplaySubtitle,
  vehicleDisplayTitle,
} from "@/lib/vehicle-visual";
import { enrichVehicleMedia } from "@/lib/vehicle-image";
import { VehiclePhoto } from "./VehiclePhoto";

interface Props {
  vehicle: Vehicle;
  /** Drive-in animation on mount */
  animate?: boolean;
  compact?: boolean;
  className?: string;
  onDelete?: () => void;
  deleteLabel?: string;
}

export function PremiumVehicleShowcase({
  vehicle,
  animate = true,
  compact = false,
  className = "",
  onDelete,
  deleteLabel = "Delete",
}: Props) {
  const enriched = enrichVehicleMedia(vehicle) as Vehicle;
  const profile = getVehicleVisualProfile(enriched);
  const [ready, setReady] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, [animate]);

  const title = vehicleDisplayTitle(enriched);
  const subtitle = vehicleDisplaySubtitle(enriched);

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl neon-border ${compact ? "p-4" : "p-6"} ${className}`}
      style={{
        background: `linear-gradient(145deg, rgba(10,10,12,0.95) 0%, rgba(20,20,24,0.9) 45%, rgba(225,6,0,0.08) 100%)`,
        boxShadow: `0 0 40px ${profile.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] uppercase font-semibold bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-colors"
          title={deleteLabel}
        >
          <Trash2 size={14} />
          {!compact && <span>{deleteLabel}</span>}
        </button>
      )}
      {/* ambient glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ delay: 0.8, duration: 1 }}
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 80%, ${profile.glow}, transparent 70%)`,
        }}
      />

      {/* road lines */}
      <div className="absolute bottom-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <motion.div
        className="absolute bottom-6 left-0 right-0 flex gap-8 justify-center opacity-20"
        initial={{ x: 0 }}
        animate={ready && animate ? { x: [0, -40, 0] } : {}}
        transition={{ duration: 2.2, ease: "easeOut" }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div key={i} className="w-12 h-0.5 bg-white/30 rounded-full" />
        ))}
      </motion.div>

      {/* car — drives in from left */}
      <motion.div
        className={`relative z-10 ${compact ? "max-w-[280px] mx-auto" : "max-w-xl mx-auto"}`}
        initial={animate ? { x: "-120%", opacity: 0, scale: 0.92 } : false}
        animate={
          ready
            ? {
                x: 0,
                opacity: 1,
                scale: 1,
              }
            : {}
        }
        transition={{
          type: "spring",
          damping: 26,
          stiffness: 58,
          mass: 1.15,
          velocity: 2,
        }}
      >
        <VehiclePhoto vehicle={enriched} priority={animate} />
      </motion.div>

      {/* dust / speed lines during entry */}
      {animate && (
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-16 pointer-events-none"
          initial={{ opacity: 0.8, x: 0 }}
          animate={ready ? { opacity: 0, x: 80 } : {}}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute h-px bg-gradient-to-r from-transparent to-white/40"
              style={{ top: `${30 + i * 20}%`, width: `${60 - i * 15}%`, left: `${i * 8}%` }}
            />
          ))}
        </motion.div>
      )}

      {/* vehicle info */}
      <motion.div
        className={`relative z-20 text-center ${compact ? "mt-3" : "mt-5"}`}
        initial={animate ? { opacity: 0, y: 16 } : false}
        animate={ready ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.55, duration: 0.5 }}
      >
        <p
          className={`font-display font-bold uppercase tracking-wide text-glow ${compact ? "text-base" : "text-xl sm:text-2xl"}`}
          style={{ color: profile.accent }}
        >
          {title}
        </p>
        {subtitle && (
          <p className={`text-bm-muted mt-1 ${compact ? "text-[10px]" : "text-sm"}`}>{subtitle}</p>
        )}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mt-3"
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : {}}
          transition={{ delay: 0.85 }}
        >
          {enriched.plate && (
            <span className="px-3 py-1 rounded-lg bg-black/50 border border-bm-border font-mono text-xs tracking-widest">
              {enriched.plate}
            </span>
          )}
          {enriched.vin && (
            <span className="px-2 py-1 rounded-lg bg-black/30 text-[10px] text-bm-muted font-mono">
              VIN …{enriched.vin.slice(-6)}
            </span>
          )}
          {enriched.mileage > 0 && (
            <span className="px-2 py-1 rounded-lg bg-bm-red/10 text-[10px] text-bm-red">
              {enriched.mileage.toLocaleString()} km
            </span>
          )}
          {enriched.color && (
            <span className="px-2 py-1 rounded-lg bg-white/5 text-[10px] text-bm-muted">
              {enriched.color}
            </span>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
