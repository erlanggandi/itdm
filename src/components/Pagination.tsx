import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  total,
  pageSize,
  pageSizeOptions = [10, 25, 50],
  onPageChange,
  onPageSizeChange,
}) => {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="px-4 py-2.5 border-t border-zinc-100 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="font-mono text-[11px] text-zinc-500 border border-zinc-200 rounded-md px-1.5 py-1 bg-white outline-none focus:border-zinc-900 cursor-pointer"
          aria-label="Baris per halaman"
        >
          {pageSizeOptions.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <span className="text-xs text-zinc-400 font-mono tabular-nums">
          {from}–{to} dari {total}
        </span>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="icon-btn disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-mono text-[11px] text-zinc-500 tabular-nums px-1.5">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="icon-btn disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
