import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Box,
  Printer,
  Layers,
  Calculator,
  Users,
  DollarSign,
  Truck,
  TrendingUp,
  BarChart3,
  Globe,
  Settings,
  ShieldCheck,
  Lock,
  ChevronRight,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export type NavModule =
  | 'dashboard'
  | 'website'
  | 'orders'
  | 'products'
  | 'production'
  | 'inventory'
  | 'costing'
  | 'customers'
  | 'finance'
  | 'suppliers'
  | 'marketing'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentModule: NavModule;
  onSelectModule: (mod: NavModule) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  badgeCounts?: {
    pendingOrders?: number;
    lowStock?: number;
    activePrints?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  isOpenMobile,
  onCloseMobile,
  badgeCounts = {},
}) => {
  const { currentUser, role, switchRole, canAccessFinance, logout } = useAuth();

  const navItems: {
    id: NavModule;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
    locked?: boolean;
    section?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      section: 'Core',
    },
    {
      id: 'website',
      label: 'Storefront Builder',
      icon: <Globe className="w-5 h-5" />,
      badge: 1,
      badgeColor: 'bg-emerald-500 text-white',
      section: 'Storefront',
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingCart className="w-5 h-5" />,
      badge: badgeCounts.pendingOrders,
      badgeColor: 'bg-indigo-500 text-white',
      section: 'Core',
    },
    {
      id: 'products',
      label: 'Products & Catalog',
      icon: <Box className="w-5 h-5" />,
      section: 'Core',
    },
    {
      id: 'production',
      label: 'Production Queue',
      icon: <Printer className="w-5 h-5" />,
      badge: badgeCounts.activePrints,
      badgeColor: 'bg-emerald-500 text-white',
      section: 'Operations',
    },
    {
      id: 'inventory',
      label: 'Filaments & Stock',
      icon: <Layers className="w-5 h-5" />,
      badge: badgeCounts.lowStock,
      badgeColor: 'bg-amber-500 text-white',
      section: 'Operations',
    },
    {
      id: 'costing',
      label: 'Cost Calculator',
      icon: <Calculator className="w-5 h-5" />,
      section: 'Operations',
    },
    {
      id: 'customers',
      label: 'Customers (CRM)',
      icon: <Users className="w-5 h-5" />,
      section: 'Management',
    },
    {
      id: 'finance',
      label: 'Finance & P&L',
      icon: <DollarSign className="w-5 h-5" />,
      locked: !canAccessFinance,
      section: 'Management',
    },
    {
      id: 'suppliers',
      label: 'Suppliers & POs',
      icon: <Truck className="w-5 h-5" />,
      section: 'Management',
    },
    {
      id: 'marketing',
      label: 'Marketing & Ads',
      icon: <TrendingUp className="w-5 h-5" />,
      section: 'Growth',
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      section: 'Growth',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      section: 'System',
    },
  ];

  const handleSelect = (mod: NavModule, locked?: boolean) => {
    if (locked) return;
    onSelectModule(mod);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white shadow-md shadow-indigo-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-slate-900 dark:text-white text-lg">
                PrintHub
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                  3D OS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Business Manager</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item, idx) => {
            const isActive = currentModule === item.id;
            const showSection = idx === 0 || navItems[idx - 1].section !== item.section;

            return (
              <React.Fragment key={item.id}>
                {showSection && item.section && (
                  <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {item.section}
                  </div>
                )}
                <button
                  onClick={() => handleSelect(item.id, item.locked)}
                  disabled={item.locked}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    item.locked
                      ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600'
                      : isActive
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`${
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.locked && (
                      <span className="flex items-center gap-1 text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        <Lock className="w-3 h-3" /> Owner
                      </span>
                    )}
                    {typeof item.badge === 'number' && item.badge > 0 && !item.locked && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold shadow-xs ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* User Profile & Role Switcher */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Active Role
            </span>
            <select
              value={role}
              onChange={(e) => switchRole(e.target.value as any)}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-2 py-1 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="owner">👑 Owner</option>
              <option value="staff">🛠️ Staff</option>
              <option value="viewer">👀 Viewer</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="relative">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                    role === 'owner'
                      ? 'bg-purple-500'
                      : role === 'staff'
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  }`}
                />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                  {role} Account
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out / Reset"
              className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
