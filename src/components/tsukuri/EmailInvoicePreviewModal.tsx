import React from 'react';
import { X, Mail, Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';
import { WorkshopOrder } from './tsukuriData.ts';
import { printInvoiceDirectly, downloadInvoiceHTML } from '../../lib/invoicePrinter.ts';

interface EmailInvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: WorkshopOrder;
  emailHTML: string;
}

export const EmailInvoicePreviewModal: React.FC<EmailInvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  order,
  emailHTML,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#faf8f5] rounded-[2rem] sm:rounded-[2.5rem] max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border-4 border-[#1e4b3e] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#1e4b3e] text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#1e4b3e] flex items-center justify-center font-bubbly text-base font-bold shadow-xs">
              造
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bubbly text-base sm:text-lg text-[#f3b755]">
                  AUTOMATED INVOICE EMAIL
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center gap-1 border border-emerald-400/30">
                  <CheckCircle className="w-2.5 h-2.5" />
                  SENT
                </span>
              </div>
              <p className="text-xs text-white/80">
                Craft website theme · Automatically dispatched to customer email address
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Email Meta Bar (The email is NOT visible, ONLY Support is visible!) */}
        <div className="px-5 py-3 bg-[#e8ece1] border-b border-slate-200 text-xs space-y-1 shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <span className="text-slate-500 font-normal">From:</span>
              <span className="px-2 py-0.5 rounded-md bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Support
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="text-slate-500">To:</span>
              <span className="font-mono font-bold bg-white/70 px-2 py-0.5 rounded border border-slate-300">
                {order.email || 'customer email'}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-600 truncate">
            <span className="text-slate-500">Subject:</span>{' '}
            <strong className="text-slate-800">
              Tax Invoice & Dispatch Receipt - Order #{order.orderNumber} - TsuKURI_3D
            </strong>
          </div>
        </div>

        {/* Rendered HTML Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-[#f4f6f0]">
          <div className="max-w-xl mx-auto rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white">
            <iframe
              title={`Invoice #${order.orderNumber}`}
              srcDoc={emailHTML}
              className="w-full min-h-[580px] sm:min-h-[640px] border-0"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-bold">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Dispatched with website theme by Support</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => printInvoiceDirectly(order)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bubbly text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#1e4b3e]" />
              <span>PRINT PDF</span>
            </button>
            <button
              type="button"
              onClick={() => downloadInvoiceHTML(order)}
              className="px-3 py-1.5 rounded-xl bg-[#1e4b3e] hover:bg-[#15342b] text-[#f3b755] font-bubbly text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bubbly text-xs transition-colors cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
