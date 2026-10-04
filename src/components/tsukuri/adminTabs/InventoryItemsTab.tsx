import React, { useState } from 'react';
import { Plus, Trash2, Edit, Box, Search, AlertTriangle } from 'lucide-react';

export interface ConsumableItem {
  id: string;
  name: string;
  category: 'Packaging' | 'Spare Parts' | 'Consumables' | 'Hardware';
  stock: number;
  unit: string;
  minReorderLevel: number;
  costPerUnitINR: number;
  supplier: string;
}

export const InventoryItemsTab: React.FC = () => {
  const [items, setItems] = useState<ConsumableItem[]>([
    { id: 'inv-1', name: 'Origami Craft Recycled Mailer Boxes', category: 'Packaging', stock: 450, unit: 'boxes', minReorderLevel: 100, costPerUnitINR: 35, supplier: 'EcoCraft Packaging' },
    { id: 'inv-2', name: '0.4mm Hardened Steel Nozzle (Bambu X1C)', category: 'Spare Parts', stock: 8, unit: 'pcs', minReorderLevel: 4, costPerUnitINR: 650, supplier: 'Bambu Lab Direct' },
    { id: 'inv-3', name: 'PEI Textured Spring Steel Build Plate', category: 'Spare Parts', stock: 3, unit: 'plates', minReorderLevel: 2, costPerUnitINR: 1800, supplier: 'Bambu Lab Direct' },
    { id: 'inv-4', name: 'IPA 99.9% Isopropyl Cleaning Solvent', category: 'Consumables', stock: 12, unit: 'liters', minReorderLevel: 5, costPerUnitINR: 220, supplier: 'Industrial Solvents India' },
    { id: 'inv-5', name: '3D Lac Bed Adhesion Spray (400ml)', category: 'Consumables', stock: 4, unit: 'cans', minReorderLevel: 5, costPerUnitINR: 480, supplier: 'PrintMaterials India' },
  ]);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Packaging' | 'Spare Parts' | 'Consumables' | 'Hardware'>('Packaging');
  const [stock, setStock] = useState(100);
  const [unit, setUnit] = useState('pcs');
  const [minReorderLevel, setMinReorderLevel] = useState(20);
  const [costPerUnit, setCostPerUnit] = useState(50);
  const [supplier, setSupplier] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === editingId
            ? {
                ...it,
                name,
                category,
                stock: Number(stock),
                unit,
                minReorderLevel: Number(minReorderLevel),
                costPerUnitINR: Number(costPerUnit),
                supplier,
              }
            : it
        )
      );
    } else {
      const newItem: ConsumableItem = {
        id: `inv-${Date.now().toString().slice(-4)}`,
        name,
        category,
        stock: Number(stock),
        unit,
        minReorderLevel: Number(minReorderLevel),
        costPerUnitINR: Number(costPerUnit),
        supplier,
      };
      setItems([...items, newItem]);
    }
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleAdjustStock = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, stock: Math.max(0, it.stock + delta) } : it
      )
    );
  };

  const handleEdit = (it: ConsumableItem) => {
    setEditingId(it.id);
    setName(it.name);
    setCategory(it.category);
    setStock(it.stock);
    setUnit(it.unit);
    setMinReorderLevel(it.minReorderLevel);
    setCostPerUnit(it.costPerUnitINR);
    setSupplier(it.supplier);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const filtered = items.filter(
    (it) =>
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      it.category.toLowerCase().includes(search.toLowerCase()) ||
      it.supplier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xs border border-slate-100 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bubbly text-xl sm:text-2xl text-[#1a2e26] flex items-center gap-2">
            <Box className="w-5 h-5 text-[#1e4b3e]" />
            <span>INVENTORY ITEMS (PARTS, CONSUMABLES & PACKAGING)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Monitor hardware consumables, nozzles, bed adhesives, mailers, and automated reorder alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#e8ece1]/50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold"
            />
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setName('');
              setCategory('Packaging');
              setStock(100);
              setUnit('pcs');
              setMinReorderLevel(20);
              setCostPerUnit(50);
              setSupplier('');
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs tracking-wider flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ ADD INVENTORY ITEM</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#e8ece1]/60 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3 rounded-l-xl">Item Name</th>
              <th className="p-3">Category</th>
              <th className="p-3 text-center">Stock Level</th>
              <th className="p-3 text-center">Quick Adjust</th>
              <th className="p-3 text-right">Cost / Unit</th>
              <th className="p-3">Supplier</th>
              <th className="p-3">Alert</th>
              <th className="p-3 text-right rounded-r-xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((it) => {
              const isLow = it.stock <= it.minReorderLevel;
              return (
                <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-[#1a2e26]">{it.name}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e8ece1] text-[#1e4b3e]">
                      {it.category}
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono font-bold">
                    {it.stock} {it.unit}
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center gap-1 bg-[#e8ece1]/70 p-0.5 rounded-lg">
                      <button
                        onClick={() => handleAdjustStock(it.id, -1)}
                        className="w-5 h-5 rounded bg-white font-bold flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 text-xs shadow-2xs"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleAdjustStock(it.id, 1)}
                        className="w-5 h-5 rounded bg-white font-bold flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-700 text-xs shadow-2xs"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono font-semibold">₹{it.costPerUnitINR}</td>
                  <td className="p-3 text-slate-500">{it.supplier}</td>
                  <td className="p-3">
                    {isLow ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-max">
                        <AlertTriangle className="w-3 h-3" />
                        Reorder (&lt;{it.minReorderLevel})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 w-max block">
                        Healthy
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(it)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#1e4b3e] hover:text-white text-slate-700 transition-colors"
                        title="Edit Item"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(it.id)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl border-4 border-[#e8ece1] space-y-4">
            <h3 className="font-bubbly text-xl text-[#1a2e26]">
              {editingId ? 'Edit Inventory Item' : 'Add Inventory Item'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0.4mm Hardened Steel Nozzle"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  >
                    <option value="Packaging">Packaging</option>
                    <option value="Spare Parts">Spare Parts</option>
                    <option value="Consumables">Consumables</option>
                    <option value="Hardware">Hardware</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="pcs / boxes / liters"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Current Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Reorder Level</label>
                  <input
                    type="number"
                    min="0"
                    value={minReorderLevel}
                    onChange={(e) => setMinReorderLevel(Number(e.target.value))}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cost Per Unit (INR)</label>
                  <input
                    type="number"
                    min="0"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(Number(e.target.value))}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Supplier</label>
                  <input
                    type="text"
                    placeholder="e.g. EcoCraft Packaging"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5"
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
                  SAVE INVENTORY ITEM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
