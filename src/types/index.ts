export type EmployeeStatus = 'Aktif' | 'Cuti' | 'Resign';

export interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  phone: string;
  status: EmployeeStatus;
  joinDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type EmailProvider = 
  | 'Google Workspace'
  | 'Microsoft 365'
  | 'Zimbra Mail'
  | 'cPanel / Webmail'
  | 'Zoho Mail'
  | 'Custom IMAP/POP3';

export type EmailStatus = 'Aktif' | 'Suspended' | 'Arsip' | 'Nonaktif';

export interface EmailAccount {
  id: string;
  employeeId: string; // Foreign key to Employee.id (can be empty string for shared mailbox)
  email: string;
  password: string;
  provider: EmailProvider;
  licenseType: string;
  quotaGB: number; // 0 = Unlimited
  usedGB: number;
  twoFactorEnabled: boolean;
  recoveryContact?: string;
  forwardTo?: string;
  status: EmailStatus;
  lastPasswordReset: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type HotspotStatus = 'Aktif' | 'Disabled' | 'Expired';

export interface HotspotAccount {
  id: string;
  employeeId: string; // Foreign key to Employee.id
  username: string;
  password: string;
  ssid: string;
  profile: string; // e.g., Staff-5Mbps, Management-20Mbps, IT-Unlimited
  macAddress?: string;
  ipAddress?: string;
  validUntil?: string; // YYYY-MM-DD or 'Unlimited'
  status: HotspotStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  companyName: string;
  defaultEmailDomain: string;
  defaultSsid: string;
  itContact: string;
  defaultHotspotProfile: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'BACKUP' | 'RESTORE';
  entity: 'EMPLOYEE' | 'EMAIL' | 'HOTSPOT' | 'DATABASE';
  details: string;
  timestamp: string;
}

export interface DatabaseSchema {
  employees: Employee[];
  emailAccounts: EmailAccount[];
  hotspotAccounts: HotspotAccount[];
  settings: AppSettings;
  logs: ActivityLog[];
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalEmailAccounts: number;
  activeEmailAccounts: number;
  suspendedEmailAccounts: number;
  totalHotspotAccounts: number;
  activeHotspotAccounts: number;
  totalDepartments: number;
  emailQuotaTotalGB: number;
  emailQuotaUsedGB: number;
}
