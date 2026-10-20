"use client";

import type { ComponentProps, MouseEvent } from "react";
import { siteConfig } from "@/lib/site";
import { workshopTelegramChatUrl } from "@/lib/chat-cta";
import { trackClickWhatsapp } from "@/lib/gtag";

type SocialKind = "whatsapp" | "telegram";

const hrefByKind: Record<SocialKind, string> = {
  whatsapp: siteConfig.whatsapp,
  telegram: workshopTelegramChatUrl(),
};

type SocialContactLinkProps = ComponentProps<"a"> & {
  kind: SocialKind;
  trackSource?: string;
};

/** WhatsApp / Telegram — fires Meta Contact + GA4 click_whatsapp (no PII) */
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
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (kind === "whatsapp") trackClickWhatsapp(trackSource ?? kind);
    onClick?.(e);
  };

  return (
    <a
      href={href ?? hrefByKind[kind]}
      target={target}
      rel={rel}
      data-fbq-track="Contact"
      data-fbq-params={JSON.stringify({ content_name: trackSource ?? kind })}
      {...props}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
