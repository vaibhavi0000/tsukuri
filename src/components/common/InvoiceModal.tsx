import React, { useState } from 'react';
import { X, Printer as PrintIcon, FileText, Package, Download, CheckSquare } from 'lucide-react';
import { Order, BusinessSettings } from '../../types/index.ts';
import { formatCurrency, formatDate } from '../../lib/utils.ts';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
  settings?: BusinessSettings;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  onClose,
  settings,
}) => {
  const [viewMode, setViewMode] = useState<'invoice' | 'packingslip'>('invoice');

  if (!order) return null;

  const business = settings || {
    businessName: 'PrintHub 3D Labs',
    gstin: '29AAAAA0000A1Z5',
    email: 'support@printhub3d.com',
    phone: '+91 98765 43210',
    address: '104 Tech Spark Hub, Indiranagar, Bengaluru, KA 560038',
    currency: 'INR',
    electricityRatePerKwh: 8.5,
    defaultTaxRate: 18,
    machineDepreciationRatePerHour: 25,
    laborRatePerHour: 100,
  };

  const handlePrint = () => {
    window.print();
  };

  const subtotal = order.subtotal || order.totalAmount / 1.18;
  const tax = order.taxAmount || order.totalAmount - subtotal;
  const cgst = tax / 2;
  const sgst = tax / 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Controls Header (Hidden during print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('invoice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'invoice'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Tax Invoice
            </button>
            <button
              onClick={() => setViewMode('packingslip')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'packingslip'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              Packing Slip
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
            >
              <PrintIcon className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Container */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100 dark:bg-slate-950/40">
          <div
            id="printable-invoice-container"
            className="max-w-2xl mx-auto bg-white text-slate-900 p-8 rounded-xl shadow-lg border border-slate-200 text-sm font-sans"
          >
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-6 mb-6">
              <div>
                <h1 className="text-2xl font-black text-indigo-700 tracking-tight">
                  {business.businessName}
                </h1>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">{business.address}</p>
                <p className="text-xs text-slate-600 mt-1">
                  <strong>GSTIN:</strong> {business.gstin || '29AAAAA0000A1Z5'}
                </p>
                <p className="text-xs text-slate-600">
                  <strong>Contact:</strong> {business.phone} | {business.email}
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-bold text-xs uppercase tracking-wider mb-2">
                  {viewMode === 'invoice' ? 'Tax Invoice' : 'Packing Slip'}
                </span>
                <p className="text-sm font-bold text-slate-800">
                  {viewMode === 'invoice' ? `INV-${order.orderNumber}` : `PKG-${order.orderNumber}`}
                </p>
                <p className="text-xs text-slate-500">Order ID: {order.orderNumber}</p>
                <p className="text-xs text-slate-500">Date: {formatDate(order.orderDate)}</p>
                <p className="text-xs text-slate-500">Channel: {order.channel}</p>
              </div>
            </div>

            {/* Bill To & Ship To */}
            <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Bill To / Customer:
                </h3>
                <p className="font-semibold text-sm text-slate-900">{order.customerName}</p>
                <p className="text-slate-600">{order.customerPhone || 'Phone: -'}</p>
                <p className="text-slate-600">{order.customerEmail || 'Email: -'}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Shipping Address & Courier:
                </h3>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {order.shippingAddress || 'Store Pickup / Counter Sale'}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between">
                  <span>
                    <strong>Courier:</strong> {order.courierName || 'Standard Surface'}
                  </span>
                  <span>
                    <strong>AWB / Tracking:</strong> {order.trackingNumber || 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left border-collapse mb-6 text-xs">
              <thead>
                <tr className="bg-slate-100 border-y border-slate-300 font-bold text-slate-700">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3">HSN Code</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  {viewMode === 'invoice' && (
                    <>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </>
                  )}
                  {viewMode === 'packingslip' && (
                    <>
                      <th className="py-2.5 px-3 text-center">QC Check</th>
                      <th className="py-2.5 px-3 text-right">Weight (approx)</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{i + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {item.productName}
                        {item.sku && <span className="block text-[10px] text-slate-500 font-normal">SKU: {item.sku}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">39269099</td>
                      <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                      {viewMode === 'invoice' && (
                        <>
                          <td className="py-2.5 px-3 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-2.5 px-3 text-right font-semibold">{formatCurrency(item.totalPrice)}</td>
                        </>
                      )}
                      {viewMode === 'packingslip' && (
                        <>
                          <td className="py-2.5 px-3 text-center font-mono text-emerald-600">[ ✓ PASSED ]</td>
                          <td className="py-2.5 px-3 text-right font-mono">{(item.filamentGramsUsed || 100) * item.quantity}g</td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">1</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {order.isCustomOrder ? 'Custom 3D Print Job' : 'PrintHub 3D Product Order'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">39269099</td>
                    <td className="py-2.5 px-3 text-center font-bold">1</td>
                    {viewMode === 'invoice' && (
                      <>
                        <td className="py-2.5 px-3 text-right">{formatCurrency(subtotal)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold">{formatCurrency(subtotal)}</td>
                      </>
                    )}
                    {viewMode === 'packingslip' && (
                      <>
                        <td className="py-2.5 px-3 text-center font-mono text-emerald-600">[ ✓ PASSED ]</td>
                        <td className="py-2.5 px-3 text-right font-mono">~150g</td>
                      </>
                    )}
                  </tr>
                )}
              </tbody>
            </table>

            {/* Calculations Breakdown for Invoice */}
            {viewMode === 'invoice' ? (
              <div className="flex justify-end mb-8 text-xs">
                <div className="w-64 space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (9%):</span>
                    <span>{formatCurrency(cgst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (9%):</span>
                    <span>{formatCurrency(sgst)}</span>
                  </div>
                  {order.shippingFee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Shipping & Packaging:</span>
                      <span>{formatCurrency(order.shippingFee)}</span>
                    </div>
                  )}
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(order.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-300 font-bold text-sm text-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-indigo-700">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1 text-right">
                    Payment Status: <strong className="uppercase">{order.paymentStatus}</strong> via {order.paymentMethod || 'Online'}
                  </div>
                </div>
              </div>
            ) : (
              /* Packing Slip Quality Checklist */
              <div className="mb-6 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <h4 className="font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  Pre-Dispatch Quality Inspection Checklist
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <p>☑ Layer adhesion and stringing checked</p>
                  <p>☑ Supports cleanly removed & sanded</p>
                  <p>☑ Bubble wrap cushioning applied (2 layers)</p>
                  <p>☑ Fragile sticker affixed on outer carton</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between text-[11px]">
                  <span>Packed by: <strong>Rohan Sharma</strong></span>
                  <span>QC Sign-off: <strong>[ APPROVED ]</strong></span>
                </div>
              </div>
            )}

            {/* Terms and Signatures */}
            <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
              <div>
                <p className="font-semibold text-slate-700">Thank you for supporting small 3D printing makers!</p>
                <p>Care instruction: Avoid prolonged exposure to direct hot sunlight above 55°C for PLA items.</p>
                <p>This is a computer generated document, authorized on behalf of {business.businessName}.</p>
              </div>
              <div className="text-center">
                <div className="h-10 border-b border-slate-400 w-32 mb-1"></div>
                <p className="font-bold text-slate-700">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
