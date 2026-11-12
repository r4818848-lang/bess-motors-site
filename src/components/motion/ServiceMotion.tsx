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
      <svg viewBox="0 0 640 280" width="640" height="280" role="presentation">
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
      <svg viewBox="0 0 640 240" width="640" height="240" role="presentation">
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
      <path d="M132 64h376c28 0 44 16 44 40v34c0 22-16 36-44 36H132c-28 0-44-14-44-36V104c0-24 16-40 44-40z" fill="url(#metal-oil)" />
      <path d="M156 92h328v12H156z" fill="#05070a" opacity="0.5" />
      {[176, 250, 390, 464].map((x) => (
        <g key={x}>
          <circle cx={x} cy="76" r="8" fill="#10141a" stroke="#d5dbe2" strokeWidth="2" />
          <path d={`M${x - 4} 76h8`} stroke="#6d757e" strokeWidth="1.6" />
        </g>
      ))}
      <path d="M286 142h68l10 18h-88z" fill="#1a2026" />
      <path d="M300 160h40v14h-40z" fill="#2a3138" stroke="#8d949c" />
      <path d="M188 206h264l22 22v18c0 18-18 30-40 30H206c-22 0-40-12-40-30v-18z" fill="#12171c" stroke="#6a737c" strokeWidth="2" />
      <path
        className="bm-oil-stream"
        d="M306 198c-2 16-8 28-4 46 1 6 8 12 18 13 14 1 26-8 24-20 0-16 6-30 4-46-1-6-12-8-18-6-10 1-20 4-24 13z"
        fill="url(#oil-oil)"
      />
      <path
        className="bm-oil-stream bm-oil-thin"
        d="M320 200c4 16 2 32 6 50"
        fill="none"
        stroke="#f8e7b4"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <g className="bm-plug-group">
        <path d="M320 154l14 8v16l-14 8-14-8v-16z" fill="#e7edf2" stroke="#2c333b" strokeWidth="2" />
        <path d="M308 170h24M320 158v24" stroke="#2c333b" strokeWidth="2.4" />
      </g>
      {[0, 1, 2, 3, 4].map((index) => (
        <circle
          key={index}
          className="bm-drop"
          cx={306 + index * 8}
          cy={206}
          r={2.2 + (index % 3) * 0.7}
          fill={index % 2 ? "#f0d48a" : "#8a5a18"}
          style={{ animationDelay: `${1.15 + index * 0.12}s` }}
        />
      ))}
      <path className="bm-oil-pool" d="M210 228h220c10 10 4 26-16 32H228c-22-6-28-22-18-32z" fill="#6a4a16" />
      <ellipse className="bm-pool-sheen" cx="328" cy="242" rx="78" ry="7" fill="#f6e2a8" opacity="0.7" />
    </g>
  );
}

function TireScene() {
  return <DriveCar y={36} kind="tires" />;
}

function DriveCar({ y, kind }: { y: number; kind: string }) {
  const g = y + 168;
  return (
    <g className="bm-car">
      <ellipse className="bm-shadow" cx="206" cy={g + 18} rx="46" ry="7" fill="#000" opacity="0.45" />
      <ellipse className="bm-shadow" cx="482" cy={g + 18} rx="46" ry="7" fill="#000" opacity="0.45" />
      <g className="bm-body">
        <path
          d={`M124 ${g - 24}
              C138 ${g - 40} 158 ${y + 104} 196 ${y + 96}
              C214 ${y + 72} 236 ${y + 46} 278 ${y + 40}
              C312 ${y + 18} 348 ${y + 14} 392 ${y + 18}
              L438 ${y + 24}
              C478 ${y + 30} 508 ${y + 50} 534 ${y + 78}
              C556 ${y + 102} 582 ${y + 116} 604 ${g - 40}
              L618 ${g - 24}
              C622 ${g - 12} 610 ${g - 8} 592 ${g - 8}
              L530 ${g - 8}
              C518 ${g - 50} 446 ${g - 50} 434 ${g - 8}
              L254 ${g - 8}
              C242 ${g - 50} 170 ${g - 50} 158 ${g - 8}
              L132 ${g - 8}
              C114 ${g - 8} 112 ${g - 16} 124 ${g - 24} Z`}
          fill={`url(#paint-${kind})`}
          stroke="#f4f7fa"
          strokeWidth="1.4"
        />
        <path d={`M168 ${g - 16} H248 C236 ${g - 44} 176 ${g - 44} 164 ${g - 16} Z`} fill="#0c0e12" />
        <path d={`M438 ${g - 16} H522 C510 ${g - 44} 446 ${g - 44} 434 ${g - 16} Z`} fill="#0c0e12" />
        <path
          d={`M286 ${y + 46} H418 C452 ${y + 48} 478 ${y + 68} 492 ${y + 92} H274 C282 ${y + 66} 284 ${y + 52} 286 ${y + 46} Z`}
          fill="#071821"
        />
        <path d={`M292 ${y + 52} H410`} stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
        <path d={`M392 ${y + 50} V${y + 90}`} stroke="#9eb0be" strokeWidth="1.6" />
        <path d={`M250 ${y + 108} H568`} stroke="rgba(255,255,255,0.28)" strokeWidth="2" />
        <path d={`M258 ${g - 18} H430`} stroke="#1a1e24" strokeWidth="8" />
        <path d={`M360 ${y + 104} V${g - 22}`} stroke="rgba(255,255,255,0.16)" />
        <path d={`M470 ${y + 104} V${g - 22}`} stroke="rgba(255,255,255,0.12)" />
        <path d={`M376 ${y + 116} h16`} stroke="#f4f7fa" strokeWidth="3" strokeLinecap="round" />
        <path d={`M292 ${y + 70} l-16 8 h16`} fill="#d5dbe2" />
        <path d={`M574 ${y + 108} h36 v8 h-32 z`} fill="#f4f7fa" />
        <path d={`M578 ${y + 118} h28 v8 h-24 z`} fill="#f6c453" />
        <path d={`M136 ${y + 112} h24 v12 h-20 z`} fill="#e10600" />
        <path d={`M136 ${y + 128} h18 v6 h-16 z`} fill="#f4f7fa" />
        <path d={`M124 ${g - 28} h28 v12 h-24 z`} fill="#1c2228" />
        <path d={`M592 ${g - 30} h22 v14 h-18 z`} fill="#1c2228" />
      </g>
      <Wheel cx={206} cy={g - 8} />
      <Wheel cx={482} cy={g - 8} />
    </g>
  );
}

