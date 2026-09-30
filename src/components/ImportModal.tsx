import React, { useState, useRef } from 'react';
import { Upload, Download, X } from 'lucide-react';
import { ParsedImportRow } from '../services/importCsv';

export interface ImportPreviewColumn<T> {
  label: string;
  mono?: boolean;
  render: (data: T) => React.ReactNode;
}

interface ImportModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  formatHint: string;
  entityName: string;
  parse: (text: string) => ParsedImportRow<T>[];
  columns: ImportPreviewColumn<T>[];
  onDownloadTemplate: () => void;
  /** Menyimpan baris valid, mengembalikan jumlah yang benar-benar tersimpan. */
  onConfirm: (rows: T[]) => Promise<number>;
  onNotice: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const MAX_PREVIEW = 200;

export function ImportModal<T>({
  isOpen,
  onClose,
  title,
  subtitle,
  formatHint,
  entityName,
  parse,
  columns,
  onDownloadTemplate,
  onConfirm,
  onNotice,
}: ImportModalProps<T>) {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedImportRow<T>[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const reset = () => {
    setFileName('');
    setRows(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parse(String(e.target?.result || ''));
        setRows(parsed);
        setError('');
        setFileName(file.name);
      } catch (err: any) {
        setRows(null);
        setError(err.message || 'File tidak dapat dibaca.');
        setFileName(file.name);
      }
    };
    reader.readAsText(file);
  };

  const valid = rows?.filter(r => r.status === 'valid') || [];
  const skipped = rows?.filter(r => r.status === 'skipped').length || 0;
  const failed = rows?.filter(r => r.status === 'error').length || 0;

  const handleConfirm = async () => {
    if (valid.length === 0) return;
    setBusy(true);
    try {
      const added = await onConfirm(valid.map(r => r.data));
      const notAdded = valid.length - added;
      let msg = `${added} ${entityName} ditambahkan.`;
      const skippedTotal = skipped + notAdded;
      if (skippedTotal > 0) msg += ` ${skippedTotal} dilewati.`;
      if (failed > 0) msg += ` ${failed} baris error.`;
      onNotice(msg, 'success');
      onClose();
    } catch (err: any) {
      onNotice('Gagal mengimpor: ' + err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-shell max-w-2xl">
        <div className="modal-head">
          <div>
            <h3 className="modal-title">{title}</h3>
            <p className="modal-sub">{subtitle}</p>
          </div>
          <button onClick={onClose} className="icon-btn" aria-label="Tutup">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <input
            type="file"
            ref={inputRef}
            accept=".csv,text/csv"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="hidden"
          />

          {/* Langkah 1: pilih file */}
          {!rows && !error && (
            <div className="space-y-3">
              <button
                onClick={() => inputRef.current?.click()}
                className="w-full border border-dashed border-zinc-300 hover:border-zinc-900 rounded-lg p-6 text-center transition-colors"
              >
                <Upload className="w-4 h-4 text-zinc-400 mx-auto" strokeWidth={1.75} />
                <span className="block text-[13px] text-zinc-700 mt-2">Pilih file .csv</span>
                <span className="block font-mono text-[11px] text-zinc-400 mt-0.5">koma / titik-koma</span>
              </button>
              <div className="flex items-center justify-between gap-3">
                <code className="font-mono text-[11px] text-zinc-400 truncate">{formatHint}</code>
                <button onClick={onDownloadTemplate} className="btn btn-ghost !text-xs flex-shrink-0">
                  <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Template
                </button>
              </div>
            </div>
          )}

          {/* File error */}
          {error && (
            <div className="space-y-3">
              <p className="font-mono text-xs text-zinc-800 truncate">{fileName}</p>
              <div className="border border-red-200 bg-red-50 rounded-lg p-3.5 text-[13px] text-red-700">
                {error}
              </div>
              <button onClick={reset} className="btn btn-ghost !text-xs">
                Pilih file lain
              </button>
            </div>
          )}

          {/* Langkah 2: pratinjau */}
          {rows && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xs text-zinc-800 truncate">{fileName}</p>
                <button onClick={reset} className="text-xs text-zinc-400 hover:text-zinc-900 flex-shrink-0">
                  Ganti file
                </button>
              </div>
              <p className="font-mono text-xs text-zinc-500 tabular-nums">
                {valid.length} siap · {skipped} dilewati · {failed} error
              </p>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full tbl">
                    <thead className="border-b border-zinc-200 sticky top-0 bg-white">
                      <tr>
                        <th>#</th>
                        {columns.map(c => (
                          <th key={c.label}>{c.label}</th>
                        ))}
                        <th>Ket</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, MAX_PREVIEW).map((r) => (
                        <tr key={r.line} className={r.status === 'error' ? '!bg-red-50/50' : ''}>
                          <td className="font-mono text-[11px] text-zinc-400">{r.line}</td>
                          {columns.map(c => (
                            <td key={c.label} className={c.mono ? 'font-mono text-xs' : ''}>
                              {c.render(r.data)}
                            </td>
                          ))}
                          <td className="whitespace-nowrap">
                            {r.status === 'valid' ? (
                              <span className="text-zinc-300">—</span>
                            ) : (
                              <span className={`text-xs ${r.status === 'error' ? 'text-red-700' : 'text-amber-700'}`}>
                                {r.message}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > MAX_PREVIEW && (
                  <div className="px-4 py-2.5 border-t border-zinc-100 text-xs text-zinc-400 font-mono">
                    +{rows.length - MAX_PREVIEW} baris lagi
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-zinc-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn btn-ghost">
            Batal
          </button>
          {rows && (
            <button
              onClick={handleConfirm}
              disabled={valid.length === 0 || busy}
              className="btn btn-primary disabled:opacity-40 disabled:pointer-events-none"
            >
              {busy ? 'Mengimpor…' : `Import ${valid.length}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
