export const TELEGRAM_WEB_APP_SDK_URL = "https://telegram.org/js/telegram-web-app.js";
export const TELEGRAM_LAUNCH_STORAGE_KEY = "__telegram__initParams";

export type TelegramWebAppSnapshot = {
  sdkReady: boolean;
  initData: string;
  platform: string;
  launchPending: boolean;
};

type TelegramWebAppLike = {
  initData?: string;
  platform?: string;
  ready?: () => void;
  expand?: () => void;
  initDataUnsafe?: { user?: { language_code?: string } };
};

type TelegramWindowLike = {
  Telegram?: { WebApp?: TelegramWebAppLike };
  location?: { hash?: string; pathname?: string; search?: string };
  sessionStorage?: { getItem(key: string): string | null };
};

function urlSafeDecode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, "%20"));
  } catch {
    return value;
  }
}

/** Same first-equals split as telegram-web-app.js. Returns null when the launch payload is absent. */
export function parseTelegramLaunchHash(hash: string): Record<string, string | null> | null {
  const raw = hash.replace(/^#/, "");
  if (!raw.includes("tgWebAppData=")) return null;
  const params: Record<string, string | null> = {};
  for (const part of raw.split("&")) {
    const pieces = part.split("=");
    const name = urlSafeDecode(pieces[0] ?? "");
    if (!name) continue;
    params[name] = pieces[1] == null ? null : urlSafeDecode(pieces[1]);
  }
  if (!params.tgWebAppData) return null;
  return params;
}

export function telegramLaunchStatus(snapshot: Pick<TelegramWebAppSnapshot, "sdkReady" | "initData" | "platform">): {
  sdkReady: boolean;
  hasInitData: boolean;
  platform: string;
} {
  return {
    sdkReady: snapshot.sdkReady,
    hasInitData: snapshot.initData.trim().length > 0,
    platform: snapshot.platform,
  };
}

function launchPending(win: TelegramWindowLike): boolean {
  if ((win.location?.hash ?? "").includes("tgWebAppData=")) return true;
  try {
    return (win.sessionStorage?.getItem(TELEGRAM_LAUNCH_STORAGE_KEY) ?? "").includes('"tgWebAppData"');
  } catch {
    return false;
  }
}

export function readTelegramWebApp(win: TelegramWindowLike): TelegramWebAppSnapshot {
  const webApp = win.Telegram?.WebApp;
  const pending = launchPending(win);
  if (!webApp) return { sdkReady: false, initData: "", platform: "", launchPending: pending };
  return {
    sdkReady: true,
    initData: typeof webApp.initData === "string" ? webApp.initData.trim() : "",
    platform: typeof webApp.platform === "string" ? webApp.platform : "",
    launchPending: pending,
  };
}

export function telegramLanguageCode(win: TelegramWindowLike): string {
  const code = win.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  return typeof code === "string" ? code : "";
}

export function markTelegramWebAppReady(win: TelegramWindowLike): void {
  const webApp = win.Telegram?.WebApp;
  webApp?.ready?.();
  webApp?.expand?.();
}

/**
 * The SDK parses the URL hash when it loads. A one-shot read during hydration
 * runs before that and must not become the final answer.
 */
export async function waitForTelegramInitData(
  read: () => TelegramWebAppSnapshot,
  options?: {
    attempts?: number;
    delayMs?: number;
    plainAttempts?: number;
    sleep?: (ms: number) => Promise<void>;
  }
): Promise<TelegramWebAppSnapshot> {
  const attempts = options?.attempts ?? 40;
  const delayMs = options?.delayMs ?? 100;
  const plainAttempts = options?.plainAttempts ?? 15;
  const sleep = options?.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  let sdkAt = -1;
  let last = read();
  for (let i = 0; i < attempts; i++) {
    last = read();
    if (last.initData) return last;
    if (last.sdkReady && sdkAt < 0) sdkAt = i;
    if (last.sdkReady && !last.launchPending && i >= sdkAt + 2) return last;
    if (!last.sdkReady && !last.launchPending && i >= plainAttempts) return last;
    if (i < attempts - 1) await sleep(delayMs);
  }
  return last;
}

/** Runs before analytics. Moves the launch hash into the SDK storage key and drops it from the URL. */
export const telegramLaunchHeadScript = `(function(){
  function urlSafeDecode(value){
    try { return decodeURIComponent(String(value).replace(/\\+/g, "%20")); }
    catch (e) { return String(value); }
  }
  try {
    var path = location.pathname || "";
    if (path !== "/telegram/calendar" && path.indexOf("/telegram/calendar/") !== 0) return;
    var hash = "";
    try { hash = location.hash.toString(); } catch (e) {}
    if (hash.indexOf("tgWebAppData=") >= 0) {
      var params = {};
      var parts = hash.replace(/^#/, "").split("&");
      for (var i = 0; i < parts.length; i++) {
        var param = parts[i].split("=");
        var name = urlSafeDecode(param[0]);
        if (!name) continue;
        params[name] = param[1] == null ? null : urlSafeDecode(param[1]);
      }
      if (params.tgWebAppData) {
        var saved = false;
        try {
          sessionStorage.setItem("__telegram__initParams", JSON.stringify(params));
          saved = true;
        } catch (e) {}
        if (saved) {
          try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
        }
      }
    }
    if (!document.querySelector("script[src='${TELEGRAM_WEB_APP_SDK_URL}']")) {
      var script = document.createElement("script");
      script.src = "${TELEGRAM_WEB_APP_SDK_URL}";
      script.async = true;
      document.head.appendChild(script);
    }
  } catch (e) {}
})();`;
