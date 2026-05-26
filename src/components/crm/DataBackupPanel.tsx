"use client";

import { useRef, useState } from "react";
import { Database, Download, Upload, RotateCcw } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { useDbSync } from "@/hooks/useDbSync";
import { loadDb } from "@/lib/store";
import {
  DB_BACKUP_KEY,
  DB_BACKUP_PREV_KEY,
  exportDbDownload,
  getBackupSummary,
  importDbFromFile,
  restoreFromBackup,
} from "@/lib/db-backup";
import { Button } from "@/components/ui/Button";

export function DataBackupPanel({ onUpdate }: { onUpdate: () => void }) {
  const { t } = useI18n();
  const w = t.wo;
  const c = t.crm;
  const fileRef = useRef<HTMLInputElement>(null);
  useDbSync();
  const db = loadDb();
  const [msg, setMsg] = useState<string | null>(null);

  const backup = getBackupSummary(DB_BACKUP_KEY);
  const backupPrev = getBackupSummary(DB_BACKUP_PREV_KEY);

  const restore = (key: string) => {
    if (!confirm(w.restoreBackupConfirm)) return;
    const ok = restoreFromBackup(key);
    setMsg(ok ? w.backupRestored : w.noBackupFound);
    if (ok) onUpdate();
  };

  return (
    <div className="glass-red rounded-xl p-6 neon-border space-y-4">
      <h3 className="font-display text-sm uppercase text-bm-red flex items-center gap-2">
        <Database size={18} /> {w.dataBackupTitle}
      </h3>
      <p className="text-sm text-bm-muted">{w.dataBackupHint}</p>
      <p className="text-xs text-bm-muted">
        {w.dataBackupCurrent}: {w.internalExpenses.toLowerCase()} — <strong>{db.expenses.length}</strong>,{" "}
        {c.workOrders} — <strong>{db.workOrders.length}</strong>
      </p>
      {backup && (
        <p className="text-xs text-bm-muted">
          {w.dataBackupLast}: {w.internalExpenses.toLowerCase()} — {backup.expenses}, {c.workOrders} —{" "}
          {backup.workOrders}
        </p>
      )}
      {backupPrev && (
        <p className="text-xs text-bm-muted">
          {w.dataBackupPrevious}: {w.internalExpenses.toLowerCase()} — {backupPrev.expenses}, {c.workOrders} —{" "}
          {backupPrev.workOrders}
        </p>
      )}
      {msg && <p className="text-sm text-bm-red">{msg}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => exportDbDownload()}>
          <Download size={16} /> {w.exportDatabase}
        </Button>
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload size={16} /> {w.importDatabase}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (!confirm(w.importBackupConfirm)) {
              e.target.value = "";
              return;
            }
            importDbFromFile(file, (ok) => {
              setMsg(ok ? w.backupRestored : w.importFailed);
              if (ok) onUpdate();
              e.target.value = "";
            });
          }}
        />
        <Button type="button" variant="outline" onClick={() => restore(DB_BACKUP_KEY)} disabled={!backup}>
          <RotateCcw size={16} /> {w.restoreAutoBackup}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => restore(DB_BACKUP_PREV_KEY)}
          disabled={!backupPrev}
        >
          <RotateCcw size={16} /> {w.restorePrevBackup}
        </Button>
      </div>
    </div>
  );
}
