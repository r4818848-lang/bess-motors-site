"use client";

import { motion } from "framer-motion";
import type { VehicleBodyType, VehicleVisualProfile } from "@/lib/vehicle-visual";

interface Props {
  bodyType: VehicleBodyType;
  colors: VehicleVisualProfile;
  wheelSpin?: boolean;
  className?: string;
}

function Wheel({ cx, cy, spin }: { cx: number; cy: number; spin?: boolean }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="14" fill="#0a0a0a" />
      <motion.g
        animate={spin ? { rotate: 360 } : { rotate: 0 }}
        transition={spin ? { duration: 0.35, repeat: 5, ease: "linear" } : {}}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      >
        <circle cx={cx} cy={cy} r="10" fill="#111" stroke="#555" strokeWidth="1.5" />
        {[0, 45, 90, 135].map((deg) => (
          <line
            key={deg}
            x1={cx}
            y1={cy - 8}
            x2={cx}
            y2={cy + 8}
            stroke="#666"
            strokeWidth="1.2"
            transform={`rotate(${deg} ${cx} ${cy})`}
          />
        ))}
      </motion.g>
    </g>
  );
}

/** Premium side-view car SVG — body shape varies by VIN-derived category */
export function CarSilhouetteSvg({ bodyType, colors, wheelSpin, className = "" }: Props) {
  const { primary, secondary, accent, glow, glass } = colors;

  const roofY = bodyType === "suv" ? 28 : bodyType === "sport" ? 38 : bodyType === "hatch" ? 36 : 34;
  const bodyH = bodyType === "suv" ? 52 : bodyType === "sport" ? 38 : 44;
  const bodyY = bodyType === "sport" ? 58 : 52;

  return (
    <svg
      viewBox="0 0 420 120"
      className={`w-full h-auto drop-shadow-2xl ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={secondary} />
          <stop offset="45%" stopColor={primary} />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#334155" stopOpacity="0.9" />
          <stop offset="100%" stopColor={glass} stopOpacity="0.95" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ground reflection */}
      <ellipse cx="210" cy="108" rx="160" ry="8" fill={glow} opacity="0.35" />

      {/* body shadow */}
      <ellipse cx="210" cy="98" rx="150" ry="10" fill="#000" opacity="0.45" />

      {/* main body */}
      <path
        d={
          bodyType === "sport"
            ? `M 40 ${bodyY + 8} Q 55 ${bodyY - 4} 90 ${bodyY - 2} L 130 ${roofY + 8} Q 180 ${roofY - 6} 240 ${roofY} Q 300 ${roofY + 4} 340 ${bodyY - 4} L 380 ${bodyY} Q 395 ${bodyY + 6} 400 ${bodyY + 14} L 400 ${bodyY + bodyH} L 40 ${bodyY + bodyH} Z`
            : bodyType === "suv"
              ? `M 35 ${bodyY + 4} L 75 ${roofY + 12} L 120 ${roofY} L 280 ${roofY - 2} L 340 ${roofY + 8} L 385 ${bodyY} L 395 ${bodyY + bodyH} L 35 ${bodyY + bodyH} Z`
              : bodyType === "hatch"
                ? `M 42 ${bodyY + 6} L 95 ${roofY + 10} Q 160 ${roofY - 4} 220 ${roofY} L 300 ${roofY + 6} L 355 ${bodyY - 2} L 395 ${bodyY + 10} L 395 ${bodyY + bodyH} L 42 ${bodyY + bodyH} Z`
                : `M 38 ${bodyY + 6} Q 70 ${bodyY} 100 ${bodyY - 2} L 145 ${roofY + 6} Q 210 ${roofY - 8} 270 ${roofY + 2} L 330 ${roofY + 10} L 375 ${bodyY} Q 395 ${bodyY + 8} 400 ${bodyY + 16} L 400 ${bodyY + bodyH} L 38 ${bodyY + bodyH} Z`
        }
        fill="url(#bodyGrad)"
        stroke={accent}
        strokeWidth="0.6"
        strokeOpacity="0.5"
      />

      {/* window */}
      <path
        d={
          bodyType === "sport"
            ? `M 135 ${roofY + 10} Q 195 ${roofY + 2} 255 ${roofY + 8} L 290 ${bodyY - 2} L 150 ${bodyY + 2} Z`
            : `M 110 ${roofY + 12} L 175 ${roofY + 4} L 265 ${roofY + 6} L 310 ${bodyY + 2} L 125 ${bodyY + 6} Z`
        }
        fill="url(#glassGrad)"
        opacity="0.92"
      />

      {/* accent stripe */}
      <path
        d={`M 55 ${bodyY + bodyH - 8} L 365 ${bodyY + bodyH - 8}`}
        stroke={accent}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* headlight */}
      <ellipse cx="392" cy={bodyY + 18} rx="6" ry="4" fill={accent} filter="url(#glow)" opacity="0.95" />
      <ellipse cx="48" cy={bodyY + 20} rx="4" ry="3" fill="#ef4444" opacity="0.7" />

      {/* wheels */}
      <Wheel cx={bodyType === "sport" ? 115 : 105} cy={bodyY + bodyH - 2} spin={wheelSpin} />
      <Wheel cx={bodyType === "sport" ? 310 : 300} cy={bodyY + bodyH - 2} spin={wheelSpin} />
      {bodyType === "suv" && <Wheel cx={340} cy={bodyY + bodyH - 2} spin={wheelSpin} />}
    </svg>
  );
}
