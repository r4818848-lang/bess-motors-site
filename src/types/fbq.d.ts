/** Meta (Facebook) Pixel — loaded via MetaPixel in root layout */
interface Window {
  fbq?: (
    action: "init" | "track" | "trackCustom",
    eventName: string,
    params?: Record<string, unknown>
  ) => void;
  _fbq?: Window["fbq"];
}
