import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  generatePassword,
  generateHotspotPin,
  evaluatePasswordStrength,
} from '../services/passwordGenerator';

interface PasswordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPassword?: (password: string) => void;
  onCopyNotice: (msg: string) => void;
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyPassword,
  onCopyNotice,
}) => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(14);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [copied, setCopied] = useState(false);

  const regenerate = () => {
    const pwd = generatePassword({
      length,
      includeUppercase: uppercase,
      includeLowercase: lowercase,
      includeNumbers: numbers,
      includeSymbols: symbols,
      excludeAmbiguous,
    });
    setPassword(pwd);
    setCopied(false);
  };

  useEffect(() => {
    if (isOpen) {
      regenerate();
    }
  }, [isOpen, length, uppercase, lowercase, numbers, symbols, excludeAmbiguous]);

  if (!isOpen) return null;

  const strength = evaluatePasswordStrength(password);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    onCopyNotice('Disalin.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSetHotspotPinPreset = () => {
    const pin = generateHotspotPin(6);
    setPassword(pin);
    setCopied(false);
  };

  const handleSetStrongPreset = () => {
    setLength(16);
    setUppercase(true);
    setLowercase(true);
    setNumbers(true);
    setSymbols(true);
    setExcludeAmbiguous(true);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-shell max-w-lg">
        <div className="modal-head">
          <h3 className="modal-title">Generator password</h3>
          <button onClick={onClose} className="icon-btn" aria-label="Tutup">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Output */}
          <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-base font-medium text-zinc-900 tracking-wide break-all select-all">
                {password}
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={regenerate}
                  title="Buat baru"
                  className="icon-btn border border-zinc-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCopy}
                  className="btn btn-primary !py-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" strokeWidth={2} />}
                  {copied ? 'Tersalin' : 'Salin'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-zinc-100">
              <div className="flex-1 h-0.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-900 transition-all duration-300"
                  style={{ width: `${(strength.score / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs text-zinc-500">{strength.label}</span>
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSetStrongPreset}
              className="btn btn-ghost !text-xs"
            >
              Email kuat · 16 karakter
            </button>
            <button
              type="button"
              onClick={handleSetHotspotPinPreset}
              className="btn btn-ghost !text-xs font-mono"
            >
              PIN · 6 angka
            </button>
          </div>

          {/* Options */}
          <div className="space-y-3 pt-4 border-t border-zinc-100">
            <div className="flex items-center justify-between text-[13px] text-zinc-700">
              <span>Panjang</span>
              <span className="font-mono tabular-nums">{length}</span>
            </div>
            <input
              type="range"
              min={6}
              max={32}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full accent-zinc-900"
              aria-label="Panjang password"
            />

            <div className="grid grid-cols-2 gap-2 text-[13px]">
              {[
                { label: 'A–Z', value: uppercase, set: setUppercase },
                { label: 'a–z', value: lowercase, set: setLowercase },
                { label: '0–9', value: numbers, set: setNumbers },
                { label: '!@#$', value: symbols, set: setSymbols },
              ].map((opt) => (
                <label key={opt.label} className="flex items-center gap-2 cursor-pointer text-zinc-700">
                  <input
                    type="checkbox"
                    checked={opt.value}
                    onChange={(e) => opt.set(e.target.checked)}
                    className="rounded border-zinc-300 w-4 h-4 accent-zinc-900 cursor-pointer"
                  />
                  <span className="font-mono text-xs">{opt.label}</span>
                </label>
              ))}
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-zinc-700">
              <input
                type="checkbox"
                checked={excludeAmbiguous}
                onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                className="rounded border-zinc-300 w-4 h-4 accent-zinc-900 cursor-pointer"
              />
              Hindari karakter ambigu (0, O, l, 1)
            </label>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-zinc-100 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Tutup
          </button>
          {onApplyPassword && (
            <button
              type="button"
              onClick={() => {
                onApplyPassword(password);
                onClose();
              }}
              className="btn btn-primary"
            >
              Gunakan ini
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
