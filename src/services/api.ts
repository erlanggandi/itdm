import {
  Employee,
  EmailAccount,
  HotspotAccount,
  AppSettings,
  ActivityLog,
  DashboardStats,
  DatabaseSchema,
} from '../types';
import {
  EmailImportRow,
  EmployeeImportRow,
  HotspotImportRow,
} from './importCsv';

const API_BASE = '/api';

// Initial local fallback data in case backend server is temporarily not reachable
const defaultFallbackSettings: AppSettings = {
  companyName: 'PT Kangoding Solusi Digital',
  defaultEmailDomain: 'kangoding.co.id',
  defaultSsid: 'KANGODING-CORP',
  itContact: 'IT Helpdesk Ext. 101 | support@kangoding.co.id',
  defaultHotspotProfile: 'Staff-5Mbps',
  updatedAt: new Date().toISOString(),
};

function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(`itdm_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`itdm_${key}`, JSON.stringify(value));
  } catch (err) {
    console.error('Error saving to localStorage:', err);
  }
}

export const api = {
  // STATS
  async getStats(): Promise<DashboardStats> {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (!res.ok) throw new Error('API server error');
      return await res.json();
    } catch {
      // Local fallback calculation
      const employees = await this.getEmployees();
      const emails = await this.getEmails();
      const hotspots = await this.getHotspots();
      const activeEmployees = employees.filter(e => e.status === 'Aktif').length;
      const activeEmails = emails.filter(m => m.status === 'Aktif').length;
      const suspendedEmails = emails.filter(m => m.status === 'Suspended').length;
      const activeHotspots = hotspots.filter(h => h.status === 'Aktif').length;
      const depts = new Set(employees.map(e => e.department)).size;
      const totalGB = emails.reduce((a, b) => a + (b.quotaGB || 0), 0);
      const usedGB = emails.reduce((a, b) => a + (b.usedGB || 0), 0);

      return {
        totalEmployees: employees.length,
        activeEmployees,
        totalEmailAccounts: emails.length,
        activeEmailAccounts: activeEmails,
        suspendedEmailAccounts: suspendedEmails,
        totalHotspotAccounts: hotspots.length,
        activeHotspotAccounts: activeHotspots,
        totalDepartments: depts,
        emailQuotaTotalGB: totalGB,
        emailQuotaUsedGB: Number(usedGB.toFixed(1)),
      };
    }
  },

  // EMPLOYEES
  async getEmployees(): Promise<Employee[]> {
    try {
      const res = await fetch(`${API_BASE}/employees`);
      if (!res.ok) throw new Error('API server error');
      const data = await res.json();
      setLocalData('employees', data);
      return data;
    } catch {
      return getLocalData('employees', []);
    }
  },

  async createEmployee(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    try {
      const res = await fetch(`${API_BASE}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create employee');
      return await res.json();
    } catch {
      const employees = getLocalData<Employee[]>('employees', []);
      const newEmp: Employee = {
        ...data,
        id: `emp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      employees.unshift(newEmp);
      setLocalData('employees', employees);
      return newEmp;
    }
  },

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    try {
      const res = await fetch(`${API_BASE}/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update employee');
      return await res.json();
    } catch {
      const employees = getLocalData<Employee[]>('employees', []);
      const index = employees.findIndex(e => e.id === id);
      if (index >= 0) {
        employees[index] = { ...employees[index], ...data, updatedAt: new Date().toISOString() };
        setLocalData('employees', employees);
        return employees[index];
      }
      throw new Error('Employee not found');
    }
  },

  async deleteEmployee(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/employees/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete employee');
      return true;
    } catch {
      const employees = getLocalData<Employee[]>('employees', []);
      const filtered = employees.filter(e => e.id !== id);
      setLocalData('employees', filtered);
      return true;
    }
  },

  // BULK IMPORT EMPLOYEES (CSV)
  async importEmployees(rows: EmployeeImportRow[]): Promise<Employee[]> {
    const clean = rows.filter(r => r.name?.trim());
    if (clean.length === 0) return [];
    try {
      const res = await fetch(`${API_BASE}/employees/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees: clean }),
      });
      if (!res.ok) throw new Error('Bulk import failed');
      const json = await res.json();
      return (json.created || []) as Employee[];
    } catch {
      // Local fallback: satu tulis localStorage untuk seluruh batch
      const employees = getLocalData<Employee[]>('employees', []);
      const existing = new Set(employees.map(e => e.name.toLowerCase()));
      const now = new Date().toISOString();
      const created: Employee[] = [];
      clean.forEach((r, i) => {
        const name = r.name.trim();
        if (existing.has(name.toLowerCase())) return;
        existing.add(name.toLowerCase());
        created.unshift({
          ...r,
          name,
          id: `emp-${Date.now()}-${i}`,
          createdAt: now,
          updatedAt: now,
        });
      });
      setLocalData('employees', [...created, ...employees]);
      return created;
    }
  },

  // EMAIL ACCOUNTS
  async getEmails(): Promise<EmailAccount[]> {
    try {
      const res = await fetch(`${API_BASE}/emails`);
      if (!res.ok) throw new Error('API server error');
      const data = await res.json();
      setLocalData('emails', data);
      return data;
    } catch {
      return getLocalData('emails', []);
    }
  },

  async createEmail(data: Omit<EmailAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailAccount> {
    try {
      const res = await fetch(`${API_BASE}/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create email account');
      return await res.json();
    } catch {
      const emails = getLocalData<EmailAccount[]>('emails', []);
      const newEmail: EmailAccount = {
        ...data,
        id: `mail-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      emails.unshift(newEmail);
      setLocalData('emails', emails);
      return newEmail;
    }
  },

  async updateEmail(id: string, data: Partial<EmailAccount>): Promise<EmailAccount> {
    try {
      const res = await fetch(`${API_BASE}/emails/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update email account');
      return await res.json();
    } catch {
      const emails = getLocalData<EmailAccount[]>('emails', []);
      const index = emails.findIndex(m => m.id === id);
      if (index >= 0) {
        emails[index] = { ...emails[index], ...data, updatedAt: new Date().toISOString() };
        setLocalData('emails', emails);
        return emails[index];
      }
      throw new Error('Email not found');
    }
  },

  async deleteEmail(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/emails/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete email');
      return true;
    } catch {
      const emails = getLocalData<EmailAccount[]>('emails', []);
      const filtered = emails.filter(m => m.id !== id);
      setLocalData('emails', filtered);
      return true;
    }
  },

  // BULK IMPORT EMAILS (CSV)
  async importEmails(rows: EmailImportRow[]): Promise<EmailAccount[]> {
    const clean = rows.filter(r => r.email?.trim() && r.password?.trim());
    if (clean.length === 0) return [];
    try {
      const res = await fetch(`${API_BASE}/emails/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: clean }),
      });
      if (!res.ok) throw new Error('Bulk import failed');
      const json = await res.json();
      return (json.created || []) as EmailAccount[];
    } catch {
      const emails = getLocalData<EmailAccount[]>('emails', []);
      const existing = new Set(emails.map(m => m.email.toLowerCase()));
      const now = new Date().toISOString();
      const created: EmailAccount[] = [];
      clean.forEach((r, i) => {
        const email = r.email.trim();
        if (existing.has(email.toLowerCase())) return;
        existing.add(email.toLowerCase());
        created.unshift({
          ...r,
          email,
          id: `mail-${Date.now()}-${i}`,
          createdAt: now,
          updatedAt: now,
        });
      });
      setLocalData('emails', [...created, ...emails]);
      return created;
    }
  },

  // HOTSPOT ACCOUNTS
  async getHotspots(): Promise<HotspotAccount[]> {
    try {
      const res = await fetch(`${API_BASE}/hotspots`);
      if (!res.ok) throw new Error('API server error');
      const data = await res.json();
      setLocalData('hotspots', data);
      return data;
    } catch {
      return getLocalData('hotspots', []);
    }
  },

  async createHotspot(data: Omit<HotspotAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<HotspotAccount> {
    try {
      const res = await fetch(`${API_BASE}/hotspots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create hotspot account');
      return await res.json();
    } catch {
      const hotspots = getLocalData<HotspotAccount[]>('hotspots', []);
      const newHotspot: HotspotAccount = {
        ...data,
        id: `hs-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      hotspots.unshift(newHotspot);
      setLocalData('hotspots', hotspots);
      return newHotspot;
    }
  },

  async updateHotspot(id: string, data: Partial<HotspotAccount>): Promise<HotspotAccount> {
    try {
      const res = await fetch(`${API_BASE}/hotspots/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update hotspot account');
      return await res.json();
    } catch {
      const hotspots = getLocalData<HotspotAccount[]>('hotspots', []);
      const index = hotspots.findIndex(h => h.id === id);
      if (index >= 0) {
        hotspots[index] = { ...hotspots[index], ...data, updatedAt: new Date().toISOString() };
        setLocalData('hotspots', hotspots);
        return hotspots[index];
      }
      throw new Error('Hotspot account not found');
    }
  },

  async deleteHotspot(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/hotspots/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete hotspot');
      return true;
    } catch {
      const hotspots = getLocalData<HotspotAccount[]>('hotspots', []);
      const filtered = hotspots.filter(h => h.id !== id);
      setLocalData('hotspots', filtered);
      return true;
    }
  },

  // BULK IMPORT HOTSPOTS (CSV)
  async importHotspots(rows: HotspotImportRow[]): Promise<HotspotAccount[]> {
    const clean = rows.filter(r => r.username?.trim() && r.password?.trim());
    if (clean.length === 0) return [];
    try {
      const res = await fetch(`${API_BASE}/hotspots/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotspots: clean }),
      });
      if (!res.ok) throw new Error('Bulk import failed');
      const json = await res.json();
      return (json.created || []) as HotspotAccount[];
    } catch {
      const hotspots = getLocalData<HotspotAccount[]>('hotspots', []);
      const existing = new Set(hotspots.map(h => h.username.toLowerCase()));
      const now = new Date().toISOString();
      const created: HotspotAccount[] = [];
      clean.forEach((r, i) => {
        const username = r.username.trim();
        if (existing.has(username.toLowerCase())) return;
        existing.add(username.toLowerCase());
        created.unshift({
          ...r,
          username,
          id: `hs-${Date.now()}-${i}`,
          createdAt: now,
          updatedAt: now,
        });
      });
      setLocalData('hotspots', [...created, ...hotspots]);
      return created;
    }
  },

  // SETTINGS
  async getSettings(): Promise<AppSettings> {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (!res.ok) throw new Error('API server error');
      const data = await res.json();
      setLocalData('settings', data);
      return data;
    } catch {
      return getLocalData('settings', defaultFallbackSettings);
    }
  },

  async updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return await res.json();
    } catch {
      const cur = getLocalData('settings', defaultFallbackSettings);
      const updated = { ...cur, ...data, updatedAt: new Date().toISOString() };
      setLocalData('settings', updated);
      return updated;
    }
  },

  // LOGS
  async getLogs(): Promise<ActivityLog[]> {
    try {
      const res = await fetch(`${API_BASE}/logs`);
      if (!res.ok) throw new Error('API server error');
      return await res.json();
    } catch {
      return [];
    }
  },

  // BACKUP JSON DOWNLOAD
  async downloadBackupJson(): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/backup`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().slice(0, 10);
        a.download = `backup_itdm_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
    } catch (err) {
      console.warn('Backend download failed, falling back to local snapshot download', err);
    }

    // Fallback: download client-side snapshot
    const employees = await this.getEmployees();
    const emails = await this.getEmails();
    const hotspots = await this.getHotspots();
    const settings = await this.getSettings();
    const logs = await this.getLogs();

    const snapshot: DatabaseSchema = {
      employees,
      emailAccounts: emails,
      hotspotAccounts: hotspots,
      settings,
      logs,
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_itdm_local_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // RESTORE JSON
  async restoreBackupJson(data: any): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Restore failed');
      return { success: true, message: json.message || 'Database berhasil dipulihkan!' };
    } catch (err: any) {
      // Local fallback restore
      if (data.employees && data.emailAccounts && data.hotspotAccounts) {
        setLocalData('employees', data.employees);
        setLocalData('emails', data.emailAccounts);
        setLocalData('hotspots', data.hotspotAccounts);
        if (data.settings) setLocalData('settings', data.settings);
        return { success: true, message: 'Database lokal berhasil dipulihkan!' };
      }
      return { success: false, message: err.message || 'Gagal memulihkan database' };
    }
  },

  // RESET TO SAMPLE
  async resetToSample(): Promise<void> {
    try {
      await fetch(`${API_BASE}/reset`, { method: 'POST' });
    } catch (err) {
      console.warn('Reset request failed', err);
    }
  },

  // CLEAR ENTIRE DATABASE (keep settings)
  async clearDatabase(): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/clear`, { method: 'POST' });
      if (!res.ok) throw new Error('Clear failed');
    } catch {
      // Local fallback
      setLocalData('employees', []);
      setLocalData('emails', []);
      setLocalData('hotspots', []);
    }
  }
};
