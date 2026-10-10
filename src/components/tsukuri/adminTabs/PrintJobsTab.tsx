import React, { useState } from 'react';
import { Plus, Trash2, Edit, Kanban, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface PrintJob {
  id: string;
  orderNumber: string;
  name: string;
  printerName: string;
  material: string;
  estimatedHours: number;
  actualHours?: number;
  filamentGrams: number;
  status: 'Queued' | 'Printing' | 'Done' | 'Failed';
  failureReason?: string;
}

export const PrintJobsTab: React.FC = () => {
  const [jobs, setJobs] = useState<PrintJob[]>(() => {
    try {
      const stored = localStorage.getItem('tsukuri_print_jobs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const saveJobs = (newJobs: PrintJob[]) => {
    setJobs(newJobs);
    try {
      localStorage.setItem('tsukuri_print_jobs', JSON.stringify(newJobs));
    } catch {}
  };

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [orderNumber, setOrderNumber] = useState('TSU-1005');
  const [name, setName] = useState('');
  const [printerName, setPrinterName] = useState('Kyoto-1 (Bambu X1C)');
  const [material, setMaterial] = useState('Matte Matcha PLA');
  const [estimatedHours, setEstimatedHours] = useState(3.5);
  const [filamentGrams, setFilamentGrams] = useState(120);
  const [status, setStatus] = useState<'Queued' | 'Printing' | 'Done' | 'Failed'>('Queued');
  const [failureReason, setFailureReason] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = jobs.map((j) =>
        j.id === editingId
          ? {
              ...j,
              orderNumber,
              name,
              printerName,
              material,
              estimatedHours: Number(estimatedHours),
              filamentGrams: Number(filamentGrams),
              status,
              failureReason: status === 'Failed' ? failureReason : undefined,
            }
          : j
      );
      saveJobs(updated);
    } else {
      const newJob: PrintJob = {
        id: `job-${Date.now().toString().slice(-4)}`,
        orderNumber,
        name,
        printerName,
        material,
        estimatedHours: Number(estimatedHours),
        filamentGrams: Number(filamentGrams),
        status,
        failureReason: status === 'Failed' ? failureReason : undefined,
      };
      saveJobs([newJob, ...jobs]);
    }
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (j: PrintJob) => {
    setEditingId(j.id);
    setOrderNumber(j.orderNumber);
    setName(j.name);
    setPrinterName(j.printerName);
    setMaterial(j.material);
    setEstimatedHours(j.estimatedHours);
    setFilamentGrams(j.filamentGrams);
    setStatus(j.status);
    setFailureReason(j.failureReason || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    saveJobs(jobs.filter((j) => j.id !== id));
  };

  const handleMoveStatus = (id: string, newStatus: any) => {
    const updated = jobs.map((j) => (j.id === id ? { ...j, status: newStatus } : j));
    saveJobs(updated);
  };

  const filtered = jobs.filter(
    (j) =>
      j.name.toLowerCase().includes(search.toLowerCase()) ||
      j.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      j.printerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xs border border-slate-100 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bubbly text-xl sm:text-2xl text-[#1a2e26] flex items-center gap-2">
            <Kanban className="w-5 h-5 text-[#1e4b3e]" />
            <span>PRINT JOBS QUEUE & G-CODE DISPATCH</span>
          </h2>
          <p className="text-xs text-slate-500">
            Track print jobs linked to orders, spool consumption, printing durations, and failure root cause.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#e8ece1] p-1 rounded-full text-xs font-bold">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-full ${viewMode === 'kanban' ? 'bg-[#1e4b3e] text-white shadow-xs' : 'text-slate-600'}`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-full ${viewMode === 'table' ? 'bg-[#1e4b3e] text-white shadow-xs' : 'text-slate-600'}`}
            >
              List View
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search job or G-Code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#e8ece1]/50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold"
            />
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setOrderNumber('TSU-1005');
              setName('');
              setPrinterName('Kyoto-1 (Bambu X1C)');
              setMaterial('Matte Matcha PLA');
              setEstimatedHours(3.5);
              setFilamentGrams(120);
              setStatus('Queued');
              setFailureReason('');
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs tracking-wider flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ ADD PRINT JOB</span>
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['Queued', 'Printing', 'Done', 'Failed'] as const).map((col) => {
            const colJobs = filtered.filter((j) => j.status === col);
            return (
              <div key={col} className="p-4 bg-[#e8ece1]/50 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bubbly text-xs text-[#1a2e26] uppercase tracking-wider">
                    {col}
                  </span>
                  <span className="w-5 h-5 rounded-full bg-white text-[10px] font-bold flex items-center justify-center text-slate-700 shadow-2xs">
                    {colJobs.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {colJobs.map((j) => (
                    <div
                      key={j.id}
                      className={`p-3 bg-white rounded-xl shadow-xs border-l-4 space-y-1.5 ${
                        col === 'Printing'
                          ? 'border-emerald-500'
                          : col === 'Queued'
                          ? 'border-[#f3b755]'
                          : col === 'Done'
                          ? 'border-blue-500'
                          : 'border-rose-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[10px] font-bold text-[#1e4b3e]">{j.orderNumber}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(j)}
                            className="text-slate-400 hover:text-slate-700 p-0.5"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(j.id)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-xs text-[#1a2e26] line-clamp-1">{j.name}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">{j.printerName}</p>

                      <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>{j.estimatedHours}h est.</span>
                        <span className="font-bold">{j.filamentGrams}g PLA</span>
                      </div>

                      {j.failureReason && (
                        <div className="p-1.5 bg-rose-50 rounded-lg text-[10px] text-rose-700 flex items-start gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>{j.failureReason}</span>
                        </div>
                      )}

                      {/* Quick Move Buttons */}
                      <div className="flex gap-1 pt-1">
                        {col !== 'Queued' && (
                          <button
                            onClick={() => handleMoveStatus(j.id, 'Queued')}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                          >
                            ← Queue
                          </button>
                        )}
                        {col !== 'Printing' && (
                          <button
                            onClick={() => handleMoveStatus(j.id, 'Printing')}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold"
                          >
                            Print →
                          </button>
                        )}
                        {col !== 'Done' && (
                          <button
                            onClick={() => handleMoveStatus(j.id, 'Done')}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-800"
                          >
                            ✓ Done
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#e8ece1]/60 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3 rounded-l-xl">Order #</th>
                <th className="p-3">G-Code File</th>
                <th className="p-3">Assigned 3D Printer</th>
                <th className="p-3">Material</th>
                <th className="p-3 text-center">Hours</th>
                <th className="p-3 text-center">Grams</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono font-bold text-[#1e4b3e]">{j.orderNumber}</td>
                  <td className="p-3 font-bold text-[#1a2e26]">{j.name}</td>
                  <td className="p-3 text-slate-600">{j.printerName}</td>
                  <td className="p-3 text-slate-500">{j.material}</td>
                  <td className="p-3 text-center font-mono">{j.estimatedHours}h</td>
                  <td className="p-3 text-center font-mono font-bold">{j.filamentGrams}g</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        j.status === 'Printing'
                          ? 'bg-emerald-100 text-emerald-800'
                          : j.status === 'Queued'
                          ? 'bg-amber-100 text-amber-800'
                          : j.status === 'Done'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(j)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#1e4b3e] hover:text-white text-slate-700 transition-colors"
                        title="Edit Job"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(j.id)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 transition-colors"
                        title="Delete Job"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl border-4 border-[#e8ece1] space-y-4">
            <h3 className="font-bubbly text-xl text-[#1a2e26]">
              {editingId ? 'Edit Print Queue Job' : 'Add Print Job to Queue'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Order Number Link</label>
                <input
                  type="text"
                  required
                  placeholder="TSU-1005"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">G-Code File Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zen_Wave_Planter_v4.gcode"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Printer</label>
                  <select
                    value={printerName}
                    onChange={(e) => setPrinterName(e.target.value)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  >
                    <option value="Kyoto-1 (Bambu X1C)">Kyoto-1 (Bambu X1C)</option>
                    <option value="Kyoto-2 (Bambu X1C)">Kyoto-2 (Bambu X1C)</option>
                    <option value="Nusantara-1 (Prusa MK4)">Nusantara-1 (Prusa MK4)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Material</label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5"
                  >
                    <option value="Matte Matcha PLA">Matte Matcha PLA</option>
                    <option value="Teak Wood Composite">Teak Wood Composite</option>
                    <option value="Terracotta Matte PETG">Terracotta Matte PETG</option>
                    <option value="Silk Obsidian PLA">Silk Obsidian PLA</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Filament (Grams)</label>
                  <input
                    type="number"
                    min="1"
                    value={filamentGrams}
                    onChange={(e) => setFilamentGrams(Number(e.target.value))}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Queue Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                >
                  <option value="Queued">Queued</option>
                  <option value="Printing">Printing</option>
                  <option value="Done">Done</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
              {status === 'Failed' && (
                <div>
                  <label className="font-bold text-rose-700 block mb-1">Failure Reason</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bed adhesion loss, thermal runaway, layer shift"
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    className="w-full bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-rose-800"
                  />
                </div>
              )}
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
                  SAVE JOB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
