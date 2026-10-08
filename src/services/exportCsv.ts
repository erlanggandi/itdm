import { Employee, EmailAccount, HotspotAccount } from '../types';

/**
 * Escapes CSV field value conforming to RFC 4180
 */
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Downloads CSV content as a file with UTF-8 BOM for Microsoft Excel compatibility
 */
export function downloadCsv(csvContent: string, filename: string) {
  // UTF-8 BOM (\uFEFF) ensures Excel opens Indonesian characters and special symbols properly
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads text or script file (.rsc, .txt)
 */
export function downloadText(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Master Karyawan to CSV
 */
export function exportEmployeesCsv(employees: Employee[]) {
  const headers = [
    'ID Karyawan',
    'Nama Lengkap',
    'Departemen / Divisi',
    'Jabatan',
    'Status Karyawan',
    'Catatan IT',
  ];

  const rows = employees.map(emp => [
    escapeCsv(emp.id),
    escapeCsv(emp.name),
    escapeCsv(emp.department),
    escapeCsv(emp.position),
    escapeCsv(emp.status),
    escapeCsv(emp.notes || ''),
  ]);

  const csv = [headers.map(escapeCsv).join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(csv, `master_karyawan_${dateStr}.csv`);
}

/**
 * Export Akun Email Karyawan to CSV
 */
export function exportEmailsCsv(emails: EmailAccount[], employees: Employee[]) {
  const empMap = new Map(employees.map(e => [e.id, e]));

  const headers = [
    'Nama Karyawan',
    'Departemen',
    'Alamat Email',
    'Password',
    'Provider',
    'Tipe Lisensi',
    'Status Akun',
    '2FA Status',
    'Kontak Pemulihan',
    'Forwarding Ke',
    'Terakhir Reset Password',
    'Catatan Akun',
  ];

  const rows = emails.map(m => {
    const emp = empMap.get(m.employeeId);
    return [
      escapeCsv(emp?.name || 'Shared / Umum'),
      escapeCsv(emp?.department || '-'),
      escapeCsv(m.email),
      escapeCsv(m.password),
      escapeCsv(m.provider),
      escapeCsv(m.licenseType),
      escapeCsv(m.status),
      escapeCsv(m.twoFactorEnabled ? 'Aktif' : 'Nonaktif'),
      escapeCsv(m.recoveryContact || '-'),
      escapeCsv(m.forwardTo || '-'),
      escapeCsv(m.lastPasswordReset || '-'),
      escapeCsv(m.notes || ''),
    ];
  });

  const csv = [headers.map(escapeCsv).join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(csv, `master_akun_email_${dateStr}.csv`);
}

/**
 * Export Akun Login Hotspot to CSV
 */
export function exportHotspotsCsv(hotspots: HotspotAccount[], employees: Employee[]) {
  const empMap = new Map(employees.map(e => [e.id, e]));

  const headers = [
    'Nama Karyawan',
    'Departemen',
    'Username Hotspot',
    'Password Hotspot',
    'SSID / Server',
    'Profil Bandwidth',
    'MAC Address',
    'IP Static',
    'Masa Berlaku',
    'Status Akun',
    'Catatan Perangkat',
  ];

  const rows = hotspots.map(h => {
    const emp = empMap.get(h.employeeId);
    return [
      escapeCsv(emp?.name || 'Tamu / Umum'),
      escapeCsv(emp?.department || '-'),
      escapeCsv(h.username),
      escapeCsv(h.password),
      escapeCsv(h.ssid),
      escapeCsv(h.profile),
      escapeCsv(h.macAddress || '-'),
      escapeCsv(h.ipAddress || '-'),
      escapeCsv(h.validUntil || 'Unlimited'),
      escapeCsv(h.status),
      escapeCsv(h.notes || ''),
    ];
  });

  const csv = [headers.map(escapeCsv).join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(csv, `master_akun_hotspot_${dateStr}.csv`);
}

/**
 * Export MikroTik RouterOS Script (.rsc)
 * Creates ready-to-run /ip hotspot user add script for SysAdmin
 */
export function exportMikrotikRsc(hotspots: HotspotAccount[], employees: Employee[]) {
  const empMap = new Map(employees.map(e => [e.id, e]));
  const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let script = `# ========================================================\r\n`;
  script += `# MikroTik RouterOS Hotspot User Batch Script\r\n`;
  script += `# Generated by IT Data Platform\r\n`;
  script += `# Waktu Pembuatan: ${dateStr}\r\n`;
  script += `# Total Akun: ${hotspots.length}\r\n`;
  script += `# ========================================================\r\n\r\n`;
  script += `/ip hotspot user\r\n`;

  hotspots.forEach(h => {
    const emp = empMap.get(h.employeeId);
    const comment = `${emp ? `${emp.name} (${emp.department})` : 'Akun Umum'}${h.notes ? ' | ' + h.notes : ''}`;
    const disabled = h.status === 'Aktif' ? 'no' : 'yes';

    let cmd = `add name="${h.username}" password="${h.password}" profile="${h.profile}"`;
    if (h.macAddress && h.macAddress.trim() !== '') {
      cmd += ` mac-address="${h.macAddress.trim()}"`;
    }
    if (h.ipAddress && h.ipAddress.trim() !== '') {
      cmd += ` address="${h.ipAddress.trim()}"`;
    }
    cmd += ` comment="${comment.replace(/"/g, "'")}" disabled=${disabled}`;
    script += `${cmd}\r\n`;
  });

  const filenameDate = new Date().toISOString().slice(0, 10);
  downloadText(script, `mikrotik_hotspot_users_${filenameDate}.rsc`, 'text/plain');
}
