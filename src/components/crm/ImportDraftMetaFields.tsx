"use client";

import { memo, useCallback, useEffect, useState } from "react";

type Meta = {
  clientName: string;
  phone: string;
  email: string;
  plate: string;
  vin: string;
  mileage: string;
  make: string;
  model: string;
};

type Labels = {
  sectionClient: string;
  sectionVehicle: string;
  clientName: string;
  phone: string;
  plate: string;
  makePlaceholder: string;
  modelLabel: string;
  mileage: string;
};

function MetaInput({
  label,
  value,
  onCommit,
  type = "text",
  className = "input-premium mt-1",
  placeholder,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
  type?: string;
  className?: string;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <label className="block">
      <span className="text-xs text-bm-muted uppercase">{label}</span>
      <input
        className={className}
        type={type}
        placeholder={placeholder}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== value) onCommit(local);
        }}
      />
    </label>
  );
}

export const ImportDraftMetaFields = memo(function ImportDraftMetaFields({
  meta,
  labels,
  onPatch,
}: {
  meta: Meta;
  labels: Labels;
  onPatch: (patch: Partial<Meta>) => void;
}) {
  const commit = useCallback((key: keyof Meta, v: string) => onPatch({ [key]: v }), [onPatch]);

  return (
    <>
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase text-bm-red">{labels.sectionClient}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <MetaInput
              label={labels.clientName}
              value={meta.clientName}
              onCommit={(v) => commit("clientName", v)}
            />
          </div>
          <MetaInput
            label={`${labels.phone} *`}
            value={meta.phone}
            onCommit={(v) => commit("phone", v)}
          />
          <MetaInput
            label="E-mail"
            value={meta.email}
            type="email"
            onCommit={(v) => commit("email", v)}
          />
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase text-bm-red">{labels.sectionVehicle}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetaInput
            label={labels.plate}
            value={meta.plate}
            onCommit={(v) => commit("plate", v)}
          />
          <MetaInput
            label="VIN"
            value={meta.vin}
            className="input-premium mt-1 font-mono text-xs"
            onCommit={(v) => commit("vin", v)}
          />
          <MetaInput
            label={labels.mileage}
            value={meta.mileage}
            type="number"
            onCommit={(v) => commit("mileage", v)}
          />
          <MetaInput
            label={labels.makePlaceholder}
            value={meta.make}
            placeholder={labels.makePlaceholder}
            onCommit={(v) => commit("make", v)}
          />
          <div className="col-span-2 sm:col-span-3">
            <MetaInput
              label={labels.modelLabel}
              value={meta.model}
              onCommit={(v) => commit("model", v)}
            />
          </div>
        </div>
      </section>
    </>
  );
});

export function metaFromDraft(draft: {
  clientName?: string;
  phone?: string;
  email?: string;
  plate?: string;
  vin?: string;
  mileage?: number;
  make?: string;
  model?: string;
}): Meta {
  return {
    clientName: draft.clientName ?? "",
    phone: draft.phone ?? "",
    email: draft.email ?? "",
    plate: draft.plate ?? "",
    vin: draft.vin ?? "",
    mileage: draft.mileage != null && draft.mileage > 0 ? String(draft.mileage) : "",
    make: draft.make ?? "",
    model: draft.model ?? "",
  };
}

export function applyMetaToDraft<T extends { mileage?: number }>(
  draft: T,
  meta: Meta
): T & {
  clientName: string;
  phone: string;
  email?: string;
  plate?: string;
  vin?: string;
  make?: string;
  model?: string;
  mileage?: number;
} {
  return {
    ...draft,
    clientName: meta.clientName.trim(),
    phone: meta.phone.trim(),
    email: meta.email.trim() || undefined,
    plate: meta.plate.trim() || undefined,
    vin: meta.vin.trim() || undefined,
    make: meta.make.trim() || undefined,
    model: meta.model.trim() || undefined,
    mileage: meta.mileage.trim() ? Number(meta.mileage) : undefined,
  };
}

export type { Meta };
