import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (updated: Partial<AppSettings>) => Promise<void>;
  onNotice: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onNotice,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({ ...settings });
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      onNotice('Pengaturan disimpan.');
      onClose();
    } catch (err: any) {
      onNotice('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-shell max-w-lg">
        <div className="modal-head">
          <h3 className="modal-title">Pengaturan</h3>
          <button onClick={onClose} className="icon-btn" aria-label="Tutup">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="lbl">Nama perusahaan</label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="field"
            />
          </div>

          <div>
            <label className="lbl">Domain email default</label>
            <div className="flex items-center rounded-lg border border-zinc-200 overflow-hidden focus-within:border-zinc-900 transition-colors">
              <span className="pl-3 text-zinc-400 text-[13px] font-mono">@</span>
              <input
                type="text"
                required
                value={formData.defaultEmailDomain}
                onChange={(e) => setFormData({ ...formData, defaultEmailDomain: e.target.value })}
                className="w-full py-2 pr-3 pl-1 text-[13px] outline-none bg-white"
                placeholder="perusahaan.co.id"
              />
            </div>
          </div>

          <div>
            <label className="lbl">SSID default</label>
            <input
              type="text"
              required
              value={formData.defaultSsid}
              onChange={(e) => setFormData({ ...formData, defaultSsid: e.target.value })}
              className="field"
            />
          </div>

          <div>
            <label className="lbl">Kontak IT</label>
            <input
              type="text"
              value={formData.itContact}
              onChange={(e) => setFormData({ ...formData, itContact: e.target.value })}
              className="field"
            />
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Batal
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              <Save className="w-3.5 h-3.5" strokeWidth={2} />
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
