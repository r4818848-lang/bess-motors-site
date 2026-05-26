"use client";

import type { ComponentProps } from "react";
import { siteConfig } from "@/lib/site";

type PhoneLinkProps = ComponentProps<"a"> & {
  /** Optional label for Meta event diagnostics */
  trackSource?: string;
};

/** Business phone link — fires Meta `Contact` on click (tel:+48791257229) */
export function PhoneLink({
  href = siteConfig.phoneHref,
  onClick,
  trackSource,
  children,
  ...props
}: PhoneLinkProps) {
  return (
    <a
      href={href}
      data-fbq-track="Contact"
      data-fbq-params={
        trackSource ? JSON.stringify({ content_name: trackSource }) : undefined
      }
      {...props}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
