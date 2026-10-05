import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, Percent, DollarSign, Sparkles } from 'lucide-react';
import { formatPrice } from '../tsukuriData.ts';

export interface DiscountCodeItem {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  description?: string;
  isActive: boolean;
  usageCount?: number;
  createdAt?: string;
}

export const DiscountsTab: React.FC = () => {
  const [discounts, setDiscounts] = useState<DiscountCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCodeItem | null>(null);

  // Form state
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<'percentage' | 'flat'>('percentage');
  const [formValue, setFormValue] = useState<number>(10);
  const [formMinOrder, setFormMinOrder] = useState<number>(0);
  const [formMaxDiscount, setFormMaxDiscount] = useState<number | undefined>(undefined);
  const [formDesc, setFormDesc] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load discounts from API
  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/discounts');
      if (res.ok) {
        const data = await res.json();
        setDiscounts(data);
      }
    } catch (err) {
      console.error('Failed to load discounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenCreateModal = () => {
    setEditingDiscount(null);
    setFormCode('');
    setFormType('percentage');
    setFormValue(15);
    setFormMinOrder(0);
    setFormMaxDiscount(undefined);
    setFormDesc('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (d: DiscountCodeItem) => {
    setEditingDiscount(d);
    setFormCode(d.code);
    setFormType(d.discountType);
    setFormValue(d.value);
    setFormMinOrder(d.minOrderValue || 0);
    setFormMaxDiscount(d.maxDiscount);
    setFormDesc(d.description || '');
    setFormIsActive(d.isActive);
    setIsModalOpen(true);
  };

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      showNotification('error', 'Discount code name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: formCode.trim().toUpperCase(),
        discountType: formType,
        value: Number(formValue),
        minOrderValue: Number(formMinOrder) || 0,
        maxDiscount: formMaxDiscount ? Number(formMaxDiscount) : undefined,
        description: formDesc.trim(),
        isActive: formIsActive,
      };

      if (editingDiscount) {
        const res = await fetch(`/api/discounts/${editingDiscount.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to update discount');
        }
        showNotification('success', `Discount code ${payload.code} updated successfully!`);
      } else {
        const res = await fetch('/api/discounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to create discount');
        }
        showNotification('success', `New coupon code ${payload.code} created!`);
      }

      setIsModalOpen(false);
      await fetchDiscounts();
    } catch (err: any) {
      showNotification('error', err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDiscount = async (d: DiscountCodeItem) => {
    if (!window.confirm(`Are you sure you want to permanently delete discount coupon "${d.code}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/discounts/${d.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete coupon');
      showNotification('success', `Coupon ${d.code} deleted`);
      setDiscounts((prev) => prev.filter((item) => item.id !== d.id));
    } catch (err: any) {
      showNotification('error', err.message || 'Could not delete discount');
    }
  };

  const handleToggleStatus = async (d: DiscountCodeItem) => {
    const updatedStatus = !d.isActive;
    try {
      const res = await fetch(`/api/discounts/${d.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: updatedStatus }),
      });
      if (res.ok) {
        setDiscounts((prev) =>
          prev.map((item) => (item.id === d.id ? { ...item, isActive: updatedStatus } : item))
        );
        showNotification('success', `${d.code} is now ${updatedStatus ? 'ACTIVE' : 'INACTIVE'}`);
      }
    } catch {}
  };

  const filteredDiscounts = discounts.filter(
    (d) =>
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeCount = discounts.filter((d) => d.isActive).length;
  const totalUsages = discounts.reduce((acc, d) => acc + (d.usageCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-7 rounded-[2rem] shadow-xs border border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1e4b3e] text-[#f3b755] flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <h2 className="font-bubbly text-2xl text-[#1a2e26]">DISCOUNT CODES & COUPONS</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create, edit, toggle, and delete promotional discount vouchers for your 3D storefront.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-2.5 rounded-full bg-[#1e4b3e] hover:bg-[#15342b] text-[#f3b755] font-bubbly text-xs tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>+ CREATE NEW DISCOUNT CODE</span>
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xs ${
            notification.type === 'success'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-rose-100 text-rose-800 border border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#e8ece1]/70 border border-[#1e4b3e]/20">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Coupons</span>
          <span className="font-bubbly text-2xl text-[#1e4b3e] block mt-1">{discounts.length}</span>
          <span className="text-[10px] text-slate-500 font-medium">Configured in store</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Active Coupons</span>
          <span className="font-bubbly text-2xl text-emerald-800 block mt-1">{activeCount}</span>
          <span className="text-[10px] text-emerald-600 font-medium">Available at checkout</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#f3b755]/20 border border-[#f3b755]/50">
          <span className="text-[10px] uppercase font-bold text-[#1a2e26] block">Total Redemptions</span>
          <span className="font-bubbly text-2xl text-[#1a2e26] block mt-1">{totalUsages}</span>
          <span className="text-[10px] text-slate-600 font-medium">Customer orders applied</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <span className="text-[10px] uppercase font-bold text-amber-800 block">Online UPI Offer</span>
          <span className="font-bubbly text-2xl text-amber-900 block mt-1">₹10 FLAT</span>
          <span className="text-[10px] text-amber-700 font-medium">Auto zero-COD discount</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search discount code (e.g. TSUKURI10, PRINT15)..."
          className="w-full text-xs font-bold text-[#1a2e26] focus:outline-none bg-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 font-bold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Discounts Table */}
      <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-xs border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-bold animate-pulse">
            Loading discount coupons...
          </div>
        ) : filteredDiscounts.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Tag className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-500">No discount codes found.</p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs shadow-sm"
            >
              + Create First Discount Code
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#e8ece1]/60 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3 rounded-l-xl">Coupon Code</th>
                  <th className="p-3">Discount Value</th>
                  <th className="p-3">Min Order</th>
                  <th className="p-3">Max Cap</th>
                  <th className="p-3">Description / Terms</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDiscounts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-lg bg-[#1e4b3e] text-[#f3b755] font-mono font-black text-xs tracking-wider shadow-2xs">
                          {d.code}
                        </span>
                        {d.usageCount !== undefined && d.usageCount > 0 && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({d.usageCount} uses)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-bubbly text-sm font-bold text-[#1e4b3e]">
                        {d.discountType === 'percentage' ? `${d.value}% OFF` : `₹${d.value} FLAT`}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {d.minOrderValue ? `₹${d.minOrderValue}` : <span className="text-slate-400 font-sans">No Min</span>}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {d.maxDiscount ? `₹${d.maxDiscount}` : <span className="text-slate-400 font-sans">No Limit</span>}
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">
                      {d.description || '—'}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleStatus(d)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          d.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title="Click to toggle active status"
                      >
                        {d.isActive ? '● ACTIVE' : '○ INACTIVE'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(d)}
                          className="p-1.5 rounded-lg bg-[#e8ece1] hover:bg-[#d8dcd1] text-[#1e4b3e] cursor-pointer"
                          title="Edit discount code"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDiscount(d)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                          title="Delete discount code"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs p-3 sm:p-6">
          <div className="min-h-full flex items-center justify-center py-6 sm:py-10">
            <div className="bg-white rounded-[2rem] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl border-4 border-[#e8ece1] relative">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bubbly text-xl text-[#1a2e26]">
                    {editingDiscount ? 'EDIT DISCOUNT COUPON' : 'CREATE NEW DISCOUNT COUPON'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Configure voucher code rules and discount deductions for storefront customers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveDiscount} className="space-y-3.5 text-xs font-bold text-[#1a2e26]">
                {/* Code name */}
                <div>
                  <label className="block mb-1 uppercase text-[10px] text-slate-600 tracking-wider">
                    Coupon Code (Uppercase) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SUMMER25"
                    className="w-full bg-[#e8ece1]/40 border border-slate-200 rounded-xl p-3 font-mono text-sm font-black focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
                  />
                </div>

                {/* Type & Value */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 uppercase text-[10px] text-slate-600 tracking-wider">
                      Discount Type *
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                      className="w-full bg-[#e8ece1]/40 border border-slate-200 rounded-xl p-3 font-bold focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 uppercase text-[10px] text-slate-600 tracking-wider">
                      {formType === 'percentage' ? 'Percentage Off (%) *' : 'Flat Discount (₹) *'}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={formType === 'percentage' ? 100 : 50000}
                      value={formValue}
                      onChange={(e) => setFormValue(Number(e.target.value))}
                      className="w-full bg-[#e8ece1]/40 border border-slate-200 rounded-xl p-3 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
                    />
                  </div>
                </div>

                {/* Min Order & Max Cap */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 uppercase text-[10px] text-slate-600 tracking-wider">
                      Min Order Value (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formMinOrder}
                      onChange={(e) => setFormMinOrder(Number(e.target.value))}
                      placeholder="0 (No Minimum)"
                      className="w-full bg-[#e8ece1]/40 border border-slate-200 rounded-xl p-3 font-mono focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 uppercase text-[10px] text-slate-600 tracking-wider">
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formMaxDiscount || ''}
                      onChange={(e) => setFormMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Optional limit"
                      className="w-full bg-[#e8ece1]/40 border border-slate-200 rounded-xl p-3 font-mono focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block mb-1 uppercase text-[10px] text-slate-600 tracking-wider">
                    Description & Terms
                  </label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="e.g. 15% Maker Slicing Discount on all drops"
                    className="w-full bg-[#e8ece1]/40 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="discount-active-checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1e4b3e] focus:ring-[#1e4b3e] cursor-pointer"
                  />
                  <label htmlFor="discount-active-checkbox" className="text-xs cursor-pointer select-none">
                    <strong>Activate Coupon Code</strong> (Allow customers to apply during checkout)
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-3 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-full bg-[#1e4b3e] hover:bg-[#15342b] text-[#f3b755] font-bubbly text-xs tracking-wider shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'SAVING...' : editingDiscount ? 'UPDATE DISCOUNT CODE' : 'CREATE DISCOUNT CODE'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
