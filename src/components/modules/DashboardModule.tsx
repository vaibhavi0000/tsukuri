import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Layers,
  Printer,
  Clock,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Sparkles,
  Globe,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency, formatDate } from '../../lib/utils.ts';
import { Order, PrintJob, FilamentSpool } from '../../types/index.ts';
import { NavModule } from '../layout/Sidebar.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface DashboardModuleProps {
  data: {
    kpis: {
      revenueToday: number;
      revenueThisWeek: number;
      revenueThisMonth: number;
      profitThisMonth: number;
      ordersTodayCount: number;
      ordersThisWeekCount: number;
      ordersThisMonthCount: number;
      pendingOrdersCount: number;
      lowStockSpoolsCount: number;
      activePrintersCount: number;
      totalPrintersCount: number;
    };
    charts: {
      monthlyFinancials: { month: string; revenue: number; expenses: number; profit: number }[];
      salesByChannel: { channel: string; orders: number; revenue: number }[];
      orderStatusBreakdown: { status: string; count: number }[];
    };
    needsAttention: {
      overdueOrders: Order[];
      failedPrints: PrintJob[];
      lowStockSpools: FilamentSpool[];
      unpaidOrders: Order[];
    };
  } | null;
  onNavigate: (module: NavModule, itemId?: number | string) => void;
  onRefresh: () => void;
}

