"use client";

import { useState, useRef } from "react";
import { X, FileUp, Loader2, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { staffCrmFetch, staffCrmFetchFailureReason } from "@/lib/crm-staff-fetch";
import type {
  ImportPartDraft,
  ImportServiceDraft,
  ImportWorkOrderDraft,
} from "@/lib/motowarsztat-import-parser";
import { calcPartLineProfit } from "@/lib/workorder-calc";
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

function ImportTableHeader({ cols }: { cols: string[] }) {
  return (
    <tr className="text-bm-muted border-b border-bm-border/40">
      {cols.map((col) => (
        <th key={col} className="text-left p-2 font-normal">
          {col}
        </th>
      ))}
      <th className="p-2 w-8" />
    </tr>
  );
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
    let keepDraftLock = false;
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await staffCrmFetch(
        "/api/crm/import-work-order",
        { method: "POST", body: form },
        90_000
      );
      if (!res?.ok) {
        const why = staffCrmFetchFailureReason(res);
        if (why === "unauthorized") {
          setError(imp.sessionExpired);
          return;
        }
        if (!res) {
          setError(why === "timeout" ? c.syncTimeout : c.syncNetwork);
          return;
        }
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          hint?: string;
        };
        setError(
          data.hint ||
            (data.error === "ocr_low_quality" ? imp.ocrPoorPhoto : data.error) ||
            imp.parseFailed
        );
        return;
      }
      const data = (await res.json()) as {
        parsed: ImportWorkOrderDraft;
        rawTextPreview?: string;
      };
      setDraft(data.parsed);
      setRawPreview(data.rawTextPreview ?? "");
      keepDraftLock = true;
    } catch {
      setError(imp.parseFailed);
    } finally {
      setParsing(false);
      if (!keepDraftLock) releaseCrmDraftLock();
    }
  };

  const updateService = (index: number, patch: Partial<ImportServiceDraft>) => {
    if (!draft) return;
    setDraft({
      ...draft,
      services: draft.services.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });
  };

  const updatePart = (index: number, patch: Partial<ImportPartDraft>) => {
    if (!draft) return;
    setDraft({
      ...draft,
      parts: draft.parts.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    });
  };

  const addServiceRow = () => {
    if (!draft) return;
    setDraft({
      ...draft,
      services: [...draft.services, { name: "", qty: 1, price: 0 }],
    });
  };

  const addPartRow = () => {
    if (!draft) return;
    setDraft({
      ...draft,
      parts: [...draft.parts, { name: "", qty: 1, purchasePrice: 0, sellPrice: 0 }],
    });
  };

  const partsProfitPreview =
    draft?.parts.reduce(
      (sum, p) =>
        sum +
        calcPartLineProfit({
          id: "",
          name: p.name,
          qty: p.qty || 1,
          purchasePrice: p.purchasePrice,
          sellPrice: p.sellPrice,
          discount: 0,
        }),
      0
    ) ?? 0;

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
        className="crm-modal-panel w-full sm:max-w-3xl max-h-[92dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="crm-mw-modal-header shrink-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileUp className="text-bm-red shrink-0" size={22} />
            <h2 className="font-semibold text-sm sm:text-base truncate">{imp.title}</h2>
          </div>
          <button
            type="button"
            className="crm-mw-modal-close"
            onClick={requestClose}
            aria-label={t.common.cancel}
          >
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
            <div className="space-y-4 text-sm">
              {draft.warnings.length > 0 && (
                <p className="text-amber-600 text-xs">{imp.checkFields}</p>
              )}

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase text-bm-red">{imp.sectionClient}</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block sm:col-span-2">
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
                  <label className="block">
                    <span className="text-xs text-bm-muted uppercase">E-mail</span>
                    <input
                      className="input-premium mt-1"
                      type="email"
                      value={draft.email ?? ""}
                      onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase text-bm-red">{imp.sectionVehicle}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="block">
                    <span className="text-xs text-bm-muted uppercase">{imp.plate}</span>
                    <input
                      className="input-premium mt-1"
                      value={draft.plate ?? ""}
                      onChange={(e) => setDraft({ ...draft, plate: e.target.value })}
                    />
                  </label>
                  <label className="block col-span-2 sm:col-span-1">
                    <span className="text-xs text-bm-muted uppercase">VIN</span>
                    <input
                      className="input-premium mt-1 font-mono text-xs"
                      value={draft.vin ?? ""}
                      onChange={(e) => setDraft({ ...draft, vin: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-bm-muted uppercase">{c.mileage}</span>
                    <input
                      type="number"
                      min={0}
                      className="input-premium mt-1"
                      value={draft.mileage ?? ""}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          mileage: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-bm-muted uppercase">{imp.makePlaceholder}</span>
                    <input
                      className="input-premium mt-1"
                      placeholder={imp.makePlaceholder}
                      value={draft.make ?? ""}
                      onChange={(e) => setDraft({ ...draft, make: e.target.value })}
                    />
                  </label>
                  <label className="block sm:col-span-3">
                    <span className="text-xs text-bm-muted uppercase">{imp.modelLabel}</span>
                    <input
                      className="input-premium mt-1"
                      value={draft.model ?? ""}
                      onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase text-bm-red">
                    {imp.servicesDetected} ({draft.services.length})
                  </h3>
                  <button
                    type="button"
                    className="text-xs text-bm-red flex items-center gap-1"
                    onClick={addServiceRow}
                  >
                    <Plus size={14} /> {imp.addService}
                  </button>
                </div>
                <div className="overflow-x-auto border border-bm-border/40 rounded-lg">
                  <table className="w-full text-xs min-w-[480px]">
                    <thead>
                      <ImportTableHeader cols={[c.name, c.qty, c.price]} />
                    </thead>
                    <tbody>
                      {draft.services.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-3 text-bm-muted text-center">
                            {imp.emptyServices}
                          </td>
                        </tr>
                      )}
                      {draft.services.map((s, i) => (
                        <tr key={i} className="border-b border-bm-border/20 last:border-0">
                          <td className="p-1">
                            <input
                              className="input-premium text-xs w-full min-w-[120px]"
                              value={s.name}
                              onChange={(e) => updateService(i, { name: e.target.value })}
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="number"
                              min={1}
                              className="input-premium text-xs w-12"
                              value={s.qty}
                              onChange={(e) =>
                                updateService(i, { qty: Number(e.target.value) || 1 })
                              }
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              className="input-premium text-xs w-20"
                              value={s.price}
                              onChange={(e) =>
                                updateService(i, { price: Number(e.target.value) || 0 })
                              }
                            />
                          </td>
                          <td className="p-1">
                            <button
                              type="button"
                              className="text-bm-muted hover:text-bm-red"
                              onClick={() =>
                                setDraft({
                                  ...draft,
                                  services: draft.services.filter((_, j) => j !== i),
                                })
                              }
                              aria-label={t.common.delete}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase text-bm-red">
                    {imp.partsDetected} ({draft.parts.length})
                  </h3>
                  <button
                    type="button"
                    className="text-xs text-bm-red flex items-center gap-1"
                    onClick={addPartRow}
                  >
                    <Plus size={14} /> {imp.addPart}
                  </button>
                </div>
                <p className="text-xs text-bm-muted">{imp.purchaseHint}</p>
                <div className="overflow-x-auto border border-bm-border/40 rounded-lg">
                  <table className="w-full text-xs min-w-[560px]">
                    <thead>
                      <ImportTableHeader
                        cols={[c.name, c.qty, c.purchasePrice, c.sellPrice]}
                      />
                    </thead>
                    <tbody>
                      {draft.parts.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-3 text-bm-muted text-center">
                            {imp.emptyParts}
                          </td>
                        </tr>
                      )}
                      {draft.parts.map((p, i) => (
                        <tr key={i} className="border-b border-bm-border/20 last:border-0">
                          <td className="p-1">
                            <input
                              className="input-premium text-xs w-full min-w-[100px]"
                              value={p.name}
                              onChange={(e) => updatePart(i, { name: e.target.value })}
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="number"
                              min={1}
                              className="input-premium text-xs w-12"
                              value={p.qty}
                              onChange={(e) =>
                                updatePart(i, { qty: Number(e.target.value) || 1 })
                              }
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              className="input-premium text-xs w-16"
                              value={p.purchasePrice}
                              onChange={(e) =>
                                updatePart(i, {
                                  purchasePrice: Number(e.target.value) || 0,
                                })
                              }
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              className="input-premium text-xs w-16"
                              value={p.sellPrice}
                              onChange={(e) =>
                                updatePart(i, { sellPrice: Number(e.target.value) || 0 })
                              }
                            />
                          </td>
                          <td className="p-1">
                            <button
                              type="button"
                              className="text-bm-muted hover:text-bm-red"
                              onClick={() =>
                                setDraft({
                                  ...draft,
                                  parts: draft.parts.filter((_, j) => j !== i),
                                })
                              }
                              aria-label={t.common.delete}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {draft.parts.length > 0 && (
                  <p className="text-xs text-green-500">
                    {imp.estimatedPartsProfit}: +{partsProfitPreview.toFixed(2)} zł
                  </p>
                )}
              </section>

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
            <Button
              type="button"
              className="flex-1"
              disabled={saving}
              onClick={() => void handleCreate()}
            >
              {saving ? imp.saving : imp.create}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
