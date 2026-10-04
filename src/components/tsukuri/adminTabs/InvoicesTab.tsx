import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, Download, Search, FileText, Mail, Eye, Check } from 'lucide-react';
import { WorkshopOrder, formatPrice, formatIndianDate } from '../tsukuriData.ts';
import {
  printInvoiceDirectly,
  downloadInvoiceHTML,
  automateInvoiceSending,
  generateBeautifulEmailHTML,
} from '../../../lib/invoicePrinter.ts';
import { EmailInvoicePreviewModal } from '../EmailInvoicePreviewModal.tsx';
import { EmailDeliverySettingsCard } from './EmailDeliverySettingsCard.tsx';

interface InvoicesTabProps {
  ordersList: WorkshopOrder[];
}

export const InvoicesTab: React.FC<InvoicesTabProps> = ({ ordersList }) => {
  const [invoices, setInvoices] = useState<WorkshopOrder[]>(() => {
    if (ordersList && ordersList.length > 0) return ordersList;
    return [
      {
        id: 'inv-1',
        orderNumber: 'TSU-1001',
        customerName: 'Aarav Patel',
        email: 'aarav.patel@gmail.com',
        phone: '+91 98201 12345',
        address: '142 Palm Meadows, Whitefield',
        city: 'Bengaluru',
        items: [{ name: 'Zen Wave Planter v4 (Matte Matcha)', quantity: 2, priceINR: 599 }],
        subtotalINR: 1198,
        paymentMethod: 'Online',
        codFee: 0,
        onlineDiscount: 10,
        totalAmountINR: 1188,
        status: 'Delivered',
        paymentStatus: 'Paid',
        orderDate: '2026-09-30T10:00:00Z',
        courier: 'BlueDart Surface Express',
        trackingNumber: 'BLU84920194',
        notes: 'Handle with care: 100% bio-PLA',
      },
      {
        id: 'inv-2',
        orderNumber: 'TSU-1002',
        customerName: 'Priya Sharma',
        email: 'priya.s@outlook.com',
        phone: '+91 98450 67890',
        address: '88 Marine Drive, Churchgate',
        city: 'Mumbai',
        items: [{ name: 'Torii Headphone Rest (Teak Wood)', quantity: 1, priceINR: 1299 }],
        subtotalINR: 1299,
        paymentMethod: 'COD',
        codFee: 50,
        onlineDiscount: 0,
        totalAmountINR: 1349,
        status: 'Shipped',
        paymentStatus: 'COD',
        orderDate: '2026-10-01T14:30:00Z',
        courier: 'Delhivery Surface Express',
        trackingNumber: 'DEL99482103',
        notes: 'Customer requested gift box',
      },
    ];
  });

  useEffect(() => {
    if (ordersList && ordersList.length > 0) {
      setInvoices(ordersList);
    }
  }, [ordersList]);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custCity, setCustCity] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState(599);
  const [itemQty, setItemQty] = useState(1);
  const [payMethod, setPayMethod] = useState<'Online' | 'COD'>('Online');

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = itemPrice * itemQty;
    const isCOD = payMethod === 'COD';
    const total = subtotal + (isCOD ? 50 : -10);

    const newInv: WorkshopOrder = {
      id: `inv-${Date.now()}`,
      orderNumber: `TSU-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: custName,
      email: '',
      phone: custPhone,
      address: custAddress,
      city: custCity || 'India',
      items: [{ name: itemName, quantity: itemQty, priceINR: itemPrice }],
      subtotalINR: subtotal,
      paymentMethod: payMethod,
      codFee: isCOD ? 50 : 0,
      onlineDiscount: isCOD ? 0 : 10,
      totalAmountINR: total,
      status: 'Confirmed',
      paymentStatus: isCOD ? 'COD' : 'Paid',
      orderDate: new Date().toISOString(),
      courier: 'BlueDart Surface Express',
      trackingNumber: `BLU${Math.floor(10000000 + Math.random() * 90000000)}`,
      notes: 'Custom manual tax invoice generated in admin ERP',
    };

    setInvoices([newInv, ...invoices]);
    setIsModalOpen(false);
  };

  const [previewOrder, setPreviewOrder] = useState<WorkshopOrder | null>(null);
  const [previewEmailHTML, setPreviewEmailHTML] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [emailNotification, setEmailNotification] = useState<string | null>(null);
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);

  const handlePreviewEmail = (inv: WorkshopOrder) => {
    const html = generateBeautifulEmailHTML(inv);
    setPreviewOrder(inv);
    setPreviewEmailHTML(html);
    setIsPreviewOpen(true);
  };

  const handleAutoSendEmail = async (inv: WorkshopOrder) => {
    if (!inv.email) {
      setEmailNotification(`Cannot send: Order #${inv.orderNumber} does not have a customer email address.`);
      setTimeout(() => setEmailNotification(null), 4000);
      return;
    }
    setSendingInvoiceId(inv.orderNumber);
    try {
      const res = await automateInvoiceSending(inv);
      setEmailNotification(
        res.message || `✓ Tax Invoice for #${inv.orderNumber} dispatched to ${inv.email} from commersgyan@gmail.com!`
      );
    } catch (err: any) {
      setEmailNotification(`Failed to dispatch invoice: ${err.message}`);
    } finally {
      setSendingInvoiceId(null);
      setTimeout(() => setEmailNotification(null), 5000);
    }
  };

  const handleDelete = (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  const filtered = invoices.filter(
    (inv) =>
      inv.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xs border border-slate-100 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bubbly text-xl sm:text-2xl text-[#1a2e26] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1e4b3e]" />
            <span>TAX INVOICES & PRINTABLE PACKING SLIPS</span>
          </h2>
          <p className="text-xs text-slate-500">
            GST-compliant invoices with Kyoto × Nusantara stamp, instant browser PDF print, and file downloads.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#e8ece1]/50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold"
            />
          </div>

          <button
            onClick={() => {
              setCustName('');
              setCustPhone('');
              setCustAddress('');
              setCustCity('');
              setItemName('Zen Wave Planter v4');
              setItemPrice(599);
              setItemQty(1);
              setPayMethod('Online');
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs tracking-wider flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ GENERATE CUSTOM INVOICE</span>
          </button>
        </div>
      </div>

      {/* Dispatched Invoice Toast / Notification Banner */}
      {emailNotification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-bold shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{emailNotification}</span>
          </div>
          <button
            onClick={() => setEmailNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 text-[11px] underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#e8ece1]/60 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3 rounded-l-xl">Invoice / Order #</th>
              <th className="p-3">Customer & Location</th>
              <th className="p-3">Purchased Items</th>
              <th className="p-3 text-right">Grand Total (INR)</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Courier Logistics</th>
              <th className="p-3 text-right rounded-r-xl">Print & Download</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3">
                  <span className="font-mono font-bold text-[#1e4b3e] block">INV-{inv.orderNumber}</span>
                  <span className="text-[11px] text-slate-700 font-mono font-bold block mt-0.5">
                    {formatIndianDate(inv.orderDate)}
                  </span>
                </td>
                <td className="p-3">
                  <span className="font-bold text-[#1a2e26] block">{inv.customerName}</span>
                  <span className="text-[11px] text-slate-500 block truncate max-w-[140px]">{inv.city}</span>
                </td>
                <td className="p-3 text-slate-600 max-w-xs">
                  {inv.items.map((it, idx) => (
                    <span key={idx} className="block text-[11px]">
                      {it.quantity}x {it.name}
                    </span>
                  ))}
                </td>
                <td className="p-3 text-right font-mono font-bold text-[#1e4b3e]">
                  {formatPrice(inv.totalAmountINR)}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.paymentMethod === 'COD' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {inv.paymentMethod} ({inv.paymentStatus})
                  </span>
                </td>
                <td className="p-3">
                  <span className="text-[11px] font-bold text-slate-700 block">{inv.courier || 'BlueDart'}</span>
                  <span className="text-[10px] font-mono text-slate-400">{inv.trackingNumber}</span>
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handlePreviewEmail(inv)}
                      className="p-1.5 rounded-lg bg-[#e8ece1] hover:bg-[#d8dcd1] text-[#1e4b3e]"
                      title="Preview beautiful invoice email with website theme"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAutoSendEmail(inv)}
                      disabled={sendingInvoiceId === inv.orderNumber}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      title={`Send official Kyoto tax invoice to customer email: ${inv.email || 'N/A'}`}
                    >
                      <Mail className={`w-3.5 h-3.5 ${sendingInvoiceId === inv.orderNumber ? 'animate-pulse' : ''}`} />
                      <span>{sendingInvoiceId === inv.orderNumber ? 'Sending...' : 'Send Invoice'}</span>
                    </button>
                    <button
                      onClick={() => printInvoiceDirectly(inv)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1e4b3e] hover:bg-[#15342b] text-[#f3b755] font-bubbly text-[11px] flex items-center gap-1 shadow-2xs active:scale-95"
                      title="Print Invoice directly to PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>PRINT PDF</span>
                    </button>
                    <button
                      onClick={() => downloadInvoiceHTML(inv)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                      title="Download HTML/PDF file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(inv.id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700"
                      title="Delete Invoice"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl border-4 border-[#e8ece1] space-y-4">
            <h3 className="font-bubbly text-xl text-[#1a2e26]">Generate Tax Invoice</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Patel"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98450 12345"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Delivery Address</label>
                  <input
                    type="text"
                    required
                    placeholder="Street / Flat"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City / State</label>
                  <input
                    type="text"
                    required
                    placeholder="Bengaluru"
                    value={custCity}
                    onChange={(e) => setCustCity(e.target.value)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Description</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(Number(e.target.value))}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={itemQty}
                    onChange={(e) => setItemQty(Number(e.target.value))}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  >
                    <option value="Online">Online UPI</option>
                    <option value="COD">COD</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-full bg-slate-100 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs shadow-md"
                >
                  CREATE INVOICE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {emailNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e4b3e] text-[#f3b755] px-4 py-2.5 rounded-2xl shadow-xl font-bubbly text-xs flex items-center gap-2 border border-[#f3b755]/30 animate-in slide-in-from-bottom">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{emailNotification}</span>
        </div>
      )}

      {previewOrder && (
        <EmailInvoicePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewOrder(null);
          }}
          order={previewOrder}
          emailHTML={previewEmailHTML}
        />
      )}

      {/* AUTOMATED INVOICE EMAIL DELIVERY CENTER & OUTBOX */}
      <div className="pt-6 border-t border-slate-100">
        <EmailDeliverySettingsCard />
      </div>
    </div>
  );
};
