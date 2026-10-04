import React from 'react';
import {
  X,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Layers,
  ArrowRight,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { Order, FilamentSpool, PrintJob } from '../../types/index.ts';
import { formatCurrency, formatDate } from '../../lib/utils.ts';
import { NavModule } from '../layout/Sidebar.tsx';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  overdueOrders: Order[];
  failedPrints: PrintJob[];
  lowStockSpools: FilamentSpool[];
  onNavigate: (module: NavModule, itemId?: number | string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  overdueOrders,
  failedPrints,
  lowStockSpools,
  onNavigate,
}) => {
  if (!isOpen) return null;

  const totalAlerts = overdueOrders.length + failedPrints.length + lowStockSpools.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">
                Action Center & Alerts
              </h3>
              <p className="text-xs text-slate-500">
                {totalAlerts} items requiring prompt business attention
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {totalAlerts === 0 && (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">All clear!</h4>
              <p className="text-xs text-slate-500">No overdue orders, failed prints, or low filament spools.</p>
            </div>
          )}

          {/* Failed Prints Alert */}
          {failedPrints.length > 0 && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-xs uppercase tracking-wider">
                <AlertOctagon className="w-4 h-4" />
                <span>Failed Print Jobs ({failedPrints.length})</span>
              </div>
              <div className="space-y-2">
                {failedPrints.map((job) => (
                  <div
                    key={job.id}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{job.jobName}</p>
                      <p className="text-rose-600 dark:text-rose-400 font-medium text-[11px]">
                        {job.failureReason || 'Failed during printing'}
                      </p>
                      <p className="text-[10px] text-slate-400">Printer: {job.printerName || 'Unassigned'}</p>
                    </div>
                    <button
                      onClick={() => {
                        onNavigate('production', job.id);
                        onClose();
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shrink-0 flex items-center gap-1"
                    >
                      Inspect <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overdue Orders Alert */}
          {overdueOrders.length > 0 && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Overdue Orders ({overdueOrders.length})</span>
              </div>
              <div className="space-y-2">
                {overdueOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{ord.orderNumber}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium">
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{ord.customerName} &bull; {formatCurrency(ord.totalAmount)}</p>
                      <p className="text-amber-700 dark:text-amber-400 font-semibold text-[11px]">
                        Expected by: {formatDate(ord.expectedDeliveryDate)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onNavigate('orders', ord.id);
                        onClose();
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shrink-0 flex items-center gap-1"
                    >
                      Prioritize <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low Stock Filament Alert */}
          {lowStockSpools.length > 0 && (
            <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                <span>Low Stock Filaments ({lowStockSpools.length})</span>
              </div>
              <div className="space-y-2">
                {lowStockSpools.map((spool) => (
                  <div
                    key={spool.id}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/40 text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full border border-slate-300 shadow-xs shrink-0"
                        style={{ backgroundColor: spool.colorHex }}
                      />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{spool.name}</p>
                        <p className="text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                          Only {spool.remainingWeightGrams}g remaining (threshold: {spool.alertThresholdGrams}g)
                        </p>
                        <p className="text-[10px] text-slate-400">{spool.location} &bull; {spool.material}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onNavigate('inventory', spool.id);
                        onClose();
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shrink-0 flex items-center gap-1"
                    >
                      Restock <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
