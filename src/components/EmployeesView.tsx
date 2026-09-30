import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Download,
  Upload,
  Edit3,
  Trash2,
  FileText,
  Mail,
  Wifi,
  X,
  Save,
} from 'lucide-react';
import { Employee, EmailAccount, HotspotAccount, EmployeeStatus } from '../types';
import { exportEmployeesCsv } from '../services/exportCsv';
import {
  EmployeeImportRow,
  downloadEmployeesTemplate,
  parseEmployeesCsv,
} from '../services/importCsv';
import { ImportModal } from './ImportModal';
import { Pagination } from './Pagination';

interface EmployeesViewProps {
  employees: Employee[];
  emails: EmailAccount[];
  hotspots: HotspotAccount[];
  onCreateEmployee: (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
  onBulkCreateEmployees: (rows: EmployeeImportRow[]) => Promise<number>;
  onOpenCredentialSlip: (employee: Employee) => void;
  onNotice: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  employees,
  emails,
  hotspots,
  onCreateEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onBulkCreateEmployees,
  onOpenCredentialSlip,
  onNotice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    nik: '',
    name: '',
    department: 'Information Technology',
    position: '',
    phone: '',
    status: 'Aktif' as EmployeeStatus,
    joinDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  // Calculate unique departments
  const departments = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department))).filter(Boolean);
  }, [employees]);

  // Pre-index email & hotspot by employeeId
  const emailByEmpId = useMemo(() => {
    const map = new Map<string, EmailAccount>();
    emails.forEach(m => map.set(m.employeeId, m));
    return map;
  }, [emails]);

  const hotspotByEmpId = useMemo(() => {
    const map = new Map<string, HotspotAccount>();
    hotspots.forEach(h => map.set(h.employeeId, h));
    return map;
  }, [hotspots]);

  // NIK terdaftar (untuk validasi duplikat saat import)
  const existingNiks = useMemo(() => {
    return new Set(employees.map(e => e.nik.toLowerCase()));
  }, [employees]);

  // Filtered + urut abjad A-Z berdasarkan nama
  const filteredEmployees = useMemo(() => {
    return employees
      .filter(emp => {
        const matchSearch =
          emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.department.toLowerCase().includes(searchTerm.toLowerCase());

        const matchDept = selectedDept === 'ALL' || emp.department === selectedDept;
        const matchStatus = selectedStatus === 'ALL' || emp.status === selectedStatus;

        return matchSearch && matchDept && matchStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' }));
  }, [employees, searchTerm, selectedDept, selectedStatus]);

  // Kembali ke halaman 1 setiap filter berubah
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedDept, selectedStatus]);

  // Paginasi
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedEmployees = filteredEmployees.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData({
      nik: `KNG-${new Date().getFullYear()}-${String(employees.length + 1).padStart(3, '0')}`,
      name: '',
      department: departments[0] || 'Information Technology',
      position: '',
      phone: '',
      status: 'Aktif',
      joinDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      nik: emp.nik,
      name: emp.name,
      department: emp.department,
      position: emp.position,
      phone: emp.phone,
      status: emp.status,
      joinDate: emp.joinDate,
      notes: emp.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Hapus "${name}"?`)) {
      await onDeleteEmployee(id);
      onNotice(`"${name}" dihapus.`, 'info');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.nik.trim()) {
      onNotice('NIK dan nama wajib diisi.', 'error');
      return;
    }

    try {
      if (editingEmployee) {
        await onUpdateEmployee(editingEmployee.id, formData);
        onNotice(`"${formData.name}" disimpan.`, 'success');
      } else {
        await onCreateEmployee(formData);
        onNotice(`"${formData.name}" ditambahkan.`, 'success');
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
          <h2 className="page-title">Karyawan</h2>
          <p className="page-sub">
            {employees.length} orang · {departments.length} departemen
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              exportEmployeesCsv(employees);
              onNotice('CSV karyawan diunduh.', 'success');
            }}
            className="btn btn-ghost"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
            Export
          </button>

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
            placeholder="Cari nama, NIK, jabatan…"
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
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="field md:!w-48"
          aria-label="Filter departemen"
        >
          <option value="ALL">Semua departemen</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
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
          <option value="Cuti">Cuti</option>
          <option value="Resign">Resign</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full tbl">
            <thead className="border-b border-zinc-200">
              <tr>
                <th>Karyawan</th>
                <th>Departemen / Jabatan</th>
                <th>Status</th>
                <th>Akun</th>
                <th>Masuk</th>
                <th><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="!py-10 text-center text-zinc-400">
                    Tidak ada hasil untuk filter ini.
                  </td>
                </tr>
              ) : (
                pagedEmployees.map((emp) => {
                  const hasEmail = emailByEmpId.has(emp.id);
                  const hasHotspot = hotspotByEmpId.has(emp.id);

                  return (
                    <tr key={emp.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-600 font-semibold text-[13px] flex-shrink-0">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-zinc-900 block truncate">{emp.name}</span>
                            <span className="font-mono text-[11px] text-zinc-400">{emp.nik}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="text-zinc-800 block">{emp.department}</span>
                        <span className="text-xs text-zinc-400">{emp.position}</span>
                      </td>

                      <td>
                        <span className="status">
                          <span
                            className={`dot ${
                              emp.status === 'Aktif'
                                ? 'bg-emerald-500'
                                : emp.status === 'Cuti'
                                ? 'bg-amber-500'
                                : 'bg-zinc-300'
                            }`}
                          />
                          {emp.status}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center gap-2.5">
                          <span title={hasEmail ? emailByEmpId.get(emp.id)?.email : 'Tanpa email'}>
                            <Mail
                              className={`w-3.5 h-3.5 ${hasEmail ? 'text-zinc-700' : 'text-zinc-300'}`}
                              strokeWidth={1.75}
                            />
                          </span>
                          <span title={hasHotspot ? hotspotByEmpId.get(emp.id)?.username : 'Tanpa hotspot'}>
                            <Wifi
                              className={`w-3.5 h-3.5 ${hasHotspot ? 'text-zinc-700' : 'text-zinc-300'}`}
                              strokeWidth={1.75}
                            />
                          </span>
                        </div>
                      </td>

                      <td className="font-mono text-xs text-zinc-400 whitespace-nowrap">
                        {emp.joinDate || '—'}
                      </td>

                      <td className="text-right whitespace-nowrap">
                        <button
                          onClick={() => onOpenCredentialSlip(emp)}
                          title="Slip kredensial"
                          className="icon-btn"
                        >
                          <FileText className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          title="Ubah"
                          className="icon-btn"
                        >
                          <Edit3 className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, emp.name)}
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
          total={filteredEmployees.length}
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
        <ImportModal<EmployeeImportRow>
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          title="Import karyawan"
          subtitle="CSV · pratinjau dulu, NIK duplikat dilewati"
          formatHint="nik, nama, departemen, jabatan, status, tgl_masuk, catatan"
          entityName="karyawan"
          parse={(text) => parseEmployeesCsv(text, existingNiks)}
          columns={[
            { label: 'Nama', render: (d) => d.name || '—' },
            { label: 'NIK', mono: true, render: (d) => d.nik || '—' },
            { label: 'Departemen', render: (d) => d.department || '—' },
            { label: 'Status', render: (d) => d.status || '—' },
          ]}
          onDownloadTemplate={downloadEmployeesTemplate}
          onConfirm={onBulkCreateEmployees}
          onNotice={onNotice}
        />
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-shell max-w-lg">
            <div className="modal-head">
              <div>
                <h3 className="modal-title">
                  {editingEmployee ? 'Ubah karyawan' : 'Karyawan baru'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="icon-btn" aria-label="Tutup">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="lbl">NIK</label>
                  <input
                    type="text"
                    required
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="field font-mono"
                    placeholder="KNG-2024-001"
                  />
                </div>

                <div>
                  <label className="lbl">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as EmployeeStatus })}
                    className="field"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Cuti">Cuti</option>
                    <option value="Resign">Resign</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="lbl">Nama lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="field"
                  placeholder="Nama karyawan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="lbl">Departemen</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="field"
                  />
                </div>

                <div>
                  <label className="lbl">Jabatan</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="field"
                  />
                </div>
              </div>

              <div>
                <label className="lbl">Tanggal masuk</label>
                <input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  className="field"
                />
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
