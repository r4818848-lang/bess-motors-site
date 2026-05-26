import Script from "next/script";
import { Suspense } from "react";
import { META_PIXEL_ID, metaPixelInitScript } from "@/lib/meta-pixel";
import { MetaPixelPageView } from "./MetaPixelPageView";

/** Meta (Facebook) Pixel — official snippet via dangerouslySetInnerHTML (reliable in Next.js) */
export function MetaPixel() {
  if (!META_PIXEL_ID) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: metaPixelInitScript(META_PIXEL_ID),
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
      <Suspense fallback={null}>
        <MetaPixelPageView />
      </Suspense>
    </>
  );
}
