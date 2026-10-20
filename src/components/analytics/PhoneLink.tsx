"use client";

import type { ComponentProps, MouseEvent } from "react";
import { siteConfig } from "@/lib/site";
import { trackClickPhone } from "@/lib/gtag";

type PhoneLinkProps = ComponentProps<"a"> & {
  /** Optional label for Meta event diagnostics */
  trackSource?: string;
};

/** Business phone link — fires Meta `Contact` + GA4 `click_phone` (no PII) */
export function PhoneLink({
  href = siteConfig.phoneHref,
  onClick,
  trackSource,
  children,
  ...props
}: PhoneLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    trackClickPhone(trackSource);
    onClick?.(e);
  };

  return (
    <a
      href={href}
      data-fbq-track="Contact"
      data-fbq-params={
        trackSource ? JSON.stringify({ content_name: trackSource }) : undefined
      }
      {...props}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
