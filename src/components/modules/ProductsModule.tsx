import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  ExternalLink,
  Edit,
  Trash2,
  Box,
  Layers,
  Clock,
  Sparkles,
  CheckCircle2,
  FileCode,
  Tag,
  Grid,
  List,
  X,
} from 'lucide-react';
import { Product } from '../../types/index.ts';
import { formatCurrency, formatMinutes } from '../../lib/utils.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface ProductsModuleProps {
  products: Product[];
  onAddProduct: (product: Partial<Product>) => Promise<void>;
  onUpdateProduct: (id: number, product: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: number) => Promise<void>;
}

export const ProductsModule: React.FC<ProductsModuleProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const { canEdit } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [materialFilter, setMaterialFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states for Create/Edit Modal
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Home & Decor');
  const [material, setMaterial] = useState('PLA');
  const [photos, setPhotos] = useState('');
  const [description, setDescription] = useState('');
  const [stlFileUrl, setStlFileUrl] = useState('');
  const [colorOptions, setColorOptions] = useState('Matte Black, Pure White, Silk Gold');
  const [printTimeMinutes, setPrintTimeMinutes] = useState(120);
  const [filamentWeightGrams, setFilamentWeightGrams] = useState(80);
  const [costPrice, setCostPrice] = useState(150);
  const [sellingPrice, setSellingPrice] = useState(499);
  const [stock, setStock] = useState(10);
  const [status, setStatus] = useState<'active' | 'draft'>('active');

  const categories = ['All', 'Home & Decor', 'Gadgets & Tools', 'Cosplay & Props', 'Miniatures', 'Custom'];
  const materials = ['All', 'PLA', 'PETG', 'ABS', 'TPU', 'Resin'];

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesMat = materialFilter === 'All' || p.material === materialFilter;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesCat && matchesMat && matchesStatus;
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSku(`PRD-${Math.floor(1000 + Math.random() * 9000)}`);
    setCategory('Home & Decor');
    setMaterial('PLA');
    setPhotos('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600');
    setDescription('');
    setStlFileUrl('https://printables.com/model/custom-design.3mf');
    setColorOptions('Matte Black, Pure White');
    setPrintTimeMinutes(120);
    setFilamentWeightGrams(80);
    setCostPrice(150);
    setSellingPrice(499);
    setStock(10);
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setCategory(p.category);
    setMaterial(p.material);
    let photoStr = '';
    try {
      if (p.photos) {
        const arr = JSON.parse(p.photos);
        photoStr = Array.isArray(arr) ? arr.join(', ') : p.photos;
      }
    } catch {
      photoStr = p.photos || '';
    }
    setPhotos(photoStr);
    setDescription(p.description || '');
    setStlFileUrl(p.stlFileUrl || '');
    let colorsStr = '';
    try {
      if (p.colorOptions) {
        const arr = JSON.parse(p.colorOptions);
        colorsStr = Array.isArray(arr) ? arr.join(', ') : p.colorOptions;
      }
    } catch {
      colorsStr = p.colorOptions || '';
    }
    setColorOptions(colorsStr);
    setPrintTimeMinutes(p.printTimeMinutes);
    setFilamentWeightGrams(p.filamentWeightGrams);
    setCostPrice(p.costPrice);
    setSellingPrice(p.sellingPrice);
    setStock(p.stock);
    setStatus(p.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const photoArr = photos
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const colorArr = colorOptions
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: Partial<Product> = {
      name,
      sku,
      category,
      material,
      photos: JSON.stringify(photoArr),
      description,
      stlFileUrl,
      colorOptions: JSON.stringify(colorArr),
      printTimeMinutes: Number(printTimeMinutes),
      filamentWeightGrams: Number(filamentWeightGrams),
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      stock: Number(stock),
      status,
    };

    if (editingProduct) {
      await onUpdateProduct(editingProduct.id, payload);
    } else {
      await onAddProduct(payload);
    }
    setIsModalOpen(false);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Material', 'Print Time (mins)', 'Weight (g)', 'Cost Price', 'Selling Price', 'Stock', 'Status'];
    const rows = products.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.category,
      p.material,
      p.printTimeMinutes,
      p.filamentWeightGrams,
      p.costPrice,
      p.sellingPrice,
      p.stock,
      p.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `printhub_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Box className="w-5 h-5 text-indigo-600" />
            Products & Catalog ({filtered.length})
          </h2>
          <p className="text-xs text-slate-500">
            Manage 3D printed inventory, STLs, filament consumption specs, and retail prices.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          {canEdit && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          )}

          {/* Toggle view mode */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs'
                  : 'text-slate-400'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs'
                  : 'text-slate-400'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, SKU or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Material Filter */}
          <select
            value={materialFilter}
            onChange={(e) => setMaterialFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            {materials.map((m) => (
              <option key={m} value={m}>
                Material: {m}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="All">Status: All</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => {
            let photoUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600';
            try {
              if (product.photos) {
                const arr = JSON.parse(product.photos);
                if (Array.isArray(arr) && arr[0]) photoUrl = arr[0];
              }
            } catch {}

            const margin = product.sellingPrice > 0
              ? Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100)
              : 0;

            return (
              <div
                key={product.id}
                className="group flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all"
              >
                {/* Photo & Category Pill */}
                <div className="relative aspect-4/3 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={photoUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white">
                      {product.category}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-600/90 backdrop-blur-md text-white">
                      {product.material}
                    </span>
                  </div>

                  <span
                    className={`absolute top-2.5 right-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      product.status === 'active'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-500 text-white'
                    }`}
                  >
                    {product.status}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                        {product.name}
                      </h3>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">{product.sku}</p>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {product.description || '3D printed custom craft product.'}
                    </p>

                    {/* Specs chips */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{formatMinutes(product.printTimeMinutes)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{product.filamentWeightGrams}g filament</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Stock */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-base font-black text-slate-900 dark:text-slate-100">
                        {formatCurrency(product.sellingPrice)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Cost: {formatCurrency(product.costPrice)} ({margin}% margin)
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          product.stock <= 3
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {product.stock} in stock
                      </span>

                      {canEdit && (
                        <div className="flex items-center justify-end gap-1 mt-1.5">
                          {product.stlFileUrl && (
                            <a
                              href={product.stlFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Download STL / 3MF"
                              className="p-1 text-slate-400 hover:text-indigo-600"
                            >
                              <FileCode className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => openEditModal(product)}
                            title="Edit Product"
                            className="p-1 text-slate-400 hover:text-indigo-600"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(product.id)}
                            title="Delete Product"
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-4">Print Specs</th>
                  <th className="py-3 px-4">Cost Price</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  {canEdit && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.sku}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{p.category}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                        {p.material}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatMinutes(p.printTimeMinutes)} &bull; {p.filamentWeightGrams}g
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {formatCurrency(p.costPrice)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(p.sellingPrice)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          p.stock <= 3 ? 'text-rose-500 font-bold' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1 text-slate-400 hover:text-indigo-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">
                {editingProduct ? 'Edit Catalog Product' : 'Add New 3D Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Product Title
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Articulated Crystal Dragon (45cm)"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="Home & Decor">Home & Decor</option>
                    <option value="Gadgets & Tools">Gadgets & Tools</option>
                    <option value="Cosplay & Props">Cosplay & Props</option>
                    <option value="Miniatures">Miniatures</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Default Material
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
                    <option value="Resin">Resin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Image URLs (comma separated)
                  </label>
                  <input
                    type="text"
                    value={photos}
                    onChange={(e) => setPhotos(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    STL / 3MF File Download Link
                  </label>
                  <input
                    type="text"
                    value={stlFileUrl}
                    onChange={(e) => setStlFileUrl(e.target.value)}
                    placeholder="https://printables.com/... or Google Drive link"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Print Time (Minutes)
                  </label>
                  <input
                    type="number"
                    value={printTimeMinutes}
                    onChange={(e) => setPrintTimeMinutes(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Filament Weight (Grams)
                  </label>
                  <input
                    type="number"
                    value={filamentWeightGrams}
                    onChange={(e) => setFilamentWeightGrams(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Stock Qty
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Color Options
                  </label>
                  <input
                    type="text"
                    value={colorOptions}
                    onChange={(e) => setColorOptions(e.target.value)}
                    placeholder="Matte Black, Pure White"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description & Print Notes
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe infill %, layer height, or recommendations..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
