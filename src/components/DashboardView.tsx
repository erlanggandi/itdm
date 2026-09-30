import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import {
  DashboardStats,
  Employee,
  EmailAccount,
  HotspotAccount,
  ActivityLog,
  AppSettings,
} from '../types';

interface DashboardViewProps {
  stats: DashboardStats;
  employees: Employee[];
  emails: EmailAccount[];
  hotspots: HotspotAccount[];
  logs: ActivityLog[];
  settings: AppSettings;
  onNavigate: (view: 'dashboard' | 'employees' | 'emails' | 'hotspots' | 'backup') => void;
  onOpenAddEmail: () => void;
  onOpenAddHotspot: () => void;
  onOpenAddEmployee: () => void;
  onOpenPasswordGenerator: () => void;
  onOpenBackupModal: () => void;
  onOpenMikrotikModal: () => void;
  onNotice: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  employees,
  emails,
  hotspots,
  logs,
  settings,
  onNavigate,
}) => {
  const providerCounts = emails.reduce((acc, email) => {
    acc[email.provider] = (acc[email.provider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const profileCounts = hotspots.reduce((acc, hs) => {
    acc[hs.profile] = (acc[hs.profile] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="page-title">Ringkasan</h2>
        <p className="page-sub">{settings.companyName}</p>
      </div>

      {/* Stats: plain figures, hairline dividers */}
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-y-6 border-y border-zinc-200 py-5">
        <Stat
          label="Karyawan"
          value={stats.totalEmployees}
          sub={`${stats.activeEmployees} aktif`}
          onClick={() => onNavigate('employees')}
        />
        <Stat
          label="Email"
          value={stats.totalEmailAccounts}
          sub={`${stats.activeEmailAccounts} aktif · ${stats.suspendedEmailAccounts} suspended`}
          onClick={() => onNavigate('emails')}
        />
        <Stat
          label="Hotspot"
          value={stats.totalHotspotAccounts}
          sub={settings.defaultSsid}
          mono
          onClick={() => onNavigate('hotspots')}
        />
        <Stat
          label="Departemen"
          value={stats.totalDepartments}
          sub="divisi terdaftar"
          onClick={() => onNavigate('employees')}
        />
      </dl>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Distributions */}
        <div className="lg:col-span-1 space-y-7">
          <section>
            <h3 className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 mb-3">
              Provider email
            </h3>
            <ul className="space-y-2.5">
              {Object.entries(providerCounts).map(([provider, count]) => (
                <li key={provider} className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="text-zinc-700 truncate">{provider}</span>
                  <span className="font-mono text-xs text-zinc-400 tabular-nums flex-shrink-0">
                    {count}
                  </span>
                </li>
              ))}
              {Object.keys(providerCounts).length === 0 && (
                <li className="text-[13px] text-zinc-400">Belum ada data.</li>
              )}
            </ul>
          </section>

          <section>
            <h3 className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 mb-3">
              Profil hotspot
            </h3>
            <ul className="space-y-2.5">
              {Object.entries(profileCounts).map(([profile, count]) => (
                <li key={profile} className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="font-mono text-xs text-zinc-700 truncate">{profile}</span>
                  <span className="font-mono text-xs text-zinc-400 tabular-nums flex-shrink-0">
                    {count}
                  </span>
                </li>
              ))}
              {Object.keys(profileCounts).length === 0 && (
                <li className="text-[13px] text-zinc-400">Belum ada data.</li>
              )}
            </ul>
          </section>
        </div>

        {/* Activity */}
        <section className="lg:col-span-2">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Aktivitas terakhir
            </h3>
            <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
              {logs.length} catatan
            </span>
          </div>
          {logs.length === 0 ? (
            <p className="text-[13px] text-zinc-400 py-6">Belum ada aktivitas.</p>
          ) : (
            <ol className="divide-y divide-zinc-100 border-y border-zinc-100">
              {logs.slice(0, 12).map((log) => (
                <li key={log.id} className="py-2.5 flex items-baseline justify-between gap-4">
                  <p className="text-[13px] text-zinc-600 truncate">
                    <span className="font-mono text-[11px] text-zinc-400 mr-2">{log.action}</span>
                    {log.details}
                  </p>
                  <time className="font-mono text-[11px] text-zinc-400 whitespace-nowrap flex-shrink-0 tabular-nums">
                    {new Date(log.timestamp).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </li>
              ))}
            </ol>
          )}
          {employees.length === 0 && (
            <button
              onClick={() => onNavigate('employees')}
              className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-zinc-900 hover:underline"
            >
              Tambah karyawan pertama <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </section>
      </div>
    </div>
  );
};

const Stat: React.FC<{
  label: string;
  value: number;
  sub: string;
  mono?: boolean;
  onClick: () => void;
}> = ({ label, value, sub, mono, onClick }) => (
  <button onClick={onClick} className="text-left px-1 group">
    <dt className="text-[11px] uppercase tracking-wide text-zinc-400">{label}</dt>
    <dd className="mt-1 text-2xl tabular-nums tracking-tight text-zinc-900 font-mono">
      {value}
    </dd>
    <dd
      className={`mt-0.5 text-xs text-zinc-400 truncate group-hover:text-zinc-600 ${
        mono ? 'font-mono' : ''
      }`}
    >
      {sub}
    </dd>
  </button>
);
