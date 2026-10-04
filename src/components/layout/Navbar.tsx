import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  ShoppingCart,
  Box,
  Layers,
  DollarSign,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface NavbarProps {
  onOpenMobileSidebar: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onQuickAdd: (type: 'order' | 'product' | 'spool' | 'expense') => void;
  notificationCount: number;
  currency?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileSidebar,
  onOpenSearch,
  onOpenNotifications,
  onQuickAdd,
  notificationCount,
  currency = 'INR',
}) => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, role, canAccessFinance, canEdit, signInWithGoogle } = useAuth();
  const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);
  const quickAddRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
        setShowQuickAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      {/* Left: Mobile hamburger & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center justify-between w-full max-w-sm px-3.5 py-2 text-sm text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400" />
            <span className="text-xs md:text-sm font-normal text-slate-500 dark:text-slate-400">
              Search orders, products, customers...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Currency & GST Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700">
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">{currency === 'INR' ? '₹ INR' : currency}</span>
          <span className="text-slate-400">|</span>
          <span className="text-[11px] text-slate-500">18% GST</span>
        </div>

        {/* Quick Add Menu */}
        {canEdit && (
          <div className="relative" ref={quickAddRef}>
            <button
              onClick={() => setShowQuickAddMenu(!showQuickAddMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Add</span>
            </button>

            {showQuickAddMenu && (
              <div className="absolute right-0 mt-2 w-48 py-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    onQuickAdd('order');
                    setShowQuickAddMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left"
                >
                  <ShoppingCart className="w-4 h-4 text-indigo-500" />
                  New Order
                </button>
                <button
                  onClick={() => {
                    onQuickAdd('product');
                    setShowQuickAddMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left"
                >
                  <Box className="w-4 h-4 text-emerald-500" />
                  New Product
                </button>
                <button
                  onClick={() => {
                    onQuickAdd('spool');
                    setShowQuickAddMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left"
                >
                  <Layers className="w-4 h-4 text-amber-500" />
                  New Spool
                </button>
                {canAccessFinance && (
                  <button
                    onClick={() => {
                      onQuickAdd('expense');
                      setShowQuickAddMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left border-t border-slate-100 dark:border-slate-700/60"
                  >
                    <DollarSign className="w-4 h-4 text-rose-500" />
                    New Expense
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Notifications & Alerts"
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse">
              {notificationCount}
            </span>
          )}
        </button>

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Toggle Dark / Light theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Google Sign In action if not signed in with Google */}
        {currentUser.uid.startsWith('user_') || currentUser.uid.includes('default') ? (
          <button
            onClick={signInWithGoogle}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors"
            title="Link with Google Account"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google Login</span>
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-medium">Firebase Connected</span>
          </div>
        )}
      </div>
    </header>
  );
};
