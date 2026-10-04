import React, { useState, useEffect } from 'react';
import {
  Globe,
  Sparkles,
  Save,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  ShoppingCart,
  Plus,
  Trash2,
  Upload,
  Eye,
  Edit,
  ArrowRight,
  TrendingUp,
  FileCode,
  Tag,
  ShieldCheck,
  Package,
  Layers,
  Clock,
  Palette,
  X,
  RefreshCw,
  Zap,
  Copy,
  Check,
  Share2,
  QrCode,
} from 'lucide-react';
import { StorefrontConfig, Product, Order, BusinessSettings } from '../../types/index.ts';
import { formatCurrency } from '../../lib/utils.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface WebsiteBuilderModuleProps {
  initialConfig?: StorefrontConfig;
  products: Product[];
  settings?: BusinessSettings;
  onRefreshOrders?: () => void;
  onNavigateToOrder?: (orderId: number) => void;
  standaloneStorefront?: boolean;
}

export const WebsiteBuilderModule: React.FC<WebsiteBuilderModuleProps> = ({
  initialConfig,
  products,
  settings,
  onRefreshOrders,
  onNavigateToOrder,
  standaloneStorefront = false,
}) => {
  const { canEdit } = useAuth();
  const [activeTab, setActiveTab] = useState<'editor' | 'storefront' | 'orders'>(
    standaloneStorefront ? 'storefront' : 'editor'
  );
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLiveUrlModalOpen, setIsLiveUrlModalOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Storefront Config state
  const [config, setConfig] = useState<StorefrontConfig>(
    initialConfig || {
      storeName: 'PrintHub 3D Atelier',
      tagline: 'Artisan 3D Printed Collectibles & Custom Engineering Parts',
      heroTitle: 'High-Precision 3D Creations Printed For Modern Living',
      heroSubtitle: 'Explore curated articulated dragons, architectural lamps, geometric planters, and custom precision parts. Dispatched across India within 48 hours.',
      heroCtaText: 'Shop Collection',
      heroImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
      announcementText: '⚡ Free Shipping across India on orders over ₹999 | 100% Quality Inspected',
      themeColor: '#4f46e5',
      accentColor: '#06b6d4',
      isPublished: true,
      customQuoteEnabled: true,
      customQuoteTitle: 'Got a 3D File? Get Instant Production Quote',
      customQuoteSubtitle: 'Upload your STL, STEP, or 3MF file. Our engineers analyze layer height, volume, and material for prompt quoting.',
      brandStory: 'We operate a high-precision print farm powered by Bambu Lab and Prusa machines in Bengaluru, India. Every object is calibrated for zero-defect layer adhesion and hand-finished with care.',
    }
  );

  // AI Generator Prompt state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStoreType, setAiStoreType] = useState('Maker Studio');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live Storefront Orders and Metrics
  const [storefrontOrders, setStorefrontOrders] = useState<Order[]>([]);
  const [storeMetrics, setStoreMetrics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
  });

  // Live Storefront Customer Cart State
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Storefront Checkout Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Online UPI' | 'COD' | 'Card'>('Online UPI');
  const [customFileUrl, setCustomFileUrl] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState<{ orderNumber: string; total: number } | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);

  // Load live storefront config, active catalog products, and orders
  const loadStorefrontData = async () => {
    try {
      const res = await fetch('/api/storefront');
      if (res.ok) {
        const data = await res.json();
        if (data.config) setConfig(data.config);
        if (data.orders) setStorefrontOrders(data.orders);
        if (data.metrics) setStoreMetrics(data.metrics);
        if (data.products && Array.isArray(data.products)) setLocalProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to load storefront data:', err);
    }
  };

  useEffect(() => {
    loadStorefrontData();
  }, []);

  // Gemini AI Generator Handler
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAi(true);
    setAiSuccessMessage('');
    try {
      const res = await fetch('/api/storefront/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, storeType: aiStoreType }),
      });
      if (res.ok) {
        const generated = await res.json();
        setConfig((prev) => ({
          ...prev,
          ...generated,
        }));
        setAiSuccessMessage('Storefront successfully generated with Gemini AI!');
        setTimeout(() => setAiSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('AI generation failed:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // 1. Direct Live Storefront URL (active right now on this server)
  const getDirectStoreUrl = () => {
    if (typeof window === 'undefined') return '';
    try {
      return `${window.location.origin}/store`;
    } catch {
      return '/store';
    }
  };

  // 2. Public Shared App URL (activated when user clicks "Share" in AI Studio top bar)
  const getPublicSharedUrl = () => {
    if (typeof window === 'undefined') return '';
    try {
      let origin = window.location.origin;
      if (origin.includes('ais-dev-')) {
        origin = origin.replace('ais-dev-', 'ais-pre-');
      }
      return `${origin}/store`;
    } catch {
      return (window.location.origin || '').replace('ais-dev-', 'ais-pre-') + '/store';
    }
  };

  // Default active store URL
  const getLiveStoreUrl = () => getDirectStoreUrl();

  const handleCopyUrl = (urlToCopy?: string) => {
    const url = urlToCopy || getDirectStoreUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  // Save / Publish Storefront
  const handleSaveStorefront = async () => {
    try {
      const updatedConfig = { ...config, isPublished: true };
      const res = await fetch('/api/storefront', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        setSaveSuccess(true);
        setIsLiveUrlModalOpen(true); // Open the live URL dialog with copy link, QR code, and direct access
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save storefront:', err);
    }
  };

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const cartTax = Number((cartSubtotal * 0.18).toFixed(2));
  const cartShipping = cartSubtotal >= 999 || cartSubtotal === 0 ? 0 : 70;
  const cartTotal = cartSubtotal + cartTax + cartShipping;

  // Real Checkout - Directly creates order in PostgreSQL
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsSubmittingOrder(true);

    try {
      const res = await fetch('/api/storefront/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          city,
          pincode,
          paymentMethod,
          items: cart.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.product.sellingPrice,
          })),
        }),
      });

      if (res.ok) {
        const orderRes = await res.json();
        setCheckoutSuccess({
          orderNumber: orderRes.orderNumber,
          total: orderRes.totalAmount,
        });
        setCart([]);
        loadStorefrontData();
        if (onRefreshOrders) onRefreshOrders();
      }
    } catch (err) {
      console.error('Checkout failed:', err);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Custom Quote Order - Directly creates order in PostgreSQL
  const handleCustomQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingOrder(true);
    try {
      const res = await fetch('/api/storefront/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress: shippingAddress || 'Standard Shipping Address',
          paymentMethod: 'Online UPI',
          isCustomQuote: true,
          customFileUrl,
          notes: 'Customer submitted custom STL CAD file for 3D printing fabrication quote.',
        }),
      });
      if (res.ok) {
        const orderRes = await res.json();
        setCheckoutSuccess({
          orderNumber: orderRes.orderNumber,
          total: orderRes.totalAmount,
        });
        loadStorefrontData();
        if (onRefreshOrders) onRefreshOrders();
      }
    } catch (err) {
      console.error('Custom quote order failed:', err);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const allProducts = products && products.length > 0 ? products : localProducts;
  const categories = ['All', ...Array.from(new Set(allProducts.map((p) => p.category)))];
  const displayedProducts = allProducts.filter(
    (p) => categoryFilter === 'All' || p.category === categoryFilter
  );

  return (
    <div className={standaloneStorefront ? 'w-full min-h-screen bg-white text-slate-900 font-sans' : 'space-y-6'}>
      {/* Top Header (Admin Dashboard Only) */}
      {!standaloneStorefront && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                Storefront Builder & Live E-Commerce
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  config.isPublished
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {config.isPublished ? '● Live Online' : '○ Draft'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Build your 3D printing storefront with Gemini AI, publish live, and manage incoming orders in real-time.
            </p>
          </div>

          {/* Tab switchers */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  activeTab === 'editor'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> AI Builder & Editor
              </button>
              <button
                onClick={() => setActiveTab('storefront')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  activeTab === 'storefront'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-500" /> Live Storefront View
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  activeTab === 'orders'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5 text-amber-500" /> Incoming Live Orders ({storefrontOrders.length})
              </button>
              <button
                onClick={() => setIsLiveUrlModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-500" /> Live Link & QR
              </button>
            </div>

            {canEdit && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLiveUrlModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-indigo-500" /> View Live Link
                </button>
                <button
                  onClick={handleSaveStorefront}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Published!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save & Publish
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Persistent Live Storefront Quick Access Banner */}
      {!standaloneStorefront && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-indigo-950/40 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Public Storefront Link:
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                  FOR VISITORS & CUSTOMERS
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                <a
                  href={getPublicSharedUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                >
                  {getPublicSharedUrl()}
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => handleCopyUrl(getPublicSharedUrl())}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-emerald-200" />}
              <span>{copiedUrl ? 'Copied Public Link!' : 'Copy Customer Link'}</span>
            </button>

            <a
              href={getDirectStoreUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs flex items-center gap-1.5 transition-colors"
              title="Open the store in your current logged-in browser session"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Preview Store</span>
            </a>

            <button
              onClick={() => setIsLiveUrlModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share & How-To</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 1: AI WEBSITE BUILDER & EDITOR */}
      {/* ---------------------------------------------------- */}
      {!standaloneStorefront && activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: AI Studio Prompt & Branding Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Gemini AI Brand Generator Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white border border-indigo-800 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Generate Storefront with Gemini AI</h3>
                    <p className="text-[11px] text-indigo-200">
                      Powered by Gemini 3.8 Flash & Google AI Studio
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-200 border border-indigo-400/20">
                  Model: gemini-3.8-flash
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-indigo-200 mb-1">
                  Describe Your Store Brand & Aesthetic:
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., Cyberpunk mechanical desk toys, glowing Voronoi lamps, and functional audio headset stands in matte and dual-silk colors..."
                    className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-indigo-500/40 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Theme Preset:</span>
                  <select
                    value={aiStoreType}
                    onChange={(e) => setAiStoreType(e.target.value)}
                    className="bg-slate-900/80 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="Maker Studio">Modern Maker Studio</option>
                    <option value="Cyberpunk & Cosplay">Cyberpunk & Cosplay</option>
                    <option value="Minimalist Botanics">Minimalist Botanics & Decor</option>
                    <option value="Rapid Engineering">Engineering & Prototyping</option>
                  </select>
                </div>

                <button
                  onClick={handleAiGenerate}
                  disabled={isGeneratingAi}
                  className="px-4 py-2 text-xs font-bold text-indigo-950 bg-indigo-300 hover:bg-white rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                >
                  {isGeneratingAi ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin" />
                      <span>Synthesizing Brand...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-900" />
                      <span>Generate Full Storefront</span>
                    </>
                  )}
                </button>
              </div>

              {aiSuccessMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{aiSuccessMessage}</span>
                </div>
              )}
            </div>

            {/* Manual Store Customizer Form */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Edit className="w-4 h-4 text-indigo-600" /> Storefront Branding & Hero Configuration
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Storefront Brand Name
                  </label>
                  <input
                    type="text"
                    value={config.storeName}
                    onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Store Tagline
                  </label>
                  <input
                    type="text"
                    value={config.tagline}
                    onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Announcement Banner (Header ticker)
                  </label>
                  <input
                    type="text"
                    value={config.announcementText || ''}
                    onChange={(e) => setConfig({ ...config, announcementText: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hero Main Headline
                  </label>
                  <input
                    type="text"
                    value={config.heroTitle}
                    onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hero Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={config.heroSubtitle}
                    onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hero Banner Image URL
                  </label>
                  <input
                    type="text"
                    value={config.heroImageUrl || ''}
                    onChange={(e) => setConfig({ ...config, heroImageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Theme Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.themeColor}
                      onChange={(e) => setConfig({ ...config, themeColor: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.themeColor}
                      onChange={(e) => setConfig({ ...config, themeColor: e.target.value })}
                      className="w-full p-1.5 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.accentColor}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.accentColor}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      className="w-full p-1.5 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Quote Commission Toggle */}
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-900 dark:text-purple-300">
                  <input
                    type="checkbox"
                    checked={config.customQuoteEnabled}
                    onChange={(e) => setConfig({ ...config, customQuoteEnabled: e.target.checked })}
                    className="rounded text-purple-600 w-4 h-4"
                  />
                  Enable &ldquo;Custom 3D Print / CAD Upload&rdquo; Section on Storefront
                </label>
                {config.customQuoteEnabled && (
                  <div className="space-y-2 pt-1 text-xs">
                    <input
                      type="text"
                      value={config.customQuoteTitle || ''}
                      onChange={(e) => setConfig({ ...config, customQuoteTitle: e.target.value })}
                      placeholder="Custom CAD Quote Title"
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    />
                    <textarea
                      rows={2}
                      value={config.customQuoteSubtitle || ''}
                      onChange={(e) => setConfig({ ...config, customQuoteSubtitle: e.target.value })}
                      placeholder="Instructions for client STL/STEP/3MF upload"
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Storefront Mini Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  Live Preview Mock
                </h3>
                <button
                  onClick={() => setActiveTab('storefront')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Full Storefront <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Mini Browser Frame */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs text-xs">
                {/* Browser bar */}
                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded text-[10px] text-slate-500 font-mono truncate">
                    https://printhub-store.shop/live
                  </div>
                </div>

                {/* Announcement Ticker */}
                <div
                  className="px-3 py-1 text-center text-[10px] text-white font-medium"
                  style={{ backgroundColor: config.themeColor }}
                >
                  {config.announcementText}
                </div>

                {/* Mini Hero */}
                <div className="relative aspect-16/9 bg-slate-900 text-white overflow-hidden p-4 flex flex-col justify-end">
                  {config.heroImageUrl && (
                    <img
                      src={config.heroImageUrl}
                      alt="Hero"
                      className="absolute inset-0 w-full h-full object-cover opacity-40"
                    />
                  )}
                  <div className="relative z-10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                      {config.storeName}
                    </span>
                    <h4 className="font-black text-sm text-white line-clamp-1 mt-0.5">
                      {config.heroTitle}
                    </h4>
                    <p className="text-[11px] text-slate-200 line-clamp-2 mt-0.5">
                      {config.heroSubtitle}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <span
                        className="px-2.5 py-1 rounded text-[10px] font-bold text-white shadow-xs"
                        style={{ backgroundColor: config.themeColor }}
                      >
                        {config.heroCtaText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mini Products Grid */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 space-y-2">
                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                    Catalog Preview ({products.length} Items Live)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {products.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]"
                      >
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{p.name}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="font-black text-indigo-600 dark:text-indigo-400">
                            {formatCurrency(p.sellingPrice)}
                          </span>
                          <span className="text-[9px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                            {p.material}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => setActiveTab('storefront')}
                className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center justify-center gap-1.5"
              >
                <Eye className="w-4 h-4" /> Open Full Interactive Storefront
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: LIVE STOREFRONT (REAL TIME E-COMMERCE) */}
      {/* ---------------------------------------------------- */}
      {(standaloneStorefront || activeTab === 'storefront') && (
        <div className={standaloneStorefront ? 'w-full' : 'space-y-4'}>
          {/* Viewport switch toolbar (Admin Preview Only) */}
          {!standaloneStorefront && (
            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Responsive Viewport:</span>
                <button
                  onClick={() => setViewportMode('desktop')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                    viewportMode === 'desktop' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 font-bold' : 'text-slate-400'
                  }`}
                  title="Desktop View"
                >
                  <Monitor className="w-4 h-4" /> Desktop
                </button>
                <button
                  onClick={() => setViewportMode('tablet')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                    viewportMode === 'tablet' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 font-bold' : 'text-slate-400'
                  }`}
                  title="Tablet View"
                >
                  <Tablet className="w-4 h-4" /> Tablet
                </button>
                <button
                  onClick={() => setViewportMode('mobile')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                    viewportMode === 'mobile' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 font-bold' : 'text-slate-400'
                  }`}
                  title="Mobile View"
                >
                  <Smartphone className="w-4 h-4" /> Mobile
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative px-3 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Cart</span>
                  {cart.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-[10px] text-white">
                      {cart.reduce((s, i) => s + i.quantity, 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Storefront Container */}
          <div
            className={`mx-auto bg-white text-slate-900 transition-all duration-300 font-sans ${
              standaloneStorefront
                ? 'w-full min-h-screen'
                : `rounded-2xl shadow-xl border border-slate-200 overflow-hidden ${
                    viewportMode === 'desktop'
                      ? 'w-full'
                      : viewportMode === 'tablet'
                      ? 'max-w-2xl'
                      : 'max-w-sm'
                  }`
            }`}
          >
            {/* 1. Announcement Header */}
            {config.announcementText && (
              <div
                className="py-2 px-4 text-center text-xs font-medium text-white"
                style={{ backgroundColor: config.themeColor }}
              >
                {config.announcementText}
              </div>
            )}

            {/* 2. Storefront Navbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-20">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
                  style={{ backgroundColor: config.themeColor }}
                >
                  3D
                </div>
                <div>
                  <h1 className="font-black text-base tracking-tight text-slate-900">
                    {config.storeName}
                  </h1>
                  <p className="text-[10px] text-slate-400">{config.tagline}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4 text-slate-600" />
                  <span>Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
                  {cart.length > 0 && (
                    <span className="font-bold text-indigo-600">
                      {formatCurrency(cartSubtotal)}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* 3. Hero Section */}
            <div className="relative bg-slate-950 text-white min-h-[360px] flex items-center px-6 md:px-12 py-12 overflow-hidden">
              {config.heroImageUrl && (
                <img
                  src={config.heroImageUrl}
                  alt="3D Prints Hero"
                  className="absolute inset-0 w-full h-full object-cover opacity-35"
                />
              )}
              <div className="relative z-10 max-w-xl space-y-4">
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md text-cyan-300 border border-white/20">
                  Precision 3D Maker Hub
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                  {config.heroTitle}
                </h2>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {config.heroSubtitle}
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <a
                    href="#catalog-section"
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-transform hover:scale-105"
                    style={{ backgroundColor: config.themeColor }}
                  >
                    {config.heroCtaText}
                  </a>
                  {config.customQuoteEnabled && (
                    <a
                      href="#custom-quote-section"
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 transition-all"
                    >
                      Upload CAD / STL
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Trust Badges Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 border-b border-slate-200 text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">0.08mm Layer Precision</p>
                  <p className="text-[10px] text-slate-500">Smooth micro-layer finish</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">Free India Delivery</p>
                  <p className="text-[10px] text-slate-500">On all orders above ₹999</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-purple-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">100% Recyclable PLA+</p>
                  <p className="text-[10px] text-slate-500">Non-toxic bio polymer</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">Fast 48h Dispatch</p>
                  <p className="text-[10px] text-slate-500">Delhivery & Bluedart express</p>
                </div>
              </div>
            </div>

            {/* 5. Live Catalog Section */}
            <div id="catalog-section" className="p-6 md:p-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Featured 3D Printed Catalog
                  </h3>
                  <p className="text-xs text-slate-500">
                    Direct from our Bambu Lab & Prusa farm to your doorstep
                  </p>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                        categoryFilter === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedProducts.map((p) => {
                  let img = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600';
                  try {
                    if (p.photos) {
                      const arr = JSON.parse(p.photos);
                      if (Array.isArray(arr) && arr[0]) img = arr[0];
                    }
                  } catch {}

                  return (
                    <div
                      key={p.id}
                      className="group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:shadow-lg transition-all"
                    >
                      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                        <img
                          src={img}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 backdrop-blur-md text-white">
                          {p.material}
                        </span>
                        {p.stock <= 3 && (
                          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white">
                            Only {p.stock} left
                          </span>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {p.category}
                          </p>
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {p.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {p.description || '3D printed custom craft piece.'}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-lg font-black text-slate-900">
                              {formatCurrency(p.sellingPrice)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">+18% GST</span>
                          </div>

                          <button
                            onClick={() => addToCart(p)}
                            className="px-3.5 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
                            style={{ backgroundColor: config.themeColor }}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. Custom 3D CAD Upload & Quote Section */}
            {config.customQuoteEnabled && (
              <div
                id="custom-quote-section"
                className="p-8 md:p-12 bg-slate-900 text-white space-y-6"
              >
                <div className="max-w-2xl mx-auto text-center space-y-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/20">
                    Bespoke 3D Fabrication
                  </span>
                  <h3 className="text-2xl font-black text-white">
                    {config.customQuoteTitle}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {config.customQuoteSubtitle}
                  </p>
                </div>

                <form
                  onSubmit={handleCustomQuoteSubmit}
                  className="max-w-xl mx-auto p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 text-xs"
                >
                  <div>
                    <label className="block font-semibold text-slate-200 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Vikram Malhotra"
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-200 mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+91 98..."
                        className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-200 mb-1">Email</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="vikram@..."
                        className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-200 mb-1">
                      STL / STEP / 3MF File Download Link (Google Drive / WeTransfer) *
                    </label>
                    <input
                      type="text"
                      required
                      value={customFileUrl}
                      onChange={(e) => setCustomFileUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/..."
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="w-full py-2.5 font-bold text-xs text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: config.themeColor }}
                  >
                    <FileCode className="w-4 h-4" />
                    Submit Custom CAD Order for Review
                  </button>
                </form>
              </div>
            )}

            {/* 7. Footer */}
            <div className="p-8 bg-slate-950 text-slate-400 text-xs border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className="font-bold text-white text-sm">{config.storeName}</p>
                <p className="text-[11px] text-slate-500">{config.brandStory}</p>
              </div>
              <div className="text-right text-[11px] text-slate-500 space-y-1">
                <p>100% Real Live 3D Orders &bull; Direct PrintHub Synced</p>
                <p>© {new Date().getFullYear()} {config.storeName}. All rights reserved.</p>
                <div className="pt-1">
                  <a
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      const url = new URL(window.location.href);
                      url.searchParams.delete('view');
                      url.searchParams.delete('store');
                      url.searchParams.delete('storefront');
                      const cleanPath = url.pathname.replace(/\/store|\/shop|\/storefront/, '') || '/';
                      window.history.pushState({}, '', cleanPath);
                      window.location.href = cleanPath;
                    }}
                    className="text-slate-500 hover:text-slate-300 underline transition-colors"
                  >
                    Workshop Staff & Owner Portal &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Slide-out Cart & Live Real Checkout Drawer */}
          {isCartOpen && (
            <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
              <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200 text-slate-900">
                {/* Cart Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-sm">Your 3D Print Cart</h3>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Cart Items or Checkout */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  {checkoutSuccess ? (
                    <div className="py-12 text-center space-y-3">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                      <h4 className="font-bold text-base text-slate-900">Order Placed Successfully!</h4>
                      <p className="text-xs text-slate-500">
                        Order Number: <strong className="font-mono text-indigo-600">{checkoutSuccess.orderNumber}</strong>
                      </p>
                      <p className="text-xs text-slate-600 max-w-xs mx-auto">
                        This order has been sent <strong>directly into your live PrintHub database</strong> and queued in the production & dispatch pipeline!
                      </p>
                      <div className="pt-4">
                        <button
                          onClick={() => {
                            setCheckoutSuccess(null);
                            setIsCartOpen(false);
                            setActiveTab('orders');
                          }}
                          className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                        >
                          View Live Order in PrintHub
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Cart Items list */}
                      {cart.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs">
                          Your cart is currently empty.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {cart.map((item) => (
                            <div
                              key={item.product.id}
                              className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                            >
                              <div>
                                <p className="font-bold text-slate-900">{item.product.name}</p>
                                <p className="text-[11px] text-slate-500">
                                  {formatCurrency(item.product.sellingPrice)} &times; {item.quantity}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-black text-slate-900">
                                  {formatCurrency(item.product.sellingPrice * item.quantity)}
                                </span>
                                <button
                                  onClick={() => removeFromCart(item.product.id)}
                                  className="text-rose-500 hover:text-rose-700"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Calculations breakdown */}
                          <div className="p-3 rounded-xl bg-slate-100 space-y-1 text-slate-600">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span className="font-semibold">{formatCurrency(cartSubtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>GST (18%):</span>
                              <span className="font-semibold">{formatCurrency(cartTax)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Shipping:</span>
                              <span className="font-semibold">
                                {cartShipping === 0 ? 'FREE' : formatCurrency(cartShipping)}
                              </span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-sm text-slate-900">
                              <span>Total Amount:</span>
                              <span className="text-indigo-600">{formatCurrency(cartTotal)}</span>
                            </div>
                          </div>

                          {/* Customer Checkout Form */}
                          <form onSubmit={handlePlaceOrder} className="space-y-2.5 pt-2">
                            <span className="block font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                              Shipping Details:
                            </span>

                            <input
                              type="text"
                              required
                              placeholder="Full Name *"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            />

                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                required
                                placeholder="Phone Number *"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                              <input
                                type="email"
                                placeholder="Email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                            </div>

                            <textarea
                              rows={2}
                              required
                              placeholder="Street Address, Flat / House No. *"
                              value={shippingAddress}
                              onChange={(e) => setShippingAddress(e.target.value)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            />

                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="City"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                              <input
                                type="text"
                                placeholder="Pincode"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value)}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold mb-1">Payment Method:</label>
                              <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as any)}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                              >
                                <option value="Online UPI">Online UPI (GooglePay / PhonePe / QR)</option>
                                <option value="COD">Cash on Delivery (COD)</option>
                                <option value="Card">Credit / Debit Card</option>
                              </select>
                            </div>

                            <button
                              type="submit"
                              disabled={isSubmittingOrder}
                              className="w-full mt-3 py-2.5 font-bold text-xs text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                              style={{ backgroundColor: config.themeColor }}
                            >
                              {isSubmittingOrder ? 'Processing Live Order...' : `Place Live Order • ${formatCurrency(cartTotal)}`}
                            </button>
                          </form>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: INCOMING STOREFRONT ORDERS & ANALYTICS */}
      {/* ---------------------------------------------------- */}
      {!standaloneStorefront && activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Live Metrics Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Live Website Orders</span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {storeMetrics.totalOrders}
              </div>
              <p className="text-[11px] text-emerald-600 mt-1 font-semibold">100% Real PostgreSQL Data</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Storefront Sales Revenue</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(storeMetrics.totalRevenue)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Direct from published website</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Average Basket Value</span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {formatCurrency(storeMetrics.avgOrderValue)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Per online transaction</p>
            </div>
          </div>

          {/* Incoming Orders Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Orders Originated from Live Published Storefront
              </h3>
              <button
                onClick={loadStorefrontData}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Live Feed
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Delivery Address</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {storefrontOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {ord.orderNumber}
                        {ord.isCustomOrder && (
                          <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                            CAD
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{ord.customerName}</p>
                        <p className="text-[11px] text-slate-400">{ord.customerPhone || ord.customerEmail}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                        {ord.shippingAddress}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{ord.paymentStatus}</span>
                        <p className="text-[10px] text-slate-400">{ord.paymentMethod}</p>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(ord.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {onNavigateToOrder && (
                          <button
                            onClick={() => onNavigateToOrder(ord.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 rounded-lg hover:bg-indigo-100"
                          >
                            Manage in Queue
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {storefrontOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No online storefront orders received yet. Place a test order in the &ldquo;Live Storefront View&rdquo; tab to see it appear here in real-time!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* LIVE URL & PUBLISH MODAL */}
      {/* ---------------------------------------------------- */}
      {isLiveUrlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-6 text-slate-900 dark:text-slate-100">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight">Your Storefront is Live!</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      ● Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Ready to receive real customer orders and 3D CAD fabrication quotes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLiveUrlModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Public Customer Storefront URL (For Visitors, Customers, Social Media) */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  Public Customer Storefront Link:
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  ● SHARE WITH CUSTOMERS
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                <input
                  type="text"
                  readOnly
                  value={getPublicSharedUrl()}
                  className="flex-1 bg-transparent font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none px-2 select-all"
                />
                <button
                  onClick={() => handleCopyUrl(getPublicSharedUrl())}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 shrink-0 transition-all shadow-xs"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copied Public Link!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Public Link</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                ✨ Anyone on the internet can open this link to browse 3D models and order without needing any Google account!
              </p>
            </div>

            {/* 2. Owner Private Preview Link */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                <span className="flex items-center gap-1">
                  <span>🔒 Owner Workspace Preview (Only You):</span>
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                  (Visitors get 403 on this URL)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getDirectStoreUrl()}
                  className="flex-1 bg-transparent font-mono text-[11px] text-slate-500 dark:text-slate-400 focus:outline-none truncate select-all"
                />
                <a
                  href={getDirectStoreUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                >
                  Test in My Browser &rarr;
                </a>
              </div>
            </div>

            {/* QR Code and Social Share */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-center gap-4">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                    getDirectStoreUrl()
                  )}`}
                  alt="Store QR Code"
                  className="w-24 h-24 rounded-lg object-contain"
                />
              </div>
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <p className="font-bold text-xs">Scan to Open Store on Mobile</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Share your 3D printing store directly with buyers on WhatsApp, Instagram bio, or print this QR on your packaging!
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `Explore our 3D printed models, architectural home decor, and custom CAD fabrication parts: ${getDirectStoreUrl()}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold hover:bg-emerald-500/20 flex items-center gap-1"
                  >
                    Share WhatsApp
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      `Discover custom 3D printed creations on our live store: ${getDirectStoreUrl()}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 text-[11px] font-bold hover:bg-sky-500/20 flex items-center gap-1"
                  >
                    Post to X
                  </a>
                </div>
              </div>
            </div>

            {/* 2. Public Sharing & 'Page Not Found' Explanation Box */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <span>💡 Public Sharing via AI Studio</span>
              </div>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                If an external visitor sees <em>&ldquo;Error: Page not found &bull; The requested URL was not found on this server&rdquo;</em>, it means the public deployment has not been published yet in Google AI Studio.
              </p>
              <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-900/60 text-[11px] space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">How to activate the public link for anyone:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                  <li>Click the <strong>&ldquo;Share&rdquo;</strong> button at the top-right corner of the AI Studio window.</li>
                  <li>AI Studio will publish your applet to Google Cloud Run&rsquo;s public tier.</li>
                  <li>Once published, the shared URL below becomes live to the entire internet:</li>
                </ol>
                <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                  <span className="truncate flex-1 select-all">{getPublicSharedUrl()}</span>
                  <button
                    onClick={() => handleCopyUrl(getPublicSharedUrl())}
                    className="font-sans font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                  >
                    Copy Shared Link
                  </button>
                </div>
              </div>
            </div>

            {/* Live Real-time Guarantee Notice */}
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-900 dark:text-indigo-300 flex items-start gap-2">
              <Zap className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p>
                <strong>100% Real-Time Backend Sync:</strong> Any orders, customer addresses, or custom STL uploads placed on this live link will immediately appear in PrintHub with instant inventory deduction and tax invoice generation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
