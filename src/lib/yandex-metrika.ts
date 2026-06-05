/** Yandex.Metrika counter — override via NEXT_PUBLIC_YANDEX_METRIKA_ID */
export const YANDEX_METRIKA_ID = Number(
  process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID ?? "109683484"
);

export function isYandexMetrikaEnabled(): boolean {
  return Number.isFinite(YANDEX_METRIKA_ID) && YANDEX_METRIKA_ID > 0;
}

export function yandexMetrikaInitScript(counterId: number): string {
  return `(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
  })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${counterId}', 'ym');

  ym(${counterId}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`;
}

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
  }
}

export function fireYmHit(url: string, title?: string): void {
  if (typeof window === "undefined" || !isYandexMetrikaEnabled()) return;
  if (typeof window.ym !== "function") return;
  window.ym(YANDEX_METRIKA_ID, "hit", url, {
    referer: document.referrer,
    title: title ?? document.title,
  });
}
