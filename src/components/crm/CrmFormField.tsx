"use client";

import { clsx } from "clsx";

export function CrmFormLabel({
  children,
  required,
  className,
}: {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={clsx("text-[10px] uppercase tracking-widest text-bm-muted block", className)}>
      {children}
      {required && <span className="text-bm-red ml-0.5">*</span>}
    </label>
  );
}

export function CrmFormField({
  label,
  required,
  children,
  className,
}: {
  label: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <CrmFormLabel required={required}>{label}</CrmFormLabel>
      <div className="mt-1">{children}</div>
    </div>
  );
}
