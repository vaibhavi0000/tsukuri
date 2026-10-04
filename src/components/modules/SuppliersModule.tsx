import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Phone,
  Mail,
  MapPin,
  Star,
  Clock,
  Layers,
  Search,
  ExternalLink,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { Supplier, FilamentSpool } from '../../types/index.ts';
import { formatCurrency } from '../../lib/utils.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface SuppliersModuleProps {
  suppliers: Supplier[];
  spools: FilamentSpool[];
  onAddSupplier: (supplier: Partial<Supplier>) => Promise<void>;
}

export const SuppliersModule: React.FC<SuppliersModuleProps> = ({
  suppliers,
  spools,
  onAddSupplier,
}) => {
  const { canEdit } = useAuth();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [materialsSupplied, setMaterialsSupplied] = useState('PLA+, PETG, TPU Spools');
  const [leadTimeDays, setLeadTimeDays] = useState(3);
  const [rating, setRating] = useState(4.8);
  const [notes, setNotes] = useState('');

  const filtered = suppliers.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
      (s.materialsSupplied && s.materialsSupplied.toLowerCase().includes(q))
    );
  });

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddSupplier({
      name,
      contactPerson,
      email: email || null,
      phone: phone || null,
      address: address || null,
      materialsSupplied,
      leadTimeDays: Number(leadTimeDays),
      rating: Number(rating),
      notes: notes || null,
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            Suppliers & Material Vendors ({filtered.length})
          </h2>
          <p className="text-xs text-slate-500">
            Filament manufacturers, spare parts distributors, B2B wholesale pricing, and delivery lead times.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => {
                setName('');
                setContactPerson('');
                setEmail('');
                setPhone('');
                setAddress('');
                setMaterialsSupplied('PLA+, PETG, High-Temp ABS');
                setLeadTimeDays(3);
                setRating(4.9);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </button>
          )}
        </div>
      </div>

      {/* Material Price Comparison Strip */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60">
        <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-1.5">
          <Layers className="w-4 h-4" />
          Benchmark Material Pricing in Workshop
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40">
            <span className="text-slate-500">Standard PLA / PLA+</span>
            <p className="font-black text-sm text-slate-900 dark:text-slate-100 mt-0.5">₹1,199 - ₹1,350/kg</p>
            <p className="text-[10px] text-slate-400">Numakers &bull; 3DPrintz</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40">
            <span className="text-slate-500">Silk / Dual PLA</span>
            <p className="font-black text-sm text-slate-900 dark:text-slate-100 mt-0.5">₹1,450 - ₹1,699/kg</p>
            <p className="text-[10px] text-slate-400">eSUN India</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40">
            <span className="text-slate-500">PETG High-Strength</span>
            <p className="font-black text-sm text-slate-900 dark:text-slate-100 mt-0.5">₹1,500 - ₹1,650/kg</p>
            <p className="text-[10px] text-slate-400">Bambu Official / eSUN</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40">
            <span className="text-slate-500">Flexible TPU 95A</span>
            <p className="font-black text-sm text-slate-900 dark:text-slate-100 mt-0.5">₹2,200 - ₹2,500/kg</p>
            <p className="text-[10px] text-slate-400">Polymaker India</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers by name, contact, or material supplied..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
          />
        </div>
      </div>

      {/* Suppliers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{s.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">Attn: {s.contactPerson || 'Sales Team'}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{s.rating || 5}</span>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                {s.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {s.phone}
                  </p>
                )}
                {s.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {s.email}
                  </p>
                )}
                {s.address && (
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {s.address}
                  </p>
                )}
              </div>

              <div className="mt-4 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                  Materials Supplied:
                </span>
                <p className="font-medium text-slate-800 dark:text-slate-200">{s.materialsSupplied}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Lead Time: <strong>{s.leadTimeDays} days</strong>
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">Active Vendor</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Add Supplier Directory Record</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 3DPrintz India"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Arun Patel"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sales@vendor.in"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold mb-1">Address / Hub</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Peenya Industrial Area, Bengaluru"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold mb-1">Materials Supplied</label>
                  <input
                    type="text"
                    value={materialsSupplied}
                    onChange={(e) => setMaterialsSupplied(e.target.value)}
                    placeholder="PLA, PETG, TPU Spools, PEI sheets"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Rating (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
