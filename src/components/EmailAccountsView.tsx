import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Upload,
  FileText,
  Edit3,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  X,
  Save,
} from 'lucide-react';
import {
  EmailAccount,
  Employee,
  EmailProvider,
  EmailStatus,
  AppSettings,
} from '../types';
import { exportEmailsCsv } from '../services/exportCsv';
import { exportEmailsReportPdf } from '../services/exportPdf';
import { generatePassword } from '../services/passwordGenerator';
import {
  EmailImportRow,
  downloadEmailsTemplate,
  parseEmailsCsv,
} from '../services/importCsv';
import { ImportModal } from './ImportModal';
import { ExportMenu } from './ExportMenu';
import { Pagination } from './Pagination';

interface EmailAccountsViewProps {
  emails: EmailAccount[];
  employees: Employee[];
  settings: AppSettings;
  onCreateEmail: (data: Omit<EmailAccount, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateEmail: (id: string, data: Partial<EmailAccount>) => Promise<void>;
  onDeleteEmail: (id: string) => Promise<void>;
  onBulkCreateEmails: (rows: EmailImportRow[]) => Promise<number>;
  onOpenCredentialSlip: (employee: Employee, emailAccount: EmailAccount) => void;
  onNotice: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const PROVIDERS: EmailProvider[] = [
  'Google Workspace',
  'Microsoft 365',
  'Zimbra Mail',
  'cPanel / Webmail',
  'Zoho Mail',
  'Custom IMAP/POP3',
];

export const EmailAccountsView: React.FC<EmailAccountsViewProps> = ({
  emails,
  employees,
  settings,
  onCreateEmail,
  onUpdateEmail,
  onDeleteEmail,
  onBulkCreateEmails,
  onOpenCredentialSlip,
  onNotice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<EmailAccount | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    email: '',
    password: '',
    provider: 'Google Workspace' as EmailProvider,
    licenseType: 'Business Starter',
    quotaGB: 30,
    usedGB: 0,
    twoFactorEnabled: false,
    recoveryContact: '',
    forwardTo: '',
    status: 'Aktif' as EmailStatus,
    lastPasswordReset: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const empMap = useMemo(() => {
    return new Map(employees.map(e => [e.id, e]));
  }, [employees]);

  // Index untuk validasi import: email terdaftar + NIK -> id karyawan
  const existingEmails = useMemo(() => {
    return new Set(emails.map(m => m.email.toLowerCase()));
  }, [emails]);

  const nikToId = useMemo(() => {
    return new Map(employees.map(e => [e.nik.toLowerCase(), e.id]));
  }, [employees]);

  // Filtered List
  const filteredEmails = useMemo(() => {
    return emails.filter(m => {
      const emp = empMap.get(m.employeeId);
      const search = searchTerm.toLowerCase();

      const matchSearch =
        m.email.toLowerCase().includes(search) ||
        (emp && emp.name.toLowerCase().includes(search)) ||
        (emp && emp.nik.toLowerCase().includes(search)) ||
        (emp && emp.department.toLowerCase().includes(search)) ||
        (m.notes && m.notes.toLowerCase().includes(search));

      const matchProvider = selectedProvider === 'ALL' || m.provider === selectedProvider;
      const matchStatus = selectedStatus === 'ALL' || m.status === selectedStatus;

      return matchSearch && matchProvider && matchStatus;
    });
  }, [emails, empMap, searchTerm, selectedProvider, selectedStatus]);

  // Kembali ke halaman 1 setiap filter berubah
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedProvider, selectedStatus]);

  // Paginasi
  const totalPages = Math.max(1, Math.ceil(filteredEmails.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedEmails = filteredEmails.slice((safePage - 1) * pageSize, safePage * pageSize);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyPassword = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onNotice('Disalin.', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAdd = () => {
    setEditingEmail(null);
    const newPwd = generatePassword({ length: 14 });
    setFormData({
      employeeId: employees[0]?.id || '',
      email: '',
      password: newPwd,
      provider: 'Google Workspace',
      licenseType: 'Business Starter',
      quotaGB: 30,
      usedGB: 0,
      twoFactorEnabled: true,
      recoveryContact: '',
      forwardTo: '',
      status: 'Aktif',
      lastPasswordReset: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mail: EmailAccount) => {
    setEditingEmail(mail);
    setFormData({
      employeeId: mail.employeeId,
      email: mail.email,
      password: mail.password,
      provider: mail.provider,
      licenseType: mail.licenseType,
      quotaGB: mail.quotaGB,
      usedGB: mail.usedGB,
      twoFactorEnabled: mail.twoFactorEnabled,
      recoveryContact: mail.recoveryContact || '',
      forwardTo: mail.forwardTo || '',
      status: mail.status,
      lastPasswordReset: mail.lastPasswordReset,
      notes: mail.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, email: string) => {
    if (confirm(`Hapus "${email}"?`)) {
      await onDeleteEmail(id);
      onNotice(`"${email}" dihapus.`, 'info');
    }
  };

  const handleGeneratePasswordForForm = () => {
    const pwd = generatePassword({ length: 14 });
    setFormData(prev => ({ ...prev, password: pwd }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim()) {
      onNotice('Email dan password wajib diisi.', 'error');
      return;
    }

    try {
      if (editingEmail) {
        await onUpdateEmail(editingEmail.id, formData);
        onNotice(`"${formData.email}" disimpan.`, 'success');
      } else {
        await onCreateEmail(formData);
        onNotice(`"${formData.email}" ditambahkan.`, 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      onNotice('Gagal menyimpan: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="page-title">Email</h2>
          <p className="page-sub">{emails.length} akun terdaftar</p>
        </div>

        <div className="flex items-center gap-2">
          <ExportMenu
            items={[
              {
                label: 'CSV',
                hint: 'email, password, provider',
                onClick: () => {
                  exportEmailsCsv(emails, employees);
                  onNotice('CSV email diunduh.', 'success');
                },
              },
              {
                label: 'PDF',
                hint: 'laporan tabel',
                onClick: () => {
                  exportEmailsReportPdf(emails, employees, settings);
                  onNotice('PDF email diunduh.', 'success');
                },
              },
            ]}
          />

          <button onClick={() => setIsImportOpen(true)} className="btn btn-ghost">
            <Upload className="w-3.5 h-3.5" strokeWidth={1.75} />
            Import
          </button>

          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Tambah
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari email, nama, NIK…"
            className="field !pl-9"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 icon-btn !p-1"
              aria-label="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          className="field md:!w-44"
          aria-label="Filter provider"
        >
          <option value="ALL">Semua provider</option>
          {PROVIDERS.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="field md:!w-36"
          aria-label="Filter status"
        >
          <option value="ALL">Semua status</option>
          <option value="Aktif">Aktif</option>
          <option value="Suspended">Suspended</option>
          <option value="Arsip">Arsip</option>
          <option value="Nonaktif">Nonaktif</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full tbl">
            <thead className="border-b border-zinc-200">
              <tr>
                <th>Email</th>
                <th>Pemilik</th>
                <th>Password</th>
                <th>Provider</th>
                <th>2FA</th>
                <th>Status</th>
                <th><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredEmails.length === 0 ? (
                <tr>
                  <td colSpan={7} className="!py-10 text-center text-zinc-400">
                    Tidak ada hasil untuk filter ini.
                  </td>
                </tr>
              ) : (
                pagedEmails.map((mail) => {
                  const emp = empMap.get(mail.employeeId);
                  const isVisible = visiblePasswords[mail.id] || false;
                  const isCopied = copiedId === mail.id;

                  return (
                    <tr key={mail.id}>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className="mono-data font-medium select-all">{mail.email}</span>
                          <button
                            onClick={() => handleCopyPassword(`email-${mail.id}`, mail.email)}
                            title="Salin email"
                            className="icon-btn !p-1"
                          >
                            {copiedId === `email-${mail.id}` ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {mail.forwardTo && (
                          <span className="text-[11px] text-zinc-400 block mt-0.5">
                            → {mail.forwardTo}
                          </span>
                        )}
                      </td>

                      <td>
                        {emp ? (
                          <div>
                            <span className="text-zinc-800 block">{emp.name}</span>
                            <span className="font-mono text-[11px] text-zinc-400">{emp.nik}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>

                      <td>
                        <div className="flex items-center gap-1">
                          <code className="bg-zinc-50 px-2 py-1 rounded-md text-zinc-800 select-all border border-zinc-200 font-mono text-xs">
                            {isVisible ? mail.password : '••••••••'}
                          </code>
                          <button
                            onClick={() => togglePasswordVisibility(mail.id)}
                            title={isVisible ? 'Sembunyikan' : 'Lihat'}
                            className="icon-btn !p-1"
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopyPassword(mail.id, mail.password)}
                            title="Salin"
                            className="icon-btn !p-1"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td>
                        <span className="text-zinc-800 block">{mail.provider}</span>
                        <span className="text-[11px] text-zinc-400">{mail.licenseType}</span>
                      </td>

                      <td>
                        <span className="status">
                          <span className={`dot ${mail.twoFactorEnabled ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
                          {mail.twoFactorEnabled ? 'Aktif' : 'Mati'}
                        </span>
                      </td>

                      <td>
                        <span className="status">
                          <span
                            className={`dot ${
                              mail.status === 'Aktif'
                                ? 'bg-emerald-500'
                                : mail.status === 'Suspended'
                                ? 'bg-amber-500'
                                : 'bg-zinc-300'
                            }`}
                          />
                          {mail.status}
                        </span>
                      </td>

                      <td className="text-right whitespace-nowrap">
                        {emp && (
                          <button
                            onClick={() => onOpenCredentialSlip(emp, mail)}
                            title="Slip kredensial"
                            className="icon-btn"
                          >
                            <FileText className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(mail)}
                          title="Ubah"
                          className="icon-btn"
                        >
                          <Edit3 className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                        <button
                          onClick={() => handleDelete(mail.id, mail.email)}
                          title="Hapus"
                          className="icon-btn hover:!text-red-700 hover:!bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={safePage}
          totalPages={totalPages}
          total={filteredEmails.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      </div>

      {/* Modal Import CSV */}
      {isImportOpen && (
        <ImportModal<EmailImportRow>
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          title="Import akun email"
          subtitle="CSV · NIK diisi untuk menautkan ke karyawan, password kosong = dibuatkan otomatis"
          formatHint="nik, email, password, provider, lisensi, status, 2fa, recovery, forward, catatan"
          entityName="akun email"
          parse={(text) => parseEmailsCsv(text, { existingEmails, nikToId })}
          columns={[
            { label: 'Email', mono: true, render: (d) => d.email || '—' },
            { label: 'Password', mono: true, render: (d) => d.password || '—' },
            { label: 'Provider', render: (d) => d.provider || '—' },
            { label: 'Status', render: (d) => d.status || '—' },
          ]}
          onDownloadTemplate={downloadEmailsTemplate}
          onConfirm={onBulkCreateEmails}
          onNotice={onNotice}
        />
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-shell max-w-xl">
            <div className="modal-head">
              <h3 className="modal-title">
                {editingEmail ? 'Ubah akun email' : 'Email baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="icon-btn" aria-label="Tutup">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="lbl">Pemilik</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => {
                    const empId = e.target.value;
                    const emp = empMap.get(empId);
                    setFormData(prev => ({
                      ...prev,
                      employeeId: empId,
                      email: prev.email || (emp ? `${emp.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@${settings.defaultEmailDomain}` : ''),
                    }));
                  }}
                  className="field"
                >
                  <option value="">— Tanpa pemilik —</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.nik})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="lbl">Alamat email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="field font-mono"
                  placeholder={`nama@${settings.defaultEmailDomain}`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="lbl !mb-0">Password</label>
                  <button
                    type="button"
                    onClick={handleGeneratePasswordForForm}
                    className="text-xs font-medium text-zinc-900 underline underline-offset-2 decoration-zinc-300 hover:decoration-zinc-900"
                  >
                    Acak
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="field font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="lbl">Provider</label>
                  <select
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value as EmailProvider })}
                    className="field"
                  >
                    {PROVIDERS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="lbl">Lisensi</label>
                  <input
                    type="text"
                    value={formData.licenseType}
                    onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
                    className="field"
                  />
                </div>
              </div>

              <div>
                <label className="lbl">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as EmailStatus })}
                  className="field"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Arsip">Arsip</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="lbl">Kontak recovery</label>
                  <input
                    type="text"
                    value={formData.recoveryContact}
                    onChange={(e) => setFormData({ ...formData, recoveryContact: e.target.value })}
                    className="field"
                  />
                </div>

                <div>
                  <label className="lbl">Forward ke</label>
                  <input
                    type="text"
                    value={formData.forwardTo}
                    onChange={(e) => setFormData({ ...formData, forwardTo: e.target.value })}
                    className="field"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-[13px] text-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.twoFactorEnabled}
                  onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
                  className="rounded border-zinc-300 w-4 h-4 accent-zinc-900 cursor-pointer"
                />
                2FA aktif untuk akun ini
              </label>

              <div>
                <label className="lbl">Catatan</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="field"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost"
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save className="w-3.5 h-3.5" strokeWidth={2} />
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
