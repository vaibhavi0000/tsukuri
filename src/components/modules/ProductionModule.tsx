import React, { useState } from 'react';
import {
  Printer as PrinterIcon,
  Play,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Layers,
  Thermometer,
  Wrench,
  Plus,
  RefreshCw,
  Sparkles,
  Kanban,
  List,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Printer, PrintJob, FilamentSpool } from '../../types/index.ts';
import { formatMinutes } from '../../lib/utils.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface ProductionModuleProps {
  printers: Printer[];
  jobs: PrintJob[];
  spools: FilamentSpool[];
  onAddJob: (job: Partial<PrintJob>) => Promise<void>;
  onUpdateJob: (id: number, job: Partial<PrintJob>) => Promise<void>;
  onUpdatePrinter: (id: number, printer: Partial<Printer>) => Promise<void>;
}

export const ProductionModule: React.FC<ProductionModuleProps> = ({
  printers,
  jobs,
  spools,
  onAddJob,
  onUpdateJob,
  onUpdatePrinter,
}) => {
  const { canEdit } = useAuth();
  const [viewMode, setViewMode] = useState<'kanban' | 'hardware'>('kanban');
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [failedJobModal, setFailedJobModal] = useState<PrintJob | null>(null);
  const [failureReason, setFailureReason] = useState('Bed adhesion failure / warping at 35% height');

  // New Job form states
  const [jobName, setJobName] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [printerId, setPrinterId] = useState<number | ''>(printers[0]?.id || '');
  const [material, setMaterial] = useState('PLA');
  const [spoolId, setSpoolId] = useState<number | ''>(spools[0]?.id || '');
  const [estimatedTimeMinutes, setEstimatedTimeMinutes] = useState(180);
  const [filamentGramsEstimated, setFilamentGramsEstimated] = useState(85);
  const [assignedTo, setAssignedTo] = useState('Rohan Sharma');

  const queuedJobs = jobs.filter((j) => j.status === 'Queued');
  const printingJobs = jobs.filter((j) => j.status === 'Printing');
  const doneJobs = jobs.filter((j) => j.status === 'Done');
  const failedJobs = jobs.filter((j) => j.status === 'Failed');

  const handleStartPrint = async (job: PrintJob) => {
    const selectedPrinter = printers.find((p) => p.id === job.printerId) || printers.find((p) => p.status === 'idle');
    await onUpdateJob(job.id, {
      status: 'Printing',
      printerId: selectedPrinter?.id,
      printerName: selectedPrinter?.name,
    });
  };

  const handleCompleteJob = async (job: PrintJob) => {
    // When marking Done, auto-deducts filament in backend!
    await onUpdateJob(job.id, {
      status: 'Done',
      actualTimeMinutes: job.estimatedTimeMinutes,
      filamentGramsUsed: job.filamentGramsEstimated,
    });
  };

  const handleMarkFailed = async () => {
    if (!failedJobModal) return;
    await onUpdateJob(failedJobModal.id, {
      status: 'Failed',
      failureReason,
    });
    setFailedJobModal(null);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const selPrinter = printers.find((p) => p.id === Number(printerId));
    await onAddJob({
      jobName,
      orderNumber: orderNumber || null,
      printerId: printerId ? Number(printerId) : null,
      printerName: selPrinter?.name || null,
      material,
      spoolId: spoolId ? Number(spoolId) : null,
      estimatedTimeMinutes: Number(estimatedTimeMinutes),
      filamentGramsEstimated: Number(filamentGramsEstimated),
      status: 'Queued',
      assignedTo,
    });
    setIsNewJobModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PrinterIcon className="w-5 h-5 text-indigo-600" />
            Production & Print Queue
          </h2>
          <p className="text-xs text-slate-500">
            Real-time farm scheduler, printer telemetry, filament deduction, and failure tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => {
                setJobName('');
                setOrderNumber('');
                setPrinterId(printers[0]?.id || '');
                setMaterial('PLA');
                setSpoolId(spools[0]?.id || '');
                setEstimatedTimeMinutes(180);
                setFilamentGramsEstimated(85);
                setIsNewJobModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Queue Print Job
            </button>
          )}

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('hardware')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                viewMode === 'hardware'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              <PrinterIcon className="w-3.5 h-3.5" /> Farm Hardware
            </button>
          </div>
        </div>
      </div>

      {/* Hardware Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {printers.map((printer) => {
          let statusColor = 'bg-emerald-500 text-white';
          if (printer.status === 'printing') statusColor = 'bg-blue-600 text-white animate-pulse';
          if (printer.status === 'maintenance') statusColor = 'bg-amber-500 text-white';
          if (printer.status === 'offline') statusColor = 'bg-slate-500 text-white';

          return (
            <div
              key={printer.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {printer.name}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                    {printer.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{printer.model}</p>
                <p className="text-[11px] text-slate-400">{printer.location}</p>

                {/* Telemetry Temps */}
                <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                    <span>Nozzle: {printer.nozzleTemperature}°C</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                    <span>Bed: {printer.bedTemperature}°C</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
                <span>Total: {printer.totalPrintHours.toFixed(1)} hrs</span>
                {canEdit && (
                  <button
                    onClick={async () => {
                      const next =
                        printer.status === 'idle'
                          ? 'printing'
                          : printer.status === 'printing'
                          ? 'idle'
                          : 'idle';
                      await onUpdatePrinter(printer.id, { status: next });
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Toggle State
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Queued Column */}
          <div className="flex flex-col rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <Clock className="w-4 h-4 text-purple-500" />
                <span>Queued ({queuedJobs.length})</span>
              </div>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[600px]">
              {queuedJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-xs transition-shadow space-y-2 text-xs"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {job.jobName}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                      {job.material}
                    </span>
                  </div>

                  {job.orderNumber && (
                    <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                      Order: {job.orderNumber}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    <span>{formatMinutes(job.estimatedTimeMinutes)}</span>
                    <span>{job.filamentGramsEstimated}g filament</span>
                  </div>

                  {canEdit && (
                    <button
                      onClick={() => handleStartPrint(job)}
                      className="w-full mt-2 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Print
                    </button>
                  )}
                </div>
              ))}

              {queuedJobs.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">No jobs queued</div>
              )}
            </div>
          </div>

          {/* 2. Printing Column */}
          <div className="flex flex-col rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 p-3 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-400">
                <PrinterIcon className="w-4 h-4 text-blue-600 animate-spin" />
                <span>Printing ({printingJobs.length})</span>
              </div>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[600px]">
              {printingJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800 shadow-2xs space-y-2 text-xs"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {job.jobName}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {job.material}
                    </span>
                  </div>

                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    Printer: <strong>{job.printerName || 'Farm Rack 1'}</strong>
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    <span>Est: {formatMinutes(job.estimatedTimeMinutes)}</span>
                    <span>{job.filamentGramsEstimated}g filament</span>
                  </div>

                  {canEdit && (
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      <button
                        onClick={() => handleCompleteJob(job)}
                        className="py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                      </button>
                      <button
                        onClick={() => setFailedJobModal(job)}
                        className="py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 rounded-lg flex items-center justify-center gap-1"
                      >
                        <AlertOctagon className="w-3.5 h-3.5" /> Failed
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {printingJobs.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">No active printing</div>
              )}
            </div>
          </div>

          {/* 3. Done Column */}
          <div className="flex flex-col rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-3 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Completed ({doneJobs.length})</span>
              </div>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[600px]">
              {doneJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800/60 shadow-2xs space-y-1.5 text-xs"
                >
                  <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {job.jobName}
                  </p>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{job.printerName}</span>
                    <span className="text-emerald-600 font-semibold font-mono">
                      -{job.filamentGramsUsed || job.filamentGramsEstimated}g deducted
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Failed Column */}
          <div className="flex flex-col rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-3 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-rose-700 dark:text-rose-400">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>Failed ({failedJobs.length})</span>
              </div>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[600px]">
              {failedJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-rose-800/60 shadow-2xs space-y-1 text-xs"
                >
                  <p className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {job.jobName}
                  </p>
                  <p className="text-[11px] text-rose-600 font-medium">
                    {job.failureReason || 'Failed mid-print'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {job.printerName} &bull; Wasted: ~{job.filamentGramsUsed || 30}g
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Failure Log Modal */}
      {failedJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Log Print Failure Reason</span>
            </div>
            <p className="text-slate-500">
              Logging the failure reason helps track farm reliability metrics and nozzle maintenance.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Failure Cause:
              </label>
              <select
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="Bed adhesion failure / warping">Bed adhesion failure / warping</option>
                <option value="Extruder clog / tangled spool">Extruder clog / tangled spool</option>
                <option value="Layer shift on Y-axis (belt tension)">Layer shift on Y-axis (belt tension)</option>
                <option value="Filament ran out mid-print">Filament ran out mid-print</option>
                <option value="Power outage / thermal runaway">Power outage / thermal runaway</option>
                <option value="Model geometry support collapse">Model geometry support collapse</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFailedJobModal(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkFailed}
                className="px-4 py-2 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Confirm Failure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Queue Job Modal */}
      {isNewJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">
                Queue 3D Print Job
              </h3>
              <button
                onClick={() => setIsNewJobModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Job G-code / 3MF Name *
                </label>
                <input
                  type="text"
                  required
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  placeholder="e.g. Job_Dragon_Gold_0.20mm.3mf"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Link Order # (Optional)
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. PH-1005"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assign Printer
                  </label>
                  <select
                    value={printerId}
                    onChange={(e) => setPrinterId(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Auto Assign Any Idle --</option>
                    {printers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Material
                  </label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="PLA">PLA</option>
                    <option value="PETG">PETG</option>
                    <option value="ABS">ABS</option>
                    <option value="TPU">TPU</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Spool to Deduct
                  </label>
                  <select
                    value={spoolId}
                    onChange={(e) => setSpoolId(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    {spools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.remainingWeightGrams}g left)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Est. Print Time (Minutes)
                  </label>
                  <input
                    type="number"
                    value={estimatedTimeMinutes}
                    onChange={(e) => setEstimatedTimeMinutes(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Filament Weight (Grams)
                  </label>
                  <input
                    type="number"
                    value={filamentGramsEstimated}
                    onChange={(e) => setFilamentGramsEstimated(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewJobModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Queue Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
