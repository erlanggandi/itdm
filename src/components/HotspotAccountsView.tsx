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
  Wifi,
  X,
  Save,
} from 'lucide-react';
import {
  HotspotAccount,
  Employee,
  HotspotStatus,
  AppSettings,
} from '../types';
import { exportHotspotsCsv } from '../services/exportCsv';
import { exportHotspotsReportPdf } from '../services/exportPdf';
import { generatePassword, generateHotspotPin } from '../services/passwordGenerator';
import {
  HotspotImportRow,
  downloadHotspotsTemplate,
  parseHotspotsCsv,
} from '../services/importCsv';
import { ImportModal } from './ImportModal';
import { ExportMenu } from './ExportMenu';
import { Pagination } from './Pagination';

interface HotspotAccountsViewProps {
  hotspots: HotspotAccount[];
  employees: Employee[];
  settings: AppSettings;
  onCreateHotspot: (data: Omit<HotspotAccount, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateHotspot: (id: string, data: Partial<HotspotAccount>) => Promise<void>;
  onDeleteHotspot: (id: string) => Promise<void>;
  onBulkCreateHotspots: (rows: HotspotImportRow[]) => Promise<number>;
  onOpenCredentialSlip: (employee: Employee, emailAccount?: any, hotspotAccount?: HotspotAccount) => void;
  onOpenMikrotikModal: () => void;
  onNotice: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const DEFAULT_PROFILES = [
  'Staff-5Mbps',
  'Supervisor-10Mbps',
  'Management-20Mbps',
  'IT-Unlimited',
  'Guest-2Mbps',
];

export const HotspotAccountsView: React.FC<HotspotAccountsViewProps> = ({
  hotspots,
  employees,
  settings,
  onCreateHotspot,
  onUpdateHotspot,
  onDeleteHotspot,
  onBulkCreateHotspots,
  onOpenCredentialSlip,
  onOpenMikrotikModal,
  onNotice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHotspot, setEditingHotspot] = useState<HotspotAccount | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    username: '',
    password: '',
    ssid: settings.defaultSsid || 'KANGODING-CORP',
    profile: settings.defaultHotspotProfile || 'Staff-5Mbps',
    macAddress: '',
    ipAddress: '',
    validUntil: 'Unlimited',
    status: 'Aktif' as HotspotStatus,
    notes: '',
  });

  const empMap = useMemo(() => {
    return new Map(employees.map(e => [e.id, e]));
  }, [employees]);

  // Index untuk validasi import: username terdaftar + nama -> id karyawan
  const existingUsernames = useMemo(() => {
    return new Set(hotspots.map(h => h.username.toLowerCase()));
  }, [hotspots]);

  const nameToId = useMemo(() => {
    return new Map(employees.map(e => [e.name.toLowerCase(), e.id]));
  }, [employees]);

  // Unique Profiles
  const uniqueProfiles = useMemo(() => {
    const set = new Set([...DEFAULT_PROFILES, ...hotspots.map(h => h.profile)]);
    return Array.from(set);
  }, [hotspots]);

  // Filtered List
  const filteredHotspots = useMemo(() => {
    return hotspots.filter(h => {
      const emp = empMap.get(h.employeeId);
      const search = searchTerm.toLowerCase();

      const matchSearch =
        h.username.toLowerCase().includes(search) ||
        h.ssid.toLowerCase().includes(search) ||
        (h.macAddress && h.macAddress.toLowerCase().includes(search)) ||
        (emp && emp.name.toLowerCase().includes(search)) ||
        (emp && emp.department.toLowerCase().includes(search));

      const matchProfile = selectedProfile === 'ALL' || h.profile === selectedProfile;
      const matchStatus = selectedStatus === 'ALL' || h.status === selectedStatus;

      return matchSearch && matchProfile && matchStatus;
    });
  }, [hotspots, empMap, searchTerm, selectedProfile, selectedStatus]);

