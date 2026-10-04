import React, { useState } from 'react';
import {
  Layers,
  Plus,
  AlertTriangle,
  Package,
  Wrench,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Edit,
  ExternalLink,
  X,
  Gauge,
} from 'lucide-react';
import { FilamentSpool, InventoryItem, Supplier } from '../../types/index.ts';
import { formatCurrency } from '../../lib/utils.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface InventoryModuleProps {
  spools: FilamentSpool[];
  inventoryItems: InventoryItem[];
  suppliers: Supplier[];
  onAddSpool: (spool: Partial<FilamentSpool>) => Promise<void>;
  onUpdateSpool: (id: number, spool: Partial<FilamentSpool>) => Promise<void>;
  onAddInventoryItem: (item: Partial<InventoryItem>) => Promise<void>;
  onUpdateInventoryItem: (id: number, item: Partial<InventoryItem>) => Promise<void>;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  spools,
  inventoryItems,
  suppliers,
  onAddSpool,
  onUpdateSpool,
  onAddInventoryItem,
  onUpdateInventoryItem,
}) => {
  const { canEdit } = useAuth();
  const [activeTab, setActiveTab] = useState<'filaments' | 'general'>('filaments');
  const [search, setSearch] = useState('');
  const [materialFilter, setMaterialFilter] = useState('All');
  const [isAddSpoolOpen, setIsAddSpoolOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  // New Spool form states
  const [spoolName, setSpoolName] = useState('');
  const [material, setMaterial] = useState('PLA');
  const [brand, setBrand] = useState('Numakers');
  const [color, setColor] = useState('Matte Black');
  const [colorHex, setColorHex] = useState('#1e293b');
  const [initialWeight, setInitialWeight] = useState(1000);
  const [remainingWeight, setRemainingWeight] = useState(1000);
  const [costPerKg, setCostPerKg] = useState(1299);
  const [location, setLocation] = useState('Shelf A - 101');
  const [alertThreshold, setAlertThreshold] = useState(200);

  // New Item form states
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Packaging');
  const [itemSku, setItemSku] = useState(`INV-${Date.now().toString().slice(-5)}`);
  const [itemQuantity, setItemQuantity] = useState(20);
  const [itemUnit, setItemUnit] = useState('pcs');
  const [itemThreshold, setItemThreshold] = useState(10);
  const [itemCost, setItemCost] = useState(25);
  const [itemLocation, setItemLocation] = useState('Packing Station');

  const filteredSpools = spools.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.name.toLowerCase().includes(q) ||
      s.brand.toLowerCase().includes(q) ||
      s.color.toLowerCase().includes(q) ||
      s.material.toLowerCase().includes(q);
    const matchMat = materialFilter === 'All' || s.material === materialFilter;
    return matchSearch && matchMat;
  });

  const filteredItems = inventoryItems.filter((i) => {
    const q = search.toLowerCase();
    return (
      i.name.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      i.sku.toLowerCase().includes(q)
    );
  });

  const handleCreateSpool = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddSpool({
      name: spoolName,
      material,
      brand,
      color,
      colorHex,
      initialWeightGrams: Number(initialWeight),
      remainingWeightGrams: Number(remainingWeight),
      costPerKg: Number(costPerKg),
      location,
      alertThresholdGrams: Number(alertThreshold),
    });
    setIsAddSpoolOpen(false);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddInventoryItem({
      name: itemName,
      category: itemCategory,
      sku: itemSku,
      quantity: Number(itemQuantity),
      unit: itemUnit,
      minThreshold: Number(itemThreshold),
      costPerUnit: Number(itemCost),
      location: itemLocation,
    });
    setIsAddItemOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Inventory & Filament Management
          </h2>
          <p className="text-xs text-slate-500">
            Real-time spool weights, auto print job deductions, packaging stock, and reorder levels.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('filaments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold ${
                activeTab === 'filaments'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Filament Spools ({spools.length})
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold ${
                activeTab === 'general'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              <Package className="w-3.5 h-3.5" /> Consumables & Parts ({inventoryItems.length})
            </button>
          </div>

          {canEdit && (
            <button
              onClick={() => {
                if (activeTab === 'filaments') {
                  setSpoolName('');
                  setBrand('Numakers');
                  setColor('Matte Black');
                  setColorHex('#1e293b');
                  setMaterial('PLA');
                  setCostPerKg(1299);
                  setIsAddSpoolOpen(true);
                } else {
                  setItemName('');
                  setItemCategory('Packaging');
                  setItemQuantity(20);
                  setIsAddItemOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              {activeTab === 'filaments' ? 'Add Spool' : 'Add Item'}
            </button>
          )}
        </div>
      </div>

      {/* Filaments Tab */}
      {activeTab === 'filaments' && (
        <div className="space-y-4">
          {/* Filter & Search */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search spools by name, brand, or color..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
            <select
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="All">Material: All</option>
              <option value="PLA">PLA</option>
              <option value="PETG">PETG</option>
              <option value="ABS">ABS</option>
              <option value="TPU">TPU</option>
            </select>
          </div>

          {/* Spool Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSpools.map((spool) => {
              const pct = Math.round((spool.remainingWeightGrams / spool.initialWeightGrams) * 100);
              const isLow = spool.isLowStock || spool.remainingWeightGrams <= spool.alertThresholdGrams;

              return (
                <div
                  key={spool.id}
                  className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-2xs flex flex-col justify-between ${
                    isLow
                      ? 'border-rose-400 dark:border-rose-800/80 bg-rose-50/10'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    {/* Header: Color Swatch + Title */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-700 shadow-md shrink-0"
                          style={{ backgroundColor: spool.colorHex }}
                        />
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                            {spool.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            {spool.brand} &bull; {spool.color}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {spool.material}
                      </span>
                    </div>

                    {/* Weight Gauge Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between items-baseline text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">Remaining Weight:</span>
                        <span
                          className={`font-black font-mono text-sm ${
                            isLow ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {spool.remainingWeightGrams}g{' '}
                          <span className="text-slate-400 font-normal text-xs">/ {spool.initialWeightGrams}g</span>
                        </span>
                      </div>

                      <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLow ? 'bg-rose-500' : pct < 40 ? 'bg-amber-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                        />
                      </div>

                      {isLow && (
                        <div className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Low stock! Below {spool.alertThresholdGrams}g reorder level</span>
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                      <div>Location: <strong className="text-slate-700 dark:text-slate-300">{spool.location}</strong></div>
                      <div>Rate: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(spool.costPerKg)}/kg</strong></div>
                    </div>
                  </div>

                  {/* Quick Adjust buttons */}
                  {canEdit && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-400 text-[11px]">Quick Tare:</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            onUpdateSpool(spool.id, {
                              remainingWeightGrams: Math.max(0, spool.remainingWeightGrams - 50),
                            })
                          }
                          className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[11px]"
                        >
                          -50g
                        </button>
                        <button
                          onClick={() =>
                            onUpdateSpool(spool.id, {
                              remainingWeightGrams: Math.min(spool.initialWeightGrams, spool.remainingWeightGrams + 100),
                            })
                          }
                          className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[11px]"
                        >
                          +100g
                        </button>
                        <button
                          onClick={() =>
                            onUpdateSpool(spool.id, {
                              remainingWeightGrams: 1000,
                            })
                          }
                          className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]"
                        >
                          Reset 1kg
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* General Consumables & Spare Parts Tab */}
      {activeTab === 'general' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">In Stock</th>
                  <th className="py-3 px-4">Min Reorder Level</th>
                  <th className="py-3 px-4">Unit Cost</th>
                  <th className="py-3 px-4">Location</th>
                  {canEdit && <th className="py-3 px-4 text-right">Adjust</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.map((item) => {
                  const isLow = item.quantity <= item.minThreshold;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{item.sku}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold ${
                            isLow ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {item.quantity} {item.unit}
                        </span>
                        {isLow && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
                            LOW
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {item.minThreshold} {item.unit}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(item.costPerUnit)}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{item.location}</td>
                      {canEdit && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() =>
                                onUpdateInventoryItem(item.id, {
                                  quantity: Math.max(0, item.quantity - 1),
                                })
                              }
                              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold"
                            >
                              -1
                            </button>
                            <button
                              onClick={() =>
                                onUpdateInventoryItem(item.id, {
                                  quantity: item.quantity + 5,
                                })
                              }
                              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold"
                            >
                              +5
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Spool Modal */}
      {isAddSpoolOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">
                Register New Filament Spool
              </h3>
              <button onClick={() => setIsAddSpoolOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSpool} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Spool Label / Name *</label>
                <input
                  type="text"
                  required
                  value={spoolName}
                  onChange={(e) => setSpoolName(e.target.value)}
                  placeholder="e.g. eSUN PLA+ Silk Silver"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Material</label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="PLA">PLA</option>
                    <option value="PETG">PETG</option>
                    <option value="ABS">ABS</option>
                    <option value="TPU">TPU</option>
                    <option value="ASA">ASA</option>
                    <option value="Resin">Resin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Brand</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Color Name</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Color Hex</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-full p-1.5 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Initial Weight (g)</label>
                  <input
                    type="number"
                    value={initialWeight}
                    onChange={(e) => setInitialWeight(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Cost per Kg (₹)</label>
                  <input
                    type="number"
                    value={costPerKg}
                    onChange={(e) => setCostPerKg(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Storage Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Low-Stock Alert Level (g)</label>
                  <input
                    type="number"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSpoolOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Save Spool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Consumable Item Modal */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">
                Add Inventory Consumable / Part
              </h3>
              <button onClick={() => setIsAddItemOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Die-cut Kraft Box 20x15x10cm"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="Packaging">Packaging</option>
                    <option value="Spare Parts">Spare Parts</option>
                    <option value="Consumables">Consumables</option>
                    <option value="Hardware">Hardware</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Unit</label>
                  <input
                    type="text"
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    placeholder="pcs / rolls / bottles"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Min Threshold</label>
                  <input
                    type="number"
                    value={itemThreshold}
                    onChange={(e) => setItemThreshold(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Cost per Unit (₹)</label>
                  <input
                    type="number"
                    value={itemCost}
                    onChange={(e) => setItemCost(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Location</label>
                  <input
                    type="text"
                    value={itemLocation}
                    onChange={(e) => setItemLocation(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddItemOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
