"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/session-context";
import { useDbSync } from "@/hooks/useDbSync";
import { loadDb } from "@/lib/store";
import {
  getNotificationsForUser,
  requestClientNotificationPermission,
  showBrowserNotification,
} from "@/lib/client-notifications";
import { resolveNotificationForWatcher } from "@/components/cabinet/notification-text";

const SHOWN_KEY = "bess-notif-browser-shown";

function loadShownIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(SHOWN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveShownIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  const arr = [...ids].slice(-100);
  sessionStorage.setItem(SHOWN_KEY, JSON.stringify(arr));
}

/** Shows browser notifications for new client alerts */
export function ClientNotificationWatcher() {
  const { clientUser } = useAuth();
  const { t } = useI18n();
  const tick = useDbSync();
  const asked = useRef(false);

  useEffect(() => {
    if (!clientUser || asked.current) return;
    asked.current = true;
    requestClientNotificationPermission();
  }, [clientUser]);

  useEffect(() => {
    if (!clientUser) return;
    const db = loadDb();
    const shown = loadShownIds();
    let changed = false;

    for (const n of getNotificationsForUser(db, clientUser.id)) {
      if (n.read || shown.has(n.id)) continue;
      const resolved = resolveNotificationForWatcher(n, t);
      showBrowserNotification(resolved.title, resolved.body, resolved.href);
      shown.add(n.id);
      changed = true;
    }

    if (changed) saveShownIds(shown);
  }, [clientUser, tick, t]);

  return null;
}
