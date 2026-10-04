import React, { useState } from 'react';
import {
  Calculator,
  DollarSign,
  Layers,
  Clock,
  Zap,
  Save,
  Wrench,
  Percent,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Product, BusinessSettings } from '../../types/index.ts';
import { formatCurrency } from '../../lib/utils.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface CostCalculatorModuleProps {
  products: Product[];
  settings?: BusinessSettings;
  onSaveProduct: (product: Partial<Product>) => Promise<void>;
}

export const CostCalculatorModule: React.FC<CostCalculatorModuleProps> = ({
  products,
  settings,
  onSaveProduct,
}) => {
  const { canEdit } = useAuth();

  // Inputs
  const [productName, setProductName] = useState('New 3D Print Model');
  const [filamentWeightGrams, setFilamentWeightGrams] = useState(120);
  const [filamentCostPerKg, setFilamentCostPerKg] = useState(1350);
  const [printTimeHours, setPrintTimeHours] = useState(5.5);
  const [printerWattage, setPrinterWattage] = useState(150); // Watts (e.g. Bambu X1 or Creality K1)
  const [electricityRatePerKwh, setElectricityRatePerKwh] = useState(settings?.electricityRatePerKwh || 8.5);
  const [machineDepreciationRatePerHour, setMachineDepreciationRatePerHour] = useState(settings?.machineDepreciationRatePerHour || 25);
  const [laborHours, setLaborHours] = useState(0.5); // 30 mins
  const [laborRatePerHour, setLaborRatePerHour] = useState(settings?.laborRatePerHour || 100);
  const [postProcessingCost, setPostProcessingCost] = useState(30); // sanding, support removal, acetone/alcohol
  const [packagingCost, setPackagingCost] = useState(35); // box, bubble wrap, stickers
  const [shippingCost, setShippingCost] = useState(70);
  const [platformFeePercent, setPlatformFeePercent] = useState(10); // e.g. Amazon / Etsy / Payment gateway
  const [targetMarginPercent, setTargetMarginPercent] = useState(50); // 50% target gross margin
  const [gstRatePercent, setGstRatePercent] = useState(settings?.defaultTaxRate || 18);
  const [isSaved, setIsSaved] = useState(false);

  // Calculations
  // 1. Material cost
  const materialCost = (filamentWeightGrams / 1000) * filamentCostPerKg;

  // 2. Electricity cost = (Watts * hours / 1000) * ratePerKwh
  const electricityKwh = (printerWattage * printTimeHours) / 1000;
  const electricityCost = electricityKwh * electricityRatePerKwh;

  // 3. Machine depreciation wear & tear
  const depreciationCost = printTimeHours * machineDepreciationRatePerHour;

  // 4. Labor cost
  const laborCost = laborHours * laborRatePerHour;

  // Total direct cost to manufacture (COGS)
  const manufacturingCost = materialCost + electricityCost + depreciationCost + laborCost + postProcessingCost;

  // Direct fulfillment cost
  const fulfillmentCost = packagingCost + shippingCost;

  // Base total cost before platform fees
  const baseCost = manufacturingCost + fulfillmentCost;

  // Suggested selling price: Base Cost / (1 - (Margin + PlatformFee)/100)
  const totalDeductionsPercent = (targetMarginPercent + platformFeePercent) / 100;
  const rawSuggestedPrice = totalDeductionsPercent < 1 ? baseCost / (1 - totalDeductionsPercent) : baseCost * 2;
  const suggestedSellingPrice = Math.ceil(rawSuggestedPrice / 10) * 10; // Round to nearest 10

  // Platform fee in ₹
  const platformFeeAmount = suggestedSellingPrice * (platformFeePercent / 100);

  // Total cost including platform fees
  const totalCost = baseCost + platformFeeAmount;

  // Net profit per unit
  const profitPerUnit = suggestedSellingPrice - totalCost;

  // GST (18%)
  const gstAmount = suggestedSellingPrice * (gstRatePercent / 100);
  const finalPriceWithGst = suggestedSellingPrice + gstAmount;

  // Quick Preset Handlers
  const applyPreset = (preset: string) => {
    if (preset === 'dragon') {
      setProductName('Articulated Dragon / Flexi');
      setFilamentWeightGrams(185);
      setFilamentCostPerKg(1450);
      setPrintTimeHours(7);
      setLaborHours(0.3);
      setTargetMarginPercent(60);
    } else if (preset === 'planter') {
      setProductName('Geometric Succulent Planter');
      setFilamentWeightGrams(95);
      setFilamentCostPerKg(1600);
      setPrintTimeHours(3.5);
      setLaborHours(0.2);
      setTargetMarginPercent(50);
    } else if (preset === 'miniature') {
      setProductName('High-Detail 32mm Miniature');
      setFilamentWeightGrams(25);
      setFilamentCostPerKg(2200);
      setPrintTimeHours(2.5);
      setLaborHours(0.6);
      setTargetMarginPercent(65);
    }
  };

  const handleSaveToCatalog = async () => {
    await onSaveProduct({
      name: productName,
      sku: `CALC-${Date.now().toString().slice(-5)}`,
      category: 'Custom',
      material: 'PLA',
      printTimeMinutes: Math.round(printTimeHours * 60),
      filamentWeightGrams,
      costPrice: Math.round(manufacturingCost),
      sellingPrice: suggestedSellingPrice,
      stock: 5,
      status: 'active',
      description: `Auto-calculated pricing: Material ₹${materialCost.toFixed(0)}, Machining ₹${depreciationCost.toFixed(0)}, Labor ₹${laborCost.toFixed(0)}. Target ${targetMarginPercent}% margin.`,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            3D Print Costing & Pricing Engine
          </h2>
          <p className="text-xs text-slate-500">
            Professional manufacturing breakdown taking into account material, electricity, depreciation, labor, packaging, platform commissions, and GST.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold mr-1">Presets:</span>
          <button
            onClick={() => applyPreset('dragon')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
          >
            Flexi Dragon
          </button>
          <button
            onClick={() => applyPreset('planter')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
          >
            PETG Planter
          </button>
          <button
            onClick={() => applyPreset('miniature')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100"
          >
            RPG Miniature
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Section (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              1. Job & Model Parameters
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product / Job Name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs"
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
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Filament Cost (₹/kg)
                </label>
                <input
                  type="number"
                  value={filamentCostPerKg}
                  onChange={(e) => setFilamentCostPerKg(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Print Time (Hours)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={printTimeHours}
                  onChange={(e) => setPrintTimeHours(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Printer Average Power (Watts)
                </label>
                <input
                  type="number"
                  value={printerWattage}
                  onChange={(e) => setPrinterWattage(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-emerald-600" />
              2. Overhead, Labor & Fulfillment Rates
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Electricity Rate (₹/kWh)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={electricityRatePerKwh}
                  onChange={(e) => setElectricityRatePerKwh(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Machine Wear (₹/hour)
                </label>
                <input
                  type="number"
                  value={machineDepreciationRatePerHour}
                  onChange={(e) => setMachineDepreciationRatePerHour(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Operator Labor (Hours)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={laborHours}
                  onChange={(e) => setLaborHours(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Labor Rate (₹/hour)
                </label>
                <input
                  type="number"
                  value={laborRatePerHour}
                  onChange={(e) => setLaborRatePerHour(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Post-Processing (₹)
                </label>
                <input
                  type="number"
                  value={postProcessingCost}
                  onChange={(e) => setPostProcessingCost(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Box & Packaging (₹)
                </label>
                <input
                  type="number"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Percent className="w-4 h-4 text-purple-600" />
              3. Channel Fees, Margins & GST
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Channel Fee (%)
                </label>
                <input
                  type="number"
                  value={platformFeePercent}
                  onChange={(e) => setPlatformFeePercent(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Profit Margin (%)
                </label>
                <input
                  type="number"
                  value={targetMarginPercent}
                  onChange={(e) => setTargetMarginPercent(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs font-bold text-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GST Rate (%)
                </label>
                <input
                  type="number"
                  value={gstRatePercent}
                  onChange={(e) => setGstRatePercent(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Output & Summary Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 text-white border border-indigo-900/60 shadow-xl space-y-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                Recommended Price Card
              </span>
              <h3 className="text-3xl font-black text-white mt-1">
                {formatCurrency(suggestedSellingPrice)}
              </h3>
              <p className="text-xs text-indigo-200">
                Excl. GST &bull; Final consumer price with 18% GST: <strong>{formatCurrency(finalPriceWithGst)}</strong>
              </p>
            </div>

            {/* Profit & Margin Highlights */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
              <div>
                <span className="text-slate-400">Net Profit / Unit:</span>
                <p className="text-lg font-black text-emerald-400">
                  {formatCurrency(profitPerUnit)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Actual Margin:</span>
                <p className="text-lg font-black text-indigo-300">
                  {suggestedSellingPrice > 0 ? Math.round((profitPerUnit / suggestedSellingPrice) * 100) : 0}%
                </p>
              </div>
            </div>

            {/* Cost Component Breakdown */}
            <div className="space-y-2 text-xs border-t border-white/10 pt-4">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                Cost Breakdown Components:
              </span>

              <div className="flex justify-between text-slate-300">
                <span>Filament Raw Material ({filamentWeightGrams}g):</span>
                <span className="font-mono">{formatCurrency(materialCost)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Electricity ({electricityKwh.toFixed(2)} kWh):</span>
                <span className="font-mono">{formatCurrency(electricityCost)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Machine Wear ({printTimeHours}h):</span>
                <span className="font-mono">{formatCurrency(depreciationCost)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Operator Labor ({laborHours}h):</span>
                <span className="font-mono">{formatCurrency(laborCost)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Post-Processing & Sanding:</span>
                <span className="font-mono">{formatCurrency(postProcessingCost)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Packaging Box & Materials:</span>
                <span className="font-mono">{formatCurrency(packagingCost)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Platform Commission ({platformFeePercent}%):</span>
                <span className="font-mono">{formatCurrency(platformFeeAmount)}</span>
              </div>

              <div className="flex justify-between pt-2 border-t border-white/10 font-bold text-sm text-white">
                <span>Total Unit Cost (COGS):</span>
                <span className="text-rose-400">{formatCurrency(totalCost)}</span>
              </div>
            </div>

            {/* Save to Catalog Button */}
            {canEdit && (
              <div className="pt-2">
                <button
                  onClick={handleSaveToCatalog}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSaved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      Saved to Catalog!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Calculation to Products Catalog
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
