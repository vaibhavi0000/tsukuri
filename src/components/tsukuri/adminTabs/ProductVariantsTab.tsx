import React, { useState } from 'react';
import { Plus, Trash2, Edit, Layers, Search } from 'lucide-react';
import { formatPrice } from '../tsukuriData.ts';

export interface ProductVariant {
  id: string;
  productId: number;
  productName: string;
  variantName: string;
  size: string;
  colorName: string;
  colorHex: string;
  priceDeltaINR: number;
  stock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export const ProductVariantsTab: React.FC = () => {
  const [variants, setVariants] = useState<ProductVariant[]>(() => {
    try {
      const stored = localStorage.getItem('tsukuri_product_variants');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const saveVariants = (newVariants: ProductVariant[]) => {
    setVariants(newVariants);
    try {
      localStorage.setItem('tsukuri_product_variants', JSON.stringify(newVariants));
    } catch {}
  };

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [prodName, setProdName] = useState('Zen Wave Planter v4');
  const [varName, setVarName] = useState('');
  const [size, setSize] = useState('Medium (140mm)');
  const [colorName, setColorName] = useState('Matcha Green');
  const [colorHex, setColorHex] = useState('#607d64');
  const [priceDelta, setPriceDelta] = useState(0);
  const [stock, setStock] = useState(20);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const statusVal: 'In Stock' | 'Low Stock' | 'Out of Stock' = stock <= 0 ? 'Out of Stock' : stock <= 5 ? 'Low Stock' : 'In Stock';

    if (editingId) {
      const updated = variants.map((v) =>
        v.id === editingId
          ? {
              ...v,
              productName: prodName,
              variantName: varName,
              size,
              colorName,
              colorHex,
              priceDeltaINR: Number(priceDelta),
              stock: Number(stock),
              status: statusVal,
            }
          : v
      );
      saveVariants(updated);
    } else {
      const newVar: ProductVariant = {
        id: `var-${Date.now()}`,
        productId: 1,
        productName: prodName,
        variantName: varName,
        size,
        colorName,
        colorHex,
        priceDeltaINR: Number(priceDelta),
        stock: Number(stock),
        status: statusVal,
      };
      saveVariants([newVar, ...variants]);
    }
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (v: ProductVariant) => {
    setEditingId(v.id);
    setProdName(v.productName);
    setVarName(v.variantName);
    setSize(v.size);
    setColorName(v.colorName);
    setColorHex(v.colorHex);
    setPriceDelta(v.priceDeltaINR);
    setStock(v.stock);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    saveVariants(variants.filter((v) => v.id !== id));
  };

  const filtered = variants.filter(
    (v) =>
      v.productName.toLowerCase().includes(search.toLowerCase()) ||
      v.variantName.toLowerCase().includes(search.toLowerCase()) ||
      v.colorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xs border border-slate-100 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bubbly text-xl sm:text-2xl text-[#1a2e26] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#1e4b3e]" />
            <span>PRODUCT VARIANTS & SPECIFICATIONS</span>
          </h2>
          <p className="text-xs text-slate-500">
            Manage multi-color, custom filament textures, size configurations, and variant stock.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search variants or colors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#e8ece1]/50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold"
            />
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setProdName('Zen Wave Planter v4');
              setVarName('');
              setSize('Medium (140mm)');
              setColorName('Matte Matcha');
              setColorHex('#607d64');
              setPriceDelta(0);
              setStock(20);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs tracking-wider flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ ADD VARIANT</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#e8ece1]/60 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3 rounded-l-xl">Parent Product</th>
              <th className="p-3">Variant Name</th>
              <th className="p-3">Color Swatch</th>
              <th className="p-3">Size Scale</th>
              <th className="p-3 text-right">Price Delta</th>
              <th className="p-3 text-center">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right rounded-r-xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 font-bold text-[#1a2e26]">{v.productName}</td>
                <td className="p-3 font-medium text-slate-700">{v.variantName}</td>
                <td className="p-3 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border border-black/20 shrink-0" style={{ backgroundColor: v.colorHex }} />
                  <span className="font-mono text-[11px] text-slate-600">{v.colorName}</span>
                </td>
                <td className="p-3 text-slate-600">{v.size}</td>
                <td className="p-3 text-right font-mono font-bold">
                  {v.priceDeltaINR > 0 ? `+${formatPrice(v.priceDeltaINR)}` : 'Base Price'}
                </td>
                <td className="p-3 text-center font-bold font-mono">{v.stock}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      v.status === 'In Stock'
                        ? 'bg-emerald-100 text-emerald-800'
                        : v.status === 'Low Stock'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {v.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleEdit(v)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#1e4b3e] hover:text-white text-slate-700 transition-colors"
                      title="Edit Variant"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 transition-colors"
                      title="Delete Variant"
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

      {/* Variant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl border-4 border-[#e8ece1] space-y-4">
            <h3 className="font-bubbly text-xl text-[#1a2e26]">
              {editingId ? 'Edit Product Variant' : 'Create Product Variant'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Parent Product</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Variant Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Matte Matcha Green (XL)"
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Size Scale</label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Color Name</label>
                  <input
                    type="text"
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Color Hex</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-1.5 font-mono text-[11px]"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Extra ₹</label>
                  <input
                    type="number"
                    value={priceDelta}
                    onChange={(e) => setPriceDelta(Number(e.target.value))}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2 font-mono font-bold"
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
                  SAVE VARIANT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
