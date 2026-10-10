import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, CheckSquare, Search } from 'lucide-react';
import { formatPrice } from '../tsukuriData.ts';

export interface OrderLineItem {
  id: string;
  orderNumber: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPriceINR: number;
  filamentGramsUsed: number;
  printTimeMinutes: number;
}

interface OrderItemsTabProps {
  ordersList: any[];
}

export const OrderItemsTab: React.FC<OrderItemsTabProps> = ({ ordersList }) => {
  const [items, setItems] = useState<OrderLineItem[]>(() => {
    const list: OrderLineItem[] = [];
    ordersList.forEach((ord) => {
      if (ord.items && ord.items.length > 0) {
        ord.items.forEach((it: any, idx: number) => {
          list.push({
            id: `item-${ord.id}-${idx}`,
            orderNumber: ord.orderNumber,
            productName: it.name || '3D Printed Object',
            sku: `TSU-${ord.id}-${idx + 1}`,
            quantity: it.quantity || 1,
            unitPriceINR: it.priceINR || 599,
            filamentGramsUsed: (it.quantity || 1) * 85,
            printTimeMinutes: (it.quantity || 1) * 120,
          });
        });
      }
    });
    return list;
  });

  // Sync when ordersList changes
  useEffect(() => {
    const list: OrderLineItem[] = [];
    ordersList.forEach((ord) => {
      if (ord.items && ord.items.length > 0) {
        ord.items.forEach((it: any, idx: number) => {
          list.push({
            id: `item-${ord.id}-${idx}`,
            orderNumber: ord.orderNumber,
            productName: it.name || '3D Printed Object',
            sku: `TSU-${ord.id}-${idx + 1}`,
            quantity: it.quantity || 1,
            unitPriceINR: it.priceINR || 599,
            filamentGramsUsed: (it.quantity || 1) * 85,
            printTimeMinutes: (it.quantity || 1) * 120,
          });
        });
      }
    });
    setItems(list);
  }, [ordersList]);

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formOrderNum, setFormOrderNum] = useState('TSU-1004');
  const [formProdName, setFormProdName] = useState('');
  const [formSKU, setFormSKU] = useState('');
  const [formQty, setFormQty] = useState(1);
  const [formPrice, setFormPrice] = useState(599);
  const [formGrams, setFormGrams] = useState(90);

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === editingId
            ? {
                ...it,
                orderNumber: formOrderNum,
                productName: formProdName,
                sku: formSKU || `SKU-${Date.now()}`,
                quantity: Number(formQty),
                unitPriceINR: Number(formPrice),
                filamentGramsUsed: Number(formGrams),
              }
            : it
        )
      );
    } else {
      const newItem: OrderLineItem = {
        id: `item-${Date.now()}`,
        orderNumber: formOrderNum,
        productName: formProdName,
        sku: formSKU || `SKU-${Date.now().toString().slice(-4)}`,
        quantity: Number(formQty),
        unitPriceINR: Number(formPrice),
        filamentGramsUsed: Number(formGrams),
        printTimeMinutes: Number(formQty) * 120,
      };
      setItems([newItem, ...items]);
    }
    setIsAddModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (it: OrderLineItem) => {
    setEditingId(it.id);
    setFormOrderNum(it.orderNumber);
    setFormProdName(it.productName);
    setFormSKU(it.sku);
    setFormQty(it.quantity);
    setFormPrice(it.unitPriceINR);
    setFormGrams(it.filamentGramsUsed);
    setIsAddModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const filtered = items.filter(
    (it) =>
      it.productName.toLowerCase().includes(search.toLowerCase()) ||
      it.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      it.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xs border border-slate-100 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bubbly text-xl sm:text-2xl text-[#1a2e26] flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#1e4b3e]" />
            <span>ORDER ITEMS / LINE ITEMS DISPATCH</span>
          </h2>
          <p className="text-xs text-slate-500">
            Granular line item control linked to production orders, filament consumption & G-Code slicing.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search items or orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#e8ece1]/50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold"
            />
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setFormOrderNum('TSU-1004');
              setFormProdName('');
              setFormSKU('');
              setFormQty(1);
              setFormPrice(599);
              setFormGrams(85);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs tracking-wider flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ ADD ORDER ITEM</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#e8ece1]/60 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3 rounded-l-xl">Order #</th>
              <th className="p-3">Product Name</th>
              <th className="p-3">SKU</th>
              <th className="p-3 text-center">Qty</th>
              <th className="p-3 text-right">Unit Price</th>
              <th className="p-3 text-right">Total (INR)</th>
              <th className="p-3">Filament (g)</th>
              <th className="p-3 text-right rounded-r-xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((it) => (
              <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 font-mono font-bold text-[#1e4b3e]">{it.orderNumber}</td>
                <td className="p-3 font-bold text-[#1a2e26]">{it.productName}</td>
                <td className="p-3 font-mono text-slate-400">{it.sku}</td>
                <td className="p-3 text-center font-bold">{it.quantity}</td>
                <td className="p-3 text-right font-mono">{formatPrice(it.unitPriceINR)}</td>
                <td className="p-3 text-right font-mono font-bold text-[#1e4b3e]">
                  {formatPrice(it.unitPriceINR * it.quantity)}
                </td>
                <td className="p-3 text-slate-500 font-mono">{it.filamentGramsUsed}g</td>
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl border-4 border-[#e8ece1] space-y-4">
            <h3 className="font-bubbly text-xl text-[#1a2e26]">
              {editingId ? 'Edit Order Line Item' : 'Add New Order Item'}
            </h3>
            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Order #</label>
                <input
                  type="text"
                  required
                  value={formOrderNum}
                  onChange={(e) => setFormOrderNum(e.target.value)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Description</label>
                <input
                  type="text"
                  required
                  value={formProdName}
                  onChange={(e) => setFormProdName(e.target.value)}
                  placeholder="e.g. Zen Wave Planter"
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU</label>
                  <input
                    type="text"
                    value={formSKU}
                    onChange={(e) => setFormSKU(e.target.value)}
                    placeholder="TSU-ZEN-01"
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formQty}
                    onChange={(e) => setFormQty(Number(e.target.value))}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Price (INR ₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold text-[#1e4b3e]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Filament (Grams)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formGrams}
                    onChange={(e) => setFormGrams(Number(e.target.value))}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2.5 px-4 rounded-full bg-slate-100 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs shadow-md"
                >
                  SAVE LINE ITEM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
