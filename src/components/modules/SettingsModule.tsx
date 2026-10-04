import React, { useState } from 'react';
import {
  Settings,
  Building,
  DollarSign,
  ShieldCheck,
  Database,
  History,
  Save,
  CheckCircle2,
  Download,
  Upload,
  UserCheck,
  Zap,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { BusinessSettings, ActivityLogItem } from '../../types/index.ts';
import { formatDate } from '../../lib/utils.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface SettingsModuleProps {
  settings: BusinessSettings;
  activityLogs: ActivityLogItem[];
  onUpdateSettings: (settings: Partial<BusinessSettings>) => Promise<void>;
  onExportFullData: () => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  settings,
  activityLogs,
  onUpdateSettings,
  onExportFullData,
}) => {
  const { canEdit, role, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'rates' | 'users' | 'activity' | 'backup'>('profile');

  // Business profile states
  const [businessName, setBusinessName] = useState(settings.businessName || 'PrintHub 3D Labs');
  const [gstin, setGstin] = useState(settings.gstin || '29AAAAA0000A1Z5');
  const [email, setEmail] = useState(settings.email || 'support@printhub3d.com');
  const [phone, setPhone] = useState(settings.phone || '+91 98765 43210');
  const [address, setAddress] = useState(settings.address || '104 Tech Spark Hub, Indiranagar, Bengaluru, KA 560038');
  const [currency, setCurrency] = useState(settings.currency || 'INR');
  const [defaultTaxRate, setDefaultTaxRate] = useState(settings.defaultTaxRate || 18);
  const [electricityRate, setElectricityRate] = useState(settings.electricityRatePerKwh || 8.5);
  const [machineDepreciation, setMachineDepreciation] = useState(settings.machineDepreciationRatePerHour || 25);
  const [laborRate, setLaborRate] = useState(settings.laborRatePerHour || 100);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings({
      businessName,
      gstin,
      email,
      phone,
      address,
      currency,
      defaultTaxRate: Number(defaultTaxRate),
      electricityRatePerKwh: Number(electricityRate),
      machineDepreciationRatePerHour: Number(machineDepreciation),
      laborRatePerHour: Number(laborRate),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            System & Business Settings
          </h2>
          <p className="text-xs text-slate-500">
            Configure workshop profile, GSTIN, electricity tariff rates, user access control, and data backups.
          </p>
        </div>

        {/* Subtabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex-wrap">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'profile' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <Building className="w-3.5 h-3.5" /> Profile & Tax
          </button>
          <button
            onClick={() => setActiveTab('rates')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'rates' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Rates & Costs
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'users' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> User Access (RBAC)
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'activity' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Activity Log
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'backup' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Backup & Export
          </button>
        </div>
      </div>

      {/* Profile & Tax Form */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSave} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 text-xs max-w-2xl">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" /> Business Profile & Legal Invoicing Info
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block font-semibold mb-1">Company / Studio Legal Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">GSTIN Number</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Default GST Rate (%)</label>
              <input
                type="number"
                value={defaultTaxRate}
                onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Support Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Official Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="col-span-2">
              <label className="block font-semibold mb-1">Workshop & Billing Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {canEdit && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              {savedSuccess ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Settings updated successfully!
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save Profile
              </button>
            </div>
          )}
        </form>
      )}

      {/* Rates & Costs Form */}
      {activeTab === 'rates' && (
        <form onSubmit={handleSave} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 text-xs max-w-2xl">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Operational Machine & Energy Benchmarks
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Default Business Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold"
              >
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Electricity Tariff Rate (₹ / kWh)</label>
              <input
                type="number"
                step="0.1"
                value={electricityRate}
                onChange={(e) => setElectricityRate(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Machine Depreciation / Wear (₹ / print hour)</label>
              <input
                type="number"
                value={machineDepreciation}
                onChange={(e) => setMachineDepreciation(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Workshop Labor Rate (₹ / hour)</label>
              <input
                type="number"
                value={laborRate}
                onChange={(e) => setLaborRate(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>
          </div>

          {canEdit && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              {savedSuccess ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Rates saved!
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save Rates
              </button>
            </div>
          )}
        </form>
      )}

      {/* User Access (RBAC) */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 text-xs max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Role-Based Access Control (RBAC)
              </h3>
              <p className="text-slate-500 mt-0.5">Enforce permission boundaries across team members</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Quick Test Switch:</span>
              <select
                value={role}
                onChange={(e) => switchRole(e.target.value as any)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="owner">Owner (Full Access)</option>
                <option value="staff">Staff (Operations only, No Finance)</option>
                <option value="viewer">Viewer (Read-Only)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-purple-900 dark:text-purple-300">Owner</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-200 text-purple-800 font-bold">FULL</span>
              </div>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                <li>✓ Full Orders & Dispatch</li>
                <li>✓ Production & Printer Farm</li>
                <li>✓ Inventory & Filaments</li>
                <li>✓ Finance, P&L, & Expenses</li>
                <li>✓ System & Tax Settings</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-emerald-900 dark:text-emerald-300">Staff</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 font-bold">OPS</span>
              </div>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                <li>✓ Orders & Production queue</li>
                <li>✓ Spools Tare & Inventory</li>
                <li>✓ Customer directory</li>
                <li>✕ No Finance / Expenses access</li>
                <li>✕ Cannot alter tax or rates</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Viewer</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">READ</span>
              </div>
              <ul className="space-y-1 text-slate-500 text-[11px]">
                <li>✓ View dashboard & KPIs</li>
                <li>✓ View catalog items</li>
                <li>✕ Cannot add/modify orders</li>
                <li>✕ Cannot queue/start prints</li>
                <li>✕ Cannot add expenses</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log */}
      {activeTab === 'activity' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" /> System Audit Trail & Activity Log
            </h3>
            <span className="text-slate-500">{activityLogs.length} recent actions logged</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
            {activityLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{log.userName}</span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold text-[10px]">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    {log.details || `Modified ${log.entityType} (${log.entityId})`}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                  {formatDate(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backup & Export */}
      {activeTab === 'backup' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 text-xs max-w-2xl">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" /> Database Backup & JSON Export
          </h3>
          <p className="text-slate-500">
            Export a full JSON snapshot of your 3D printing enterprise data—including orders, catalog specs, filament spools, CRM customer data, and expense ledgers.
          </p>

          <div className="pt-2">
            <button
              onClick={onExportFullData}
              className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Download Complete Database Backup (JSON)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
