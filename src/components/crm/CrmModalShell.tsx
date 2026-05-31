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
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80"
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
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-bm-border bg-black/90 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {icon}
            <h2 className="font-display font-bold uppercase text-sm sm:text-base text-white truncate">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white shrink-0"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        {footer && (
          <div className="shrink-0 flex flex-wrap justify-end gap-2 px-4 py-3 border-t border-bm-border bg-bm-graphite/90">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
