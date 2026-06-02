"use client";

import { useState, useRef } from "react";
import { X, FileUp, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { staffCrmFetch } from "@/lib/crm-staff-fetch";
import type { ImportWorkOrderDraft } from "@/lib/motowarsztat-import-parser";
import { createWorkOrderFromImport } from "@/lib/create-work-order-from-import";
import { loadDb } from "@/lib/store";
import { saveDbAndPushCrm } from "@/lib/cloud-crm-db";
import { acquireCrmDraftLock, releaseCrmDraftLock } from "@/lib/crm-draft-lock";
import { Button } from "@/components/ui/Button";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (orderId: string) => void;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

export function ImportWorkOrderModal({ open, onClose, onCreated }: Props) {
  const { t } = useI18n();
  const c = t.crm;
  const imp = c.importOrder;
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<ImportWorkOrderDraft | null>(null);
  const [rawPreview, setRawPreview] = useState("");

  const reset = () => {
    setFile(null);
    setDraft(null);
    setRawPreview("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const requestClose = () => {
    if (parsing || saving) return;
    releaseCrmDraftLock();
    reset();
    onClose();
  };

  const handleFile = (f: File | null) => {
    setFile(f);
    setDraft(null);
    setRawPreview("");
    setError("");
  };

  const runParse = async () => {
    if (!file) return;
    setParsing(true);
    setError("");
    acquireCrmDraftLock();
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await staffCrmFetch(
        "/api/crm/import-work-order",
        { method: "POST", body: form },
        90_000
      );
      if (!res?.ok) {
        const data = (await res?.json().catch(() => ({}))) as {
          error?: string;
          hint?: string;
        };
        setError(data.hint || data.error || imp.parseFailed);
        return;
      }
      const data = (await res.json()) as {
        parsed: ImportWorkOrderDraft;
        rawTextPreview?: string;
      };
      setDraft(data.parsed);
      setRawPreview(data.rawTextPreview ?? "");
    } catch {
      setError(imp.parseFailed);
    } finally {
      setParsing(false);
    }
  };

  const handleCreate = async () => {
    if (!draft || !file) return;
    if (!draft.phone?.trim()) {
      setError(imp.phoneRequired);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const fresh = loadDb();
      const result = await createWorkOrderFromImport(fresh, {
        ...draft,
        attachment: {
          name: file.name,
          mime: file.type || "application/octet-stream",
          dataUrl,
        },
      });
      if (!result.ok) {
        setError(
          result.error === "phone_required"
            ? imp.phoneRequired
            : imp.createFailed
        );
        return;
      }
      const ok = await saveDbAndPushCrm(fresh);
      if (!ok) {
        setError(c.pushSyncFailed);
        return;
      }
      releaseCrmDraftLock();
      reset();
      onCreated(result.orderId);
      onClose();
    } catch {
      setError(imp.createFailed);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      role="dialog"
      aria-modal
      onClick={(e) => e.target === e.currentTarget && requestClose()}
    >
      <div
        className="crm-modal-panel w-full sm:max-w-2xl max-h-[92dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="crm-mw-modal-header shrink-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileUp className="text-bm-red shrink-0" size={22} />
            <h2 className="font-semibold text-sm sm:text-base truncate">{imp.title}</h2>
          </div>
          <button type="button" className="crm-mw-modal-close" onClick={requestClose} aria-label={t.common.cancel}>
            <X size={22} />
          </button>
        </div>

        <div className="crm-mw-modal-body overflow-y-auto space-y-4 flex-1">
          <p className="text-sm text-bm-muted">{imp.hint}</p>

          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => fileRef.current?.click()}
            disabled={parsing || saving}
          >
            {file ? file.name : imp.pickFile}
          </Button>

          {!draft && (
            <Button
              type="button"
              className="w-full"
              disabled={!file || parsing}
              onClick={() => void runParse()}
            >
              {parsing ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> {imp.parsing}
                </>
              ) : (
                imp.analyze
              )}
            </Button>
          )}

          {draft && (
            <div className="space-y-3 text-sm">
              {draft.warnings.length > 0 && (
                <p className="text-amber-600 text-xs">{imp.checkFields}</p>
              )}
              <label className="block">
                <span className="text-xs text-bm-muted uppercase">{imp.clientName}</span>
                <input
                  className="input-premium mt-1"
                  value={draft.clientName ?? ""}
                  onChange={(e) => setDraft({ ...draft, clientName: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-xs text-bm-muted uppercase">{imp.phone} *</span>
                <input
                  className="input-premium mt-1"
                  value={draft.phone ?? ""}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-bm-muted uppercase">{imp.plate}</span>
                  <input
                    className="input-premium mt-1"
                    value={draft.plate ?? ""}
                    onChange={(e) => setDraft({ ...draft, plate: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-bm-muted uppercase">VIN</span>
                  <input
                    className="input-premium mt-1"
                    value={draft.vin ?? ""}
                    onChange={(e) => setDraft({ ...draft, vin: e.target.value })}
                  />
                </label>
              </div>
              <p className="text-xs text-bm-muted">
                {imp.servicesDetected}: {draft.services.length}
              </p>
              {draft.services.length > 0 && (
                <ul className="text-xs space-y-1 max-h-32 overflow-y-auto border border-bm-border/40 rounded-lg p-2">
                  {draft.services.map((s, i) => (
                    <li key={i}>
                      {s.name} — {s.price.toFixed(2)} zł
                    </li>
                  ))}
                </ul>
              )}
              <details className="text-xs">
                <summary className="cursor-pointer text-bm-muted">{imp.rawText}</summary>
                <pre className="mt-2 p-2 bg-bm-graphite/50 rounded text-[10px] whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {rawPreview}
                </pre>
              </details>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {draft && (
          <div className="crm-mw-modal-footer shrink-0 flex gap-2 p-4 border-t border-bm-border/40">
            <Button type="button" variant="outline" onClick={reset} disabled={saving}>
              {imp.back}
            </Button>
            <Button type="button" className="flex-1" disabled={saving} onClick={() => void handleCreate()}>
              {saving ? imp.saving : imp.create}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
