import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Sliders,
  PieChart,
  HelpCircle,
  FileSpreadsheet,
  Printer,
  Zap,
  Layers,
  Clock,
  Megaphone,
  Box,
  Truck,
  Wrench,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  Info,
  Calendar,
  Download,
} from 'lucide-react';
import { WorkshopOrder, TsukuriProduct, formatPrice } from '../tsukuriData.ts';

export interface CostDriverSettings {
  filamentPricePerKg: number; // ₹ per 1 kg spool (e.g. 1200)
  electricityTariffKwh: number; // ₹ per kWh (e.g. 8.5)
  printerWatts: number; // Printer power consumption in watts (e.g. 280W)
  machineRatePerHour: number; // Machine depreciation, nozzle wear & maintenance ₹/hr (e.g. 30)
  adCostPerUnit: number; // Blended Meta/Google CAC allocated per product sold (e.g. 75)
  packagingCostPerOrder: number; // Box, custom tape, bubble wrap, cards (e.g. 35)
  shippingCostPerOrder: number; // Courier freight charge (e.g. 50)
  miscFlatCostPerOrder: number; // Post-processing, sanding, alcohol, tools (e.g. 30)
  scrapFailureRatePercent: number; // 3D print failure allowance % (e.g. 5%)
  paymentGatewayFeePercent: number; // Razorpay / UPI gateway fee % (e.g. 2%)
}

export const DEFAULT_COST_DRIVERS: CostDriverSettings = {
  filamentPricePerKg: 1200, // ₹1.20 / gram
  electricityTariffKwh: 8.5, // Commercial tariff in Karnataka/India
  printerWatts: 280, // Bambu Lab P1S/X1C average draw ~250-320W
  machineRatePerHour: 30, // ₹30/hour wear, PEI sheet, nozzle, maintenance
  adCostPerUnit: 75, // Target ad spend per 3D print sold
  packagingCostPerOrder: 35, // Premium rigid box, filler, custom seal
  shippingCostPerOrder: 50, // Base courier charge
  miscFlatCostPerOrder: 30, // Cleaning, support snips, craft tools
  scrapFailureRatePercent: 5, // 5% print failure allowance
  paymentGatewayFeePercent: 2, // 2% gateway fee for online payments
};

interface CostAndProfitAnalysisTabProps {
  ordersList: WorkshopOrder[];
  productsList?: TsukuriProduct[];
  onRefreshOrders?: () => void;
}

