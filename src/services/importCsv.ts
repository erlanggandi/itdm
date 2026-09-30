import {
  EmailAccount,
  EmailProvider,
  EmailStatus,
  Employee,
  EmployeeStatus,
  HotspotAccount,
  HotspotStatus,
} from '../types';
import { downloadCsv } from './exportCsv';
import { generateHotspotPin, generatePassword } from './passwordGenerator';

export type EmployeeImportRow = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>;
export type EmailImportRow = Omit<EmailAccount, 'id' | 'createdAt' | 'updatedAt'>;
export type HotspotImportRow = Omit<HotspotAccount, 'id' | 'createdAt' | 'updatedAt'>;

export interface ParsedImportRow<T> {
  line: number;
  data: T;
  status: 'valid' | 'skipped' | 'error';
  message?: string;
}

export type ParsedEmployeeRow = ParsedImportRow<EmployeeImportRow>;

const EMPLOYEE_STATUSES: Record<string, EmployeeStatus> = {
  aktif: 'Aktif',
  active: 'Aktif',
  cuti: 'Cuti',
  leave: 'Cuti',
  resign: 'Resign',
  resigned: 'Resign',
  nonaktif: 'Resign',
  inactive: 'Resign',
};

const EMAIL_PROVIDERS: EmailProvider[] = [
  'Google Workspace',
  'Microsoft 365',
  'Zimbra Mail',
  'cPanel / Webmail',
  'Zoho Mail',
  'Custom IMAP/POP3',
];

const EMAIL_STATUSES: Record<string, EmailStatus> = {
  aktif: 'Aktif',
  suspended: 'Suspended',
  arsip: 'Arsip',
  nonaktif: 'Nonaktif',
};

const HOTSPOT_STATUSES: Record<string, HotspotStatus> = {
  aktif: 'Aktif',
  disabled: 'Disabled',
  nonaktif: 'Disabled',
  expired: 'Expired',
};

const TRUTHY = new Set(['aktif', 'ya', 'yes', 'y', 'on', 'true', '1']);

