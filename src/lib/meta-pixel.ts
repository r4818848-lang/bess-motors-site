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

type FbqFn = {
  (...args: unknown[]): void;
  callMethod?: { apply: (ctx: unknown, args: unknown[]) => void };
  queue?: unknown[];
};

function getFbq(): FbqFn | null {
  if (typeof window === "undefined") return null;
  const fbq = (window as Window & { fbq?: FbqFn }).fbq;
  return fbq ?? null;
}

/** Low-level send — same as fbq('track', event) in console */
export function fireFbq(event: string, params?: Record<string, unknown>): void {
  const fbq = getFbq();
  if (!fbq) return;
  try {
    if (params !== undefined) fbq("track", event, params);
    else fbq("track", event);
  } catch {
    /* pixel blocked or not ready */
  }
}

const pending: { event: string; params?: Record<string, unknown> }[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function flushPending(): void {
  if (!getFbq()) return;
  while (pending.length > 0) {
    const { event, params } = pending.shift()!;
    fireFbq(event, params);
  }
  if (flushTimer !== null) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

function scheduleFlush(): void {
  if (flushTimer !== null || typeof window === "undefined") return;
  let attempts = 0;
  flushTimer = setInterval(() => {
    attempts += 1;
    flushPending();
    if (!pending.length || attempts >= 50) {
      clearInterval(flushTimer!);
      flushTimer = null;
    }
  }, 100);
}

/** Track standard Meta events — queues until fbq stub exists (max ~5s) */
export function trackMetaEvent(
  event: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  if (getFbq()) {
    fireFbq(event, params);
    return;
  }
  pending.push({ event, params });
  scheduleFlush();
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

/** Console test: __bmFbq('Lead') */
export function installMetaPixelDebug(): void {
  if (typeof window === "undefined") return;
  (window as Window & { __bmFbq?: typeof fireFbq }).__bmFbq = fireFbq;
}
