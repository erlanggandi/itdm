import React, { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';

export interface ExportMenuItem {
  label: string;
  hint: string;
  mono?: boolean;
  onClick: () => void;
}

export const ExportMenu: React.FC<{ items: ExportMenuItem[] }> = ({ items }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open ]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="btn btn-ghost"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
        Export
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-1.5 w-60 card shadow-lg p-1 z-40">
          {items.map(item => (
            <button
              key={item.label}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              <span className={`block text-[13px] text-zinc-800 ${item.mono ? 'font-mono' : ''}`}>
                {item.label}
              </span>
              <span className="block font-mono text-[11px] text-zinc-400 mt-0.5">{item.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
