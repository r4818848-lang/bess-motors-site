"use client";

import { useState, useRef, useMemo, useCallback, startTransition, useEffect } from "react";
import { X, FileUp, Loader2, Plus, Trash2, Info } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { staffCrmFetch, staffCrmFetchFailureReason } from "@/lib/crm-staff-fetch";
import type {
  ImportPartDraft,
  ImportServiceDraft,
  ImportWorkOrderDraft,
} from "@/lib/motowarsztat-import-parser";
import { parseWorkOrderImportText } from "@/lib/motowarsztat-import-parser";
import { normalizeImportDraftPrices } from "@/lib/import-draft-validate";
import { importFileTooLargeLabel, prepareImportUploadFile } from "@/lib/import-file-upload";
import { extractPdfTextClient, isPdfFile } from "@/lib/import-pdf-client";
import { calcPartLineProfit } from "@/lib/workorder-calc";
import { pullCrmFromCloud } from "@/lib/cloud-crm-db";
import { loadDb } from "@/lib/store";
import { acquireCrmDraftLock, releaseCrmDraftLock } from "@/lib/crm-draft-lock";
import {
  ImportDraftMetaFields,
  applyMetaToDraft,
  metaFromDraft,
  type Meta,
} from "@/components/crm/ImportDraftMetaFields";
import { Button } from "@/components/ui/Button";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (orderId: string) => void;
};

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

function applyParsedDraft(parsed: ImportWorkOrderDraft) {
  const normalized = normalizeImportDraftPrices(parsed);
  return {
    core: normalized,
    meta: metaFromDraft(normalized),
    services: normalized.services,
    parts: normalized.parts,
  };
}

