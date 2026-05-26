/** Meta Pixel ID — override via NEXT_PUBLIC_META_PIXEL_ID in Vercel */
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "1670736437497545";

/** Meta Events Manager base code — plain <script> in <head>, not next/script */
export function metaPixelInitScript(pixelId: string): string {
  return `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');
fbq('track','PageView');`;
}

/** Track standard Meta events from client components */
export function trackMetaEvent(
  event: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (params) window.fbq("track", event, params);
  else window.fbq("track", event);
}

export function trackMetaContact(source?: string): void {
  trackMetaEvent("Contact", source ? { content_name: source } : undefined);
}

export function trackMetaLead(source?: string): void {
  trackMetaEvent("Lead", source ? { content_name: source } : undefined);
}

export function trackMetaSchedule(source?: string): void {
  trackMetaEvent("Schedule", source ? { content_name: source } : undefined);
}

export function trackMetaInitiateCheckout(source?: string): void {
  trackMetaEvent("InitiateCheckout", source ? { content_name: source } : undefined);
}

export function trackMetaAddToCart(source?: string): void {
  trackMetaEvent("AddToCart", source ? { content_name: source } : undefined);
}

export function trackMetaCustomizeProduct(source?: string): void {
  trackMetaEvent("CustomizeProduct", source ? { content_name: source } : undefined);
}

export function trackMetaCompleteRegistration(source?: string): void {
  trackMetaEvent("CompleteRegistration", source ? { content_name: source } : undefined);
}

export function trackMetaViewContent(contentName: string): void {
  trackMetaEvent("ViewContent", { content_name: contentName });
}
