# IT Data Platform (ITDP) 🚀
**Sistem Manajemen & Backup Akun Login Karyawan (Email & Hotspot)**

Aplikasi web modern yang dirancang khusus untuk **IT Administrator, Network Engineer, dan SysAdmin** dalam mengelola, mencadangkan (backup), dan mengekspor kredensial login karyawan perusahaan secara rapi, aman, dan terpusat.

---

## 🌟 Fitur Utama

### 1. Manajemen Master Data Karyawan
- Pencatatan data karyawan: **NIK**, **Nama Lengkap**, **Departemen/Divisi**, **Jabatan**, **No. HP/WhatsApp**, **Status** (Aktif, Cuti, Resign), dan **Tanggal Masuk**.
- Indikator status akun yang terhubung (apakah karyawan sudah memiliki akun email atau login hotspot).
- Fitur pencarian instan dan filter berdasarkan departemen serta status karyawan.

### 2. Modul Akun Email Karyawan
- Mendukung berbagai provider: **Google Workspace**, **Microsoft 365**, **Zimbra Mail**, **cPanel/Webmail**, **Zoho Mail**, dan **Custom IMAP/POP3**.
- Penyimpanan password dengan fitur toggle **Lihat / Sembunyikan Password** dan tombol **1-Klik Salin (Copy)**.
- Pemantauan kapasitas kuota penyimpanan email (GB Digunakan vs Total GB) dengan progress bar visual.
- Status keamanan **2FA / MFA (Two-Factor Authentication)**.
- Catatan kontak pemulihan (recovery email/phone) dan email forwarding.
- Generator password kuat bawaan (14+ karakter alfanumerik & simbol acak).

### 3. Modul Akun Login Hotspot & Wi-Fi
- Kompatibel dengan sistem hotspot **MikroTik RouterOS**, **Radius Server**, **Ubiquiti UniFi**, dan **Captive Portal**.
- Pengaturan **SSID**, **Username Hotspot**, **Password / PIN 6 Angka**.
- Pengelompokan **Profil Bandwidth** (*Staff-5Mbps*, *Supervisor-10Mbps*, *Management-20Mbps*, *IT-Unlimited*, dll.).
- Pengikatan perangkat melalui **MAC Address Binding** dan **IP Static**.
- Masa aktif akun (*Unlimited* atau tanggal kedaluwarsa).
- **Export Script MikroTik (.rsc)**: Hasilkan batch script CLI MikroTik RouterOS otomatis siap pakai di Winbox Terminal!

### 4. Ekspor Data Lengkap (CSV & PDF)
- **Ekspor CSV**:
  - Format CSV berstandar RFC 4180 dengan **UTF-8 BOM** (langsung rapi saat dibuka di Microsoft Excel tanpa error karakter).
  - Ekspor Master Karyawan, Master Akun Email, dan Master Akun Hotspot.
- **Ekspor Dokumen PDF Resmi**:
  - **Laporan Rekapitulasi Master IT**: Dokumen resmi landscape A4 berisi ringkasan statistik, seluruh akun email, dan seluruh login hotspot dengan penomoran halaman otomatis.
  - **Laporan Akun Email Karyawan**: Rekapitulasi khusus email, lisensi, kuota, dan 2FA.
  - **Laporan Akun Hotspot Karyawan**: Rekapitulasi khusus akun hotspot dan profil kecepatan.

### 5. Cetak Slip Kredensial Karyawan (Handover Slip)
- Cetak formulir resmi **Tanda Terima Kredensial Akun & Akses IT Karyawan**.
- Menampilkan data lengkap akun email awal dan login hotspot karyawan.
- Dilengkapi **Ketentuan & Kebijakan Keamanan Informasi (SOP Keamanan Password)**.
- Kolom tanda tangan resmi pihak IT Administrator dan Karyawan penerima.
- Bisa langsung dicetak via browser atau diunduh sebagai **file PDF**.

### 6. Pusat Backup & Pemulihan (Disaster Recovery)
- **1-Klik Backup JSON**: Mengunduh seluruh basis data (karyawan, email, hotspot, log aktivitas, konfigurasi) dalam format `.json` berstempel tanggal.
- **1-Klik Restore JSON**: Pulihkan kembali seluruh akun kapan saja dengan mengunggah file backup `.json`.
- **Log Aktivitas (Audit Trail)**: Riwayat lengkap pencatatan setiap penambahan, perubahan, dan pencadangan akun.

