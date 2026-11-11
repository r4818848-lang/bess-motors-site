import type { ServiceId } from "@/lib/services-catalog";
import { motionKindFor, type MotionKind } from "@/components/motion/service-motion-kind";

type Props = {
  slug: string;
  serviceId?: ServiceId;
  className?: string;
};

/** Decorative technical scene. The page title and booking buttons stay outside this figure. */
export function ServiceMotion({ slug, serviceId, className = "" }: Props) {
  const kind = motionKindFor(slug, serviceId);
  return (
    <figure className={`bm-scene bm-scene-${kind} ${className}`} data-scene={kind} aria-hidden="true">
      <svg viewBox="0 0 640 280" role="presentation">
        <SceneDefs kind={kind} />
        <rect width="640" height="280" rx="18" fill="#090b0e" />
        <rect x="16" y="16" width="608" height="248" rx="14" fill="#101318" />
        <rect x="16" y="16" width="608" height="248" rx="14" fill="none" stroke="rgba(255,255,255,0.08)" />
        <Scene kind={kind} />
      </svg>
    </figure>
  );
}

/** Side-view car used on the homepage. Wheels spin on their own while the body drives in. */
export function DriveInCar({ className = "" }: { className?: string }) {
  return (
    <figure className={`bm-scene bm-scene-hero ${className}`} data-scene="tires" aria-hidden="true">
      <svg viewBox="0 0 640 240" role="presentation">
        <SceneDefs kind="hero" />
        <rect width="640" height="240" fill="transparent" />
        <DriveCar y={18} kind="hero" />
      </svg>
    </figure>
  );
}