export const CostAndProfitAnalysisTab: React.FC<CostAndProfitAnalysisTabProps> = ({
  ordersList,
  productsList = [],
  onRefreshOrders,
}) => {
  // Configurable Cost Driver Settings
  const [drivers, setDrivers] = useState<CostDriverSettings>(() => {
    try {
      const saved = localStorage.getItem('tsukuri_cost_drivers');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_COST_DRIVERS;
  });

  const [isDriversOpen, setIsDriversOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'high' | 'healthy' | 'slim' | 'loss'>('all');
  const [sortBy, setSortBy] = useState<'margin_desc' | 'margin_asc' | 'profit_desc' | 'revenue_desc' | 'date_desc'>('date_desc');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Per-order manual overrides (if admin customized an individual order's ad spend or shipping)
  const [orderOverrides, setOrderOverrides] = useState<Record<string, Partial<CostDriverSettings>>>({});

  // Save drivers to localStorage
  const updateDrivers = (newDrivers: Partial<CostDriverSettings>) => {
    setDrivers((prev) => {
      const updated = { ...prev, ...newDrivers };
      try {
        localStorage.setItem('tsukuri_cost_drivers', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleResetDrivers = () => {
    setDrivers(DEFAULT_COST_DRIVERS);
    try {
      localStorage.removeItem('tsukuri_cost_drivers');
    } catch {}
  };

  // Helper map for fast product lookup by name or ID
  const productLookup = useMemo(() => {
    const map = new Map<string, TsukuriProduct>();
    productsList.forEach((p) => {
      map.set(String(p.id), p);
      map.set(p.name.toLowerCase().trim(), p);
      map.set(p.sku.toLowerCase().trim(), p);
    });
    return map;
  }, [productsList]);

  // Order Analysis Calculation Engine
  const analyzedOrders = useMemo(() => {
    return ordersList.map((order) => {
      const ov = orderOverrides[order.orderNumber] || {};
      const activeDrivers = { ...drivers, ...ov };

      // 1. Tally units, filament weight, and machine print time across all items in order
      let totalUnits = 0;
      let totalWeightGrams = 0;
      let totalPrintHours = 0;

      const analyzedItems = (order.items || []).map((item) => {
        const qty = Number(item.quantity) || 1;
        totalUnits += qty;

        const matchedProduct =
          (item.productId ? productLookup.get(String(item.productId)) : null) ||
          productLookup.get(item.name.toLowerCase().trim());

        const unitGrams = matchedProduct?.weightGrams || 65;
        const unitHours = matchedProduct?.printTimeHours || 1.8;

        const itemTotalGrams = unitGrams * qty;
        const itemTotalHours = unitHours * qty;

        totalWeightGrams += itemTotalGrams;
        totalPrintHours += itemTotalHours;

        return {
          ...item,
          unitGrams,
          unitHours,
          itemTotalGrams,
          itemTotalHours,
        };
      });

      // Default fallback if order has no detailed items
      if (totalUnits === 0) totalUnits = 1;
      if (totalWeightGrams === 0) totalWeightGrams = 75;
      if (totalPrintHours === 0) totalPrintHours = 2.0;

      // 2. Individual 7 Cost Driver Components for this order:
      // (a) Filament Cost
      const filamentCost = (totalWeightGrams * activeDrivers.filamentPricePerKg) / 1000;

      // (b) Electricity Cost = hours * (kW) * tariff/kWh
      const kw = activeDrivers.printerWatts / 1000;
      const electricityCost = totalPrintHours * kw * activeDrivers.electricityTariffKwh;

      // (c) Machine Time / Wear & Tear Cost
      const machineTimeCost = totalPrintHours * activeDrivers.machineRatePerHour;

      // (d) Ad Cost per Product
      const adCost = totalUnits * activeDrivers.adCostPerUnit;

      // (e) Packaging Cost
      const packagingCost = activeDrivers.packagingCostPerOrder;

      // (f) Shipping Charge (use order's charged/incurred shipping or default)
      const shippingCost =
        (order as any).shippingFee !== undefined && (order as any).shippingFee !== null
          ? Number((order as any).shippingFee) || activeDrivers.shippingCostPerOrder
          : activeDrivers.shippingCostPerOrder;

      // (g) Miscellaneous Cost (Flat tools/prep + scrap allowance on print + payment gateway charge)
      const scrapCost =
        ((filamentCost + electricityCost) * activeDrivers.scrapFailureRatePercent) / 100;
      const gatewayCost =
        order.paymentMethod === 'Online'
          ? ((order.totalAmountINR || order.subtotalINR || 0) * activeDrivers.paymentGatewayFeePercent) / 100
          : 0;
      const miscCost = activeDrivers.miscFlatCostPerOrder + scrapCost + gatewayCost;

      // 3. Totals and Margin
      const totalCost =
        filamentCost +
        electricityCost +
        machineTimeCost +
        adCost +
        packagingCost +
        shippingCost +
        miscCost;

      const revenue = Number(order.totalAmountINR || order.subtotalINR || 0);
      const netProfit = revenue - totalCost;
      const marginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      // Margin Tier
      let tier: 'high' | 'healthy' | 'slim' | 'loss' = 'healthy';
      if (marginPercent >= 50) tier = 'high';
      else if (marginPercent >= 30) tier = 'healthy';
      else if (marginPercent >= 10) tier = 'slim';
      else tier = 'loss';

      return {
        order,
        analyzedItems,
        totalUnits,
        totalWeightGrams,
        totalPrintHours,
        revenue,
        costs: {
          filamentCost,
          electricityCost,
          machineTimeCost,
          adCost,
          packagingCost,
          shippingCost,
          miscCost,
          totalCost,
        },
        netProfit,
        marginPercent,
        tier,
      };
    });
  }, [ordersList, drivers, orderOverrides, productLookup]);

  // Aggregate Workshop Metrics
  const summary = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalNetProfit = 0;
    let totalFilament = 0;
    let totalElectricity = 0;
    let totalMachineTime = 0;
    let totalAds = 0;
    let totalPackaging = 0;
    let totalShipping = 0;
    let totalMisc = 0;

    let highCount = 0;
    let healthyCount = 0;
    let slimCount = 0;
    let lossCount = 0;

    analyzedOrders.forEach((o) => {
      totalRevenue += o.revenue;
      totalCost += o.costs.totalCost;
      totalNetProfit += o.netProfit;

      totalFilament += o.costs.filamentCost;
      totalElectricity += o.costs.electricityCost;
      totalMachineTime += o.costs.machineTimeCost;
      totalAds += o.costs.adCost;
      totalPackaging += o.costs.packagingCost;
      totalShipping += o.costs.shippingCost;
      totalMisc += o.costs.miscCost;

      if (o.tier === 'high') highCount++;
      else if (o.tier === 'healthy') healthyCount++;
      else if (o.tier === 'slim') slimCount++;
      else lossCount++;
    });

    const averageMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
    const avgProfitPerOrder = analyzedOrders.length > 0 ? totalNetProfit / analyzedOrders.length : 0;

    return {
      totalRevenue,
      totalCost,
      totalNetProfit,
      averageMargin,
      avgProfitPerOrder,
      totalFilament,
      totalElectricity,
      totalMachineTime,
      totalAds,
      totalPackaging,
      totalShipping,
      totalMisc,
      orderCount: analyzedOrders.length,
      highCount,
      healthyCount,
      slimCount,
      lossCount,
    };
  }, [analyzedOrders]);

  // Filtered and Sorted Orders for Table
  const filteredOrders = useMemo(() => {
    return analyzedOrders
      .filter((o) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesNum = o.order.orderNumber.toLowerCase().includes(q);
          const matchesCust = o.order.customerName.toLowerCase().includes(q);
          const matchesCity = (o.order.city || '').toLowerCase().includes(q);
          const matchesItem = (o.order.items || []).some((it) =>
            it.name.toLowerCase().includes(q)
          );
          if (!matchesNum && !matchesCust && !matchesCity && !matchesItem) return false;
        }

        // Margin Tier Filter
        if (filterTier !== 'all' && o.tier !== filterTier) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'margin_desc') return b.marginPercent - a.marginPercent;
        if (sortBy === 'margin_asc') return a.marginPercent - b.marginPercent;
        if (sortBy === 'profit_desc') return b.netProfit - a.netProfit;
        if (sortBy === 'revenue_desc') return b.revenue - a.revenue;
        // date_desc
        return new Date(b.order.orderDate || 0).getTime() - new Date(a.order.orderDate || 0).getTime();
      });
  }, [analyzedOrders, searchQuery, filterTier, sortBy]);

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = [
      'Order Number',
      'Customer',
      'Date',
      'Units',
      'Filament (g)',
      'Print Hours',
      'Revenue (INR)',
      'Filament Cost (INR)',
      'Electricity Cost (INR)',
      'Machine Time Cost (INR)',
      'Ad Cost (INR)',
      'Packaging Cost (INR)',
      'Shipping Charge (INR)',
      'Misc Cost (INR)',
      'Total Cost (INR)',
      'Net Profit (INR)',
      'Margin %',
      'Health Status',
    ];

    const rows = analyzedOrders.map((o) => [
      `"${o.order.orderNumber}"`,
      `"${o.order.customerName}"`,
      `"${o.order.orderDate || 'N/A'}"`,
      o.totalUnits,
      o.totalWeightGrams.toFixed(1),
      o.totalPrintHours.toFixed(1),
      o.revenue.toFixed(2),
      o.costs.filamentCost.toFixed(2),
      o.costs.electricityCost.toFixed(2),
      o.costs.machineTimeCost.toFixed(2),
      o.costs.adCost.toFixed(2),
      o.costs.packagingCost.toFixed(2),
      o.costs.shippingCost.toFixed(2),
      o.costs.miscCost.toFixed(2),
      o.costs.totalCost.toFixed(2),
      o.netProfit.toFixed(2),
      `${o.marginPercent.toFixed(1)}%`,
      `"${o.tier.toUpperCase()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tsukuri3d_cost_and_profit_analysis_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-[#1e4b3e] to-[#122e26] text-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-[#f3b755]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f3b755]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#f3b755] text-[#1a2e26] text-[10px] font-black uppercase tracking-wider">
                Financial Intelligence
              </span>
              <span className="text-xs text-white/70 font-mono">
                Order-Level Unit Economics
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bubbly text-white flex items-center gap-2.5">
              <span>Cost & Profit Analysis</span>
              <Sparkles className="w-6 h-6 text-[#f3b755]" />
            </h1>
            <p className="text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
              Real-time margin calculation for every customer order factored against 
              <strong> filament material, electricity, machine depreciation time, ad acquisition cost, packaging, courier shipping,</strong> and <strong>miscellaneous prep/scrap</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsDriversOpen(!isDriversOpen)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold flex items-center gap-2 backdrop-blur-md transition-all cursor-pointer border border-white/15"
            >
              <Sliders className="w-4 h-4 text-[#f3b755]" />
              <span>{isDriversOpen ? 'Hide Cost Drivers' : 'Adjust Cost Drivers'}</span>
              {isDriversOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-[#f3b755] hover:bg-[#e0a23d] active:scale-95 text-[#1a2e26] text-xs font-black flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Global Summary KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-6 mt-6 border-t border-white/15 relative z-10">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-white/60 block">Total Revenue</span>
            <span className="text-lg sm:text-xl font-bubbly text-[#f3b755]">
              {formatPrice(summary.totalRevenue)}
            </span>
            <span className="text-[10px] text-white/60 block">{summary.orderCount} Orders</span>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-white/60 block">Total Cost of Goods</span>
            <span className="text-lg sm:text-xl font-bubbly text-rose-300">
              {formatPrice(summary.totalCost)}
            </span>
            <span className="text-[10px] text-white/60 block">Production & Freight</span>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-white/60 block">Total Net Profit</span>
            <span className={`text-lg sm:text-xl font-bubbly ${summary.totalNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatPrice(summary.totalNetProfit)}
            </span>
            <span className="text-[10px] text-white/60 block">Bottom-line Earnings</span>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-white/60 block">Average Margin</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-lg sm:text-xl font-bubbly ${summary.averageMargin >= 40 ? 'text-emerald-400' : summary.averageMargin >= 20 ? 'text-amber-400' : 'text-rose-400'}`}>
                {summary.averageMargin.toFixed(1)}%
              </span>
              {summary.averageMargin >= 40 ? (
                <Flame className="w-4 h-4 text-[#f3b755]" />
              ) : summary.averageMargin >= 20 ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <span className="text-[10px] text-white/60 block">Target: &gt; 45%</span>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-white/60 block">Avg Profit / Order</span>
            <span className="text-lg sm:text-xl font-bubbly text-white">
              {formatPrice(summary.avgProfitPerOrder)}
            </span>
            <span className="text-[10px] text-white/60 block">Per order dispatch</span>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-white/60 block">Margin Health</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300" title="High Margin">
                🔥 {summary.highCount}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/30 text-teal-300" title="Healthy Margin">
                ✓ {summary.healthyCount}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300" title="Slim Margin">
                ⚠️ {summary.slimCount}
              </span>
              {summary.lossCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/40 text-rose-300" title="Loss Making">
                  ❌ {summary.lossCount}
                </span>
              )}
            </div>
            <span className="text-[10px] text-white/60 block mt-1">Portfolio balance</span>
          </div>
        </div>
      </div>

      {/* Expandable Cost Drivers Settings Panel */}
      {isDriversOpen && (
        <div className="bg-white rounded-3xl p-6 border-2 border-[#1e4b3e]/20 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-[#1e4b3e]">
                <Wrench className="w-5 h-5 text-[#1e4b3e]" />
              </div>
              <div>
                <h3 className="font-bubbly text-base text-[#1a2e26]">Workshop Cost Drivers & Assumptions</h3>
                <p className="text-xs text-slate-500">
                  Calibrate your workshop rates. All order margins update instantly in real-time.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDrivers}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Reset Defaults
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* 1. Filament Cost */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  1. Filament Cost
                </span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{(drivers.filamentPricePerKg / 1000).toFixed(2)}/g
                </span>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 block">Spool Cost per Kg (₹)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={400}
                    max={4000}
                    step={50}
                    value={drivers.filamentPricePerKg}
                    onChange={(e) => updateDrivers({ filamentPricePerKg: Number(e.target.value) || 1200 })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">₹/kg</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Standard PLA/PETG ~₹1,200/kg; Composites ~₹2,200/kg</p>
            </div>

            {/* 2. Electricity Tariff & Power */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  2. Electricity & Power
                </span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{((drivers.printerWatts / 1000) * drivers.electricityTariffKwh).toFixed(2)}/hr
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Tariff (₹/kWh)</label>
                  <input
                    type="number"
                    step={0.5}
                    value={drivers.electricityTariffKwh}
                    onChange={(e) => updateDrivers({ electricityTariffKwh: Number(e.target.value) || 8.5 })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Power (Watts)</label>
                  <input
                    type="number"
                    step={10}
                    value={drivers.printerWatts}
                    onChange={(e) => updateDrivers({ printerWatts: Number(e.target.value) || 280 })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Printer average bed+nozzle heating consumption</p>
            </div>

            {/* 3. Machine Time / Wear */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  3. Machine Time / Wear
                </span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{drivers.machineRatePerHour}/hr
                </span>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 block">Depreciation & Wear (₹/hr)</label>
                <input
                  type="number"
                  step={5}
                  value={drivers.machineRatePerHour}
                  onChange={(e) => updateDrivers({ machineRatePerHour: Number(e.target.value) || 30 })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                />
              </div>
              <p className="text-[10px] text-slate-400">Covers nozzle replacements, belts, lubricant, motor wear</p>
            </div>

            {/* 4. Ad Cost Per Product */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-bold flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 text-rose-500" />
                  4. Ad Cost per Unit
                </span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{drivers.adCostPerUnit}/unit
                </span>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 block">Allocated CAC / Spend (₹)</label>
                <input
                  type="number"
                  step={5}
                  value={drivers.adCostPerUnit}
                  onChange={(e) => updateDrivers({ adCostPerUnit: Number(e.target.value) || 75 })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                />
              </div>
              <p className="text-[10px] text-slate-400">Meta/Google Ads acquisition cost per item sold</p>
            </div>

            {/* 5. Packaging Cost */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-bold flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-amber-700" />
                  5. Packaging Cost
                </span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{drivers.packagingCostPerOrder}/order
                </span>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 block">Box + Filler + Sticker (₹)</label>
                <input
                  type="number"
                  step={5}
                  value={drivers.packagingCostPerOrder}
                  onChange={(e) => updateDrivers({ packagingCostPerOrder: Number(e.target.value) || 35 })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                />
              </div>
              <p className="text-[10px] text-slate-400">Branded rigid box, foam cushion, seal sticker, flyer</p>
            </div>

            {/* 6. Shipping Charge */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-bold flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  6. Shipping Charge
                </span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{drivers.shippingCostPerOrder}/order
                </span>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 block">Courier Freight Fee (₹)</label>
                <input
                  type="number"
                  step={5}
                  value={drivers.shippingCostPerOrder}
                  onChange={(e) => updateDrivers({ shippingCostPerOrder: Number(e.target.value) || 50 })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                />
              </div>
              <p className="text-[10px] text-slate-400">Shadowfax Express Logistics freight cost per dispatch (Production Token Connected)</p>
            </div>

            {/* 7. Miscellaneous Cost & Scrap */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                  7. Miscellaneous & Scrap Allowance
                </span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{drivers.miscFlatCostPerOrder} flat + {drivers.scrapFailureRatePercent}% scrap
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Prep/Tools (₹)</label>
                  <input
                    type="number"
                    step={5}
                    value={drivers.miscFlatCostPerOrder}
                    onChange={(e) => updateDrivers({ miscFlatCostPerOrder: Number(e.target.value) || 30 })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Scrap Factor (%)</label>
                  <input
                    type="number"
                    step={1}
                    value={drivers.scrapFailureRatePercent}
                    onChange={(e) => updateDrivers({ scrapFailureRatePercent: Number(e.target.value) || 5 })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Gateway Fee (%)</label>
                  <input
                    type="number"
                    step={0.5}
                    value={drivers.paymentGatewayFeePercent}
                    onChange={(e) => updateDrivers({ paymentGatewayFeePercent: Number(e.target.value) || 2 })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Support removal, acetone wipe, failed print buffer, 2% online gateway fee</p>
            </div>
          </div>
        </div>
      )}

      {/* Aggregate Cost Composition Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bubbly text-sm text-[#1a2e26] uppercase tracking-wide flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#1e4b3e]" />
              <span>Workshop Cost Distribution Breakdown</span>
            </h3>
            <p className="text-xs text-slate-500">
              Where every Rupee spent on production & fulfillment goes across all {summary.orderCount} orders.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full self-start">
            Total Spent: {formatPrice(summary.totalCost)}
          </span>
        </div>

        {summary.totalCost > 0 && (
          <div className="space-y-3">
            {/* Segmented Progress Bar */}
            <div className="h-6 w-full rounded-xl overflow-hidden flex bg-slate-100 p-0.5 gap-0.5 shadow-inner">
              <div
                style={{ width: `${(summary.totalFilament / summary.totalCost) * 100}%` }}
                className="bg-amber-500 h-full rounded-sm transition-all"
                title={`Filament: ${formatPrice(summary.totalFilament)} (${((summary.totalFilament / summary.totalCost) * 100).toFixed(1)}%)`}
              />
              <div
                style={{ width: `${(summary.totalElectricity / summary.totalCost) * 100}%` }}
                className="bg-yellow-400 h-full rounded-sm transition-all"
                title={`Electricity: ${formatPrice(summary.totalElectricity)} (${((summary.totalElectricity / summary.totalCost) * 100).toFixed(1)}%)`}
              />
              <div
                style={{ width: `${(summary.totalMachineTime / summary.totalCost) * 100}%` }}
                className="bg-blue-500 h-full rounded-sm transition-all"
                title={`Machine Wear: ${formatPrice(summary.totalMachineTime)} (${((summary.totalMachineTime / summary.totalCost) * 100).toFixed(1)}%)`}
              />
              <div
                style={{ width: `${(summary.totalAds / summary.totalCost) * 100}%` }}
                className="bg-rose-500 h-full rounded-sm transition-all"
                title={`Ad Spend: ${formatPrice(summary.totalAds)} (${((summary.totalAds / summary.totalCost) * 100).toFixed(1)}%)`}
              />
              <div
                style={{ width: `${(summary.totalPackaging / summary.totalCost) * 100}%` }}
                className="bg-amber-700 h-full rounded-sm transition-all"
                title={`Packaging: ${formatPrice(summary.totalPackaging)} (${((summary.totalPackaging / summary.totalCost) * 100).toFixed(1)}%)`}
              />
              <div
                style={{ width: `${(summary.totalShipping / summary.totalCost) * 100}%` }}
                className="bg-emerald-600 h-full rounded-sm transition-all"
                title={`Shipping: ${formatPrice(summary.totalShipping)} (${((summary.totalShipping / summary.totalCost) * 100).toFixed(1)}%)`}
              />
              <div
                style={{ width: `${(summary.totalMisc / summary.totalCost) * 100}%` }}
                className="bg-purple-500 h-full rounded-sm transition-all"
                title={`Misc: ${formatPrice(summary.totalMisc)} (${((summary.totalMisc / summary.totalCost) * 100).toFixed(1)}%)`}
              />
            </div>

            {/* Legend with exact amounts and percentages */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1 text-[11px]">
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-slate-700 block truncate">Filament</span>
                  <span className="font-mono text-slate-500 text-[10px]">
                    {formatPrice(summary.totalFilament)} ({((summary.totalFilament / summary.totalCost) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-slate-700 block truncate">Power/Elec</span>
                  <span className="font-mono text-slate-500 text-[10px]">
                    {formatPrice(summary.totalElectricity)} ({((summary.totalElectricity / summary.totalCost) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-slate-700 block truncate">Machine Wear</span>
                  <span className="font-mono text-slate-500 text-[10px]">
                    {formatPrice(summary.totalMachineTime)} ({((summary.totalMachineTime / summary.totalCost) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-slate-700 block truncate">Ad Spend</span>
                  <span className="font-mono text-slate-500 text-[10px]">
                    {formatPrice(summary.totalAds)} ({((summary.totalAds / summary.totalCost) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-700 shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-slate-700 block truncate">Packaging</span>
                  <span className="font-mono text-slate-500 text-[10px]">
                    {formatPrice(summary.totalPackaging)} ({((summary.totalPackaging / summary.totalCost) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-slate-700 block truncate">Shipping</span>
                  <span className="font-mono text-slate-500 text-[10px]">
                    {formatPrice(summary.totalShipping)} ({((summary.totalShipping / summary.totalCost) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-slate-700 block truncate">Misc / Scrap</span>
                  <span className="font-mono text-slate-500 text-[10px]">
                    {formatPrice(summary.totalMisc)} ({((summary.totalMisc / summary.totalCost) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order #, customer, city, or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#1e4b3e]/20 outline-none"
            />
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Margin Health Filter Pills */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setFilterTier('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterTier === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({analyzedOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTier('high')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterTier === 'high' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              🔥 High &gt;50% ({summary.highCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTier('healthy')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterTier === 'healthy' ? 'bg-teal-600 text-white shadow-2xs' : 'text-teal-700 hover:text-teal-900'
              }`}
            >
              ✓ Healthy 30-50% ({summary.healthyCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTier('slim')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterTier === 'slim' ? 'bg-amber-600 text-white shadow-2xs' : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              ⚠️ Slim 10-30% ({summary.slimCount})
            </button>
            {summary.lossCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterTier('loss')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterTier === 'loss' ? 'bg-rose-600 text-white shadow-2xs' : 'text-rose-700 hover:text-rose-900'
                }`}
              >
                ❌ Loss ({summary.lossCount})
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="date_desc">Most Recent</option>
            <option value="margin_desc">Highest Margin %</option>
            <option value="margin_asc">Lowest Margin %</option>
            <option value="profit_desc">Highest Net Profit (₹)</option>
            <option value="revenue_desc">Highest Revenue (₹)</option>
          </select>
        </div>
      </div>

      {/* Orders Table with Expandable Drilldown */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-3">Order Details</th>
                <th className="py-3 px-2 text-right">Revenue</th>
                <th className="py-3 px-2 text-right text-amber-700" title="Filament Cost (grams × ₹/g)">Filament</th>
                <th className="py-3 px-2 text-right text-yellow-700" title="Power Draw (hours × kW × ₹/kWh)">Power</th>
                <th className="py-3 px-2 text-right text-blue-700" title="Machine Time Wear (hours × ₹/hr)">Machine</th>
                <th className="py-3 px-2 text-right text-rose-700" title="Allocated Ad CAC per product sold">Ads</th>
                <th className="py-3 px-2 text-right text-amber-900" title="Rigid box, padding, tape">Packaging</th>
                <th className="py-3 px-2 text-right text-emerald-700" title="Courier freight charge">Shipping</th>
                <th className="py-3 px-2 text-right text-purple-700" title="Prep, tools, scrap factor, payment gateway">Misc</th>
                <th className="py-3 px-2 text-right font-black">Total Cost</th>
                <th className="py-3 px-3 text-right font-black">Net Profit</th>
                <th className="py-3 px-3 text-center font-black">Margin %</th>
                <th className="py-3 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400 text-xs">
                    No orders matching search or margin filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((item) => {
                  const isExpanded = expandedOrderId === item.order.orderNumber;
                  const o = item.order;
                  const c = item.costs;

                  return (
                    <React.Fragment key={o.orderNumber}>
                      <tr
                        onClick={() => setExpandedOrderId(isExpanded ? null : o.orderNumber)}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        {/* Order & Customer */}
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-[#1e4b3e] text-xs flex items-center gap-1.5">
                            <span>#{o.orderNumber}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-normal">
                              {o.paymentMethod || 'Online'}
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-800 truncate max-w-[140px]">
                            {o.customerName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.totalUnits} items • {item.totalWeightGrams.toFixed(0)}g • {item.totalPrintHours.toFixed(1)}h
                          </div>
                        </td>

                        {/* Revenue */}
                        <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">
                          {formatPrice(item.revenue)}
                        </td>

                        {/* Filament */}
                        <td className="py-3 px-2 text-right font-mono text-amber-800">
                          {formatPrice(c.filamentCost)}
                        </td>

                        {/* Power */}
                        <td className="py-3 px-2 text-right font-mono text-yellow-800">
                          {formatPrice(c.electricityCost)}
                        </td>

                        {/* Machine */}
                        <td className="py-3 px-2 text-right font-mono text-blue-800">
                          {formatPrice(c.machineTimeCost)}
                        </td>

                        {/* Ads */}
                        <td className="py-3 px-2 text-right font-mono text-rose-800">
                          {formatPrice(c.adCost)}
                        </td>

                        {/* Packaging */}
                        <td className="py-3 px-2 text-right font-mono text-amber-900">
                          {formatPrice(c.packagingCost)}
                        </td>

                        {/* Shipping */}
                        <td className="py-3 px-2 text-right font-mono text-emerald-800">
                          {formatPrice(c.shippingCost)}
                        </td>

                        {/* Misc */}
                        <td className="py-3 px-2 text-right font-mono text-purple-800">
                          {formatPrice(c.miscCost)}
                        </td>

                        {/* Total Cost */}
                        <td className="py-3 px-2 text-right font-mono font-bold text-rose-700">
                          {formatPrice(c.totalCost)}
                        </td>

                        {/* Net Profit */}
                        <td className={`py-3 px-3 text-right font-mono font-bold ${item.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {item.netProfit >= 0 ? `+${formatPrice(item.netProfit)}` : formatPrice(item.netProfit)}
                        </td>

                        {/* Margin % Badge */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold ${
                              item.tier === 'high'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : item.tier === 'healthy'
                                ? 'bg-teal-100 text-teal-800 border border-teal-300'
                                : item.tier === 'slim'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {item.tier === 'high' ? (
                              <Flame className="w-3 h-3 text-emerald-600" />
                            ) : item.tier === 'healthy' ? (
                              <CheckCircle2 className="w-3 h-3 text-teal-600" />
                            ) : item.tier === 'slim' ? (
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-rose-600" />
                            )}
                            <span>{item.marginPercent.toFixed(1)}%</span>
                          </span>
                        </td>

                        {/* Expand Action */}
                        <td className="py-3 px-2 text-center text-slate-400">
                          <button
                            type="button"
                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Order Drilldown View */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b-2 border-slate-200">
                          <td colSpan={13} className="p-4 sm:p-6 space-y-4">
                            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                <div>
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                    Comprehensive Order Unit Economics
                                  </span>
                                  <h4 className="font-bubbly text-sm text-[#1a2e26]">
                                    Order #{o.orderNumber} • {o.customerName} ({o.city || 'India'})
                                  </h4>
                                </div>
                                <div className="flex items-center gap-3 text-xs font-mono">
                                  <span>
                                    Selling Price: <strong>{formatPrice(item.revenue)}</strong>
                                  </span>
                                  <span>
                                    Cost to Make & Deliver: <strong className="text-rose-700">{formatPrice(c.totalCost)}</strong>
                                  </span>
                                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold">
                                    Net Margin: {item.marginPercent.toFixed(1)}% (+{formatPrice(item.netProfit)})
                                  </span>
                                </div>
                              </div>

                              {/* Stacked Breakdown Visual Bar for this order */}
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                                  Cost & Margin Share Distribution:
                                </span>
                                <div className="h-4 w-full rounded-lg overflow-hidden flex bg-slate-100 p-0.5 gap-0.5 shadow-inner text-[9px] font-mono font-bold text-white text-center">
                                  <div
                                    style={{ width: `${Math.max(5, (c.filamentCost / item.revenue) * 100)}%` }}
                                    className="bg-amber-500 h-full rounded-xs flex items-center justify-center overflow-hidden"
                                    title={`Filament: ${formatPrice(c.filamentCost)}`}
                                  >
                                    Fil
                                  </div>
                                  <div
                                    style={{ width: `${Math.max(4, (c.electricityCost / item.revenue) * 100)}%` }}
                                    className="bg-yellow-400 h-full rounded-xs flex items-center justify-center overflow-hidden text-slate-900"
                                    title={`Power: ${formatPrice(c.electricityCost)}`}
                                  >
                                    Pwr
                                  </div>
                                  <div
                                    style={{ width: `${Math.max(4, (c.machineTimeCost / item.revenue) * 100)}%` }}
                                    className="bg-blue-500 h-full rounded-xs flex items-center justify-center overflow-hidden"
                                    title={`Machine: ${formatPrice(c.machineTimeCost)}`}
                                  >
                                    Mach
                                  </div>
                                  <div
                                    style={{ width: `${Math.max(5, (c.adCost / item.revenue) * 100)}%` }}
                                    className="bg-rose-500 h-full rounded-xs flex items-center justify-center overflow-hidden"
                                    title={`Ad Spend: ${formatPrice(c.adCost)}`}
                                  >
                                    Ads
                                  </div>
                                  <div
                                    style={{ width: `${Math.max(4, (c.packagingCost / item.revenue) * 100)}%` }}
                                    className="bg-amber-700 h-full rounded-xs flex items-center justify-center overflow-hidden"
                                    title={`Packaging: ${formatPrice(c.packagingCost)}`}
                                  >
                                    Pack
                                  </div>
                                  <div
                                    style={{ width: `${Math.max(4, (c.shippingCost / item.revenue) * 100)}%` }}
                                    className="bg-emerald-600 h-full rounded-xs flex items-center justify-center overflow-hidden"
                                    title={`Shipping: ${formatPrice(c.shippingCost)}`}
                                  >
                                    Ship
                                  </div>
                                  <div
                                    style={{ width: `${Math.max(4, (c.miscCost / item.revenue) * 100)}%` }}
                                    className="bg-purple-500 h-full rounded-xs flex items-center justify-center overflow-hidden"
                                    title={`Misc: ${formatPrice(c.miscCost)}`}
                                  >
                                    Misc
                                  </div>
                                  {item.netProfit > 0 && (
                                    <div
                                      style={{ width: `${(item.netProfit / item.revenue) * 100}%` }}
                                      className="bg-emerald-500 h-full rounded-xs flex items-center justify-center overflow-hidden font-bold"
                                      title={`Net Margin: ${formatPrice(item.netProfit)}`}
                                    >
                                      Profit ({item.marginPercent.toFixed(0)}%)
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Detailed 7 Cost Cards with Exact Formulas */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                                  <span className="text-[10px] font-bold text-amber-900 block">1. Filament Material</span>
                                  <span className="font-mono font-bold text-amber-950 block text-sm mt-0.5">
                                    {formatPrice(c.filamentCost)}
                                  </span>
                                  <span className="text-[9px] text-amber-700 block mt-1">
                                    {item.totalWeightGrams.toFixed(0)}g @ ₹{(drivers.filamentPricePerKg / 1000).toFixed(2)}/g
                                  </span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-yellow-50/70 border border-yellow-200">
                                  <span className="text-[10px] font-bold text-yellow-900 block">2. Electricity Power</span>
                                  <span className="font-mono font-bold text-yellow-950 block text-sm mt-0.5">
                                    {formatPrice(c.electricityCost)}
                                  </span>
                                  <span className="text-[9px] text-yellow-700 block mt-1">
                                    {item.totalPrintHours.toFixed(1)}h @ {(drivers.printerWatts / 1000).toFixed(2)}kW × ₹{drivers.electricityTariffKwh}
                                  </span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200">
                                  <span className="text-[10px] font-bold text-blue-900 block">3. Machine Wear</span>
                                  <span className="font-mono font-bold text-blue-950 block text-sm mt-0.5">
                                    {formatPrice(c.machineTimeCost)}
                                  </span>
                                  <span className="text-[9px] text-blue-700 block mt-1">
                                    {item.totalPrintHours.toFixed(1)}h @ ₹{drivers.machineRatePerHour}/hr wear
                                  </span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200">
                                  <span className="text-[10px] font-bold text-rose-900 block">4. Ad CAC Cost</span>
                                  <span className="font-mono font-bold text-rose-950 block text-sm mt-0.5">
                                    {formatPrice(c.adCost)}
                                  </span>
                                  <span className="text-[9px] text-rose-700 block mt-1">
                                    {item.totalUnits} unit(s) @ ₹{drivers.adCostPerUnit}/unit
                                  </span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-300">
                                  <span className="text-[10px] font-bold text-amber-900 block">5. Packaging</span>
                                  <span className="font-mono font-bold text-amber-950 block text-sm mt-0.5">
                                    {formatPrice(c.packagingCost)}
                                  </span>
                                  <span className="text-[9px] text-amber-700 block mt-1">
                                    Rigid box, padding, tape
                                  </span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                                  <span className="text-[10px] font-bold text-emerald-900 block">6. Shipping Freight</span>
                                  <span className="font-mono font-bold text-emerald-950 block text-sm mt-0.5">
                                    {formatPrice(c.shippingCost)}
                                  </span>
                                  <span className="text-[9px] text-emerald-700 block mt-1">
                                    Courier air/surface charge
                                  </span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200">
                                  <span className="text-[10px] font-bold text-purple-900 block">7. Misc & Scrap</span>
                                  <span className="font-mono font-bold text-purple-950 block text-sm mt-0.5">
                                    {formatPrice(c.miscCost)}
                                  </span>
                                  <span className="text-[9px] text-purple-700 block mt-1">
                                    Tools, {drivers.scrapFailureRatePercent}% scrap, gateway
                                  </span>
                                </div>
                              </div>

                              {/* Products List Breakdown in this Order */}
                              <div className="pt-2 border-t border-slate-100">
                                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                  Line Items in this Order:
                                </span>
                                <div className="divide-y divide-slate-100">
                                  {item.analyzedItems.map((prod, idx) => (
                                    <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-2">
                                        <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="font-bold text-slate-800">{prod.name}</span>
                                        <span className="text-[11px] text-slate-500">× {prod.quantity}</span>
                                      </div>
                                      <div className="flex items-center gap-4 text-[11px] font-mono text-slate-600">
                                        <span>Est. {prod.itemTotalGrams}g</span>
                                        <span>Est. {prod.itemTotalHours.toFixed(1)} hrs</span>
                                        <span className="font-bold text-slate-900">{formatPrice(prod.priceINR * prod.quantity)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
