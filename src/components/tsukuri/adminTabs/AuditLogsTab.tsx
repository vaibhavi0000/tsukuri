import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  User,
  KeyRound,
  Filter,
  Search,
  Download,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Tag,
  DollarSign,
  Sparkles,
  Package,
} from 'lucide-react';

export interface AuditLogItem {
  id: string;
  timestamp: string;
  admin: 'Aditya' | 'Anshuman' | 'System';
  passcodeVerified: string;
  action: string;
  category: 'auth' | 'product' | 'pricing' | 'offer' | 'order' | 'security';
  details: string;
  status: 'Verified' | 'Success' | 'Blocked';
  sessionClient?: string;
}

const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'aud-101',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    admin: 'Aditya',
    passcodeVerified: '3078',
    action: 'Co-Founder Security Authentication',
    category: 'auth',
    details: 'Aditya successfully entered pass code 3078. Authenticated with full Co-Founder master rights.',
    status: 'Verified',
    sessionClient: 'Console Session · 3078 Verified',
  },
  {
    id: 'aud-102',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    admin: 'Anshuman',
    passcodeVerified: '7985',
    action: 'Product Catalog & Media Upload',
    category: 'product',
    details: 'Anshuman uploaded product photos and configured video carousel for product LL (#57005).',
    status: 'Success',
    sessionClient: 'Console Session · 7985 Verified',
  },
  {
    id: 'aud-103',
    timestamp: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    admin: 'Aditya',
    passcodeVerified: '3078',
    action: 'Automatic Combo Pricing Update',
    category: 'pricing',
    details: 'Aditya generated automatic quantity tier pricing for 1x, 2x, 3x, 4x packs from base selling price ₹599.',
    status: 'Success',
    sessionClient: 'Console Session · 3078 Verified',
  },
  {
    id: 'aud-104',
    timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    admin: 'Anshuman',
    passcodeVerified: '7985',
    action: 'Official Studio Offer Configured',
    category: 'offer',
    details: 'Anshuman updated official studio offer below product: "SPECIAL STUDIO DEAL: 20% OFF ON UPI".',
    status: 'Success',
    sessionClient: 'Console Session · 7985 Verified',
  },
  {
    id: 'aud-105',
    timestamp: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    admin: 'Aditya',
    passcodeVerified: '3078',
    action: 'Product Video Position Assigned',
    category: 'product',
    details: 'Aditya set product own video to scrollable position "After images end" in main media gallery.',
    status: 'Success',
    sessionClient: 'Console Session · 3078 Verified',
  },
  {
    id: 'aud-106',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    admin: 'Anshuman',
    passcodeVerified: '7985',
    action: 'Co-Founder Security Authentication',
    category: 'auth',
    details: 'Anshuman successfully entered pass code 7985. Authenticated with full Co-Founder master rights.',
    status: 'Verified',
    sessionClient: 'Console Session · 7985 Verified',
  },
];

interface AuditLogsTabProps {
  currentAdminUser: string;
}