export function ImportWorkOrderModal({ open, onClose, onCreated }: Props) {
  const { t, locale } = useI18n();
  const c = t.crm;
  const imp = c.importOrder;
  const fileRef = useRef<HTMLInputElement>(null);
  const parseAbortRef = useRef<AbortController | null>(null);
  const metaRef = useRef<Meta>(metaFromDraft({}));
  const lockHeldRef = useRef(false);

  const lockDraft = useCallback(() => {
    if (!lockHeldRef.current) {
      acquireCrmDraftLock();
      lockHeldRef.current = true;
    }
  }, []);

  const unlockDraft = useCallback(() => {
    if (lockHeldRef.current) {
      releaseCrmDraftLock();
      lockHeldRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      parseAbortRef.current?.abort();
      unlockDraft();
    }
  }, [open, unlockDraft]);

  const [files, setFiles] = useState<File[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [error, setError] = useState("");
  const [bulkSummary, setBulkSummary] = useState("");
  const [draftCore, setDraftCore] = useState<Omit<
    ImportWorkOrderDraft,
    keyof Meta | "services" | "parts"
  > | null>(null);
  const [meta, setMeta] = useState<Meta>(metaFromDraft({}));
  const [services, setServices] = useState<ImportServiceDraft[]>([]);
  const [parts, setParts] = useState<ImportPartDraft[]>([]);
  const [rawPreview, setRawPreview] = useState("");
  const [parsedFromImage, setParsedFromImage] = useState(false);
  const [ocrWeak, setOcrWeak] = useState(false);
  const [showLineEditor, setShowLineEditor] = useState(false);

  metaRef.current = meta;

  const hasDraft = draftCore !== null;
  const file = files[0] ?? null;
  const isBulk = files.length > 1;
  const isImageFile = Boolean(
    file && !isPdfFile(file) &&
      (file.type.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(file.name))
  );

  const reset = () => {
    parseAbortRef.current?.abort();
    parseAbortRef.current = null;
    setFiles([]);
    setUploadFile(null);
    setDraftCore(null);
    setMeta(metaFromDraft({}));
    setServices([]);
    setParts([]);
    setRawPreview("");
    setParsedFromImage(false);
    setOcrWeak(false);
    setShowLineEditor(false);
    setBulkSummary("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const loadParsed = useCallback(
    (
      parsed: ImportWorkOrderDraft,
      opts?: { fromImage?: boolean; ocrWeak?: boolean; raw?: string }
    ) => {
      const { core, meta: m, services: s, parts: p } = applyParsedDraft(parsed);
      const { services: _s, parts: _p, ...rest } = core;
      void _s;
      void _p;
      setDraftCore(rest);
      setMeta(m);
      setServices(s);
      setParts(p);
      setRawPreview(opts?.raw ?? "");
      setParsedFromImage(Boolean(opts?.fromImage));
      setOcrWeak(Boolean(opts?.ocrWeak));
      setShowLineEditor(false);
      lockDraft();
    },
    [lockDraft]
  );

  const requestClose = () => {
    if (saving || bulkImporting) return;
    parseAbortRef.current?.abort();
    unlockDraft();
    reset();
    onClose();
  };

  const runParseForFile = async (target: File) => {
    parseAbortRef.current?.abort();
    const ac = new AbortController();
    parseAbortRef.current = ac;

    setParsing(true);
    setError("");
    try {
      const prepared = await prepareImportUploadFile(target);
      if (!prepared.ok) {
        setError(importFileTooLargeLabel(locale === "ru" ? "ru" : "pl"));
        return;
      }
      if (ac.signal.aborted) return;
      setUploadFile(prepared.file);

      if (isPdfFile(prepared.file)) {
        const text = await extractPdfTextClient(prepared.file);
        if (ac.signal.aborted) return;
        if (text.replace(/\s+/g, " ").trim().length < 8) {
          setError(imp.parseFailed);
          return;
        }
        const parsed = parseWorkOrderImportText(text);
        loadParsed(parsed, { raw: text.slice(0, 4000) });
        return;
      }

      const form = new FormData();
      form.append("file", prepared.file);
      const res = await staffCrmFetch(
        "/api/crm/import-work-order",
        { method: "POST", body: form, signal: ac.signal },
        120_000
      );
      if (ac.signal.aborted) return;
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
        fromImage?: boolean;
        ocrWeak?: boolean;
      };
      loadParsed(data.parsed, {
        fromImage: data.fromImage,
        ocrWeak: data.ocrWeak,
        raw: data.rawTextPreview,
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(imp.parseFailed);
    } finally {
      setParsing(false);
    }
  };

  const handleFiles = (list: FileList | null) => {
    parseAbortRef.current?.abort();
    unlockDraft();
    const next = list ? Array.from(list) : [];
    setFiles(next);
    setUploadFile(null);
    setDraftCore(null);
    setMeta(metaFromDraft({}));
    setServices([]);
    setParts([]);
    setRawPreview("");
    setParsedFromImage(false);
    setOcrWeak(false);
    setShowLineEditor(false);
    setBulkSummary("");
    setError("");

    const single = next[0];
    if (next.length === 1 && single && isPdfFile(single)) {
      void runParseForFile(single);
    }
  };

  const runBulkImport = async () => {
    if (files.length < 2) return;
    setBulkImporting(true);
    setError("");
    setBulkSummary("");
    try {
      const form = new FormData();
      for (const f of files) {
        const prepared = await prepareImportUploadFile(f);
        if (!prepared.ok) {
          setError(importFileTooLargeLabel(locale === "ru" ? "ru" : "pl"));
          return;
        }
        form.append("files", prepared.file);
      }
      const res = await staffCrmFetch(
        "/api/crm/import-work-order/bulk",
        { method: "POST", body: form },
        300_000
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
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || imp.createFailed);
        return;
      }
      const data = (await res.json()) as {
        imported: number;
        skipped: number;
        failed: number;
        results: {
          fileName: string;
          ok: boolean;
          orderNumber?: string;
          error?: string;
          skipped?: boolean;
        }[];
      };
      setBulkSummary(
        imp.bulkDone
          .replace("{imported}", String(data.imported))
          .replace("{total}", String(files.length))
          .replace("{skipped}", String(data.skipped))
          .replace("{failed}", String(data.failed))
      );
      await pullCrmFromCloud({ force: true });
      const lastOk = [...data.results]
        .reverse()
        .find((r) => r.ok && r.orderNumber && !r.skipped);
      if (lastOk?.orderNumber) {
        const fresh = loadDb();
        const order = fresh.workOrders.find((o) => o.number === lastOk.orderNumber);
        if (order) onCreated(order.id);
      }
    } catch {
      setError(imp.createFailed);
    } finally {
      setBulkImporting(false);
    }
  };

  const updateService = (index: number, patch: Partial<ImportServiceDraft>) => {
    startTransition(() => {
      setServices((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    });
  };

  const updatePart = (index: number, patch: Partial<ImportPartDraft>) => {
    startTransition(() => {
      setParts((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
    });
  };

  const onMetaPatch = useCallback((patch: Partial<Meta>) => {
    setMeta((prev) => ({ ...prev, ...patch }));
  }, []);

  const partsProfitPreview = useMemo(
    () =>
      parts.reduce((sum, p) => {
        const qty = p.qty || 1;
        const unitSell = p.sellPrice / qty;
        return (
          sum +
          calcPartLineProfit({
            id: "",
            name: p.name,
            qty,
            purchasePrice: p.purchasePrice,
            sellPrice: unitSell,
            discount: 0,
          })
        );
      }, 0),
    [parts]
  );

  const buildDraftForSave = (): ImportWorkOrderDraft | null => {
    if (!draftCore) return null;
    const m = metaRef.current;
    return applyMetaToDraft(
      { ...draftCore, services, parts } as ImportWorkOrderDraft,
      m
    );
  };

  const handleCreate = async () => {
    if (!draftCore || !file) return;
    const draft = buildDraftForSave();
    if (!draft?.phone?.trim()) {
      setError(imp.phoneRequired);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const source = uploadFile ?? file;
      const prepared = await prepareImportUploadFile(source);
      if (!prepared.ok) {
        setError(importFileTooLargeLabel(locale === "ru" ? "ru" : "pl"));
        return;
      }
      const form = new FormData();
      form.append("file", prepared.file);
      form.append("draft", JSON.stringify(draft));
      const res = await staffCrmFetch(
        "/api/crm/import-work-order/create",
        { method: "POST", body: form },
        120_000
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
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (data.error === "already_exists") {
          setError(imp.alreadyExists ?? imp.createFailed);
          return;
        }
        if (data.error === "client_vehicle_required") {
          setError(imp.vehicleLinkFailed ?? imp.createFailed);
          return;
        }
        setError(
          data.error === "phone_required" ? imp.phoneRequired : imp.createFailed
        );
        return;
      }
      const data = (await res.json()) as { orderId: string };
      unlockDraft();
      reset();
      onCreated(data.orderId);
      onClose();
      void pullCrmFromCloud({ force: true });
    } catch {
      setError(imp.createFailed);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const metaLabels = {
    sectionClient: imp.sectionClient,
    sectionVehicle: imp.sectionVehicle,
    clientName: imp.clientName,
    phone: imp.phone,
    plate: imp.plate,
    makePlaceholder: imp.makePlaceholder,
    modelLabel: imp.modelLabel,
    mileage: c.mileage,
  };

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
            multiple
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => fileRef.current?.click()}
            disabled={parsing || saving || bulkImporting}
          >
            {files.length === 0
              ? imp.pickFiles
              : files.length === 1
                ? files[0]!.name
                : `${files.length} PDF`}
          </Button>

          {isBulk && !hasDraft && (
            <Button
              type="button"
              className="w-full"
              disabled={bulkImporting}
              onClick={() => void runBulkImport()}
            >
              {bulkImporting ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> {imp.importingAll}
                </>
              ) : (
                imp.importAll
              )}
            </Button>
          )}

          {!hasDraft && !isBulk && file && isImageFile && (
            <Button
              type="button"
              className="w-full"
              disabled={parsing}
              onClick={() => void runParseForFile(file)}
            >
              {parsing ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> {imp.parsingPhoto}
                </>
              ) : (
                imp.analyze
              )}
            </Button>
          )}

          {parsing && !hasDraft && file && isPdfFile(file) && (
            <p className="text-sm text-bm-muted flex items-center gap-2">
              <Loader2 className="animate-spin" size={18} /> {imp.parsing}
            </p>
          )}

          {!hasDraft && isImageFile && file && !parsing && (
            <p className="text-xs text-bm-muted">{imp.preferPdf}</p>
          )}

          {hasDraft && draftCore && (
            <div className="space-y-4 text-sm">
              {draftCore.orderNumber && (
                <p className="text-xs font-medium">{draftCore.orderNumber}</p>
              )}

              <p
                className={`text-xs ${
                  ocrWeak || parsedFromImage ? "text-amber-700" : "text-emerald-700"
                }`}
              >
                {ocrWeak
                  ? imp.ocrWeakHint
                  : parsedFromImage
                    ? imp.parsedFromImage
                    : imp.parsedFromPdf}
              </p>

              {!showLineEditor && (services.length > 0 || parts.length > 0) && (
                <div className="text-xs space-y-1 rounded-lg border border-bm-border/40 p-3 bg-bm-graphite/20">
                  {services.slice(0, 6).map((s, i) => (
                    <div key={`s-${i}`} className="flex justify-between gap-2">
                      <span className="truncate">{s.name}</span>
                      <span className="shrink-0 tabular-nums">{s.price.toFixed(2)} zł</span>
                    </div>
                  ))}
                  {parts.slice(0, 4).map((p, i) => (
                    <div key={`p-${i}`} className="flex justify-between gap-2 text-bm-muted">
                      <span className="truncate">{p.name}</span>
                      <span className="shrink-0 tabular-nums">{p.sellPrice.toFixed(2)} zł</span>
                    </div>
                  ))}
                  {(services.length > 6 || parts.length > 4) && <p className="text-bm-muted">…</p>}
                  <button
                    type="button"
                    className="text-bm-red text-xs mt-1"
                    onClick={() => setShowLineEditor(true)}
                  >
                    {imp.editLines}
                  </button>
                </div>
              )}

              <ImportDraftMetaFields meta={meta} labels={metaLabels} onPatch={onMetaPatch} />

              {showLineEditor && (
                <>
                  <section className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-semibold uppercase text-bm-red">
                        {imp.servicesDetected} ({services.length})
                      </h3>
                      <button
                        type="button"
                        className="text-xs text-bm-red flex items-center gap-1"
                        onClick={() =>
                          setServices((prev) => [...prev, { name: "", qty: 1, price: 0 }])
                        }
                      >
                        <Plus size={14} /> {imp.addService}
                      </button>
                    </div>
                    <div className="overflow-x-auto border border-bm-border/40 rounded-lg max-h-48 overflow-y-auto">
                      <table className="w-full text-xs min-w-[480px]">
                        <thead className="sticky top-0 bg-bm-graphite z-10">
                          <ImportTableHeader cols={[c.name, c.qty, imp.lineTotalBrutto]} />
                        </thead>
                        <tbody>
                          {services.map((s, i) => (
                            <tr key={i} className="border-b border-bm-border/20 last:border-0">
                              <td className="p-1">
                                <input
                                  className="input-premium text-xs w-full min-w-[120px]"
                                  defaultValue={s.name}
                                  key={`sn-${i}-${s.name.slice(0, 8)}`}
                                  onBlur={(e) => updateService(i, { name: e.target.value })}
                                />
                              </td>
                              <td className="p-1">
                                <input
                                  type="number"
                                  min={1}
                                  className="input-premium text-xs w-12"
                                  defaultValue={s.qty}
                                  key={`sq-${i}-${s.qty}`}
                                  onBlur={(e) =>
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
                                  defaultValue={s.price}
                                  key={`sp-${i}-${s.price}`}
                                  onBlur={(e) =>
                                    updateService(i, { price: Number(e.target.value) || 0 })
                                  }
                                />
                              </td>
                              <td className="p-1">
                                <button
                                  type="button"
                                  className="text-bm-muted hover:text-bm-red"
                                  onClick={() => setServices((prev) => prev.filter((_, j) => j !== i))}
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
                        {imp.partsDetected} ({parts.length})
                      </h3>
                      <button
                        type="button"
                        className="text-xs text-bm-red flex items-center gap-1"
                        onClick={() =>
                          setParts((prev) => [
                            ...prev,
                            { name: "", qty: 1, purchasePrice: 0, sellPrice: 0 },
                          ])
                        }
                      >
                        <Plus size={14} /> {imp.addPart}
                      </button>
                    </div>
                    <div className="overflow-x-auto border border-bm-border/40 rounded-lg max-h-48 overflow-y-auto">
                      <table className="w-full text-xs min-w-[560px]">
                        <thead className="sticky top-0 bg-bm-graphite z-10">
                          <ImportTableHeader
                            cols={[
                              c.name,
                              c.qty,
                              `${c.purchasePrice} (${c.brutto})`,
                              imp.lineTotalBrutto,
                            ]}
                          />
                        </thead>
                        <tbody>
                          {parts.map((p, i) => (
                            <tr key={i} className="border-b border-bm-border/20 last:border-0">
                              <td className="p-1">
                                <input
                                  className="input-premium text-xs w-full min-w-[100px]"
                                  defaultValue={p.name}
                                  key={`pn-${i}-${p.name.slice(0, 8)}`}
                                  onBlur={(e) => updatePart(i, { name: e.target.value })}
                                />
                              </td>
                              <td className="p-1">
                                <input
                                  type="number"
                                  min={1}
                                  className="input-premium text-xs w-12"
                                  defaultValue={p.qty}
                                  key={`pq-${i}-${p.qty}`}
                                  onBlur={(e) =>
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
                                  defaultValue={p.purchasePrice}
                                  key={`pp-${i}-${p.purchasePrice}`}
                                  onBlur={(e) =>
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
                                  defaultValue={p.sellPrice}
                                  key={`ps-${i}-${p.sellPrice}`}
                                  onBlur={(e) =>
                                    updatePart(i, { sellPrice: Number(e.target.value) || 0 })
                                  }
                                />
                              </td>
                              <td className="p-1">
                                <button
                                  type="button"
                                  className="text-bm-muted hover:text-bm-red"
                                  onClick={() => setParts((prev) => prev.filter((_, j) => j !== i))}
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
                    {parts.length > 0 && (
                      <p className="text-xs text-green-500">
                        {imp.estimatedPartsProfit}: +{partsProfitPreview.toFixed(2)} zł
                      </p>
                    )}
                  </section>

                  <button
                    type="button"
                    className="text-xs text-bm-muted"
                    onClick={() => setShowLineEditor(false)}
                  >
                    {imp.hideLines}
                  </button>
                </>
              )}

              <p className="text-xs text-bm-muted flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                {imp.afterCreateHint}
              </p>

              <details className="text-xs">
                <summary className="cursor-pointer text-bm-muted">{imp.rawText}</summary>
                <pre className="mt-2 p-2 bg-bm-graphite/50 rounded text-[10px] whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {rawPreview}
                </pre>
              </details>
            </div>
          )}

          {bulkSummary && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              {bulkSummary}
            </p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {hasDraft && (
          <div className="crm-mw-modal-footer shrink-0 flex gap-2 p-4 border-t border-bm-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                unlockDraft();
                reset();
              }}
              disabled={saving}
            >
              {imp.back}
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={saving}
              onMouseDown={() => {
                (document.activeElement as HTMLElement | null)?.blur?.();
              }}
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