  // Kembali ke halaman 1 setiap filter berubah
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedProfile, selectedStatus]);

  // Paginasi
  const totalPages = Math.max(1, Math.ceil(filteredHotspots.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedHotspots = filteredHotspots.slice((safePage - 1) * pageSize, safePage * pageSize);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onNotice('Disalin.', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAdd = () => {
    setEditingHotspot(null);
    const newPin = generateHotspotPin(6);
    setFormData({
      employeeId: employees[0]?.id || '',
      username: '',
      password: newPin,
      ssid: settings.defaultSsid || 'KANGODING-CORP',
      profile: settings.defaultHotspotProfile || 'Staff-5Mbps',
      macAddress: '',
      ipAddress: '',
      validUntil: 'Unlimited',
      status: 'Aktif',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (hs: HotspotAccount) => {
    setEditingHotspot(hs);
    setFormData({
      employeeId: hs.employeeId,
      username: hs.username,
      password: hs.password,
      ssid: hs.ssid,
      profile: hs.profile,
      macAddress: hs.macAddress || '',
      ipAddress: hs.ipAddress || '',
      validUntil: hs.validUntil || 'Unlimited',
      status: hs.status,
      notes: hs.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, username: string) => {
    if (confirm(`Hapus "${username}"?`)) {
      await onDeleteHotspot(id);
      onNotice(`"${username}" dihapus.`, 'info');
    }
  };

  const handleGeneratePin = () => {
    const pin = generateHotspotPin(6);
    setFormData(prev => ({ ...prev, password: pin }));
  };

  const handleGenerateAlphaPwd = () => {
    const pwd = generatePassword({ length: 10, includeSymbols: false });
    setFormData(prev => ({ ...prev, password: pwd }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim()) {
      onNotice('Username dan password wajib diisi.', 'error');
      return;
    }

    try {
      if (editingHotspot) {
        await onUpdateHotspot(editingHotspot.id, formData);
        onNotice(`"${formData.username}" disimpan.`, 'success');
      } else {
        await onCreateHotspot(formData);
        onNotice(`"${formData.username}" ditambahkan.`, 'success');
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
          <h2 className="page-title">Hotspot</h2>
          <p className="page-sub">
            {hotspots.length} akun · <span className="font-mono">{settings.defaultSsid}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportMenu
            items={[
              {
                label: 'CSV',
                hint: 'username, ssid, profil',
                onClick: () => {
                  exportHotspotsCsv(hotspots, employees);
                  onNotice('CSV hotspot diunduh.', 'success');
                },
              },
              {
                label: 'PDF',
                hint: 'laporan tabel',
                onClick: () => {
                  exportHotspotsReportPdf(hotspots, employees, settings);
                  onNotice('PDF hotspot diunduh.', 'success');
                },
              },
              {
                label: '.rsc MikroTik',
                hint: 'pratinjau script RouterOS',
                mono: true,
                onClick: onOpenMikrotikModal,
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
            placeholder="Cari username, SSID, MAC…"
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
          value={selectedProfile}
          onChange={(e) => setSelectedProfile(e.target.value)}
          className="field md:!w-44"
          aria-label="Filter profil"
        >
          <option value="ALL">Semua profil</option>
          {uniqueProfiles.map(p => (
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
          <option value="Disabled">Disabled</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full tbl">
            <thead className="border-b border-zinc-200">
              <tr>
                <th>Username</th>
                <th>Pemilik</th>
                <th>Password</th>
                <th>SSID</th>
                <th>Profil</th>
                <th>MAC / IP</th>
                <th>Status</th>
                <th><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredHotspots.length === 0 ? (
                <tr>
                  <td colSpan={8} className="!py-10 text-center text-zinc-400">
                    Tidak ada hasil untuk filter ini.
                  </td>
                </tr>
              ) : (
                pagedHotspots.map((hs) => {
                  const emp = empMap.get(hs.employeeId);
                  const isVisible = visiblePasswords[hs.id] || false;
                  const isCopied = copiedId === hs.id;

                  return (
                    <tr key={hs.id}>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className="mono-data font-medium select-all">
                            {hs.username}
                          </span>
                          <button
                            onClick={() => handleCopy(`user-${hs.id}`, hs.username)}
                            title="Salin"
                            className="icon-btn !p-1"
                          >
                            {copiedId === `user-${hs.id}` ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {hs.validUntil && hs.validUntil !== 'Unlimited' && (
                          <span className="font-mono text-[11px] text-zinc-400 block">
                            exp {hs.validUntil}
                          </span>
                        )}
                      </td>

                      <td>
                        {emp ? (
                          <span className="text-zinc-800 block">{emp.name}</span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>

                      <td>
                        <div className="flex items-center gap-1">
                          <code className="bg-zinc-50 px-2 py-1 rounded-md text-zinc-800 select-all border border-zinc-200 font-mono text-xs">
                            {isVisible ? hs.password : '••••••••'}
                          </code>
                          <button
                            onClick={() => togglePasswordVisibility(hs.id)}
                            title={isVisible ? 'Sembunyikan' : 'Lihat'}
                            className="icon-btn !p-1"
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopy(hs.id, hs.password)}
                            title="Salin"
                            className="icon-btn !p-1"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td>
                        <span className="inline-flex items-center gap-1.5 text-zinc-800">
                          <Wifi className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.75} />
                          {hs.ssid}
                        </span>
                      </td>

                      <td className="font-mono text-xs text-zinc-600 whitespace-nowrap">
                        {hs.profile}
                      </td>

                      <td className="font-mono text-[11px] text-zinc-500">
                        {hs.macAddress ? (
                          <span className="block select-all">{hs.macAddress}</span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                        {hs.ipAddress && (
                          <span className="text-zinc-400 block select-all">{hs.ipAddress}</span>
                        )}
                      </td>

                      <td>
                        <span className="status">
                          <span
                            className={`dot ${
                              hs.status === 'Aktif'
                                ? 'bg-emerald-500'
                                : hs.status === 'Disabled'
                                ? 'bg-amber-500'
                                : 'bg-zinc-300'
                            }`}
                          />
                          {hs.status}
                        </span>
                      </td>

                      <td className="text-right whitespace-nowrap">
                        {emp && (
                          <button
                            onClick={() => onOpenCredentialSlip(emp, undefined, hs)}
                            title="Slip kredensial"
                            className="icon-btn"
                          >
                            <FileText className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(hs)}
                          title="Ubah"
                          className="icon-btn"
                        >
                          <Edit3 className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                        <button
                          onClick={() => handleDelete(hs.id, hs.username)}
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
          total={filteredHotspots.length}
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
        <ImportModal<HotspotImportRow>
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          title="Import akun hotspot"
          subtitle="CSV · nama diisi untuk menautkan ke karyawan, password kosong = PIN 6 digit otomatis"
          formatHint="nama, username, password, ssid, profil, mac, ip, berlaku, status, catatan"
          entityName="akun hotspot"
          parse={(text) => parseHotspotsCsv(text, {
            existingUsernames,
            nameToId,
            defaultSsid: settings.defaultSsid,
            defaultProfile: settings.defaultHotspotProfile,
          })}
          columns={[
            { label: 'Username', mono: true, render: (d) => d.username || '—' },
            { label: 'Password', mono: true, render: (d) => d.password || '—' },
            { label: 'SSID', render: (d) => d.ssid || '—' },
            { label: 'Profil', mono: true, render: (d) => d.profile || '—' },
          ]}
          onDownloadTemplate={downloadHotspotsTemplate}
          onConfirm={onBulkCreateHotspots}
          onNotice={onNotice}
        />
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-shell max-w-xl">
            <div className="modal-head">
              <h3 className="modal-title">
                {editingHotspot ? 'Ubah akun hotspot' : 'Hotspot baru'}
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
                      username: prev.username || (emp ? emp.name.toLowerCase().replace(/[^a-z0-9]/g, '.') : ''),
                    }));
                  }}
                  className="field"
                >
                  <option value="">— Tanpa pemilik —</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="lbl">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="field font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="lbl !mb-0">Password</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleGeneratePin}
                      className="text-xs font-medium text-zinc-900 underline underline-offset-2 decoration-zinc-300 hover:decoration-zinc-900"
                    >
                      PIN 6 digit
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateAlphaPwd}
                      className="text-xs font-medium text-zinc-900 underline underline-offset-2 decoration-zinc-300 hover:decoration-zinc-900"
                    >
                      Acak
                    </button>
                  </div>
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
                  <label className="lbl">SSID</label>
                  <input
                    type="text"
                    required
                    value={formData.ssid}
                    onChange={(e) => setFormData({ ...formData, ssid: e.target.value })}
                    className="field"
                  />
                </div>

                <div>
                  <label className="lbl">Profil</label>
                  <select
                    value={formData.profile}
                    onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                    className="field"
                  >
                    {DEFAULT_PROFILES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="lbl">MAC binding</label>
                  <input
                    type="text"
                    value={formData.macAddress}
                    onChange={(e) => setFormData({ ...formData, macAddress: e.target.value.toUpperCase() })}
                    className="field font-mono"
                    placeholder="—"
                  />
                </div>

                <div>
                  <label className="lbl">IP statis</label>
                  <input
                    type="text"
                    value={formData.ipAddress}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                    className="field font-mono"
                    placeholder="—"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="lbl">Berlaku hingga</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      className="field"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, validUntil: 'Unlimited' })}
                      className="btn btn-ghost !px-2.5"
                      title="Tanpa batas"
                    >
                      ∞
                    </button>
                  </div>
                </div>

                <div>
                  <label className="lbl">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as HotspotStatus })}
                    className="field"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Disabled">Disabled</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

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
