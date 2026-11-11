"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { trackBookingOpen } from "@/lib/gtag";

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
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    trackBookingOpen(trackSource);
    onClick?.(event);
  };
  return (
    <Link
      href={href}
      data-fbq-track="InitiateCheckout"
      data-fbq-params={
        trackSource ? JSON.stringify({ content_name: trackSource }) : undefined
      }
      {...props}
      onClick={handleClick}
    />
  );
}
