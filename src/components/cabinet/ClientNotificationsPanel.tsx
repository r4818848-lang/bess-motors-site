"use client";

import Link from "next/link";
import { Bell, Check, FileSignature, CalendarDays, Wrench } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/session-context";
import { useDbSync } from "@/hooks/useDbSync";
import { loadDb, saveDb } from "@/lib/store";
import {
  getNotificationsForUser,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/client-notifications";
import type { ClientNotification } from "@/lib/store";
import { resolveNotificationForWatcher } from "@/components/cabinet/notification-text";
import { Button } from "@/components/ui/Button";

function resolveNotification(
  n: ClientNotification,
  t: ReturnType<typeof useI18n>["t"]
): { title: string; body: string; href: string; icon: typeof Bell } {
  const resolved = resolveNotificationForWatcher(n, t);
  const icon =
    n.type === "status_change" ? Wrench : n.type === "sign_required" ? FileSignature : CalendarDays;
  return { ...resolved, icon };
}

interface Props {
  compact?: boolean;
  onNavigate?: () => void;
}

export function ClientNotificationsPanel({ compact, onNavigate }: Props) {
  const { t } = useI18n();
  const { clientUser } = useAuth();
  const tick = useDbSync();
  void tick;

  if (!clientUser) return null;

  const db = loadDb();
  const items = getNotificationsForUser(db, clientUser.id);
  const unread = getUnreadCount(db, clientUser.id);
  const cn = t.clientNotifications;

  const openItem = (n: ClientNotification) => {
    markNotificationRead(db, n.id);
    saveDb(db);
    onNavigate?.();
  };

  const markAll = () => {
    markAllNotificationsRead(db, clientUser.id);
    saveDb(db);
  };

  if (compact) {
    return (
      <Link
        href="/cabinet?tab=notifications"
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg glass text-bm-muted hover:text-white"
        aria-label={cn.title}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-bm-red text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl uppercase text-glow">{cn.title}</h2>
          {unread > 0 && (
            <p className="text-sm text-bm-muted mt-1">
              {cn.unreadCount.replace("{n}", String(unread))}
            </p>
          )}
        </div>
        {unread > 0 && (
          <Button variant="outline" onClick={markAll} className="gap-1 text-xs py-2 px-3">
            <Check size={14} /> {cn.markAllRead}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="glass-red rounded-2xl p-10 text-center neon-border text-bm-muted">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{cn.empty}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => {
            const resolved = resolveNotification(n, t);
            const Icon = resolved.icon;
            return (
              <li key={n.id}>
                <Link
                  href={resolved.href}
                  onClick={() => openItem(n)}
                  className={`block rounded-xl border p-4 transition-all hover:border-bm-red/50 ${
                    n.read
                      ? "border-bm-border/40 bg-bm-card/40 opacity-80"
                      : "border-bm-red/40 bg-bm-red/10 shadow-neon-sm"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-bm-red/20 flex items-center justify-center text-bm-red">
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{resolved.title}</p>
                      <p className="text-sm text-bm-muted mt-1 leading-relaxed">
                        {resolved.body}
                      </p>
                      <p className="text-[10px] text-bm-muted/70 mt-2">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="shrink-0 w-2 h-2 rounded-full bg-bm-red mt-2" />
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
