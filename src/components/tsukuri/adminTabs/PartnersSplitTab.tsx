import React, { useState } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Wallet,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';
import { formatPrice, formatIndianDateShort } from '../tsukuriData.ts';

export interface PartnerDrawing {
  id: string;
  partner: 'Aditya' | 'Anshuman';
  amount: number;
  date: string;
  description: string;
  category: 'Profit Draw' | 'Capital Contribution' | 'Equipment Reimbursement';
}

interface PartnersSplitTabProps {
  totalRevenueINR: number;
  totalExpensesINR: number;
}

export const PartnersSplitTab: React.FC<PartnersSplitTabProps> = ({
  totalRevenueINR,
  totalExpensesINR,
}) => {
  // Configurable Profit Split Percentage (Default 50-50)
  const [adityaSplitPercent, setAdityaSplitPercent] = useState<number>(50);
  const anshumanSplitPercent = 100 - adityaSplitPercent;

  // Partner Drawings & Capital Transactions
  const [transactions, setTransactions] = useState<PartnerDrawing[]>([
    {
      id: 'tx-1',
      partner: 'Aditya',
      amount: 8000,
      date: '2026-10-01',
      description: 'Monthly Partner Drawing (Bambu Lab Print Farm Share)',
      category: 'Profit Draw',
    },
    {
      id: 'tx-2',
      partner: 'Anshuman',
      amount: 8000,
      date: '2026-10-01',
      description: 'Monthly Partner Drawing (E-Commerce & CAD Operations)',
      category: 'Profit Draw',
    },
    {
      id: 'tx-3',
      partner: 'Aditya',
      amount: 12000,
      date: '2026-09-20',
      description: 'PEI Build Plate & 0.2mm Nozzles Seed Capital',
      category: 'Capital Contribution',
    },
    {
      id: 'tx-4',
      partner: 'Anshuman',
      amount: 15000,
      date: '2026-09-18',
      description: 'Meta Ads & Packaging Design Seed Capital',
      category: 'Capital Contribution',
    },
  ]);

  // Modal State for adding partner withdrawal or contribution
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [partnerSelect, setPartnerSelect] = useState<'Aditya' | 'Anshuman'>('Aditya');
  const [amountInput, setAmountInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [categorySelect, setCategorySelect] = useState<'Profit Draw' | 'Capital Contribution' | 'Equipment Reimbursement'>('Profit Draw');

  // Calculations
  const netProfitINR = totalRevenueINR - totalExpensesINR;
  const isProfitable = netProfitINR >= 0;

  // Aditya Shares
  const adityaShareINR = Math.round((netProfitINR * adityaSplitPercent) / 100);
  const adityaDraws = transactions
    .filter((t) => t.partner === 'Aditya' && t.category === 'Profit Draw')
    .reduce((sum, t) => sum + t.amount, 0);
  const adityaContributions = transactions
    .filter((t) => t.partner === 'Aditya' && t.category === 'Capital Contribution')
    .reduce((sum, t) => sum + t.amount, 0);
  const adityaNetBalance = adityaShareINR - adityaDraws + adityaContributions;

  // Anshuman Shares
  const anshumanShareINR = netProfitINR - adityaShareINR;
  const anshumanDraws = transactions
    .filter((t) => t.partner === 'Anshuman' && t.category === 'Profit Draw')
    .reduce((sum, t) => sum + t.amount, 0);
  const anshumanContributions = transactions
    .filter((t) => t.partner === 'Anshuman' && t.category === 'Capital Contribution')
    .reduce((sum, t) => sum + t.amount, 0);
  const anshumanNetBalance = anshumanShareINR - anshumanDraws + anshumanContributions;

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amountInput);
    if (!amt || !descInput) return;

    const newTx: PartnerDrawing = {
      id: `tx-${Date.now()}`,
      partner: partnerSelect,
      amount: amt,
      date: new Date().toISOString().slice(0, 10),
      description: descInput,
      category: categorySelect,
    };

    setTransactions([newTx, ...transactions]);
    setIsModalOpen(false);
    setAmountInput('');
    setDescInput('');
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xs border border-slate-100 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1e4b3e]" />
            <h2 className="font-bubbly text-2xl text-[#1a2e26]">
              ADITYA & ANSHUMAN CO-FOUNDER P&L SPLIT
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Exclusive partner dashboard managing 50/50 profit distributions, capital contributions, and ledger drawings.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs tracking-wider flex items-center gap-1.5 self-start sm:self-auto cursor-pointer hover:bg-[#15342b] transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ LOG PARTNER PAYOUT / DRAW</span>
        </button>
      </div>

      {/* Global P&L Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#e8ece1]/50 border border-slate-200">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Total Net Revenue
          </span>
          <span className="font-bubbly text-2xl text-[#1a2e26] mt-1 block">
            {formatPrice(totalRevenueINR)}
          </span>
          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Storefront + Custom CAD Commissions</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#e8ece1]/50 border border-slate-200">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Total Studio Expenses
          </span>
          <span className="font-bubbly text-2xl text-rose-600 mt-1 block">
            {formatPrice(totalExpensesINR)}
          </span>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Filaments, Power, Ads, Courier & Packaging
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#1e4b3e] text-white shadow-xs">
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">
            Net Distributable Profit / (Loss)
          </span>
          <span className="font-bubbly text-2xl text-[#f3b755] mt-1 block">
            {formatPrice(netProfitINR)}
          </span>
          <span className="text-[11px] text-emerald-300 font-bold flex items-center gap-1 mt-1">
            <Percent className="w-3.5 h-3.5" />
            <span>
              Net Margin: {totalRevenueINR > 0 ? Math.round((netProfitINR / totalRevenueINR) * 100) : 0}%
            </span>
          </span>
        </div>
      </div>

      {/* Split Ratio Slider & Control */}
      <div className="p-4 bg-[#e8ece1]/40 rounded-2xl border border-slate-200 space-y-2">
        <div className="flex justify-between items-center text-xs font-bold text-[#1a2e26]">
          <span>Co-Founder Profit Allocation Ratio</span>
          <span className="font-mono text-[#1e4b3e]">
            Aditya: {adityaSplitPercent}% | Anshuman: {anshumanSplitPercent}%
          </span>
        </div>
        <input
          type="range"
          min="10"
          max="90"
          value={adityaSplitPercent}
          onChange={(e) => setAdityaSplitPercent(Number(e.target.value))}
          className="w-full accent-[#1e4b3e] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-bold">
          <span>Aditya (10%)</span>
          <span>50% - 50% Equal Partnership</span>
          <span>Aditya (90%)</span>
        </div>
      </div>

      {/* Individual Co-Founder Balance Bento Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ADITYA BENTO */}
        <div className="p-5 rounded-3xl bg-white border-2 border-[#1e4b3e] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#1e4b3e] text-[#f3b755] font-bubbly text-base flex items-center justify-center font-bold">
                AD
              </div>
              <div>
                <h3 className="font-bubbly text-lg text-[#1a2e26]">Aditya</h3>
                <span className="text-[10px] font-bold text-[#1e4b3e] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  CO-FOUNDER ({adityaSplitPercent}% PROFIT SHARE)
                </span>
              </div>
            </div>
            <Shield className="w-5 h-5 text-[#1e4b3e]" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-[#e8ece1]/50">
              <span className="text-[10px] text-slate-400 block font-bold">Profit Allocated</span>
              <strong className="text-base text-[#1e4b3e] font-bubbly">{formatPrice(adityaShareINR)}</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#e8ece1]/50">
              <span className="text-[10px] text-slate-400 block font-bold">Drawings Taken</span>
              <strong className="text-base text-rose-600 font-bubbly">-{formatPrice(adityaDraws)}</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#e8ece1]/50">
              <span className="text-[10px] text-slate-400 block font-bold">Capital Invested</span>
              <strong className="text-base text-slate-800 font-bubbly">+{formatPrice(adityaContributions)}</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#1e4b3e] text-white">
              <span className="text-[10px] text-slate-300 block font-bold">Net Available Balance</span>
              <strong className="text-base text-[#f3b755] font-bubbly">{formatPrice(adityaNetBalance)}</strong>
            </div>
          </div>
        </div>

        {/* ANSHUMAN BENTO */}
        <div className="p-5 rounded-3xl bg-white border-2 border-[#ea8f5a] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#ea8f5a] text-white font-bubbly text-base flex items-center justify-center font-bold">
                AN
              </div>
              <div>
                <h3 className="font-bubbly text-lg text-[#1a2e26]">Anshuman</h3>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  CO-FOUNDER ({anshumanSplitPercent}% PROFIT SHARE)
                </span>
              </div>
            </div>
            <Shield className="w-5 h-5 text-[#ea8f5a]" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-[#e8ece1]/50">
              <span className="text-[10px] text-slate-400 block font-bold">Profit Allocated</span>
              <strong className="text-base text-[#1e4b3e] font-bubbly">{formatPrice(anshumanShareINR)}</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#e8ece1]/50">
              <span className="text-[10px] text-slate-400 block font-bold">Drawings Taken</span>
              <strong className="text-base text-rose-600 font-bubbly">-{formatPrice(anshumanDraws)}</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#e8ece1]/50">
              <span className="text-[10px] text-slate-400 block font-bold">Capital Invested</span>
              <strong className="text-base text-slate-800 font-bubbly">+{formatPrice(anshumanContributions)}</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#ea8f5a] text-white">
              <span className="text-[10px] text-amber-100 block font-bold">Net Available Balance</span>
              <strong className="text-base text-white font-bubbly">{formatPrice(anshumanNetBalance)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Payout & Capital Ledger Table */}
      <div className="space-y-3 pt-2">
        <h3 className="font-bubbly text-base text-[#1a2e26] uppercase tracking-wider flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[#1e4b3e]" />
          <span>Partner Ledger & Payout History</span>
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#1e4b3e] text-[#f3b755] font-bubbly uppercase text-[10px]">
              <tr>
                <th className="p-3">Date (DD/MM/YYYY)</th>
                <th className="p-3">Partner</th>
                <th className="p-3">Category</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Amount (INR)</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-800">
                    {formatIndianDateShort(tx.date)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        tx.partner === 'Aditya'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tx.partner}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 font-bold">{tx.category}</td>
                  <td className="p-3 text-slate-700">{tx.description}</td>
                  <td
                    className={`p-3 text-right font-mono font-bold text-sm ${
                      tx.category === 'Profit Draw' ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {tx.category === 'Profit Draw' ? '-' : '+'}
                    {formatPrice(tx.amount)}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteTransaction(tx.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for adding drawing/contribution */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-6 space-y-4 shadow-2xl border-4 border-[#e8ece1]">
            <div className="flex justify-between items-center">
              <h3 className="font-bubbly text-lg text-[#1a2e26]">LOG PARTNER TRANSACTION</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold">Partner Name</label>
                <select
                  value={partnerSelect}
                  onChange={(e) => setPartnerSelect(e.target.value as any)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                >
                  <option value="Aditya">Aditya (50% Share)</option>
                  <option value="Anshuman">Anshuman (50% Share)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold">Transaction Category</label>
                <select
                  value={categorySelect}
                  onChange={(e) => setCategorySelect(e.target.value as any)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                >
                  <option value="Profit Draw">Profit Draw / Partner Payout</option>
                  <option value="Capital Contribution">Capital Contribution (Investment)</option>
                  <option value="Equipment Reimbursement">Equipment / Farm Reimbursement</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold">Amount in INR (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold">Description / Purpose</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly profit draw or Hotend purchase"
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs tracking-wider"
                >
                  RECORD TRANSACTION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
