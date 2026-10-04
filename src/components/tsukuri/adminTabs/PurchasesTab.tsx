import React, { useState } from 'react';
import { Plus, Trash2, Edit, Truck, Search, Download } from 'lucide-react';
import { formatPrice, formatIndianDateShort } from '../tsukuriData.ts';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  itemsDescription: string;
  totalCostINR: number;
  date: string;
  status: 'Received' | 'In Transit' | 'Ordered' | 'Pending Approval';
  notes?: string;
}

export const PurchasesTab: React.FC = () => {
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([
    { id: 'po-1', poNumber: 'PO-2026-089', supplier: 'Kyoto BioPolymer Ltd.', itemsDescription: '10x Spools Matte Matcha PLA (1kg each)', totalCostINR: 12000, date: '2026-09-28', status: 'Received', notes: 'Quality verified - 0.02mm tolerance' },
    { id: 'po-2', poNumber: 'PO-2026-090', supplier: 'PrintMaterials India', itemsDescription: '8x Spools Terracotta PETG + 5x Silk Obsidian', totalCostINR: 14500, date: '2026-10-01', status: 'In Transit', notes: 'Delhivery Surface tracking AWB 9482109' },
    { id: 'po-3', poNumber: 'PO-2026-091', supplier: 'EcoCraft Packaging Solutions', itemsDescription: '500x Recycled Bento Mailer Boxes', totalCostINR: 4200, date: '2026-09-25', status: 'Received' },
  ]);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [poNumber, setPoNumber] = useState('');
  const [supplier, setSupplier] = useState('Kyoto BioPolymer Ltd.');
  const [itemsDescription, setItemsDescription] = useState('');
  const [totalCostINR, setTotalCostINR] = useState(5000);
  const [status, setStatus] = useState<'Received' | 'In Transit' | 'Ordered' | 'Pending Approval'>('Ordered');
  const [notes, setNotes] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setPurchases((prev) =>
        prev.map((po) =>
          po.id === editingId
            ? {
                ...po,
                poNumber,
                supplier,
                itemsDescription,
                totalCostINR: Number(totalCostINR),
                status,
                notes,
              }
            : po
        )
      );
    } else {
      const newPO: PurchaseOrder = {
        id: `po-${Date.now().toString().slice(-4)}`,
        poNumber: poNumber || `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
        supplier,
        itemsDescription,
        totalCostINR: Number(totalCostINR),
        date: new Date().toISOString().split('T')[0],
        status,
        notes,
      };
      setPurchases([newPO, ...purchases]);
    }
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (po: PurchaseOrder) => {
    setEditingId(po.id);
    setPoNumber(po.poNumber);
    setSupplier(po.supplier);
    setItemsDescription(po.itemsDescription);
    setTotalCostINR(po.totalCostINR);
    setStatus(po.status);
    setNotes(po.notes || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setPurchases((prev) => prev.filter((po) => po.id !== id));
  };

  const filtered = purchases.filter(
    (po) =>
      po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      po.supplier.toLowerCase().includes(search.toLowerCase()) ||
      po.itemsDescription.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xs border border-slate-100 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bubbly text-xl sm:text-2xl text-[#1a2e26] flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#1e4b3e]" />
            <span>PURCHASE ORDERS (POs) & MATERIAL ACQUISITION</span>
          </h2>
          <p className="text-xs text-slate-500">
            Log procurement from filament vendors, packaging suppliers, and track logistics delivery status.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search PO or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#e8ece1]/50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold"
            />
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setPoNumber(`PO-2026-${Math.floor(100 + Math.random() * 900)}`);
              setSupplier('Kyoto BioPolymer Ltd.');
              setItemsDescription('');
              setTotalCostINR(5000);
              setStatus('Ordered');
              setNotes('');
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs tracking-wider flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ NEW PURCHASE ORDER</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#e8ece1]/60 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3 rounded-l-xl">PO Number</th>
              <th className="p-3">Supplier Name</th>
              <th className="p-3">Procured Materials</th>
              <th className="p-3 text-right">Total Cost (INR)</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right rounded-r-xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((po) => (
              <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 font-mono font-bold text-[#1e4b3e]">{po.poNumber}</td>
                <td className="p-3 font-bold text-[#1a2e26]">{po.supplier}</td>
                <td className="p-3 text-slate-600 max-w-xs">{po.itemsDescription}</td>
                <td className="p-3 text-right font-mono font-bold text-[#1e4b3e]">
                  {formatPrice(po.totalCostINR)}
                </td>
                <td className="p-3 text-slate-800 font-bold font-mono text-xs">{formatIndianDateShort(po.date)}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      po.status === 'Received'
                        ? 'bg-emerald-100 text-emerald-800'
                        : po.status === 'In Transit'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {po.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleEdit(po)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#1e4b3e] hover:text-white text-slate-700 transition-colors"
                      title="Edit PO"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(po.id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 transition-colors"
                      title="Delete PO"
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
            <h3 className="font-bubbly text-xl text-[#1a2e26]">
              {editingId ? 'Edit Purchase Order' : 'Create Purchase Order (PO)'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">PO Number</label>
                  <input
                    type="text"
                    required
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  >
                    <option value="Ordered">Ordered</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Received">Received</option>
                    <option value="Pending Approval">Pending Approval</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Supplier Name</label>
                <input
                  type="text"
                  required
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Items & Quantities</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. 10x Spools Matte Matcha PLA (1kg each)"
                  value={itemsDescription}
                  onChange={(e) => setItemsDescription(e.target.value)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Total Procurement Cost (INR ₹)</label>
                <input
                  type="number"
                  required
                  value={totalCostINR}
                  onChange={(e) => setTotalCostINR(Number(e.target.value))}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-[#1e4b3e]"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Tracking</label>
                <input
                  type="text"
                  placeholder="AWB number, invoice reference"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5"
                />
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
                  SAVE PURCHASE ORDER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