---

## 🛠️ Arsitektur & Teknologi

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite.
- **Backend API**: Node.js, Express, RESTful JSON API.
- **Database**: Local File-based JSON Database berlokasi di `server/data/database.json` (ringan, tidak perlu install MySQL/PostgreSQL, data otomatis tersimpan permanen di harddisk).
- **PDF Engine**: jsPDF & jsPDF-autotable.
- **Fallback**: Dilengkapi sinkronisasi cache browser bila server sedang offline.

---

## 🚀 Cara Menjalankan

### Cara Cepat (Windows)
Cukup **double-click file**:
```
jalankan-itdm.bat
```
Aplikasi akan otomatis mengompilasi, membuka peramban web di `http://localhost:5000`, dan menjalankan server.

---

### Cara Manual via Terminal (Command Prompt / PowerShell)

1. **Masuk ke direktori proyek**:
   ```bash
   cd "D:\99. Other\PROJECT\project-app\Kangoding-ITDM"
   ```

2. **Jalankan Mode Pengembangan (Hot-reload Client & Server)**:
   ```bash
   npm run dev
   ```
   - Client Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

3. **Jalankan Mode Produksi (Single Server)**:
   ```bash
   npm run build
   npm start
   ```
   Aplikasi siap diakses di:
   `http://localhost:5000`

---

### Cara Menjalankan Menggunakan Docker Compose 🐳

1. **Jalankan container**:
   ```bash
   docker compose up -d --build
   ```

2. **Periksa status container**:
   ```bash
   docker compose ps
   ```

3. **Melihat log container**:
   ```bash
   docker compose logs -f
   ```

4. **Menghentikan container**:
   ```bash
   docker compose down
   ```

Aplikasi siap diakses di:
`http://localhost:5000`

> **Catatan Data**: Folder `./server/data` di-mount ke container, sehingga semua data di `database.json` tetap tersimpan permanen di harddisk host saat container dimatikan atau di-restart.

---

## 📁 Struktur Direktori

```
Kangoding-ITDM/
├── server/
│   ├── data/
│   │   └── database.json          <-- File database lokal permanen
│   ├── src/
│   │   ├── db.ts                  <-- Operasi data, atomic write & seed default
│   │   ├── index.ts               <-- REST API Express server
│   │   └── types.ts               <-- Definisi tipe data backend
│   └── tsconfig.json
├── src/
│   ├── components/
│   │   ├── BackupRestoreModal.tsx <-- Modal backup/restore JSON & CSV/PDF
│   │   ├── CredentialSlipModal.tsx<-- Slip cetak serah terima kredensial
│   │   ├── DashboardView.tsx      <-- Tampilan utama analitik & ringkasan
│   │   ├── EmailAccountsView.tsx  <-- Master akun email perusahaan
│   │   ├── EmployeesView.tsx      <-- Master karyawan perusahaan
│   │   ├── HotspotAccountsView.tsx<-- Master login WiFi / hotspot MikroTik
│   │   ├── MikrotikExportModal.tsx<-- Modal preview & download script .rsc
│   │   ├── PasswordGeneratorModal.tsx <-- Generator password acak & PIN
│   │   ├── SettingsModal.tsx      <-- Pengaturan nama PT & default domain
│   │   └── Toast.tsx              <-- Notifikasi mengambang
│   ├── services/
│   │   ├── api.ts                 <-- Service pemanggil REST API
│   │   ├── exportCsv.ts           <-- Generator CSV & script MikroTik .rsc
│   │   ├── exportPdf.ts           <-- Generator PDF Master & Slip Karyawan
│   │   └── passwordGenerator.ts   <-- Algoritma enkripsi acak & PIN
│   ├── types/
│   │   └── index.ts               <-- Skema data TypeScript
│   ├── App.tsx                    <-- Layout utama & state manager
│   ├── index.css                  <-- Tailwind & styling
│   └── main.tsx                   <-- Entry point React
├── dist/                          <-- File hasil build produksi
├── jalankan-itdm.bat              <-- Launcher 1-klik untuk Windows
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

Dibuat dengan ❤️ untuk kemudahan administrasi IT & infrastruktur jaringan perusahaan.
