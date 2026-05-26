/** Meta (Facebook) Pixel — inline script in app/layout.tsx <head> */
interface Window {
  fbq?: (
    action: "init" | "track" | "trackCustom",
    eventName: string,
    params?: Record<string, unknown>
  ) => void;
  _fbq?: Window["fbq"];
}
