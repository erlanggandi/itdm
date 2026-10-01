import React, { useState } from 'react';
import { Employee, EmailAccount, HotspotAccount, AppSettings } from '../types';
import { generateEmployeeCredentialSlipPdf } from '../services/exportPdf';
import {
  Printer,
  Download, 
  X, 
  Mail, 
  Wifi, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Check, 
  Copy 
} from 'lucide-react';

interface CredentialSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  emailAccount?: EmailAccount;
  hotspotAccount?: HotspotAccount;
  settings: AppSettings;
  onCopyNotice: (msg: string) => void;
}

export const CredentialSlipModal: React.FC<CredentialSlipModalProps> = ({
  isOpen,
  onClose,
  employee,
  emailAccount,
  hotspotAccount,
  settings,
  onCopyNotice,
}) => {
  const [showPasswords, setShowPasswords] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedHotspot, setCopiedHotspot] = useState(false);

  if (!isOpen || !employee) return null;

  const handleDownloadPdf = () => {
    generateEmployeeCredentialSlipPdf(employee, emailAccount, hotspotAccount, settings);
    onCopyNotice('PDF Slip Kredensial Karyawan berhasil diunduh!');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyEmailCreds = () => {
    if (!emailAccount) return;
    const text = `Akun Email: ${emailAccount.email}\nPassword: ${emailAccount.password}\nProvider: ${emailAccount.provider}`;
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    onCopyNotice('Kredensial email disalin!');
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyHotspotCreds = () => {
    if (!hotspotAccount) return;
    const text = `SSID: ${hotspotAccount.ssid}\nUsername: ${hotspotAccount.username}\nPassword: ${hotspotAccount.password}`;
    navigator.clipboard.writeText(text);
    setCopiedHotspot(true);
    onCopyNotice('Kredensial hotspot disalin!');
    setTimeout(() => setCopiedHotspot(false), 2000);
  };

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="modal-overlay no-print">
      <div className="modal-shell max-w-3xl">
        {/* Header Toolbar */}
        <div className="modal-head no-print">
          <div>
            <h3 className="modal-title">Slip kredensial — {employee.name}</h3>
            <p className="modal-sub font-mono">IT/DOC/{employee.id.slice(-6).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPasswords(!showPasswords)}
              className="btn btn-ghost !text-xs"
            >
              {showPasswords ? <EyeOff className="w-3.5 h-3.5" strokeWidth={1.75} /> : <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />}
              {showPasswords ? 'Sembunyikan' : 'Tampilkan'}
            </button>
            <button
              onClick={onClose}
              className="icon-btn"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Preview Sheet */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 bg-zinc-100">
          <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-8 space-y-6 print:p-0 print:border-none print:shadow-none">
            {/* Document Header */}
            <div className="border-b border-zinc-200 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">
                    {settings.companyName.toUpperCase()}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Departemen Teknologi Informasi
                  </p>
                  <p className="text-[11px] text-zinc-400">Kontak: {settings.itContact}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-semibold bg-zinc-900 text-white uppercase tracking-wide">
                    Rahasia
                  </span>
                  <p className="text-[11px] text-zinc-500 mt-1">Tanggal: {currentDate}</p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <h1 className="text-base font-semibold text-zinc-900 uppercase tracking-wide">
                  Tanda Terima Kredensial Akun IT
                </h1>
                <p className="text-xs text-zinc-500 font-mono">IT/DOC/{employee.id.slice(-6).toUpperCase()}</p>
              </div>
            </div>

            {/* Section 1: Data Karyawan */}
            <div>
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide border-b border-zinc-100 pb-1.5 mb-3">
                1 · Karyawan penerima
              </h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div>
                  <span className="text-zinc-500">Nama Lengkap:</span>
                  <p className="font-bold text-zinc-800 text-sm">{employee.name}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Departemen / Divisi:</span>
                  <p className="font-semibold text-zinc-800">{employee.department}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Jabatan:</span>
                  <p className="font-semibold text-zinc-800">{employee.position}</p>
                </div>
              </div>
            </div>

            {/* Section 2: Email Account */}
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-zinc-100 pb-1.5">
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  2 · Email kantor
                </h4>
                {emailAccount && (
                  <button
                    onClick={handleCopyEmailCreds}
                    className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1 no-print"
                  >
                    {copiedEmail ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedEmail ? 'Disalin' : 'Salin'}
                  </button>
                )}
              </div>

              {emailAccount ? (
                <div className="border border-zinc-200 rounded-lg p-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Alamat email:</span>
                    <span className="font-medium text-zinc-900 text-sm select-all font-mono">{emailAccount.email}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Password Awal:</span>
                    <span className="font-mono font-bold text-zinc-800 text-sm select-all">
                      {showPasswords ? emailAccount.password : '••••••••••••'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Platform / Provider:</span>
                    <span className="font-medium text-zinc-700">{emailAccount.provider} ({emailAccount.licenseType})</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic p-3 bg-zinc-50 rounded-lg">
                  Karyawan ini belum memiliki akun email yang terdaftar.
                </p>
              )}
            </div>

            {/* Section 3: Hotspot Account */}
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-zinc-100 pb-1.5">
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-zinc-400" />
                  3 · Hotspot / Wi-Fi
                </h4>
                {hotspotAccount && (
                  <button
                    onClick={handleCopyHotspotCreds}
                    className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1 no-print"
                  >
                    {copiedHotspot ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedHotspot ? 'Disalin' : 'Salin'}
                  </button>
                )}
              </div>

              {hotspotAccount ? (
                <div className="border border-zinc-200 rounded-lg p-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">SSID Wi-Fi:</span>
                    <span className="font-medium text-zinc-900 text-sm">{hotspotAccount.ssid}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Username:</span>
                    <span className="font-mono font-medium text-zinc-900 text-sm select-all">{hotspotAccount.username}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Password:</span>
                    <span className="font-mono font-bold text-zinc-800 text-sm select-all">
                      {showPasswords ? hotspotAccount.password : '••••••••••••'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Profil Bandwidth:</span>
                    <span className="font-medium text-zinc-700">{hotspotAccount.profile}</span>
                  </div>
                  {hotspotAccount.macAddress && (
                    <div className="col-span-2">
                      <span className="text-zinc-500 block text-[11px]">MAC Address Binding:</span>
                      <span className="font-mono text-zinc-700">{hotspotAccount.macAddress}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic p-3 bg-zinc-50 rounded-lg">
                  Karyawan ini belum memiliki akun hotspot yang terdaftar.
                </p>
              )}
            </div>

            {/* Section 4: Security SOP */}
            <div className="border border-zinc-200 rounded-lg p-3.5 text-[11px] text-zinc-600 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-zinc-800">
                <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
                Kebijakan keamanan:
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                <li>Ganti password awal saat login pertama.</li>
                <li>Jangan bagikan akun ke orang lain.</li>
                <li>Laporkan ke IT bila ada indikasi kebocoran.</li>
              </ul>
            </div>

            {/* Section 5: Signature */}
            <div className="pt-4 grid grid-cols-2 text-center text-xs text-zinc-600 gap-8">
              <div>
                <p>Diserahkan oleh (IT Administrator):</p>
                <div className="h-14"></div>
                <div className="border-t border-zinc-300 w-36 mx-auto pt-1 font-bold text-zinc-800">
                  ( IT Support )
                </div>
              </div>
              <div>
                <p>Diterima oleh (Karyawan):</p>
                <div className="h-14"></div>
                <div className="border-t border-zinc-300 w-44 mx-auto pt-1 font-bold text-zinc-800">
                  ( {employee.name} )
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-zinc-100 flex items-center justify-end gap-2 no-print">
          <button
            onClick={onClose}
            className="btn btn-ghost"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-ghost"
          >
            <Printer className="w-3.5 h-3.5" strokeWidth={1.75} />
            Cetak
          </button>
          <button
            onClick={handleDownloadPdf}
            className="btn btn-primary"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={2} />
            Unduh PDF
          </button>
        </div>
      </div>
    </div>
  );
};
