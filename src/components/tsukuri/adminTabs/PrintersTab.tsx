import React, { useState } from 'react';
import { Plus, Trash2, Edit, Printer, Play, Pause, Search } from 'lucide-react';

export interface PrinterUnit {
  id: string;
  name: string;
  model: string;
  status: 'Printing' | 'Idle' | 'Maintenance' | 'Offline';
  bedTemp: number;
  nozzleTemp: number;
  totalPrintHours: number;
  maintenanceDueHours: number;
  currentJobName: string;
  progressPercent: number;
  filamentUsedGrams: number;
}

export const PrintersTab: React.FC = () => {
  const [printers, setPrinters] = useState<PrinterUnit[]>([
    {
      id: 'pr-01',
      name: 'Kyoto-1 (Bambu X1C)',
      model: 'Bambu Lab X1-Carbon AMS',
      status: 'Printing',
      bedTemp: 55,
      nozzleTemp: 215,
      totalPrintHours: 412,
      maintenanceDueHours: 88,
      currentJobName: 'Zen_Wave_Planter_v4.gcode',
      progressPercent: 78,
      filamentUsedGrams: 165,
    },
    {
      id: 'pr-02',
      name: 'Kyoto-2 (Bambu X1C)',
      model: 'Bambu Lab X1-Carbon AMS',
      status: 'Printing',
      bedTemp: 60,
      nozzleTemp: 220,
      totalPrintHours: 285,
      maintenanceDueHours: 215,
      currentJobName: 'Matcha_Keycaps_Batch3.gcode',
      progressPercent: 91,
      filamentUsedGrams: 35,
    },
    {
      id: 'pr-03',
      name: 'Nusantara-1 (Prusa MK4)',
      model: 'Original Prusa MK4 Nextruder',
      status: 'Idle',
      bedTemp: 24,
      nozzleTemp: 25,
      totalPrintHours: 540,
      maintenanceDueHours: 60,
      currentJobName: 'Standby for queue',
      progressPercent: 0,
      filamentUsedGrams: 0,
    },
  ]);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [model, setModel] = useState('Bambu Lab X1-Carbon AMS');
  const [status, setStatus] = useState<'Printing' | 'Idle' | 'Maintenance' | 'Offline'>('Idle');
  const [bedTemp, setBedTemp] = useState(55);
  const [nozzleTemp, setNozzleTemp] = useState(215);
  const [totalHours, setTotalHours] = useState(100);
  const [maintHours, setMaintHours] = useState(200);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setPrinters((prev) =>
        prev.map((pr) =>
          pr.id === editingId
            ? {
                ...pr,
                name,
                model,
                status,
                bedTemp: Number(bedTemp),
                nozzleTemp: Number(nozzleTemp),
                totalPrintHours: Number(totalHours),
                maintenanceDueHours: Number(maintHours),
              }
            : pr
        )
      );
    } else {
      const newPrinter: PrinterUnit = {
        id: `pr-${Date.now().toString().slice(-4)}`,
        name,
        model,
        status,
        bedTemp: Number(bedTemp),
        nozzleTemp: Number(nozzleTemp),
        totalPrintHours: Number(totalHours),
        maintenanceDueHours: Number(maintHours),
        currentJobName: 'Standby for job',
        progressPercent: 0,
        filamentUsedGrams: 0,
      };
      setPrinters([...printers, newPrinter]);
    }
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (pr: PrinterUnit) => {
    setEditingId(pr.id);
    setName(pr.name);
    setModel(pr.model);
    setStatus(pr.status);
    setBedTemp(pr.bedTemp);
    setNozzleTemp(pr.nozzleTemp);
    setTotalHours(pr.totalPrintHours);
    setMaintHours(pr.maintenanceDueHours);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setPrinters((prev) => prev.filter((pr) => pr.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    setPrinters((prev) =>
      prev.map((pr) =>
        pr.id === id
          ? {
              ...pr,
              status: pr.status === 'Printing' ? 'Idle' : 'Printing',
            }
          : pr
      )
    );
  };

  const filtered = printers.filter(
    (pr) =>
      pr.name.toLowerCase().includes(search.toLowerCase()) ||
      pr.model.toLowerCase().includes(search.toLowerCase()) ||
      pr.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xs border border-slate-100 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bubbly text-xl sm:text-2xl text-[#1a2e26] flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#1e4b3e]" />
            <span>3D PRINTERS FLEET MONITOR & HARDWARE ERP</span>
          </h2>
          <p className="text-xs text-slate-500">
            High-speed Bambu Lab X1C & Prusa fleet telemetry, nozzle temperatures, and maintenance tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search printer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#e8ece1]/50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold"
            />
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setName('Kyoto-3 (Bambu X1C)');
              setModel('Bambu Lab X1-Carbon AMS');
              setStatus('Idle');
              setBedTemp(55);
              setNozzleTemp(215);
              setTotalHours(45);
              setMaintHours(250);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs tracking-wider flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ ADD PRINTER</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map((pr) => {
          const isPrinting = pr.status === 'Printing';
          return (
            <div key={pr.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-[#1a2e26]">{pr.name}</h4>
                  <span className="text-[11px] text-slate-500">{pr.model}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isPrinting
                        ? 'bg-emerald-100 text-emerald-800'
                        : pr.status === 'Idle'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {pr.status}
                  </span>
                </div>
              </div>

              {isPrinting && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600">
                    <span className="truncate max-w-[170px]">{pr.currentJobName}</span>
                    <span>{pr.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#1e4b3e] h-full transition-all" style={{ width: `${pr.progressPercent}%` }} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Nozzle Temp</span>
                  <span className="font-mono font-bold text-[#1e4b3e]">{pr.nozzleTemp}°C</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Bed Temp</span>
                  <span className="font-mono font-bold text-[#1a2e26]">{pr.bedTemp}°C</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Total Print Hrs</span>
                  <span className="font-mono font-bold">{pr.totalPrintHours}h</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Maint. Due</span>
                  <span className="font-mono font-bold text-[#ea8f5a]">{pr.maintenanceDueHours}h</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => handleToggleStatus(pr.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bubbly flex items-center gap-1 ${
                    isPrinting
                      ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                      : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                  }`}
                >
                  {isPrinting ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isPrinting ? 'Pause' : 'Start Job'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(pr)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                    title="Edit Printer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(pr.id)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600"
                    title="Delete Printer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl border-4 border-[#e8ece1] space-y-4">
            <h3 className="font-bubbly text-xl text-[#1a2e26]">
              {editingId ? 'Edit 3D Printer Fleet Unit' : 'Add 3D Printer to Fleet'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Printer Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kyoto-4 (Bambu X1C)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hardware Model</label>
                <input
                  type="text"
                  required
                  placeholder="Bambu Lab X1-Carbon AMS"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  >
                    <option value="Printing">Printing</option>
                    <option value="Idle">Idle</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nozzle Temp (°C)</label>
                  <input
                    type="number"
                    value={nozzleTemp}
                    onChange={(e) => setNozzleTemp(Number(e.target.value))}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Print Hours</label>
                  <input
                    type="number"
                    value={totalHours}
                    onChange={(e) => setTotalHours(Number(e.target.value))}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Maint. Due In (Hours)</label>
                  <input
                    type="number"
                    value={maintHours}
                    onChange={(e) => setMaintHours(Number(e.target.value))}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
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
                  SAVE PRINTER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
