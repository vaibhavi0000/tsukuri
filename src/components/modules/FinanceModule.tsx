import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  Filter,
  Receipt,
  Lock,
  Calendar,
  CreditCard,
  Building,
  Trash2,
  FileSpreadsheet,
  X,
  PieChart as PieIcon,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Expense, Order } from '../../types/index.ts';
import { formatCurrency, formatDate } from '../../lib/utils.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface FinanceModuleProps {
  expenses: Expense[];
  orders: Order[];
  onAddExpense: (expense: Partial<Expense>) => Promise<void>;
  onDeleteExpense: (id: number) => Promise<void>;
}

const EXPENSE_CATEGORIES = [
  'filament',
  'electricity',
  'rent',
  'ads',
  'packaging',
  'courier',
  'software',
  'salaries',
  'maintenance',
  'other',
];

export const FinanceModule: React.FC<FinanceModuleProps> = ({
  expenses,
  orders,
  onAddExpense,
  onDeleteExpense,
}) => {
  const { canAccessFinance, canEdit, isViewer } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('filament');
  const [amount, setAmount] = useState(1500);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [recurring, setRecurring] = useState(false);

  // If user role is Staff, finance is strictly forbidden by specification
  if (!canAccessFinance) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center max-w-lg mx-auto mt-12 shadow-md">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Owner-Only Financial Access
        </h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          The Finance & P&L module contains sensitive workshop margins, rent, salary distributions, and profit reports.
          Your current active role (<strong>Staff</strong>) is restricted to Orders, Production, and Inventory operations.
        </p>
        <p className="text-[11px] text-slate-400 mt-4 italic">
          Switch to Owner role via the bottom-left profile dropdown to review financials.
        </p>
      </div>
    );
  }

  // Calculate metrics
  const validOrders = orders.filter((o) => o.status !== 'Cancelled' && o.status !== 'Returned/Cancelled');
  const grossRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossRevenue - totalExpenses;
  const netMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

  // Unpaid / COD tracking
  const pendingOrders = orders.filter((o) => o.paymentStatus === 'Pending' || o.paymentStatus === 'COD');
  const pendingAmount = pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Filtered expenses
  const filteredExpenses = expenses.filter(
    (e) => categoryFilter === 'All' || e.category === categoryFilter
  );

  // Category aggregations for chart
  const categoryTotals: Record<string, number> = {};
  for (const exp of expenses) {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  }
  const chartData = Object.entries(categoryTotals).map(([cat, amt]) => ({
    category: cat.toUpperCase(),
    amount: amt,
  }));

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddExpense({
      title,
      category,
      amount: Number(amount),
      date,
      paymentMethod,
      notes: notes || null,
      recurring,
    });
    setIsAddModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Title', 'Category', 'Amount (INR)', 'Payment Method', 'Notes'];
    const rows = expenses.map((e) => [
      e.id,
      formatDate(e.date),
      `"${e.title.replace(/"/g, '""')}"`,
      e.category,
      e.amount,
      e.paymentMethod || '',
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `printhub_expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            Financial Management & P&L
          </h2>
          <p className="text-xs text-slate-500">
            Real-time cash flow, auto-synced order sales, workshop expenses, and pending COD collections.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export P&L (CSV)
          </button>

          {!isViewer && (
            <button
              onClick={() => {
                setTitle('');
                setCategory('filament');
                setAmount(1500);
                setDate(new Date().toISOString().slice(0, 10));
                setNotes('');
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              New Expense
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Gross Sales (Orders)</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {formatCurrency(grossRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{validOrders.length} billed orders</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Total Operating Expenses</span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(totalExpenses)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{expenses.length} expense entries</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Net Business Profit</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(netProfit)}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-semibold">{netMargin}% Net Margin</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Pending COD / Receivables</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(pendingAmount)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{pendingOrders.length} unpaid / COD orders</p>
        </div>
      </div>

      {/* Expense Category Chart */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
          Expenses Breakdown by Category
        </h3>
        <p className="text-xs text-slate-500 mb-4">Filament restocks, electricity duty cycles, courier accounts, and staff</p>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val / 1000}k`} />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val)), 'Total Spent']}
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Recorded Expense Ledger
          </span>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="All">Category: All</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Title / Purpose</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Amount</th>
                {!isViewer && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-slate-500">{formatDate(exp.date)}</td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{exp.title}</p>
                    {exp.notes && <p className="text-[11px] text-slate-400 italic">{exp.notes}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold uppercase text-[10px]">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {exp.paymentMethod || 'Bank Transfer'}
                  </td>
                  <td className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(exp.amount)}
                  </td>
                  {!isViewer && (
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Record Business Expense</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Expense Description *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 5x Spools PETG Restock"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="NetBanking">NetBanking / NEFT</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Notes / Invoice #</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="PO #402, BESCOM invoice, etc."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="recurring-check"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4"
                />
                <label htmlFor="recurring-check" className="font-medium text-slate-700 dark:text-slate-300">
                  Recurring monthly expense (e.g. software, rent, electricity)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