const CHANNEL_COLORS: Record<string, string> = {
  'Own website': '#6366f1',
  Instagram: '#ec4899',
  WhatsApp: '#10b981',
  Amazon: '#f59e0b',
  Etsy: '#f97316',
  Meesho: '#8b5cf6',
  Flipkart: '#0284c7',
  Other: '#64748b',
};

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  data,
  onNavigate,
  onRefresh,
}) => {
  const { canAccessFinance } = useAuth();

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading PrintHub telemetry & metrics...</p>
        </div>
      </div>
    );
  }

  const { kpis, charts, needsAttention } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Live Workshop Feed
            </span>
            <span className="text-xs text-indigo-200">&bull; Cloud SQL Connected</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-1">
            PrintHub Operations Command
          </h2>
          <p className="text-xs text-indigo-200 max-w-xl mt-0.5">
            Real-time tracking of 3D farm production, filament levels, active sales channels, and financials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('website')}
            className="px-3.5 py-2 text-xs font-bold bg-indigo-500/30 hover:bg-indigo-500/50 text-white rounded-xl border border-indigo-400/40 shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Globe className="w-4 h-4 text-cyan-300" />
            <span>Storefront Builder</span>
          </button>

          <button
            onClick={() => onNavigate('production')}
            className="px-4 py-2 text-xs font-bold bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Farm View ({kpis.activePrintersCount}/{kpis.totalPrintersCount} Active)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Today&apos;s Revenue
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {canAccessFinance ? formatCurrency(kpis.revenueToday) : '₹ •••••'}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {kpis.ordersTodayCount} orders
              </span>{' '}
              placed today
            </p>
          </div>
        </div>

        {/* This Month's Revenue */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              This Month&apos;s Revenue
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {canAccessFinance ? formatCurrency(kpis.revenueThisMonth) : '₹ •••••'}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {kpis.ordersThisMonthCount} orders
              </span>{' '}
              this month
            </p>
          </div>
        </div>

        {/* Pending Orders */}
        <div
          onClick={() => onNavigate('orders')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pending Orders
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {kpis.pendingOrdersCount}
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium flex items-center gap-1">
              In queue / In production &bull; View <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </div>

        {/* Low Stock Spools Alert */}
        <div
          onClick={() => onNavigate('inventory')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs cursor-pointer hover:border-rose-400 dark:hover:border-rose-600 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Low-Stock Alerts
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {kpis.lowStockSpoolsCount}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              Spools below 200g &bull; Restock <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </div>
      </div>

      {/* Needs Attention Action Row */}
      {(needsAttention.overdueOrders.length > 0 ||
        needsAttention.failedPrints.length > 0 ||
        needsAttention.lowStockSpools.length > 0) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Needs Attention
              </h3>
            </div>
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              Urgent tasks requiring manual intervention
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Overdue */}
            {needsAttention.overdueOrders.length > 0 && (
              <div
                onClick={() => onNavigate('orders')}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-900/60 cursor-pointer hover:shadow-xs transition-shadow"
              >
                <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Overdue Order
                  </span>
                  <span>{needsAttention.overdueOrders[0].orderNumber}</span>
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {needsAttention.overdueOrders[0].customerName}
                </p>
                <p className="text-[11px] text-rose-500 font-semibold">
                  Deadline was: {formatDate(needsAttention.overdueOrders[0].expectedDeliveryDate)}
                </p>
              </div>
            )}

            {/* Failed print */}
            {needsAttention.failedPrints.length > 0 && (
              <div
                onClick={() => onNavigate('production')}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-300 dark:border-rose-900/60 cursor-pointer hover:shadow-xs transition-shadow"
              >
                <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400 font-semibold mb-1">
                  <span className="flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5" /> Print Failure Logged
                  </span>
                  <span>{needsAttention.failedPrints[0].printerName || 'Farm'}</span>
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                  {needsAttention.failedPrints[0].jobName}
                </p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 truncate">
                  {needsAttention.failedPrints[0].failureReason || 'Adhesion loss'}
                </p>
              </div>
            )}

            {/* Low filament */}
            {needsAttention.lowStockSpools.length > 0 && (
              <div
                onClick={() => onNavigate('inventory')}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-300 dark:border-blue-900/60 cursor-pointer hover:shadow-xs transition-shadow"
              >
                <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-400 font-semibold mb-1">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> Low Filament Spool
                  </span>
                  <span>{needsAttention.lowStockSpools[0].remainingWeightGrams}g left</span>
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                  {needsAttention.lowStockSpools[0].name}
                </p>
                <p className="text-[11px] text-slate-500">
                  {needsAttention.lowStockSpools[0].brand} &bull; {needsAttention.lowStockSpools[0].material}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue vs Expenses Chart (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Revenue vs Expenses (Monthly)
              </h3>
              <p className="text-xs text-slate-500">Cash performance over past 6 calendar months</p>
            </div>
            {canAccessFinance && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                Net Profit: {formatCurrency(kpis.profitThisMonth)}
              </span>
            )}
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyFinancials} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), '']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
                {canAccessFinance && (
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorExpenses)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Channel Donut */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Sales by Channel
            </h3>
            <p className="text-xs text-slate-500 mb-2">Order distribution across online storefronts</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.salesByChannel}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="orders"
                  nameKey="channel"
                >
                  {charts.salesByChannel.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHANNEL_COLORS[entry.channel] || '#94a3b8'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [
                    `${val} orders (${formatCurrency(item.payload.revenue)})`,
                    item.payload.channel,
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Channel breakdown legend list */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {charts.salesByChannel.slice(0, 4).map((ch) => (
              <div key={ch.channel} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CHANNEL_COLORS[ch.channel] || '#94a3b8' }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{ch.channel}</span>
                </div>
                <span className="text-slate-500 font-mono">
                  {ch.orders} orders ({formatCurrency(ch.revenue)})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Status Breakdown & Quick Action shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Order Pipeline Status
              </h3>
              <p className="text-xs text-slate-500">Live order state breakdown</p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              All Orders <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {charts.orderStatusBreakdown.map((item) => {
              const totalOrders = charts.orderStatusBreakdown.reduce((sum, i) => sum + i.count, 0) || 1;
              const pct = Math.round((item.count / totalOrders) * 100);

              let barColor = 'bg-indigo-500';
              if (item.status === 'Delivered') barColor = 'bg-emerald-500';
              if (item.status === 'In Production') barColor = 'bg-blue-500';
              if (item.status === 'Shipped') barColor = 'bg-cyan-500';
              if (item.status === 'Cancelled' || item.status === 'Returned/Cancelled') barColor = 'bg-rose-500';

              return (
                <div key={item.status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{item.status}</span>
                    <span className="text-slate-500 font-mono">
                      {item.count} orders ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Launchpad & Quick Links */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
              PrintHub Action Launchpad
            </h3>
            <p className="text-xs text-slate-500 mb-4">Fast shortcuts for daily workshop routines</p>

            <div className="grid grid-cols-2 gap-3 text-left">
              <button
                onClick={() => onNavigate('production')}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <Printer className="w-5 h-5 text-indigo-500 mb-1.5" />
                <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">Printer Farm</p>
                <p className="text-[11px] text-slate-500">Monitor bed & nozzle temps</p>
              </button>

              <button
                onClick={() => onNavigate('costing')}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <Sparkles className="w-5 h-5 text-purple-500 mb-1.5" />
                <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">Cost Calculator</p>
                <p className="text-[11px] text-slate-500">Calculate quote & GST margin</p>
              </button>

              <button
                onClick={() => onNavigate('inventory')}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <Layers className="w-5 h-5 text-amber-500 mb-1.5" />
                <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">Filament Spools</p>
                <p className="text-[11px] text-slate-500">Track remaining spool weights</p>
              </button>

              <button
                onClick={() => onNavigate('customers')}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <ShoppingCart className="w-5 h-5 text-emerald-500 mb-1.5" />
                <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">Customer CRM</p>
                <p className="text-[11px] text-slate-500">View repeat buyers & LTV</p>
              </button>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <span>Server: PostgreSQL (Cloud SQL)</span>
            <button
              onClick={onRefresh}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Sync Metrics Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
