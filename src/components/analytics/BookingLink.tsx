"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackMetaInitiateCheckout } from "@/lib/meta-pixel";

type BookingLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href?: ComponentProps<typeof Link>["href"];
  trackSource?: string;
};

/** Links to /booking — fires Meta InitiateCheckout on click */
export function BookingLink({
  onClick,
  trackSource,
  href = "/booking",
  ...props
}: BookingLinkProps) {
  return (
    <Link
      href={href}
      {...props}
      onClick={(e) => {
        trackMetaInitiateCheckout(trackSource);
        onClick?.(e);
      }}
    />
  );
}