function Wheel({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="39" fill="#0c0e12" />
      <circle cx={cx} cy={cy} r="33" fill="none" stroke="#242a31" strokeWidth="14" />
      <circle cx={cx} cy={cy} r="26" fill="none" stroke="#8d949c" strokeWidth="2" />
      <circle cx={cx} cy={cy} r="22" fill="#1a1e24" />
      <g className="bm-wheel">
        <circle cx={cx} cy={cy} r="16" fill="#d5dbe2" />
        {[0, 72, 144, 216, 288].map((angle) => (
          <path
            key={angle}
            d={`M${cx - 3} ${cy} L${cx + 3} ${cy} L${cx + 2} ${cy - 18} L${cx - 2} ${cy - 18} Z`}
            fill="#8d949c"
            transform={`rotate(${angle} ${cx} ${cy})`}
          />
        ))}
      </g>
      <circle cx={cx} cy={cy} r="5.5" fill="#14181d" stroke="#e10600" strokeWidth="2" />
    </g>
  );
}

function BrakeScene() {
  return (
    <g>
      <ellipse cx="320" cy="228" rx="120" ry="14" fill="#000" opacity="0.35" />
      <g className="bm-disc">
        <circle cx="300" cy="132" r="92" fill="#10141a" />
        <circle cx="300" cy="132" r="84" fill="#c5ced6" />
        <circle cx="300" cy="132" r="70" fill="#1c2228" />
        <circle cx="300" cy="132" r="62" fill="none" stroke="#f4f7fa" strokeWidth="8" />
        {Array.from({ length: 8 }, (_, index) => (
          <circle key={index} cx="300" cy="78" r="6" fill="#0c0e12" transform={`rotate(${index * 45} 300 132)`} />
        ))}
        <circle cx="300" cy="132" r="22" fill="#12161c" stroke="#f4f7fa" strokeWidth="3" />
      </g>
      <path d="M336 42h78v34h-28v116h28v34h-78v-22h34V64h-34z" fill="#3e474f" />
      <path d="M352 58h46" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
      <rect className="bm-pad bm-pad-top" x="292" y="52" width="72" height="16" rx="2" fill="#e10600" />
      <rect className="bm-pad bm-pad-bottom" x="292" y="196" width="72" height="16" rx="2" fill="#e10600" />
    </g>
  );
}

function ScanScene() {
  return (
    <g>
      <DriveCar y={28} kind="diagnostic" />
      <rect className="bm-scan" x="150" y="20" width="360" height="3" fill="#9fd6ff" opacity="0.9" />
      <circle className="bm-marker" cx="214" cy="150" r="5" fill="#e10600" />
      <circle className="bm-marker bm-marker-late" cx="340" cy="118" r="5" fill="#b9e4ff" />
      <circle className="bm-marker bm-marker-last" cx="470" cy="154" r="5" fill="#e10600" />
    </g>
  );
}

function AcScene() {
  return (
    <g>
      <path d="M120 168h400v28c0 16-16 24-28 24H148c-12 0-28-8-28-24z" fill="#10141a" />
      <rect x="132" y="78" width="376" height="96" rx="18" fill="url(#metal-ac)" />
      <path d="M148 78h344v16H148z" fill="rgba(255,255,255,0.16)" />
      {[0, 1, 2, 3].map((index) => (
        <g key={index} className="bm-vent" style={{ transformOrigin: `${188 + index * 88}px 126px`, animationDelay: `${index * 0.1}s` }}>
          <rect x={168 + index * 88} y="100" width="40" height="52" rx="8" fill="#10141a" stroke="#c5ced6" />
          <path d={`M${176 + index * 88} 112h24M${176 + index * 88} 126h24M${176 + index * 88} 140h24`} stroke="#8d949c" />
        </g>
      ))}
      {[0, 1, 2, 3].map((index) => (
        <path
          key={index}
          className="bm-flow"
          style={{ animationDelay: `${0.15 + index * 0.12}s` }}
          d={`M${176 + index * 88} 156c18 16 28 28 24 48 16-6 36-4 48 8 8-28-8-46-20-58z`}
          fill="#bfefff"
          opacity="0.8"
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
      <rect x="150" y="118" width="340" height="96" rx="16" fill="url(#metal-engine)" />
      <rect x="176" y="96" width="288" height="28" rx="8" fill="#2a3138" />
      <rect className="bm-piston" x="230" y="48" width="28" height="72" rx="6" fill="#e7edf2" />
      <rect className="bm-piston bm-piston-late" x="300" y="58" width="28" height="62" rx="6" fill="#c5ced6" />
      <rect className="bm-piston" x="370" y="52" width="28" height="68" rx="6" fill="#d5dbe2" style={{ animationDelay: "0.18s" }} />
      <circle className="bm-pulley" cx="214" cy="196" r="22" fill="#14181d" stroke="#e7edf2" strokeWidth="6" />
      <path d="M196 166h220" stroke="#e10600" strokeWidth="4" />
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
