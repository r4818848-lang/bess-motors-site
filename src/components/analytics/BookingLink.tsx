"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type BookingLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href?: ComponentProps<typeof Link>["href"];
  trackSource?: string;
};

/** Links to /booking — data-fbq-track fires InitiateCheckout (MetaClickTracker) */
export function BookingLink({
  onClick,
  trackSource,
  href = "/booking",
  ...props
}: BookingLinkProps) {
  return (
    <Link
      href={href}
      data-fbq-track="InitiateCheckout"
      data-fbq-params={
        trackSource ? JSON.stringify({ content_name: trackSource }) : undefined
      }
      {...props}
      onClick={onClick}
    />
  );
}