/** Header CSV dinormalisasi -> nama kolom kanonis. Mendukung format export + sederhana. */
const HEADER_ALIASES: Record<string, string> = {
  // Karyawan
  nik: 'nik',
  nama: 'name',
  namalengkap: 'name',
  name: 'name',
  fullname: 'name',
  departemen: 'department',
  departemendivisi: 'department',
  divisi: 'department',
  department: 'department',
  dept: 'department',
  jabatan: 'position',
  posisi: 'position',
  position: 'position',
  status: 'status',
  statuskaryawan: 'status',
  statusakun: 'status',
  tanggalmasuk: 'joinDate',
  tglmasuk: 'joinDate',
  tanggal: 'joinDate',
  joindate: 'joinDate',
  catatan: 'notes',
  catatanit: 'notes',
  catatanakun: 'notes',
  catatanperangkat: 'notes',
  notes: 'notes',
  // Email
  nikkaryawan: 'nik',
  email: 'email',
  alamatemail: 'email',
  password: 'password',
  pass: 'password',
  sandi: 'password',
  katakunci: 'password',
  passwordhotspot: 'password',
  provider: 'provider',
  platform: 'provider',
  lisensi: 'licenseType',
  tipelisensi: 'licenseType',
  license: 'licenseType',
  licensetype: 'licenseType',
  paket: 'licenseType',
  '2fa': 'twoFactor',
  fa: 'twoFactor',
  tfa: 'twoFactor',
  mfa: 'twoFactor',
  recovery: 'recoveryContact',
  kontakrecovery: 'recoveryContact',
  kontakpemulihan: 'recoveryContact',
  kontak: 'recoveryContact',
  forward: 'forwardTo',
  forwarding: 'forwardTo',
  forwardke: 'forwardTo',
  forwardingke: 'forwardTo',
  reset: 'lastPasswordReset',
  terakhirresetpassword: 'lastPasswordReset',
  lastreset: 'lastPasswordReset',
  // Hotspot
  username: 'username',
  user: 'username',
  login: 'username',
  usernamehotspot: 'username',
  ssid: 'ssid',
  wifi: 'ssid',
  server: 'ssid',
  ssidserver: 'ssid',
  profil: 'profile',
  profile: 'profile',
  bandwidth: 'profile',
  profilbandwidth: 'profile',
  mac: 'macAddress',
  macaddress: 'macAddress',
  ip: 'ipAddress',
  ipaddress: 'ipAddress',
  ipstatis: 'ipAddress',
  berlaku: 'validUntil',
  masaberlaku: 'validUntil',
  expired: 'validUntil',
  validuntil: 'validUntil',
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Excel Indonesia umumnya memakai titik-koma — deteksi dari baris header. */
function detectDelimiter(headerLine: string): ',' | ';' {
  const semi = (headerLine.match(/;/g) || []).length;
  const comma = (headerLine.match(/,/g) || []).length;
  return semi > comma ? ';' : ',';
}

/** Parser CSV minimal sesuai RFC 4180 (kutip, "" escape, newline dalam kutip). */
function parseCsvText(text: string, delimiter: ',' | ';'): string[][] {
  const src = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = '';
    } else if (c === '\r') {
      // abaikan, \n yang mengakhiri baris
    } else if (c === '\n') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

interface SplitResult {
  header: string[];
  dataRows: { cells: string[]; line: number }[];
  colIndex: Map<number, string>;
}

function splitCsv(text: string, minColumns: number, missingMessage: string): SplitResult {
  const firstLine = text.replace(/^\uFEFF/, '').split(/\r?\n/).find(l => l.trim() !== '') || '';
  const delimiter = detectDelimiter(firstLine);
  const allRows = parseCsvText(text, delimiter);

  const numbered = allRows
    .map((cells, i) => ({ cells, line: i + 1 }))
    .filter(r => r.cells.some(c => c.trim() !== ''));

  if (numbered.length < 2) {
    throw new Error('File kosong — minimal ada baris header dan 1 data.');
  }

  const [headerRow, ...dataRows] = numbered;
  const colIndex = new Map<number, string>();
  headerRow.cells.forEach((h, i) => {
    const key = HEADER_ALIASES[normalizeHeader(h)];
    if (key && ![...colIndex.values()].includes(key)) colIndex.set(i, key);
  });

  if (colIndex.size < minColumns) {
    throw new Error(missingMessage);
  }
  return { header: headerRow.cells, dataRows, colIndex };
}

function makeGetter(cells: string[], colIndex: Map<number, string>) {
  return (key: string): string => {
    for (const [idx, k] of colIndex) {
      if (k === key) return (cells[idx] || '').trim();
    }
    return '';
  };
}

function normalizeDate(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (m) {
    let year = m[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return '';
}

function parseBool(raw: string): boolean {
  return TRUTHY.has(raw.trim().toLowerCase());
}

const today = () => new Date().toISOString().slice(0, 10);

// ─── Karyawan ────────────────────────────────────────────────────────────────

function emptyEmployeeRow(): EmployeeImportRow {
  return { nik: '', name: '', department: '', position: '', phone: '', status: 'Aktif', joinDate: '', notes: '' };
}

export function parseEmployeesCsv(text: string, existingNiks: Set<string>): ParsedEmployeeRow[] {
  const { dataRows, colIndex } = splitCsv(text, 2, 'Header tidak dikenali. Unduh template untuk format yang benar.');
  const keys = [...colIndex.values()];
  if (!keys.includes('nik') || !keys.includes('name')) {
    throw new Error('Kolom wajib tidak ada: file harus memuat nik dan nama.');
  }

  const seenInFile = new Set<string>();
  return dataRows.map(({ cells, line }) => {
    const get = makeGetter(cells, colIndex);
    const nik = get('nik');
    const name = get('name');
    const rawStatus = get('status');

    if (!nik && !name) {
      return { line, data: emptyEmployeeRow(), status: 'skipped' as const, message: 'Baris kosong' };
    }
    if (!nik) return { line, data: emptyEmployeeRow(), status: 'error' as const, message: 'NIK kosong' };
    if (!name) return { line, data: emptyEmployeeRow(), status: 'error' as const, message: 'Nama kosong' };

    let status: EmployeeStatus = 'Aktif';
    if (rawStatus) {
      const mapped = EMPLOYEE_STATUSES[rawStatus.toLowerCase()];
      if (!mapped) {
        return { line, data: emptyEmployeeRow(), status: 'error' as const, message: `Status "${rawStatus}" tidak valid` };
      }
      status = mapped;
    }

    const nikKey = nik.toLowerCase();
    if (existingNiks.has(nikKey)) {
      return { line, data: emptyEmployeeRow(), status: 'skipped' as const, message: 'NIK sudah terdaftar' };
    }
    if (seenInFile.has(nikKey)) {
      return { line, data: emptyEmployeeRow(), status: 'skipped' as const, message: 'NIK duplikat di file' };
    }
    seenInFile.add(nikKey);

    return {
      line,
      data: {
        nik,
        name,
        department: get('department') || 'Information Technology',
        position: get('position'),
        phone: '',
        status,
        joinDate: normalizeDate(get('joinDate')),
        notes: get('notes'),
      },
      status: 'valid' as const,
    };
  });
}

export function downloadEmployeesTemplate() {
  downloadCsv('nik,nama,departemen,jabatan,status,tgl_masuk,catatan', 'template_import_karyawan.csv');
}

// ─── Email ───────────────────────────────────────────────────────────────────

export interface EmailImportContext {
  existingEmails: Set<string>;
  nikToId: Map<string, string>;
}

function emptyEmailRow(): EmailImportRow {
  return {
    employeeId: '', email: '', password: '', provider: 'Google Workspace',
    licenseType: '', quotaGB: 0, usedGB: 0, twoFactorEnabled: false,
    recoveryContact: '', forwardTo: '', status: 'Aktif', lastPasswordReset: '', notes: '',
  };
}

export function parseEmailsCsv(text: string, ctx: EmailImportContext): ParsedImportRow<EmailImportRow>[] {
  const { dataRows, colIndex } = splitCsv(text, 1, 'Header tidak dikenali. Unduh template untuk format yang benar.');
  if (![...colIndex.values()].includes('email')) {
    throw new Error('Kolom email tidak ditemukan di file.');
  }

  const seenInFile = new Set<string>();
  return dataRows.map(({ cells, line }) => {
    const get = makeGetter(cells, colIndex);
    const email = get('email');
    const rawProvider = get('provider');
    const rawStatus = get('status');
    const nik = get('nik');

    if (!email && !nik) {
      return { line, data: emptyEmailRow(), status: 'skipped' as const, message: 'Baris kosong' };
    }
    if (!email) return { line, data: emptyEmailRow(), status: 'error' as const, message: 'Email kosong' };
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return { line, data: emptyEmailRow(), status: 'error' as const, message: 'Format email tidak valid' };
    }

    const emailKey = email.toLowerCase();
    if (ctx.existingEmails.has(emailKey)) {
      return { line, data: emptyEmailRow(), status: 'skipped' as const, message: 'Email sudah terdaftar' };
    }
    if (seenInFile.has(emailKey)) {
      return { line, data: emptyEmailRow(), status: 'skipped' as const, message: 'Email duplikat di file' };
    }

    let provider: EmailProvider = 'Google Workspace';
    if (rawProvider) {
      const match = EMAIL_PROVIDERS.find(p => p.toLowerCase() === rawProvider.toLowerCase());
      if (!match) {
        return { line, data: emptyEmailRow(), status: 'error' as const, message: `Provider "${rawProvider}" tidak dikenal` };
      }
      provider = match;
    }

    let status: EmailStatus = 'Aktif';
    if (rawStatus) {
      const mapped = EMAIL_STATUSES[rawStatus.toLowerCase()];
      if (!mapped) {
        return { line, data: emptyEmailRow(), status: 'error' as const, message: `Status "${rawStatus}" tidak valid` };
      }
      status = mapped;
    }

    let employeeId = '';
    if (nik) {
      const found = ctx.nikToId.get(nik.toLowerCase());
      if (!found) {
        return { line, data: emptyEmailRow(), status: 'error' as const, message: `NIK "${nik}" tidak terdaftar` };
      }
      employeeId = found;
    }

    seenInFile.add(emailKey);
    return {
      line,
      data: {
        employeeId,
        email,
        password: get('password') || generatePassword({ length: 14 }),
        provider,
        licenseType: get('licenseType') || 'Business Starter',
        quotaGB: 0,
        usedGB: 0,
        twoFactorEnabled: parseBool(get('twoFactor')),
        recoveryContact: get('recoveryContact'),
        forwardTo: get('forwardTo'),
        status,
        lastPasswordReset: normalizeDate(get('lastPasswordReset')) || today(),
        notes: get('notes'),
      },
      status: 'valid' as const,
    };
  });
}

export function downloadEmailsTemplate() {
  downloadCsv(
    'nik,email,password,provider,lisensi,status,2fa,recovery,forward,catatan',
    'template_import_email.csv',
  );
}

// ─── Hotspot ─────────────────────────────────────────────────────────────────

export interface HotspotImportContext {
  existingUsernames: Set<string>;
  nikToId: Map<string, string>;
  defaultSsid: string;
  defaultProfile: string;
}

function emptyHotspotRow(): HotspotImportRow {
  return {
    employeeId: '', username: '', password: '', ssid: '',
    profile: '', macAddress: '', ipAddress: '', validUntil: 'Unlimited', status: 'Aktif', notes: '',
  };
}

export function parseHotspotsCsv(text: string, ctx: HotspotImportContext): ParsedImportRow<HotspotImportRow>[] {
  const { dataRows, colIndex } = splitCsv(text, 1, 'Header tidak dikenali. Unduh template untuk format yang benar.');
  if (![...colIndex.values()].includes('username')) {
    throw new Error('Kolom username tidak ditemukan di file.');
  }

  const seenInFile = new Set<string>();
  return dataRows.map(({ cells, line }) => {
    const get = makeGetter(cells, colIndex);
    const username = get('username');
    const rawStatus = get('status');
    const nik = get('nik');

    if (!username && !nik) {
      return { line, data: emptyHotspotRow(), status: 'skipped' as const, message: 'Baris kosong' };
    }
    if (!username) return { line, data: emptyHotspotRow(), status: 'error' as const, message: 'Username kosong' };

    const userKey = username.toLowerCase();
    if (ctx.existingUsernames.has(userKey)) {
      return { line, data: emptyHotspotRow(), status: 'skipped' as const, message: 'Username sudah terdaftar' };
    }
    if (seenInFile.has(userKey)) {
      return { line, data: emptyHotspotRow(), status: 'skipped' as const, message: 'Username duplikat di file' };
    }

    let status: HotspotStatus = 'Aktif';
    if (rawStatus) {
      const mapped = HOTSPOT_STATUSES[rawStatus.toLowerCase()];
      if (!mapped) {
        return { line, data: emptyHotspotRow(), status: 'error' as const, message: `Status "${rawStatus}" tidak valid` };
      }
      status = mapped;
    }

    let employeeId = '';
    if (nik) {
      const found = ctx.nikToId.get(nik.toLowerCase());
      if (!found) {
        return { line, data: emptyHotspotRow(), status: 'error' as const, message: `NIK "${nik}" tidak terdaftar` };
      }
      employeeId = found;
    }

    seenInFile.add(userKey);
    return {
      line,
      data: {
        employeeId,
        username,
        password: get('password') || generateHotspotPin(6),
        ssid: get('ssid') || ctx.defaultSsid,
        profile: get('profile') || ctx.defaultProfile,
        macAddress: get('macAddress'),
        ipAddress: get('ipAddress'),
        validUntil: get('validUntil') || 'Unlimited',
        status,
        notes: get('notes'),
      },
      status: 'valid' as const,
    };
  });
}

export function downloadHotspotsTemplate() {
  downloadCsv(
    'nik,username,password,ssid,profil,mac,ip,berlaku,status,catatan',
    'template_import_hotspot.csv',
  );
}
