"use client";

import { useMemo, useState } from "react";
import { RefreshCw, ChevronDown, ChevronUp, Cloud, CloudOff } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function formatSyncAge(ms: number, locale: string): string {
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 15) {
    return locale.startsWith("ru") ? "только что" : locale.startsWith("pl") ? "przed chwilą" : "just now";
  }
  if (sec < 60) {
    return locale.startsWith("ru")
      ? `${sec} сек. назад`
      : locale.startsWith("pl")
        ? `${sec} s temu`
        : `${sec}s ago`;
  }
  const min = Math.floor(sec / 60);
  return locale.startsWith("ru")
    ? `${min} мин. назад`
    : locale.startsWith("pl")
      ? `${min} min temu`
      : `${min}m ago`;
}

interface Props {
  syncing: boolean;
  syncFailed: boolean;
  lastSyncedAt: number | null;
  liveMode?: boolean;
  onResync: () => void;
}

export function ClientSyncStatusBar({
  syncing,
  syncFailed,
  lastSyncedAt,
  liveMode,
  onResync,
}: Props) {
  const { t, locale } = useI18n();
  const c = t.cabinet;
  const [helpOpen, setHelpOpen] = useState(false);

  const ageLabel = useMemo(() => {
    if (!lastSyncedAt) return "";
    return formatSyncAge(lastSyncedAt, locale);
  }, [lastSyncedAt, locale, syncing]);

  return (
    <div className="mb-4 space-y-2">
      <div
        className={`flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 rounded-xl border px-3 py-2.5 text-xs sm:text-sm ${
          syncFailed
            ? "border-amber-500/40 bg-amber-500/10"
            : "border-bm-border/50 bg-bm-surface/40"
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {syncing ? (
            <>
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-bm-red border-t-transparent animate-spin"
                aria-hidden
              />
              <span className="text-bm-muted">{c.syncUpdating}</span>
            </>
          ) : syncFailed ? (
            <>
              <CloudOff size={16} className="text-amber-400 shrink-0" aria-hidden />
              <span className="text-amber-200">{c.syncFailed}</span>
            </>
          ) : (
            <>
              <Cloud size={16} className="text-green-400 shrink-0" aria-hidden />
              <span className="text-bm-muted">
                {lastSyncedAt
                  ? c.syncUpdated.replace("{time}", ageLabel)
                  : c.syncUpdating}
                {liveMode ? (
                  <span className="text-green-400/90 ml-1">· {c.syncLiveHint}</span>
                ) : null}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            className="text-bm-red hover:underline inline-flex items-center gap-1"
            onClick={() => setHelpOpen((v) => !v)}
            aria-expanded={helpOpen}
          >
            {c.syncHowTitle}
            {helpOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <Button
            type="button"
            variant="outline"
            className="text-xs py-1 px-2 h-8"
            disabled={syncing}
            onClick={() => void onResync()}
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? c.syncUpdating : c.syncRefresh}
          </Button>
        </div>
      </div>

      {syncFailed && !syncing && (
        <p className="text-xs text-amber-300/80 px-1">{c.syncOfflineHint}</p>
      )}

      {helpOpen && (
        <Card className="p-4 text-sm text-bm-muted leading-relaxed border-bm-border/40">
          <p className="whitespace-pre-line">{c.syncHowBody}</p>
          <p className="mt-3 text-xs border-t border-bm-border/40 pt-3">{c.statusPageHint}</p>
        </Card>
      )}
    </div>
  );
}
