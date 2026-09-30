import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  LayoutDashboard,
  Users,
  Mail,
  Wifi,
  Database,
  Settings,
  Key,
  FileText,
  Menu,
  X,
} from 'lucide-react';
import { 
  Employee, 
  EmailAccount, 
  HotspotAccount, 
  AppSettings, 
  ActivityLog, 
  DashboardStats 
} from './types';
import { api } from './services/api';
import { EmailImportRow, EmployeeImportRow, HotspotImportRow } from './services/importCsv';
import { ToastContainer, ToastMessage } from './components/Toast';
import { DashboardView } from './components/DashboardView';
import { EmployeesView } from './components/EmployeesView';
import { EmailAccountsView } from './components/EmailAccountsView';
import { HotspotAccountsView } from './components/HotspotAccountsView';
import { PasswordGeneratorModal } from './components/PasswordGeneratorModal';
import { CredentialSlipModal } from './components/CredentialSlipModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { MikrotikExportModal } from './components/MikrotikExportModal';
import { SettingsModal } from './components/SettingsModal';
import { exportMasterReportPdf } from './services/exportPdf';

export const App: React.FC = () => {
  // Navigation
  const [currentView, setCurrentView] = useState<'dashboard' | 'employees' | 'emails' | 'hotspots' | 'backup'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data States
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalEmailAccounts: 0,
    activeEmailAccounts: 0,
    suspendedEmailAccounts: 0,
    totalHotspotAccounts: 0,
    activeHotspotAccounts: 0,
    totalDepartments: 0,
    emailQuotaTotalGB: 0,
    emailQuotaUsedGB: 0,
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [emails, setEmails] = useState<EmailAccount[]>([]);
  const [hotspots, setHotspots] = useState<HotspotAccount[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    companyName: 'PT Kangoding Solusi Digital',
    defaultEmailDomain: 'kangoding.co.id',
    defaultSsid: 'KANGODING-CORP',
    itContact: 'IT Helpdesk Ext. 101 | support@kangoding.co.id',
    defaultHotspotProfile: 'Staff-5Mbps',
    updatedAt: new Date().toISOString(),
  });

  // Modal States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isMikrotikModalOpen, setIsMikrotikModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Credential Slip Modal State
  const [slipEmployee, setSlipEmployee] = useState<Employee | null>(null);
  const [slipEmail, setSlipEmail] = useState<EmailAccount | undefined>(undefined);
  const [slipHotspot, setSlipHotspot] = useState<HotspotAccount | undefined>(undefined);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Load Data
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, empData, emailData, hsData, settsData, logsData] = await Promise.all([
        api.getStats(),
        api.getEmployees(),
        api.getEmails(),
        api.getHotspots(),
        api.getSettings(),
        api.getLogs(),
      ]);

      setStats(statsData);
      setEmployees(empData);
      setEmails(emailData);
      setHotspots(hsData);
      setSettings(settsData);
      setLogs(logsData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      addToast('Koneksi ke backend server gagal, menggunakan cache lokal.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handlers for Employees
  const handleCreateEmployee = async (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    await api.createEmployee(data);
    await loadAllData();
  };

  const handleUpdateEmployee = async (id: string, data: Partial<Employee>) => {
    await api.updateEmployee(id, data);
    await loadAllData();
  };

  const handleDeleteEmployee = async (id: string) => {
    await api.deleteEmployee(id);
    await loadAllData();
  };

  const handleBulkCreateEmployees = async (rows: EmployeeImportRow[]): Promise<number> => {
    const created = await api.importEmployees(rows);
    await loadAllData();
    return created.length;
  };

  // Handlers for Emails
  const handleCreateEmail = async (data: Omit<EmailAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
    await api.createEmail(data);
    await loadAllData();
  };

  const handleUpdateEmail = async (id: string, data: Partial<EmailAccount>) => {
    await api.updateEmail(id, data);
    await loadAllData();
  };

  const handleDeleteEmail = async (id: string) => {
    await api.deleteEmail(id);
    await loadAllData();
  };

  const handleBulkCreateEmails = async (rows: EmailImportRow[]): Promise<number> => {
    const created = await api.importEmails(rows);
    await loadAllData();
    return created.length;
  };

  // Handlers for Hotspots
  const handleCreateHotspot = async (data: Omit<HotspotAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
    await api.createHotspot(data);
    await loadAllData();
  };

  const handleUpdateHotspot = async (id: string, data: Partial<HotspotAccount>) => {
    await api.updateHotspot(id, data);
    await loadAllData();
  };

  const handleDeleteHotspot = async (id: string) => {
    await api.deleteHotspot(id);
    await loadAllData();
  };

  const handleBulkCreateHotspots = async (rows: HotspotImportRow[]): Promise<number> => {
    const created = await api.importHotspots(rows);
    await loadAllData();
    return created.length;
  };

  // Handlers for Settings
  const handleSaveSettings = async (updated: Partial<AppSettings>) => {
    const res = await api.updateSettings(updated);
    setSettings(res);
    await loadAllData();
  };

  // Open Credential Slip Modal
  const handleOpenSlip = (emp: Employee, emailAccount?: EmailAccount, hotspotAccount?: HotspotAccount) => {
    setSlipEmployee(emp);
    const targetEmail = emailAccount || emails.find(m => m.employeeId === emp.id);
    const targetHotspot = hotspotAccount || hotspots.find(h => h.employeeId === emp.id);
    setSlipEmail(targetEmail);
    setSlipHotspot(targetHotspot);
    setIsSlipModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col md:flex-row text-zinc-900">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen w-60 bg-white text-zinc-600 flex flex-col justify-between border-r border-zinc-200 transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand */}
          <div className="px-4 h-14 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-zinc-900 flex items-center justify-center text-white">
                <Server className="w-4 h-4" strokeWidth={2} />
              </div>
              <div className="leading-none">
                <p className="font-semibold text-[13px] tracking-tight text-zinc-900">
                  ITDM
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">IT Data Platform</p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden icon-btn"
              aria-label="Tutup menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="p-2.5 space-y-0.5">
            <NavButton
              active={currentView === 'dashboard'}
              onClick={() => {
                setCurrentView('dashboard');
                setMobileMenuOpen(false);
              }}
              icon={<LayoutDashboard className="w-4 h-4" strokeWidth={1.75} />}
              label="Ringkasan"
            />
            <NavButton
              active={currentView === 'employees'}
              onClick={() => {
                setCurrentView('employees');
                setMobileMenuOpen(false);
              }}
              icon={<Users className="w-4 h-4" strokeWidth={1.75} />}
              label="Karyawan"
              count={employees.length}
            />
            <NavButton
              active={currentView === 'emails'}
              onClick={() => {
                setCurrentView('emails');
                setMobileMenuOpen(false);
              }}
              icon={<Mail className="w-4 h-4" strokeWidth={1.75} />}
              label="Email"
              count={emails.length}
            />
            <NavButton
              active={currentView === 'hotspots'}
              onClick={() => {
                setCurrentView('hotspots');
                setMobileMenuOpen(false);
              }}
              icon={<Wifi className="w-4 h-4" strokeWidth={1.75} />}
              label="Hotspot"
              count={hotspots.length}
            />
            <NavButton
              active={currentView === 'backup'}
              onClick={() => {
                setCurrentView('backup');
                setMobileMenuOpen(false);
              }}
              icon={<Database className="w-4 h-4" strokeWidth={1.75} />}
              label="Backup"
            />
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-2.5 border-t border-zinc-100 space-y-0.5">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
          >
            <Settings className="w-4 h-4" strokeWidth={1.75} />
            Pengaturan
          </button>
          <div className="flex items-center gap-2 px-3 py-2 text-[12px] text-zinc-400">
            <span className="dot bg-emerald-500" />
            <span className="truncate" title={settings.companyName}>
              {settings.companyName}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-[#FAFAF9]/90 backdrop-blur border-b border-zinc-200 px-4 md:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden icon-btn"
              aria-label="Buka menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <p className="text-[13px] text-zinc-400 truncate">
              {currentView === 'dashboard' && 'Ringkasan'}
              {currentView === 'employees' && 'Karyawan'}
              {currentView === 'emails' && 'Email'}
              {currentView === 'hotspots' && 'Hotspot'}
              {currentView === 'backup' && 'Backup'}
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="btn btn-ghost !px-3"
            >
              <Key className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Generator</span>
            </button>

            <button
              onClick={() => {
                exportMasterReportPdf(stats, employees, emails, hotspots, settings);
                addToast('Laporan PDF diunduh.', 'success');
              }}
              className="btn btn-ghost !px-3"
            >
              <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="btn btn-primary !px-3"
            >
              <Database className="w-3.5 h-3.5" strokeWidth={1.75} />
              Backup
            </button>
          </div>
        </header>

        {/* View Router */}
        <main className="px-4 md:px-8 py-6 flex-1 max-w-6xl w-full mx-auto">
          {loading ? (
            <div className="flex items-center gap-3 py-20 text-zinc-400">
              <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
              <p className="text-[13px]">Memuat data…</p>
            </div>
          ) : (
            <>
              {currentView === 'dashboard' && (
                <DashboardView
                  stats={stats}
                  employees={employees}
                  emails={emails}
                  hotspots={hotspots}
                  logs={logs}
                  settings={settings}
                  onNavigate={setCurrentView}
                  onOpenAddEmail={() => setCurrentView('emails')}
                  onOpenAddHotspot={() => setCurrentView('hotspots')}
                  onOpenAddEmployee={() => setCurrentView('employees')}
                  onOpenPasswordGenerator={() => setIsPasswordModalOpen(true)}
                  onOpenBackupModal={() => setIsBackupModalOpen(true)}
                  onOpenMikrotikModal={() => setIsMikrotikModalOpen(true)}
                  onNotice={addToast}
                />
              )}

              {currentView === 'employees' && (
                <EmployeesView
                  employees={employees}
                  emails={emails}
                  hotspots={hotspots}
                  onCreateEmployee={handleCreateEmployee}
                  onUpdateEmployee={handleUpdateEmployee}
                  onDeleteEmployee={handleDeleteEmployee}
                  onBulkCreateEmployees={handleBulkCreateEmployees}
                  onOpenCredentialSlip={handleOpenSlip}
                  onNotice={addToast}
                />
              )}

              {currentView === 'emails' && (
                <EmailAccountsView
                  emails={emails}
                  employees={employees}
                  settings={settings}
                  onCreateEmail={handleCreateEmail}
                  onUpdateEmail={handleUpdateEmail}
                  onDeleteEmail={handleDeleteEmail}
                  onBulkCreateEmails={handleBulkCreateEmails}
                  onOpenCredentialSlip={handleOpenSlip}
                  onNotice={addToast}
                />
              )}

              {currentView === 'hotspots' && (
                <HotspotAccountsView
                  hotspots={hotspots}
                  employees={employees}
                  settings={settings}
                  onCreateHotspot={handleCreateHotspot}
                  onUpdateHotspot={handleUpdateHotspot}
                  onDeleteHotspot={handleDeleteHotspot}
                  onBulkCreateHotspots={handleBulkCreateHotspots}
                  onOpenCredentialSlip={(emp, _e, hs) => handleOpenSlip(emp, undefined, hs)}
                  onOpenMikrotikModal={() => setIsMikrotikModalOpen(true)}
                  onNotice={addToast}
                />
              )}

              {currentView === 'backup' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="page-title">Backup</h2>
                    <p className="page-sub">{employees.length} karyawan · {emails.length} email · {hotspots.length} hotspot</p>
                  </div>
                  <div className="card p-4">
                    <button
                      onClick={() => setIsBackupModalOpen(true)}
                      className="btn btn-primary w-full !py-3"
                    >
                      <Database className="w-4 h-4" strokeWidth={1.75} />
                      Buka Backup & Restore
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* MODALS */}
      <PasswordGeneratorModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onCopyNotice={(msg) => addToast(msg, 'success')}
      />

      <CredentialSlipModal
        isOpen={isSlipModalOpen}
        onClose={() => setIsSlipModalOpen(false)}
        employee={slipEmployee}
        emailAccount={slipEmail}
        hotspotAccount={slipHotspot}
        settings={settings}
        onCopyNotice={(msg) => addToast(msg, 'success')}
      />

      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        stats={stats}
        employees={employees}
        emails={emails}
        hotspots={hotspots}
        settings={settings}
        onDataRefreshed={loadAllData}
        onNotice={addToast}
      />

      <MikrotikExportModal
        isOpen={isMikrotikModalOpen}
        onClose={() => setIsMikrotikModalOpen(false)}
        hotspots={hotspots}
        employees={employees}
        onCopyNotice={(msg) => addToast(msg, 'success')}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onNotice={(msg) => addToast(msg, 'success')}
      />
    </div>
  );
};

export default App;

const NavButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}> = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-colors ${
      active
        ? 'bg-zinc-900 text-white font-medium'
        : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
    }`}
  >
    <span className="flex items-center gap-2.5">
      {icon}
      {label}
    </span>
    {typeof count === 'number' && (
      <span
        className={`font-mono text-[11px] tabular-nums ${
          active ? 'text-zinc-300' : 'text-zinc-400'
        }`}
      >
        {count}
      </span>
    )}
  </button>
);
