import React, { useState } from 'react';
import { HotspotAccount, Employee } from '../types';
import { exportMikrotikRsc } from '../services/exportCsv';
import { Copy, Download, Check, X } from 'lucide-react';

interface MikrotikExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotspots: HotspotAccount[];
  employees: Employee[];
  onCopyNotice: (msg: string) => void;
}

export const MikrotikExportModal: React.FC<MikrotikExportModalProps> = ({
  isOpen,
  onClose,
  hotspots,
  employees,
  onCopyNotice,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const empMap = new Map(employees.map(e => [e.id, e]));

  // Generate preview script
  const scriptLines: string[] = [
    `# MikroTik RouterOS Hotspot User Script`,
    `# Total Akun: ${hotspots.length}`,
    `/ip hotspot user`,
  ];

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
    scriptLines.push(cmd);
  });

  const fullScript = scriptLines.join('\r\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(fullScript);
    setCopied(true);
    onCopyNotice('Script disalin.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    exportMikrotikRsc(hotspots, employees);
    onCopyNotice('File .rsc diunduh.');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-shell max-w-2xl">
        <div className="modal-head">
          <div>
            <h3 className="modal-title font-mono">MikroTik <span className="text-zinc-400">.rsc</span></h3>
            <p className="modal-sub">Paste ke Terminal Winbox / SSH, atau unduh lalu <code className="font-mono text-[11px]">/import file.rsc</code></p>
          </div>
          <button onClick={onClose} className="icon-btn" aria-label="Tutup">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <pre className="bg-zinc-950 rounded-lg p-4 overflow-auto font-mono text-xs text-zinc-200 select-all whitespace-pre leading-relaxed max-h-[50vh]">
            {fullScript}
          </pre>
        </div>

        <div className="px-5 py-4 border-t border-zinc-100 flex items-center justify-between">
          <span className="font-mono text-xs text-zinc-400 tabular-nums">
            {hotspots.length} user
          </span>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="btn btn-ghost">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />}
              {copied ? 'Tersalin' : 'Salin'}
            </button>
            <button onClick={handleDownload} className="btn btn-primary">
              <Download className="w-3.5 h-3.5" strokeWidth={2} />
              Unduh .rsc
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
