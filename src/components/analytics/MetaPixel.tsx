import { META_PIXEL_ID, metaPixelInitScript } from "@/lib/meta-pixel";

/**
 * Meta base pixel — place between <head> and </head> on every page (root layout).
 * Plain <script> so the snippet is in server HTML, as Meta Events Manager expects.
 */
export function MetaPixel() {
  if (!META_PIXEL_ID) return null;

  return (
    <>
      <script
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
    </>
  );
}
