import React, { useState } from 'react';
import { Plus, Trash2, Edit, Briefcase, Search, Star } from 'lucide-react';

export interface SupplierRecord {
  id: string;
  name: string;
  material: string;
  contactPerson: string;
  email: string;
  phone: string;
  rating: number;
  city: string;
}

export const SuppliersTab: React.FC = () => {
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>(() => {
    try {
      const stored = localStorage.getItem('tsukuri_suppliers');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const saveSuppliers = (newSuppliers: SupplierRecord[]) => {
    setSuppliers(newSuppliers);
    try {
      localStorage.setItem('tsukuri_suppliers', JSON.stringify(newSuppliers));
    } catch {}
  };

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [material, setMaterial] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rating, setRating] = useState(4.8);
  const [city, setCity] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = suppliers.map((s) =>
        s.id === editingId
          ? { ...s, name, material, contactPerson, email, phone, rating: Number(rating), city }
          : s
      );
      saveSuppliers(updated);
    } else {
      const newSup: SupplierRecord = {
        id: `sup-${Date.now().toString().slice(-4)}`,
        name,
        material,
        contactPerson,
        email,
        phone,
        rating: Number(rating),
        city,
      };
      saveSuppliers([...suppliers, newSup]);
    }
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (s: SupplierRecord) => {
    setEditingId(s.id);
    setName(s.name);
    setMaterial(s.material);
    setContactPerson(s.contactPerson);
    setEmail(s.email);
    setPhone(s.phone);
    setRating(s.rating);
    setCity(s.city);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    saveSuppliers(suppliers.filter((s) => s.id !== id));
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.material.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xs border border-slate-100 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bubbly text-xl sm:text-2xl text-[#1a2e26] flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#1e4b3e]" />
            <span>SUPPLIERS DIRECTORY & VENDOR ERP</span>
          </h2>
          <p className="text-xs text-slate-500">
            Certified bio-polymer manufacturers, packaging suppliers, and printer hardware distributors.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendor or material..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#e8ece1]/50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold"
            />
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setName('');
              setMaterial('');
              setContactPerson('');
              setEmail('');
              setPhone('');
              setRating(4.8);
              setCity('');
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs tracking-wider flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ ADD SUPPLIER</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#e8ece1]/60 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3 rounded-l-xl">Supplier Entity</th>
              <th className="p-3">Primary Materials Supplied</th>
              <th className="p-3">Contact Person</th>
              <th className="p-3">Email & Phone</th>
              <th className="p-3">Rating</th>
              <th className="p-3 text-right rounded-r-xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3">
                  <span className="font-bold text-[#1a2e26] block">{s.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{s.city}</span>
                </td>
                <td className="p-3 text-slate-600 font-medium">{s.material}</td>
                <td className="p-3 text-slate-700">{s.contactPerson}</td>
                <td className="p-3 font-mono text-[11px] text-slate-500">
                  <div>{s.email}</div>
                  <div>{s.phone}</div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{s.rating}</span>
                  </div>
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleEdit(s)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#1e4b3e] hover:text-white text-slate-700 transition-colors"
                      title="Edit Supplier"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 transition-colors"
                      title="Delete Supplier"
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
              {editingId ? 'Edit Supplier' : 'Register New Vendor / Supplier'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kyoto BioPolymer Ltd."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Materials / Services Supplied</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bio-Matte PLA, PETG, Mailer Boxes"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="Hiroshi Tanaka"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Location / City</label>
                  <input
                    type="text"
                    placeholder="Kyoto, Japan"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="orders@vendor.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98450..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                  SAVE SUPPLIER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
