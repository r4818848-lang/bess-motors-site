import {
  isYandexMetrikaEnabled,
  YANDEX_METRIKA_ID,
  yandexMetrikaInitScript,
} from "@/lib/yandex-metrika";

/** Inline in <head> for early load (Yandex recommendation). */
export function YandexMetrika() {
  if (!isYandexMetrikaEnabled()) return null;
  return (
    <>
      <link rel="dns-prefetch" href="https://mc.yandex.ru" />
      <link rel="preconnect" href="https://mc.yandex.ru" crossOrigin="anonymous" />
      <script
        dangerouslySetInnerHTML={{
          __html: yandexMetrikaInitScript(YANDEX_METRIKA_ID),
        }}
      />
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
