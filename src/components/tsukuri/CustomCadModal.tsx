import React, { useState } from 'react';
import { UploadCloud, Layers, Clock, ShieldCheck, CheckCircle2, X, Lock, User, ArrowRight } from 'lucide-react';
import { formatPrice, UserAccount } from './tsukuriData.ts';

interface CustomCadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitQuote: (quoteData: any) => void;
  user?: UserAccount | null;
  onRequireAuth?: () => void;
}

export const CustomCadModal: React.FC<CustomCadModalProps> = ({
  isOpen,
  onClose,
  onSubmitQuote,
  user,
  onRequireAuth,
}) => {
  const [fileName, setFileName] = useState<string>('cyber_torii_keycap_v2.stl');
  const [fileSize, setFileSize] = useState<string>('8.4 MB');
  const [material, setMaterial] = useState<'Matcha Bio-PLA' | 'Terracotta PETG' | 'Teak Wood Composite' | 'Silk Obsidian'>('Matcha Bio-PLA');
  const [infill, setInfill] = useState<number>(20);
  const [layerHeight, setLayerHeight] = useState<'0.12mm (Ultra Fine)' | '0.20mm (Standard)' | '0.28mm (Draft)'>('0.20mm (Standard)');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  // Real-time calculated specs in INR
  const estimatedGrams = Math.round(45 * (infill / 20));
  const estimatedHours = Number((3.2 * (infill / 20) * (layerHeight.includes('0.12') ? 1.5 : 1.0)).toFixed(1));
  // INR Calculation: Base ₹299 + ₹3 per gram + ₹50 per hour
  const baseCostINR = Math.round(299 + estimatedGrams * 3.5 + estimatedHours * 60);

  const handleFakeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitQuote({
      fileName,
      fileSize,
      material,
      infill,
      layerHeight,
      estimatedGrams,
      estimatedHours,
      priceINR: baseCostINR,
      customerName: user?.name,
      customerEmail: user?.email,
      customerPhone: user?.phone,
    });
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#e8ece1] rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border-4 border-white overflow-hidden text-[#1a2e26]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white text-slate-700 flex items-center justify-center hover:bg-[#1e4b3e] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="mb-5">
          <span className="text-[11px] font-bold tracking-widest text-[#1e4b3e] uppercase">
            造り · Custom Fabrication Lab
          </span>
          <h2 className="text-3xl font-bubbly text-[#1a2e26] mt-1">
            CUSTOM CAD SLICER
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Drop your STL, OBJ, or STEP 3D models for instant Kyoto precision calculation in INR.
          </p>
        </div>

        {/* Requirement 2: User must be signed in or sign up to explore CAD slicer or upload CAD */}
        {!user ? (
          <div className="p-6 sm:p-8 text-center bg-white rounded-3xl space-y-4 border border-[#1e4b3e]/15 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#1e4b3e] text-[#f3b755] flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest text-[#ea8f5a] uppercase">
                MEMBER SIGN-IN REQUIRED
              </span>
              <h3 className="text-xl sm:text-2xl font-bubbly text-[#1a2e26] mt-1">
                SIGN IN TO ACCESS CAD SLICER
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 max-w-md mx-auto leading-relaxed">
                To explore our high-speed 3D CAD slicer, configure custom infill/layer heights, and upload bespoke .STL / .OBJ / .STEP files, please sign in or create a TsuKURI account.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-left max-w-sm mx-auto p-3 bg-[#e8ece1]/50 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1e4b3e] shrink-0" />
                <span>STL / STEP Cloud Slicing</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1e4b3e] shrink-0" />
                <span>Instant Weight & INR Quotes</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1e4b3e] shrink-0" />
                <span>Bambu Fleet Farm Queue</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1e4b3e] shrink-0" />
                <span>Order Tracking & Receipts</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onRequireAuth) onRequireAuth();
                }}
                className="flex-1 py-3.5 rounded-full bg-[#1e4b3e] hover:bg-[#15342b] text-[#f3b755] font-bubbly text-xs tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>SIGN IN / SIGN UP NOW</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3.5 px-6 rounded-full bg-[#e8ece1] hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="p-8 text-center bg-white rounded-3xl space-y-3">
            <CheckCircle2 className="w-16 h-16 text-[#1e4b3e] mx-auto animate-bounce" />
            <h3 className="text-2xl font-bubbly text-[#1e4b3e]">CUSTOM ORDER TRANSMITTED!</h3>
            <p className="text-xs text-slate-600">
              Your CAD file is queued on our Bambu Lab X1C fleet. Order reference logged for {user.name}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Authenticated badge */}
            <div className="flex items-center justify-between text-[11px] bg-white/70 px-3 py-1.5 rounded-xl border border-[#1e4b3e]/10">
              <span className="text-slate-600">
                Logged in as <strong className="text-[#1e4b3e]">{user.name}</strong>
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                Slicer Authorized
              </span>
            </div>
            {/* File Drag Drop Box */}
            <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#1e4b3e]/40 rounded-3xl bg-white/70 hover:bg-white cursor-pointer transition-colors group">
              <UploadCloud className="w-8 h-8 text-[#1e4b3e] group-hover:scale-110 transition-transform mb-2" />
              <span className="text-xs font-bold text-[#1a2e26]">
                {fileName} ({fileSize})
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Click or drag & drop new .STL / .OBJ / .STEP / .3MF file
              </span>
              <input
                type="file"
                accept=".stl,.obj,.step,.3mf"
                onChange={handleFakeUpload}
                className="hidden"
              />
            </label>

            {/* Slicing Controls Bento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Material */}
              <div className="p-3 bg-white rounded-2xl">
                <label className="block text-[11px] font-bold text-[#1a2e26] mb-1.5">
                  Select Filament
                </label>
                <select
                  value={material}
                  onChange={(e: any) => setMaterial(e.target.value)}
                  className="w-full text-xs font-semibold bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
                >
                  <option value="Matcha Bio-PLA">Matcha Bio-PLA (Natural)</option>
                  <option value="Terracotta PETG">Terracotta PETG (Durable)</option>
                  <option value="Teak Wood Composite">Teak Wood PLA (Organic)</option>
                  <option value="Silk Obsidian">Silk Obsidian (Glossy)</option>
                </select>
              </div>

              {/* Infill Density */}
              <div className="p-3 bg-white rounded-2xl">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] font-bold text-[#1a2e26]">
                    Infill Density
                  </label>
                  <span className="text-xs font-bold text-[#1e4b3e] font-mono">
                    {infill}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={infill}
                  onChange={(e) => setInfill(Number(e.target.value))}
                  className="w-full accent-[#1e4b3e] cursor-pointer"
                />
              </div>

              {/* Layer Quality */}
              <div className="p-3 bg-white rounded-2xl sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#1a2e26] mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#1e4b3e]" />
                  Layer Precision
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['0.12mm (Ultra Fine)', '0.20mm (Standard)', '0.28mm (Draft)'] as const).map((layer) => (
                    <button
                      key={layer}
                      type="button"
                      onClick={() => setLayerHeight(layer)}
                      className={`py-2 px-1 text-[11px] font-bold rounded-xl border text-center transition-all ${
                        layerHeight === layer
                          ? 'bg-[#1e4b3e] text-white border-[#1e4b3e] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {layer.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Instant Slicing Summary & Price Quote */}
            <div className="p-4 bg-[#f3b755] rounded-3xl flex items-center justify-between text-[#1a2e26]">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider opacity-80">
                  SLICER ESTIMATE
                </span>
                <div className="flex items-center gap-3 text-xs font-bold font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {estimatedHours} hrs
                  </span>
                  <span>·</span>
                  <span>{estimatedGrams}g Bio-PLA</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold block opacity-75">
                  ESTIMATED QUOTE (INR)
                </span>
                <span className="text-2xl font-bubbly text-[#1a2e26]">
                  {formatPrice(baseCostINR)}
                </span>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full py-4 rounded-full bg-[#1e4b3e] hover:bg-[#15342b] text-[#f3b755] font-bubbly text-base tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <ShieldCheck className="w-5 h-5 text-[#f3b755]" />
              <span>SUBMIT CUSTOM PRINT ORDER &rarr;</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
