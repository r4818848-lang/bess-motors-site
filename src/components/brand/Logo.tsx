"use client";

import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { useI18n } from "@/lib/i18n/context";
import { siteConfig } from "@/lib/site";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

const sizes = {
  sm: { height: 44, width: 120 },
  md: { height: 64, width: 180 },
  lg: { height: 120, width: 320 },
};

export function Logo({ size = "md", showTagline = true }: LogoProps) {
  const { t } = useI18n();
  const s = sizes[size];

  return (
    <Link href="/" className="group flex flex-col items-start gap-1 shrink-0">
      <Image
        src={siteConfig.logoImage}
        alt={siteConfig.name}
        width={s.width}
        height={s.height}
        className={clsx(
          "object-contain object-left drop-shadow-[0_0_12px_rgba(225,6,0,0.35)]",
          "transition-transform duration-300 group-hover:scale-[1.02]"
        )}
        style={{ height: s.height, width: "auto", maxWidth: s.width }}
        priority={size === "lg"}
      />
      {showTagline && size !== "sm" && (
        <p className="text-[9px] uppercase tracking-widest text-bm-muted group-hover:text-white transition-colors pl-0.5">
          {t.tagline}
        </p>
      )}
    </Link>
  );
}
