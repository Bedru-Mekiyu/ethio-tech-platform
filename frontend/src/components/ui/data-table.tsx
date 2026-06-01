import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ChevronsUpDown, ArrowUpDown } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  pageSize?: number;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  pageSize = 10,
  className,
  emptyMessage = "No data found",
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className={cn("flex flex-col", className)} role="region" aria-label="Data table">
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-left text-sm" role="table">
          <thead>
            <tr className="border-b border-[var(--border)] bg-white/[0.02]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]",
                    col.sortable && "cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors duration-150",
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                  scope="col"
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      sortKey === col.key ? (
                        <ArrowUpDown size={13} className="text-primary" />
                      ) : (
                        <ChevronsUpDown size={13} className="opacity-40" />
                      )
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-[var(--text-muted)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="border-b border-[var(--border)] last:border-0 transition-colors duration-150 hover:bg-white/[0.02]"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 text-[var(--text-secondary)]", col.className)}>
                      {col.render ? col.render(item) : String(item[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between px-1" role="navigation" aria-label="Table pagination">
          <span className="text-xs text-[var(--text-muted)]">
            Page {safePage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="flex items-center justify-center rounded-lg p-2 text-[var(--text-muted)] hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 min-w-9 min-h-9"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - safePage) <= 2 || p === 1 || p === totalPages)
              .map((p, idx, arr) => (
                <span key={p} className="inline-flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-[var(--text-muted)]">...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPage(p)}
                    className={cn(
                      "flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150 min-w-9 min-h-9",
                      p === safePage
                        ? "bg-primary/10 text-primary"
                        : "text-[var(--text-muted)] hover:text-white hover:bg-white/5"
                    )}
                    aria-current={p === safePage ? "page" : undefined}
                    aria-label={`Page ${p}`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="flex items-center justify-center rounded-lg p-2 text-[var(--text-muted)] hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 min-w-9 min-h-9"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
