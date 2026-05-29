import type { WorkOrderDocVariant } from "./work-order-document";
import type { DocLocale } from "./work-order-locale";

export function buildWorkOrderPreviewUrl(
  orderId: string,
  options?: { lang?: DocLocale; variant?: WorkOrderDocVariant }
): string {
  const params = new URLSearchParams();
  if (options?.lang) params.set("lang", options.lang);
  if (options?.variant && options.variant !== "color") {
    params.set("variant", options.variant);
  }
  const query = params.toString();
  return `/crm/work-orders/preview/${encodeURIComponent(orderId)}${query ? `?${query}` : ""}`;
}

export function openWorkOrderPreview(
  orderId: string,
  options?: { lang?: DocLocale; variant?: WorkOrderDocVariant }
): void {
  const url = buildWorkOrderPreviewUrl(orderId, options);
  window.open(url, "_blank", "noopener,noreferrer");
}
