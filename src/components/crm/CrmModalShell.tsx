"use client";

import { X } from "lucide-react";
import { clsx } from "clsx";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
};

export function CrmModalShell({
  open,
  onClose,
  title,
  icon,
  children,
  footer,
  wide,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40"
      role="dialog"
      aria-modal
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={clsx(
          "crm-modal-panel w-full max-h-[94dvh] flex flex-col overflow-hidden safe-area-pb",
          wide ? "sm:max-w-5xl" : "sm:max-w-2xl"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="crm-mw-modal-header flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {icon}
            <h2 className="font-semibold text-sm sm:text-base truncate">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="crm-mw-modal-close shrink-0"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>
        <div className="crm-mw-modal-body">{children}</div>
        {footer && <div className="crm-mw-modal-footer shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
