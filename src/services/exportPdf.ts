import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee, EmailAccount, HotspotAccount, AppSettings, DashboardStats } from '../types';

/**
 * Generates Master Summary PDF with all data
 */
export function exportMasterReportPdf(
  stats: DashboardStats,
  employees: Employee[],
  emails: EmailAccount[],
  hotspots: HotspotAccount[],
  settings: AppSettings
) {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const empMap = new Map(employees.map(e => [e.id, e]));
  const dateFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Header Banner
  doc.setFillColor(2, 132, 199); // Primary Sky 600
  doc.rect(0, 0, 297, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(settings.companyName.toUpperCase(), 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('IT DATA PLATFORM - LAPORAN REKAPITULASI AKUN & LOGIN KARYAWAN', 14, 18);

  doc.setFontSize(8);
  doc.setTextColor(224, 242, 254);
  doc.text(`Dicetak: ${dateFormatted}`, 283, 18, { align: 'right' });

  // Summary Metrics Box
  let startY = 32;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, startY, 269, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('RINGKASAN SISTEM:', 18, startY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Total Karyawan: ${stats.totalEmployees} (${stats.activeEmployees} Aktif)   |   ` +
    `Akun Email: ${stats.totalEmailAccounts} (${stats.activeEmailAccounts} Aktif, ${stats.suspendedEmailAccounts} Suspended)   |   ` +
    `Akun Hotspot: ${stats.totalHotspotAccounts} (${stats.activeHotspotAccounts} Aktif)`,
    18, startY + 13
  );

  // Table 1: Email Accounts
  startY += 26;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(2, 132, 199);
  doc.text('1. DAFTAR MASTER AKUN EMAIL KARYAWAN', 14, startY);

  const emailRows = emails.map((m, idx) => {
    const emp = empMap.get(m.employeeId);
    return [
      idx + 1,
      emp ? emp.name : 'Shared / Umum',
      emp?.department || '-',
      m.email,
      m.password,
      m.provider,
      m.twoFactorEnabled ? '2FA ON' : '2FA OFF',
      m.status,
    ];
  });

  autoTable(doc, {
    startY: startY + 3,
    head: [['No', 'Karyawan', 'Departemen', 'Alamat Email', 'Password', 'Provider', '2FA', 'Status']],
    body: emailRows,
    theme: 'grid',
    headStyles: {
      fillColor: [2, 132, 199],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 42 },
      2: { cellWidth: 35 },
      3: { cellWidth: 50 },
      4: { font: 'courier', cellWidth: 35 },
      5: { cellWidth: 32 },
      6: { halign: 'center', cellWidth: 18 },
      7: { halign: 'center', cellWidth: 18 },
      8: { halign: 'center', cellWidth: 20 },
    },
    didDrawPage: (data) => {
      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `DOKUMEN RAHASIA IT - ${settings.companyName} | Halaman ${data.pageNumber} dari ${pageCount}`,
        14,
        205
      );
    }
  });

  // Table 2: Hotspot Accounts (Add on new page or continuation)
  doc.addPage('landscape');

  // Header Banner for page 2
  doc.setFillColor(2, 132, 199);
  doc.rect(0, 0, 297, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('2. DAFTAR MASTER AKUN LOGIN HOTSPOT / WI-FI KARYAWAN', 14, 12);

  const hotspotRows = hotspots.map((h, idx) => {
    const emp = empMap.get(h.employeeId);
    return [
      idx + 1,
      emp ? emp.name : 'Tamu / Umum',
      emp?.department || '-',
      h.username,
      h.password,
      h.ssid,
      h.profile,
      h.macAddress || '-',
      h.validUntil || 'Unlimited',
      h.status,
    ];
  });

  autoTable(doc, {
    startY: 24,
    head: [['No', 'Karyawan', 'Departemen', 'Username Hotspot', 'Password', 'SSID / Server', 'Profil Limit', 'MAC Device', 'Masa Berlaku', 'Status']],
    body: hotspotRows,
    theme: 'grid',
    headStyles: {
      fillColor: [14, 116, 144], // Cyan / Blue 700
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 42 },
      2: { cellWidth: 35 },
      3: { font: 'courier', cellWidth: 32 },
      4: { font: 'courier', cellWidth: 35 },
      5: { cellWidth: 32 },
      6: { cellWidth: 28 },
      7: { font: 'courier', cellWidth: 30 },
      8: { halign: 'center', cellWidth: 20 },
      9: { halign: 'center', cellWidth: 20 },
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `DOKUMEN RAHASIA IT - ${settings.companyName} | Halaman ${data.pageNumber} dari ${pageCount}`,
        14,
        205
      );
    }
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Laporan_Master_IT_${dateStr}.pdf`);
}

/**
 * Generates Dedicated Email Accounts Report PDF
 */
export function exportEmailsReportPdf(
  emails: EmailAccount[],
  employees: Employee[],
  settings: AppSettings
) {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const empMap = new Map(employees.map(e => [e.id, e]));
  const dateFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  doc.setFillColor(2, 132, 199);
  doc.rect(0, 0, 297, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(settings.companyName.toUpperCase(), 14, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('MASTER DATA AKUN EMAIL PERUSAHAAN & KARYAWAN', 14, 17);

  doc.setFontSize(8);
  doc.setTextColor(224, 242, 254);
  doc.text(`Per Tanggal: ${dateFormatted} | Total: ${emails.length} Akun`, 283, 17, { align: 'right' });

  const emailRows = emails.map((m, idx) => {
    const emp = empMap.get(m.employeeId);
    return [
      idx + 1,
      emp ? emp.name : 'Umum / Shared',
      emp?.department || '-',
      m.email,
      m.password,
      m.provider,
      m.licenseType,
      m.twoFactorEnabled ? 'Aktif' : 'Nonaktif',
      m.status,
      m.notes || '-',
    ];
  });

  autoTable(doc, {
    startY: 28,
    head: [['No', 'Karyawan', 'Divisi', 'Alamat Email', 'Password', 'Provider', 'Lisensi', '2FA', 'Status', 'Catatan']],
    body: emailRows,
    theme: 'grid',
    headStyles: {
      fillColor: [2, 132, 199],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 38 },
      2: { cellWidth: 28 },
      3: { cellWidth: 46 },
      4: { font: 'courier', cellWidth: 32 },
      5: { cellWidth: 28 },
      6: { cellWidth: 28 },
      7: { halign: 'center', cellWidth: 20 },
      8: { halign: 'center', cellWidth: 14 },
      9: { halign: 'center', cellWidth: 16 },
      10: { cellWidth: 30 },
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `DOKUMEN RAHASIA IT - ${settings.companyName} | Halaman ${data.pageNumber} dari ${pageCount}`,
        14,
        205
      );
    }
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Laporan_Email_Karyawan_${dateStr}.pdf`);
}

/**
 * Generates Dedicated Hotspot Accounts Report PDF
 */
export function exportHotspotsReportPdf(
  hotspots: HotspotAccount[],
  employees: Employee[],
  settings: AppSettings
) {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const empMap = new Map(employees.map(e => [e.id, e]));
  const dateFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  doc.setFillColor(14, 116, 144);
  doc.rect(0, 0, 297, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(settings.companyName.toUpperCase(), 14, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('MASTER DATA AKUN LOGIN HOTSPOT / WI-FI KARYAWAN', 14, 17);

  doc.setFontSize(8);
  doc.setTextColor(207, 250, 254);
  doc.text(`Per Tanggal: ${dateFormatted} | Total: ${hotspots.length} Akun Hotspot`, 283, 17, { align: 'right' });

  const hotspotRows = hotspots.map((h, idx) => {
    const emp = empMap.get(h.employeeId);
    return [
      idx + 1,
      emp ? emp.name : 'Tamu / Umum',
      emp?.department || '-',
      h.username,
      h.password,
      h.ssid,
      h.profile,
      h.macAddress || '-',
      h.ipAddress || '-',
      h.validUntil || 'Unlimited',
      h.status,
      h.notes || '-',
    ];
  });

  autoTable(doc, {
    startY: 28,
    head: [['No', 'Karyawan', 'Divisi', 'Username Hotspot', 'Password', 'SSID', 'Profil Bandwidth', 'MAC Binding', 'IP Static', 'Masa Berlaku', 'Status', 'Catatan']],
    body: hotspotRows,
    theme: 'grid',
    headStyles: {
      fillColor: [14, 116, 144],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 36 },
      2: { cellWidth: 26 },
      3: { font: 'courier', cellWidth: 28 },
      4: { font: 'courier', cellWidth: 28 },
      5: { cellWidth: 26 },
      6: { cellWidth: 24 },
      7: { font: 'courier', cellWidth: 26 },
      8: { font: 'courier', cellWidth: 22 },
      9: { halign: 'center', cellWidth: 18 },
      10: { halign: 'center', cellWidth: 16 },
      11: { cellWidth: 28 },
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `DOKUMEN RAHASIA IT - ${settings.companyName} | Halaman ${data.pageNumber} dari ${pageCount}`,
        14,
        205
      );
    }
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Laporan_Hotspot_Karyawan_${dateStr}.pdf`);
}

/**
 * Generates an Individual Official "Slip Kredensial Karyawan" (IT Account Handover Slip)
 * Printable A4 Portrait format for new or existing employee onboarding
 */
export function generateEmployeeCredentialSlipPdf(
  employee: Employee,
  emailAccount?: EmailAccount,
  hotspotAccount?: HotspotAccount,
  settings?: AppSettings
) {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const compName = settings?.companyName || 'PT KANGODING DIGITAL NUSANTARA';
  const itContact = settings?.itContact || 'IT Helpdesk Ext. 101 | support@kangoding.co.id';
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Top Accent Bar
  doc.setFillColor(2, 132, 199);
  doc.rect(0, 0, 210, 8, 'F');

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(compName.toUpperCase(), 15, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('DEPARTEMEN TEKNOLOGI INFORMASI (IT SUPPORT & INFRASTRUCTURE)', 15, 28);
  doc.text(`Kontak IT: ${itContact}`, 15, 33);

  // Line separator
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.6);
  doc.line(15, 37, 195, 37);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(2, 132, 199);
  doc.text('FORM TANDA TERIMA KREDENSIAL AKUN IT KARYAWAN', 105, 47, { align: 'center' });

  // Confidential badge
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(252, 165, 165);
  doc.roundedRect(68, 51, 74, 7, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(220, 38, 38);
  doc.text('SANGAT RAHASIA - HANYA UNTUK KARYAWAN BERSANGKUTAN', 105, 55.5, { align: 'center' });

  // SECTION 1: Data Karyawan
  let y = 66;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('A. INFORMASI KARYAWAN', 18, y + 5);

  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  const col1X = 20;
  const col1ValX = 65;
  const col2X = 115;
  const col2ValX = 150;

  doc.text('Nama Lengkap', col1X, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${employee.name}`, col1ValX, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Tanggal Penyerahan', col2X, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${currentDate}`, col2ValX, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Departemen / Divisi', col1X, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${employee.department}`, col1ValX, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Jabatan / Posisi', col2X, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${employee.position}`, col2ValX, y);

  // SECTION 2: Akun Email Perusahaan
  y += 12;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('B. KREDENSIAL AKUN EMAIL PERUSAHAAN', 18, y + 5);

  y += 11;
  if (emailAccount) {
    // Credentials Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(18, y, 174, 38, 2, 2, 'FD');

    let boxY = y + 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Alamat Email', 23, boxY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(2, 132, 199);
    doc.text(`: ${emailAccount.email}`, 65, boxY);

    boxY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Password Awal', 23, boxY);
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`: ${emailAccount.password}`, 65, boxY);

    boxY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Provider Layanan', 23, boxY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`: ${emailAccount.provider} (${emailAccount.licenseType})`, 65, boxY);

    boxY += 6;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('* Catatan: Segera aktifkan verifikasi 2 langkah (2FA) demi keamanan data kantor.', 23, boxY);

    y += 42;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Tidak ada akun email yang terdaftar untuk karyawan ini.', 20, y + 4);
    y += 12;
  }

  // SECTION 3: Akun Wi-Fi & Hotspot Kantor
  y += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('C. KREDENSIAL AKUN LOGIN WI-FI & HOTSPOT KANTOR', 18, y + 5);

  y += 11;
  if (hotspotAccount) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(18, y, 174, 38, 2, 2, 'FD');

    let boxY = y + 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Nama Wi-Fi (SSID)', 23, boxY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(14, 116, 144);
    doc.text(`: ${hotspotAccount.ssid}`, 65, boxY);

    boxY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Username Hotspot', 23, boxY);
    doc.setFont('courier', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`: ${hotspotAccount.username}`, 65, boxY);

    boxY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Password Hotspot', 23, boxY);
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`: ${hotspotAccount.password}`, 65, boxY);

    boxY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Profil Bandwidth', 23, boxY);
    doc.setTextColor(15, 23, 42);
    doc.text(`: ${hotspotAccount.profile} (Batas: ${hotspotAccount.validUntil || 'Unlimited'})`, 65, boxY);

    boxY += 6;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      hotspotAccount.macAddress 
        ? `* Terdaftar khusus untuk perangkat dengan MAC Address: ${hotspotAccount.macAddress}`
        : '* Harap gunakan akun ini hanya pada perangkat dinas / kerja resmi.',
      23, boxY
    );

    y += 42;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Tidak ada akun hotspot yang terdaftar untuk karyawan ini.', 20, y + 4);
    y += 12;
  }

  // SECTION 4: Ketentuan & Kebijakan Keamanan IT (SOP)
  y += 4;
  doc.setFillColor(254, 252, 232); // Light yellow
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(15, y, 180, 25, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(133, 77, 14);
  doc.text('KETENTUAN DAN KEBIJAKAN PENGGUNAAN FASILITAS IT:', 18, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(113, 63, 18);
  doc.text('1. Karyawan WAJIB mengganti password awal pada saat pertama kali login ke sistem.', 18, y + 10);
  doc.text('2. Password bersifat PRIBADI dan RAHASIA. Dilarang membagikan atau meminjamkan akun kepada rekan kerja lain.', 18, y + 14);
  doc.text('3. Fasilitas email dan internet kantor dipergunakan semata-mata untuk kepentingan pekerjaan perusahaan.', 18, y + 18);
  doc.text('4. Bila terjadi indikasi kebocoran akun atau perangkat kerja hilang, segera hubungi IT Support dalam kurun waktu 1x24 jam.', 18, y + 22);

  // SECTION 5: Signatures Block
  y += 32;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  // Left: Yang Menyerahkan (IT)
  doc.text('Diserahkan oleh,', 30, y);
  doc.text('IT Support & Infrastructure', 30, y + 5);
  doc.line(25, y + 26, 75, y + 26);
  doc.setFont('helvetica', 'bold');
  doc.text('( IT Administrator )', 32, y + 31);

  // Right: Yang Menerima (Karyawan)
  doc.setFont('helvetica', 'normal');
  doc.text('Diterima oleh,', 140, y);
  doc.text('Karyawan Bersangkutan', 140, y + 5);
  doc.line(135, y + 26, 185, y + 26);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${employee.name} )`, 140, y + 31);

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dokumen ini dicetak otomatis dari Sistem IT Data Platform pada ${currentDate}`, 105, 290, { align: 'center' });

  const safeName = employee.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Slip_Akun_IT_${safeName}.pdf`);
}