function SceneDefs({ kind }: { kind: string }) {
  return (
    <defs>
      <linearGradient id={`metal-${kind}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#5c656f" />
        <stop offset="0.42" stopColor="#1a1e24" />
        <stop offset="1" stopColor="#b7c0c8" />
      </linearGradient>
      <linearGradient id={`paint-${kind}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e7edf2" />
        <stop offset="0.42" stopColor="#8b949e" />
        <stop offset="1" stopColor="#2a3138" />
      </linearGradient>
      <linearGradient id={`oil-${kind}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f3d48a" />
        <stop offset="0.4" stopColor="#c48a2a" />
        <stop offset="1" stopColor="#5a3a12" />
      </linearGradient>
      <linearGradient id={`cool-${kind}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#e7c2a0" />
        <stop offset="1" stopColor="#d7f4ff" />
      </linearGradient>
      <radialGradient id={`lamp-${kind}`} cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor="#fff4d6" />
        <stop offset="1" stopColor="#e10600" />
      </radialGradient>
    </defs>
  );
}

function Scene({ kind }: { kind: MotionKind }) {
  if (kind === "oil") return <OilScene />;
  if (kind === "tires") return <TireScene />;
  if (kind === "brakes") return <BrakeScene />;
  if (kind === "diagnostic") return <ScanScene />;
  if (kind === "ac") return <AcScene />;
  if (kind === "suspension") return <SuspensionScene />;
  if (kind === "timing") return <TimingScene />;
  if (kind === "engine") return <EngineScene />;
  if (kind === "transmission") return <GearScene />;
  if (kind === "electric") return <ElectricScene />;
  if (kind === "fleet") return <FleetScene />;
  if (kind === "checklist") return <ChecklistScene />;
  return <WorkshopScene />;
}

function OilScene() {
  return (
    <g>
      <path d="M150 70h340c22 0 34 16 34 32v42c0 26-18 40-42 40H160c-24 0-42-14-42-40v-42c0-16 12-32 32-32z" fill="url(#metal-oil)" />
      <path d="M176 92h288v16H176z" fill="#07090c" opacity="0.45" />
      {[188, 250, 390, 452].map((x) => (
        <circle key={x} cx={x} cy="78" r="4" fill="#0e1116" stroke="#9aa3ad" strokeWidth="1" />
      ))}
      <rect x="292" y="142" width="56" height="18" rx="4" fill="#2a3038" />
      <circle cx="320" cy="160" r="11" fill="#1a1e24" stroke="#6d757e" />
      <g className="bm-plug-group">
        <circle cx="320" cy="160" r="13" fill="#d5dbe2" />
        <rect x="312" y="152" width="16" height="16" rx="2" fill="#8b939c" />
        <path d="M314 160h12" stroke="#1a1e24" strokeWidth="2" />
      </g>
      <path className="bm-oil" d="M320 176c1 18 4 34 2 58 8 10 14 16 14 28" fill="none" stroke="url(#oil-oil)" strokeWidth="16" strokeLinecap="round" />
      <path className="bm-oil bm-oil-thin" d="M324 178c6 22 10 40 6 62" fill="none" stroke="#c4a15a" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      {[0, 1, 2, 3].map((index) => (
        <circle key={index} className="bm-drop" cx={312 + index * 8} cy={206} r={2.2 + (index % 2)} fill="#6a4e22" style={{ animationDelay: `${1.15 + index * 0.16}s` }} />
      ))}
      <path d="M236 250h168c16 0 24-8 24-18v-14H212v14c0 10 8 18 24 18z" fill="#12161c" stroke="#3c444e" />
      <path className="bm-oil-pool" d="M226 230h188v10c0 8-10 14-22 14H248c-12 0-22-6-22-14z" fill="#3a2a14" />
    </g>
  );
}

function TireScene() {
  return <DriveCar y={36} kind="tires" />;
}

function DriveCar({ y, kind }: { y: number; kind: string }) {
  const roof = y + 42;
  const belt = y + 86;
  const rocker = y + 128;
  return (
    <g className="bm-car">
      <ellipse className="bm-shadow" cx="330" cy={rocker + 42} rx="176" ry="11" fill="#000" opacity="0.55" />
      <g className="bm-body">
        <path
          d={`M128 ${rocker}
              C150 ${belt + 6} 196 ${roof + 22} 248 ${roof + 8}
              C268 ${roof - 6} 286 ${roof} 310 ${roof}
              H402
              C438 ${roof} 468 ${roof + 10} 498 ${belt}
              L548 ${rocker - 4}
              H128 Z`}
          fill={`url(#paint-${kind})`}
          stroke="#f2f5f8"
          strokeWidth="2"
        />
        <path
          d={`M262 ${roof + 10} H392 C410 ${roof + 10} 428 ${belt - 16} 436 ${belt - 4} H250 C254 ${belt - 16} 256 ${roof + 16} 262 ${roof + 10} Z`}
          fill="#10202c"
        />
        <path d={`M338 ${roof + 12} V${belt - 6}`} stroke="#8ea0ae" strokeWidth="2" />
        <path d={`M248 ${belt + 4} H520`} stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
        <path d={`M318 ${belt + 8} V${rocker - 2}`} stroke="rgba(255,255,255,0.16)" strokeWidth="2" />
        <path d={`M530 ${belt + 8} h28 v14 h-22 z`} fill={`url(#lamp-${kind})`} />
        <path d={`M136 ${belt + 12} h16 v10 h-16 z`} fill="#e7edf2" />
        <path d={`M248 ${rocker - 2} h78`} stroke="#0a0c10" strokeWidth="10" strokeLinecap="round" />
        <path d={`M430 ${rocker - 2} h78`} stroke="#0a0c10" strokeWidth="10" strokeLinecap="round" />
      </g>
      <Wheel cx={214} cy={rocker + 4} />
      <Wheel cx={468} cy={rocker + 4} />
      <path className="bm-streak" d={`M20 ${rocker + 46} H620`} stroke="#e10600" strokeWidth="2" opacity="0.8" />
    </g>
  );
}

function Wheel({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="36" fill="#07090c" />
      <circle cx={cx} cy={cy} r="30" fill="none" stroke="#2c3138" strokeWidth="12" />
      <g className="bm-wheel" style={{ transformBox: "view-box", transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r="16" fill="#d5dbe2" />
        {[0, 45, 90, 135].map((angle) => (
          <line
            key={angle}
            x1={cx}
            y1={cy - 15}
            x2={cx}
            y2={cy + 15}
            stroke="#5d666f"
            strokeWidth="3"
            transform={`rotate(${angle} ${cx} ${cy})`}
          />
        ))}
      </g>
      <circle cx={cx} cy={cy} r="5" fill="#e10600" />
    </g>
  );
}

function BrakeScene() {
  return (
    <g>
      <g className="bm-disc">
        <circle cx="300" cy="148" r="86" fill="#12161c" stroke="#d5dbe2" strokeWidth="14" />
        <circle cx="300" cy="148" r="58" fill="none" stroke="#3a424c" strokeWidth="10" />
        {Array.from({ length: 8 }, (_, index) => (
          <circle key={index} cx="300" cy="86" r="5" fill="#0c0e12" transform={`rotate(${index * 45} 300 148)`} />
        ))}
        <circle cx="300" cy="148" r="24" fill="#2a313a" stroke="#9aa3ad" />
      </g>
      <path d="M236 62h128c18 0 28 12 22 28l-10 22H224l-10-22c-6-16 4-28 22-28z" fill="#4a525c" />
      <rect className="bm-pad bm-pad-top" x="258" y="102" width="84" height="12" rx="2" fill="#e10600" />
      <rect className="bm-pad bm-pad-bottom" x="258" y="178" width="84" height="12" rx="2" fill="#e10600" />
    </g>
  );
}

function ScanScene() {
  return (
    <g>
      <DriveCar y={28} kind="diagnostic" />
      <rect className="bm-scan" x="80" y="36" width="480" height="10" rx="5" fill="url(#cool-diagnostic)" />
      <circle className="bm-marker" cx="214" cy="150" r="5" fill="#e10600" />
      <circle className="bm-marker bm-marker-late" cx="340" cy="118" r="5" fill="#b9e4ff" />
      <circle className="bm-marker bm-marker-last" cx="470" cy="154" r="5" fill="#e10600" />
    </g>
  );
}

function AcScene() {
  return (
    <g>
      <rect x="150" y="78" width="340" height="92" rx="16" fill="url(#metal-ac)" />
      {[0, 1, 2, 3].map((index) => (
        <g key={index} className="bm-vent" style={{ transformOrigin: `${196 + index * 78}px 124px`, animationDelay: `${index * 0.12}s` }}>
          <rect x={184 + index * 78} y="96" width="24" height="56" rx="8" fill="#141920" stroke="#9aa3ad" />
        </g>
      ))}
      {[0, 1, 2].map((index) => (
        <path
          key={index}
          className="bm-air"
          style={{ animationDelay: `${index * 0.2}s` }}
          d={`M${150 + index * 16} ${188 + index * 8}c50-24 100-8 150-28s110-4 180-22`}
          fill="none"
          stroke="url(#cool-ac)"
          strokeWidth={10 - index * 2}
          strokeLinecap="round"
          opacity="0.95"
        />
      ))}
      {[0, 1, 2, 3].map((index) => (
        <circle
          key={`puff-${index}`}
          className="bm-puff"
          style={{ animationDelay: `${0.2 + index * 0.18}s` }}
          cx={210 + index * 70}
          cy={196}
          r={4 + (index % 2)}
          fill="#d7f3ff"
        />
      ))}
    </g>
  );
}

function SuspensionScene() {
  return (
    <g className="bm-strut">
      <rect x="292" y="48" width="22" height="36" rx="4" fill="#d5dbe2" />
      <rect x="286" y="84" width="34" height="70" rx="8" fill="#4a525c" />
      <path d="M270 154c18 18 54 18 72 0" fill="none" stroke="#e10600" strokeWidth="7" />
      <Wheel cx={306} cy={198} />
    </g>
  );
}

function TimingScene() {
  return (
    <g>
      <circle className="bm-pulley" cx="230" cy="150" r="48" fill="#141920" stroke="#d5dbe2" strokeWidth="10" />
      <circle className="bm-pulley bm-pulley-slow" cx="420" cy="150" r="30" fill="#141920" stroke="#d5dbe2" strokeWidth="8" />
      <path className="bm-belt" d="M230 102h190" stroke="#e10600" strokeWidth="6" />
      <path className="bm-belt" d="M230 198h190" stroke="#8d949c" strokeWidth="6" />
    </g>
  );
}

function EngineScene() {
  return (
    <g>
      <rect x="168" y="108" width="304" height="108" rx="14" fill="url(#metal-engine)" />
      <rect className="bm-piston" x="292" y="62" width="32" height="58" rx="4" fill="#d5dbe2" />
      <rect className="bm-piston bm-piston-late" x="360" y="70" width="28" height="48" rx="4" fill="#b7c0c8" />
      <rect x="196" y="136" width="78" height="18" rx="4" fill="#0c0e12" />
      <rect x="366" y="136" width="78" height="18" rx="4" fill="#0c0e12" />
    </g>
  );
}

function GearScene() {
  return (
    <g>
      <circle className="bm-gear" cx="268" cy="142" r="52" fill="none" stroke="#d5dbe2" strokeWidth="16" strokeDasharray="16 12" />
      <circle cx="268" cy="142" r="16" fill="#1a1e24" />
      <circle className="bm-gear bm-gear-reverse" cx="366" cy="176" r="36" fill="none" stroke="#e10600" strokeWidth="14" strokeDasharray="12 10" />
      <circle cx="366" cy="176" r="12" fill="#1a1e24" />
    </g>
  );
}

function ElectricScene() {
  return (
    <g>
      <path className="bm-pulse" d="M110 156h86l28-42 32 78 26-36h230" fill="none" stroke="#e10600" strokeWidth="4" />
      <rect x="188" y="132" width="36" height="48" rx="4" fill="#d5dbe2" />
      <rect x="430" y="132" width="36" height="48" rx="4" fill="#9fd6ff" />
    </g>
  );
}

function FleetScene() {
  return (
    <g>
      {[0, 1, 2].map((index) => (
        <path
          key={index}
          className="bm-fleet"
          style={{ animationDelay: `${index * 0.28}s` }}
          d={`M${80 + index * 180} 176c18-6 42-30 74-34h78c20 0 34 12 26 24H${92 + index * 180}c-10 0-16-6-12-10z`}
          fill="#222830"
          stroke="#9aa3ad"
        />
      ))}
    </g>
  );
}

function ChecklistScene() {
  return (
    <g>
      {[0, 1, 2].map((index) => (
        <g key={index} className="bm-check" style={{ animationDelay: `${index * 0.35}s` }}>
          <rect x="170" y={84 + index * 52} width="300" height="32" rx="8" fill="#141920" stroke="#3c444e" />
          <path d={`M190 ${100 + index * 52}l8 8 18-18`} fill="none" stroke="#e10600" strokeWidth="3" />
        </g>
      ))}
    </g>
  );
}

function WorkshopScene() {
  return (
    <g>
      <path d="M150 196h340" stroke="#e10600" strokeWidth="3" />
      <path d="M190 196V108h260v88" fill="none" stroke="#9aa3ad" strokeWidth="4" />
      <path d="M250 196v-48h140v48" fill="#141920" stroke="#3c444e" />
      <Wheel cx={230} cy={206} />
    </g>
  );
}
