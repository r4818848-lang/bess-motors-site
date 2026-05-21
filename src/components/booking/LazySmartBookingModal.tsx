"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const SmartBookingModal = dynamic(
  () =>
    import("@/components/booking/SmartBookingModal").then((m) => m.SmartBookingModal),
  { ssr: false, loading: () => null }
);

export function LazySmartBookingModal(
  props: ComponentProps<typeof SmartBookingModal>
) {
  return <SmartBookingModal {...props} />;
}
