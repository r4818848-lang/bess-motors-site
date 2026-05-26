"use client";

import type { ComponentProps } from "react";
import { siteConfig } from "@/lib/site";

type SocialKind = "whatsapp" | "telegram";

const hrefByKind: Record<SocialKind, string> = {
  whatsapp: siteConfig.whatsapp,
  telegram: siteConfig.telegram,
};

type SocialContactLinkProps = ComponentProps<"a"> & {
  kind: SocialKind;
  trackSource?: string;
};

/** WhatsApp / Telegram — fires Meta Contact on click */
export function SocialContactLink({
  kind,
  href,
  onClick,
  trackSource,
  target = "_blank",
  rel = "noopener noreferrer",
  children,
  ...props
}: SocialContactLinkProps) {
  return (
    <a
      href={href ?? hrefByKind[kind]}
      target={target}
      rel={rel}
      data-fbq-track="Contact"
      data-fbq-params={JSON.stringify({ content_name: trackSource ?? kind })}
      {...props}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
