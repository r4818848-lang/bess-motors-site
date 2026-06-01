"use client";

import { useI18n } from "@/lib/i18n/context";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
};

export function CrmTableFooter({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: Props) {
  const { t } = useI18n();
  const c = t.crm;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <div className="crm-mw-table-footer">
      <button type="button" className="crm-mw-table-settings" disabled title={c.tableSettings}>
        {c.tableSettings}
      </button>
      <div className="crm-mw-table-footer-center">
        <select
          className="crm-mw-page-size"
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
          aria-label={c.rowsPerPage}
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="crm-mw-page-info">
          {c.paginationSummary
            .replace("{from}", String(from))
            .replace("{to}", String(to))
            .replace("{total}", String(total))}
        </span>
      </div>
      <div className="crm-mw-pagination">
        <button
          type="button"
          className="crm-mw-page-btn"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label={c.prevPage}
        >
          ‹
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let p = i + 1;
          if (totalPages > 7) {
            if (safePage <= 4) p = i + 1;
            else if (safePage >= totalPages - 3) p = totalPages - 6 + i;
            else p = safePage - 3 + i;
          }
          return (
            <button
              key={p}
              type="button"
              className={`crm-mw-page-btn ${p === safePage ? "active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          );
        })}
        <button
          type="button"
          className="crm-mw-page-btn"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label={c.nextPage}
        >
          ›
        </button>
      </div>
    </div>
  );
}
