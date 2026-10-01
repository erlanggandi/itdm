import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  X,
} from 'lucide-react';
import { Employee, EmailAccount, HotspotAccount, AppSettings, DashboardStats } from '../types';
import { api } from '../services/api';
import {
  exportEmployeesCsv,
  exportEmailsCsv,
  exportHotspotsCsv,
  exportMikrotikRsc,
} from '../services/exportCsv';
import {
  exportMasterReportPdf,
  exportEmailsReportPdf,
  exportHotspotsReportPdf,
} from '../services/exportPdf';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DashboardStats;
  employees: Employee[];
  emails: EmailAccount[];
  hotspots: HotspotAccount[];
  settings: AppSettings;
  onDataRefreshed: () => void;
  onNotice: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  stats,
  employees,
  emails,
  hotspots,
  settings,
  onDataRefreshed,
  onNotice,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'export' | 'reset'>('backup');
  const [restoring, setRestoring] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearConfirm, setClearConfirm] = useState('');
  const [restoreFileSummary, setRestoreFileSummary] = useState<any>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadBackup = async () => {
    try {
      await api.downloadBackupJson();
      onNotice('Backup .json diunduh.', 'success');
    } catch (err: any) {
      onNotice('Gagal mengunduh: ' + err.message, 'error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.employees || !json.emailAccounts || !json.hotspotAccounts) {
          throw new Error('Format file tidak valid.');
        }
        setParsedData(json);
        setRestoreFileSummary({
          fileName: file.name,
          employeesCount: json.employees.length,
          emailsCount: json.emailAccounts.length,
          hotspotsCount: json.hotspotAccounts.length,
        });
      } catch (err: any) {
        onNotice('File tidak valid: ' + err.message, 'error');
        setParsedData(null);
        setRestoreFileSummary(null);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!parsedData) return;
    setRestoring(true);
    try {
      const res = await api.restoreBackupJson(parsedData);
      if (res.success) {
        onNotice('Database dipulihkan.', 'success');
        setParsedData(null);
        setRestoreFileSummary(null);
        onDataRefreshed();
        onClose();
      } else {
        onNotice(res.message, 'error');
      }
    } catch (err: any) {
      onNotice('Gagal memulihkan: ' + err.message, 'error');
    } finally {
      setRestoring(false);
    }
  };

  const handleResetToDefault = async () => {
    if (confirm('Reset seluruh database ke data contoh? Perubahan Anda akan hilang.')) {
      try {
        await api.resetToSample();
        onNotice('Database direset.', 'info');
        onDataRefreshed();
        onClose();
      } catch (err: any) {
        onNotice('Gagal mereset: ' + err.message, 'error');
      }
    }
  };

  const handleClearDatabase = async () => {
    if (clearConfirm.trim().toUpperCase() !== 'HAPUS') return;
    setClearing(true);
    try {
      await api.clearDatabase();
      onNotice('Database dikosongkan.', 'info');
      setClearConfirm('');
      onDataRefreshed();
      onClose();
    } catch (err: any) {
      onNotice('Gagal mengosongkan: ' + err.message, 'error');
    } finally {
      setClearing(false);
    }
  };

  const exportRow = (label: string, sub: string, onClick: () => void) => (
    <button
      onClick={onClick}
      className="w-full py-2.5 flex items-center justify-between gap-3 text-left border-b border-zinc-100 last:border-0 group"
    >
      <span>
        <span className="block text-[13px] text-zinc-800">{label}</span>
        <span className="block font-mono text-[11px] text-zinc-400 mt-0.5">{sub}</span>
      </span>
      <Download className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-900 flex-shrink-0" strokeWidth={1.75} />
    </button>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-shell max-w-2xl">
        <div className="modal-head">
          <h3 className="modal-title">Backup & export</h3>
          <button onClick={onClose} className="icon-btn" aria-label="Tutup">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-5 px-5 border-b border-zinc-100 text-[13px]">
          {(
            [
              ['backup', 'Backup'],
              ['export', 'Export'],
              ['reset', 'Reset'],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 -mb-px border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-zinc-900 text-zinc-900 font-medium'
                  : 'border-transparent text-zinc-400 hover:text-zinc-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto">
          {activeTab === 'backup' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[13px] text-zinc-500 font-mono tabular-nums">
                  {employees.length} karyawan · {emails.length} email · {hotspots.length} hotspot
                </p>
                <button onClick={handleDownloadBackup} className="btn btn-primary">
                  <Download className="w-3.5 h-3.5" strokeWidth={2} />
                  Unduh .json
                </button>
              </div>

              <div className="pt-5 border-t border-zinc-100">
                <p className="lbl">Restore dari file .json</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!restoreFileSummary ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border border-dashed border-zinc-300 hover:border-zinc-900 rounded-lg p-6 text-center transition-colors"
                  >
                    <Upload className="w-4 h-4 text-zinc-400 mx-auto" strokeWidth={1.75} />
                    <span className="block text-[13px] text-zinc-700 mt-2">Pilih file backup</span>
                    <span className="block font-mono text-[11px] text-zinc-400 mt-0.5">backup_*.json</span>
                  </button>
                ) : (
                  <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-zinc-800 truncate">
                        {restoreFileSummary.fileName}
                      </span>
                      <button
                        onClick={() => {
                          setParsedData(null);
                          setRestoreFileSummary(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-xs text-zinc-400 hover:text-zinc-900"
                      >
                        Batal
                      </button>
                    </div>
                    <p className="font-mono text-xs text-zinc-500 tabular-nums">
                      {restoreFileSummary.employeesCount} karyawan · {restoreFileSummary.emailsCount} email ·{' '}
                      {restoreFileSummary.hotspotsCount} hotspot
                    </p>
                    <button
                      onClick={handleExecuteRestore}
                      disabled={restoring}
                      className="btn btn-primary w-full"
                    >
                      {restoring ? 'Memulihkan…' : 'Pulihkan database'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              <div>
                <p className="lbl">CSV</p>
                {exportRow('Karyawan', 'nama, departemen', () => {
                  exportEmployeesCsv(employees);
                  onNotice('CSV karyawan diunduh.', 'success');
                })}
                {exportRow('Email', 'email, password, provider', () => {
                  exportEmailsCsv(emails, employees);
                  onNotice('CSV email diunduh.', 'success');
                })}
                {exportRow('Hotspot', 'username, ssid, profil', () => {
                  exportHotspotsCsv(hotspots, employees);
                  onNotice('CSV hotspot diunduh.', 'success');
                })}
                {exportRow('MikroTik .rsc', 'RouterOS import script', () => {
                  exportMikrotikRsc(hotspots, employees);
                  onNotice('File .rsc diunduh.', 'success');
                })}
              </div>

              <div>
                <p className="lbl">PDF</p>
                {exportRow('Laporan master', 'rekap A4 landscape', () => {
                  exportMasterReportPdf(stats, employees, emails, hotspots, settings);
                  onNotice('PDF master diunduh.', 'success');
                })}
                {exportRow('Laporan email', 'provider, lisensi, 2FA', () => {
                  exportEmailsReportPdf(emails, employees, settings);
                  onNotice('PDF email diunduh.', 'success');
                })}
                {exportRow('Laporan hotspot', 'login, profil, MAC', () => {
                  exportHotspotsReportPdf(hotspots, employees, settings);
                  onNotice('PDF hotspot diunduh.', 'success');
                })}
              </div>
            </div>
          )}

          {activeTab === 'reset' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="lbl">Data contoh</p>
                <p className="text-[13px] text-zinc-600 leading-relaxed">
                  Kembalikan database ke data contoh bawaan. Seluruh perubahan akan hilang — unduh
                  backup .json terlebih dahulu bila data saat ini masih diperlukan.
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={handleResetToDefault}
                    className="btn bg-red-700 text-white hover:bg-red-800"
                  >
                    <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
                    Reset database
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-5 border-t border-zinc-100">
                <p className="lbl">Kosongkan database</p>
                <p className="text-[13px] text-zinc-600 leading-relaxed">
                  Hapus seluruh karyawan, email, dan hotspot sekaligus — untuk mulai dari nol
                  (misalnya pindah perusahaan). Pengaturan dipertahankan. Tindakan ini tidak bisa
                  dibatalkan.
                </p>
                <p className="font-mono text-xs text-zinc-500 tabular-nums">
                  {employees.length} karyawan · {emails.length} email · {hotspots.length} hotspot
                </p>
                <div className="flex items-center justify-end gap-2">
                  <input
                    type="text"
                    value={clearConfirm}
                    onChange={(e) => setClearConfirm(e.target.value)}
                    placeholder='Ketik HAPUS'
                    aria-label="Ketik HAPUS untuk konfirmasi"
                    className="field !w-32 font-mono uppercase placeholder:normal-case"
                  />
                  <button
                    onClick={handleClearDatabase}
                    disabled={clearConfirm.trim().toUpperCase() !== 'HAPUS' || clearing}
                    className="btn bg-red-700 text-white hover:bg-red-800 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {clearing ? 'Menghapus…' : 'Kosongkan'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-zinc-100 flex justify-end">
          <button onClick={onClose} className="btn btn-ghost">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