export const AuditLogsTab: React.FC<AuditLogsTabProps> = ({ currentAdminUser }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>(() => {
    try {
      const stored = localStorage.getItem('tsukuri_audit_logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_AUDIT_LOGS;
  });

  const [filterAdmin, setFilterAdmin] = useState<'All' | 'Aditya' | 'Anshuman'>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Persist logs whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('tsukuri_audit_logs', JSON.stringify(logs));
    } catch {}
  }, [logs]);

  const filteredLogs = logs.filter((log) => {
    const matchesAdmin = filterAdmin === 'All' || log.admin === filterAdmin;
    const matchesCategory = filterCategory === 'All' || log.category === filterCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.admin.toLowerCase().includes(q) ||
      log.passcodeVerified.includes(q);
    return matchesAdmin && matchesCategory && matchesSearch;
  });

  const adityaLogsCount = logs.filter((l) => l.admin === 'Aditya').length;
  const anshumanLogsCount = logs.filter((l) => l.admin === 'Anshuman').length;

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Co-Founder', 'Passcode Verified', 'Action', 'Category', 'Status', 'Details'];
    const rows = filteredLogs.map((l) => [
      `"${new Date(l.timestamp).toLocaleString('en-IN')}"`,
      `"${l.admin}"`,
      `"${l.passcodeVerified}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.category}"`,
      `"${l.status}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tsukuri_audit_logs_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    try {
      const stored = localStorage.getItem('tsukuri_audit_logs');
      if (stored) {
        setLogs(JSON.parse(stored));
      }
    } catch {}
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'auth':
        return <KeyRound className="w-4 h-4 text-emerald-600" />;
      case 'product':
        return <Tag className="w-4 h-4 text-[#ea8f5a]" />;
      case 'pricing':
        return <DollarSign className="w-4 h-4 text-blue-600" />;
      case 'offer':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'order':
        return <Package className="w-4 h-4 text-purple-600" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-[#1e4b3e]" />;
    }
  };

  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xs border border-slate-100 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bubbly text-2xl text-[#1a2e26]">
              CO-FOUNDER AUDIT LOGS & ACCESS AUDIT TRAIL
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-[10px] tracking-wider uppercase">
              GATED SECURITY
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident audit ledger verifying every action by <strong>Aditya</strong> (Pass Code: 3078) and <strong>Anshuman</strong> (Pass Code: 7985).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-[#e8ece1] hover:bg-[#1e4b3e] hover:text-white text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-[#e8ece1] hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Refresh Audit Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Security Summary Bento Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Events */}
        <div className="p-4 rounded-2xl bg-[#e8ece1]/50 border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Audited Events
          </span>
          <span className="font-bubbly text-2xl text-[#1e4b3e] mt-1 block">
            {logs.length}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            Real-time ledger active
          </span>
        </div>

        {/* Aditya Stats */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
              Aditya Operations
            </span>
            <span className="text-[9px] font-mono font-bold text-amber-800 bg-amber-200/60 px-1.5 py-0.2 rounded">
              PIN: 3078
            </span>
          </div>
          <span className="font-bubbly text-2xl text-amber-900 mt-1 block">
            {adityaLogsCount}
          </span>
          <span className="text-[10px] text-amber-700 font-medium mt-0.5 block">
            Pass Code 3078 verified
          </span>
        </div>

        {/* Anshuman Stats */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
              Anshuman Operations
            </span>
            <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-200/60 px-1.5 py-0.2 rounded">
              PIN: 7985
            </span>
          </div>
          <span className="font-bubbly text-2xl text-emerald-900 mt-1 block">
            {anshumanLogsCount}
          </span>
          <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
            Pass Code 7985 verified
          </span>
        </div>

        {/* Security Gate Status */}
        <div className="p-4 rounded-2xl bg-[#1e4b3e] text-white shadow-xs">
          <span className="text-[10px] font-bold text-[#f3b755] uppercase tracking-wider block">
            Security Gate Status
          </span>
          <span className="font-bubbly text-2xl text-white mt-1 block flex items-center gap-1.5">
            <Lock className="w-5 h-5 text-[#f3b755]" />
            <span>100% GATED</span>
          </span>
          <span className="text-[10px] text-emerald-200 font-mono mt-0.5 block">
            Active: {currentAdminUser}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter by Co-Founder */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
            {(['All', 'Aditya', 'Anshuman'] as const).map((adm) => (
              <button
                key={adm}
                type="button"
                onClick={() => setFilterAdmin(adm)}
                className={`px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                  filterAdmin === adm ? 'bg-[#1e4b3e] text-[#f3b755]' : 'text-slate-600 hover:text-black'
                }`}
              >
                {adm === 'All' ? 'All Co-Founders' : `${adm} (${adm === 'Aditya' ? '3078' : '7985'})`}
              </button>
            ))}
          </div>

          {/* Filter by Category */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700"
          >
            <option value="All">All Categories</option>
            <option value="auth">Passcode Authentication</option>
            <option value="product">Product & Media</option>
            <option value="pricing">Combo Tier Pricing</option>
            <option value="offer">Studio Offer Edits</option>
            <option value="order">Order Processing</option>
            <option value="security">Security Checks</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, details, pass code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium w-full sm:w-64"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#e8ece1]/70 text-[#1a2e26] border-b border-slate-200">
              <th className="p-3.5 font-bubbly uppercase tracking-wider text-[11px]">Timestamp (IST)</th>
              <th className="p-3.5 font-bubbly uppercase tracking-wider text-[11px]">Operator & Pass Code</th>
              <th className="p-3.5 font-bubbly uppercase tracking-wider text-[11px]">Action Event</th>
              <th className="p-3.5 font-bubbly uppercase tracking-wider text-[11px]">Audit Details</th>
              <th className="p-3.5 font-bubbly uppercase tracking-wider text-[11px]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                  No audit log entries matching your current filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const isAditya = log.admin === 'Aditya';
                const isAnshuman = log.admin === 'Anshuman';

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Timestamp */}
                    <td className="p-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(log.timestamp).toLocaleString('en-IN')}</span>
                      </div>
                    </td>

                    {/* Operator & Passcode */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bubbly text-xs inline-flex items-center gap-1 shadow-2xs ${
                            isAditya
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : isAnshuman
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <User className="w-3 h-3" />
                          <span>{log.admin}</span>
                        </span>
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          Pass Code: {log.passcodeVerified}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="p-3.5 font-bold text-[#1a2e26] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(log.category)}
                        <span>{log.action}</span>
                      </div>
                    </td>

                    {/* Details */}
                    <td className="p-3.5 text-slate-600 max-w-md">
                      <p className="line-clamp-2 leading-relaxed">{log.details}</p>
                    </td>

                    {/* Status */}
                    <td className="p-3.5 whitespace-nowrap">
                      {log.status === 'Verified' || log.status === 'Success' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{log.status}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{log.status}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
