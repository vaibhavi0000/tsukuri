import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShoppingBag,
  Plus,
  Check,
  User,
  Eye,
  Star,
  Zap,
  ArrowRight,
  Truck,
  ShieldCheck,
  Mail,
} from 'lucide-react';
import {
  TsukuriProduct,
  INITIAL_TSUKURI_PRODUCTS,
  CartItem,
  formatPrice,
  UserAccount,
  formatMediaUrl,
} from './tsukuriData.ts';
import { CustomCadModal } from './CustomCadModal.tsx';
import { TsukuriCartDrawer } from './TsukuriCartDrawer.tsx';
import { AuthModal } from './AuthModal.tsx';
import { OrderTrackingModal } from './OrderTrackingModal.tsx';
import { recordLiveActivity } from '../../lib/firebase.ts';

interface TsukuriStorefrontProps {
  onOpenAdmin: () => void;
  onSelectProduct: (product: TsukuriProduct) => void;
  onBuyNowDirect: (product: TsukuriProduct) => void;
  liveVisitorsCount: number;
  productsList: TsukuriProduct[];
}

export const TsukuriStorefront: React.FC<TsukuriStorefrontProps> = ({
  onOpenAdmin,
  onSelectProduct,
  onBuyNowDirect,
  liveVisitorsCount,
  productsList,
}) => {
  const [cart, setCart] = useState<CartItem[]>([
    { product: productsList[0] || INITIAL_TSUKURI_PRODUCTS[0], quantity: 1 },
    { product: productsList[1] || INITIAL_TSUKURI_PRODUCTS[1], quantity: 2 },
  ]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCadModalOpen, setIsCadModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState('');
  const [trackingPhone, setTrackingPhone] = useState('');
  const [user, setUser] = useState<UserAccount | null>(null);
  const [pendingCadAfterAuth, setPendingCadAfterAuth] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [addedPopup, setAddedPopup] = useState<string | null>(null);

  const handleOpenCadSlicer = () => {
    if (!user) {
      setPendingCadAfterAuth(true);
      setIsAuthModalOpen(true);
      setAddedPopup('Sign In or Sign Up required to explore CAD slicer & upload custom CAD models.');
      setTimeout(() => setAddedPopup(null), 3500);
      return;
    }
    setIsCadModalOpen(true);
  };

  // Check stored user account
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tsukuri_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Send telemetry heartbeat & Firebase activity on mount
  useEffect(() => {
    recordLiveActivity('view', 'Maker browsed TsuKURI_3D Kyoto collection');
    fetch('/api/telemetry/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'view',
        eventMessage: 'Visitor landed on TsuKURI_3D Kyoto Storefront',
      }),
    }).catch(() => {});
  }, []);

  const handleAddToCart = (product: TsukuriProduct, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    setAddedPopup(`Added ${product.name} to Bag!`);
    setTimeout(() => setAddedPopup(null), 2400);

    recordLiveActivity('cart', `Added "${product.name}" (${formatPrice(product.priceINR)}) to bag`);
    fetch('/api/telemetry/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'cart',
        eventMessage: `Visitor added "${product.name}" to cart (INR)`,
      }),
    }).catch(() => {});
  };

  const handleDirectBuy = (product: TsukuriProduct, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onBuyNowDirect(product);
  };

  const handleUpdateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const displayProducts = productsList.length > 0 ? productsList : INITIAL_TSUKURI_PRODUCTS;

  const filteredProducts =
    selectedCategory === 'All'
      ? displayProducts
      : displayProducts.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#e8ece1] text-[#1a2e26] font-sans antialiased selection:bg-[#f3b755] selection:text-[#1a2e26]">
      {/* Toast Notification */}
      {addedPopup && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#1e4b3e] text-white font-bubbly text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Check className="w-4 h-4 text-[#f3b755]" />
          <span>{addedPopup}</span>
        </div>
      )}

      {/* Main Header (Clean Kyoto aesthetic without offer bar) */}
      <header className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-2 sm:pb-3">
        <div className="flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
              <div className="absolute w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#1e4b3e] -translate-x-1 -translate-y-0.5 sm:-translate-x-1.5 sm:-translate-y-1" />
              <div className="absolute w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-[#f3b755] translate-x-1 translate-y-0.5 sm:translate-x-1.5 sm:translate-y-1" />
              <span className="relative z-10 font-bubbly text-white text-xs sm:text-base">造</span>
            </div>
            <div>
              <span className="font-bubbly text-lg sm:text-2xl tracking-tight text-[#1a2e26] block leading-none">
                TSUKURI_3D
              </span>
              <span className="text-[8px] sm:text-[10px] font-bold tracking-widest text-[#1e4b3e] block uppercase mt-0.5">
                造り · KYOTO × NUSANTARA
              </span>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-[#273d34]">
            <a href="#drops" className="hover:text-[#1e4b3e] transition-colors">
              Collection Drops
            </a>
            <a href="#philosophy" className="hover:text-[#1e4b3e] transition-colors">
              Philosophy
            </a>
            <a href="#top-5" className="hover:text-[#1e4b3e] transition-colors">
              Top Picks
            </a>
            <button
              onClick={handleOpenCadSlicer}
              className="hover:text-[#1e4b3e] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Custom CAD</span>
              <Sparkles className="w-3.5 h-3.5 text-[#f3b755]" />
            </button>
            <button
              onClick={() => setIsTrackingModalOpen(true)}
              className="hover:text-[#1e4b3e] text-[#1e4b3e] font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer bg-white/70 px-2.5 py-1 rounded-full border border-[#1e4b3e]/20"
              title="Track Your Order by Phone & Order ID"
            >
              <Truck className="w-3.5 h-3.5 text-[#ea8f5a]" />
              <span>Track Order</span>
            </button>
          </nav>

          {/* Header Action Buttons (Track Order, User Sign In & Cart Capsule) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setIsTrackingModalOpen(true)}
              className="md:hidden p-2 rounded-full bg-white/90 text-[#1e4b3e] border border-slate-200 shadow-2xs cursor-pointer active:scale-95"
              title="Track Order"
            >
              <Truck className="w-4 h-4 text-[#ea8f5a]" />
            </button>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white/80 hover:bg-white text-slate-800 text-xs font-bold flex items-center gap-1 sm:gap-1.5 border border-slate-200 transition-all shadow-2xs cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[#1e4b3e]" />
              <span className="hidden sm:inline">
                {user ? user.name : 'Sign In'}
              </span>
            </button>

            {/* Dark Forest Green CART Capsule */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-[#1e4b3e] hover:bg-[#15342b] text-[#f3b755] font-bubbly text-xs sm:text-sm tracking-wider flex items-center gap-1.5 sm:gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>BAG</span>
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#f3b755] text-[#1e4b3e] font-bubbly text-[10px] sm:text-xs flex items-center justify-center">
                {totalCartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Bento Grid */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* ==============================================================
              LEFT COLUMN: MAIN OCHRE HERO CARD + TOP-5 PICKS TABLE
              ============================================================== */}
          <div className="lg:col-span-12 flex flex-col gap-4 sm:gap-5">
            {/* Main Ochre / Amber Hero Card (#f3b755) */}
            <div className="relative rounded-[2rem] sm:rounded-[2.5rem] bg-[#f3b755] p-5 sm:p-10 overflow-hidden shadow-sm flex flex-col justify-between min-h-[380px] sm:min-h-[440px]">
              <div className="absolute top-6 left-8 text-white/90 font-mono text-2xl select-none pointer-events-none">
                \ \ /
              </div>
              <div className="absolute top-10 right-12 text-white/80 font-mono text-xl select-none pointer-events-none">
                ✦
              </div>

              <div className="relative z-10 flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-white/40 backdrop-blur-xs text-[#1a2e26] text-[10px] sm:text-[11px] font-bold tracking-wider uppercase">
                    作り · TSUKURI3D STUDIO
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#1e4b3e] text-[#f3b755] text-[10px] font-bubbly tracking-wider uppercase">
                    Print your vibe
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a2e26]/80 bg-white/30 backdrop-blur-xs px-3 py-1 rounded-full">
                  <span>✨ Your space, but make it 3D.</span>
                </div>
              </div>

              {/* Brand Typography & Updated Hero Content */}
              <div className="relative z-10 my-auto py-4 sm:py-8 text-center sm:text-left">
                <div className="inline-block px-3 py-0.5 rounded-full bg-white/60 text-[#1e4b3e] font-bold text-[11px] tracking-wider uppercase mb-2">
                  Made layer by layer. Made for you.
                </div>
                <h1 className="font-bubbly text-[42px] xs:text-[54px] sm:text-[100px] lg:text-[120px] leading-none text-white tracking-tighter drop-shadow-xs select-none">
                  TSUKURI3D
                </h1>
                <p className="font-bubbly text-lg sm:text-2xl text-[#1a2e26] mt-2 tracking-tight">
                  Aesthetic 3D Printed Decor & Desk Accessories
                </p>
                <p className="text-xs sm:text-sm font-bold text-[#1a2e26]/85 mt-2 max-w-xl leading-relaxed">
                  Tsukuri3d makes aesthetic 3D printed pieces for desks, shelves, and everyday carry. Think minimal, quirky, and a little futuristic. Every piece is designed to stand out and is printed to order.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3 mt-5">
                  <a
                    href="#drops"
                    className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-[#1e4b3e] hover:bg-[#15342b] text-[#f3b755] font-bubbly text-xs tracking-wider flex items-center gap-2 shadow-md active:scale-95 transition-all"
                  >
                    <span>EXPLORE ALL DROPS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={handleOpenCadSlicer}
                    className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-white text-[#1a2e26] font-bubbly text-xs tracking-wider hover:bg-slate-50 transition-all shadow-xs"
                  >
                    UPLOAD CUSTOM CAD (.STL)
                  </button>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-black/5">
                <div className="text-center sm:text-left">
                  <p className="text-xs font-bold text-[#1a2e26]/80 leading-snug">
                    Made layer by layer. Made for you. · Print your vibe.
                  </p>
                </div>

                <div className="text-center sm:text-right">
                  <span className="font-bubbly text-2xl sm:text-3xl text-[#1a2e26] block leading-none">
                    ( 4.9 )
                  </span>
                  <span className="text-[10px] font-bold text-[#1a2e26]/75 uppercase tracking-wider">
                    since 2024 · 1,400+ Prints Shipped
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Card: TOP-5 PICKS */}
            <div id="top-5" className="rounded-[2rem] sm:rounded-[2.2rem] bg-white p-4 sm:p-8 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bubbly text-xl sm:text-3xl text-[#1a2e26] tracking-tight">
                  TOP-5 PICKS
                </h2>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#1e4b3e] uppercase tracking-wider">
                  Kyoto Best-Sellers
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {displayProducts.slice(0, 5).map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => onSelectProduct(prod)}
                    className="py-3 flex items-center justify-between gap-2.5 sm:gap-3 group hover:bg-[#e8ece1]/30 px-1 sm:px-2 rounded-2xl transition-colors cursor-pointer"
                  >
                    {/* Thumbnail & Titles */}
                    <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                      <div
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-xs"
                        style={{ backgroundColor: prod.colorHex }}
                      >
                        <img
                          src={formatMediaUrl(prod.imageUrl)}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bubbly text-xs sm:text-base text-[#1a2e26] truncate group-hover:text-[#1e4b3e] transition-colors">
                          {prod.name}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 truncate max-w-[150px] sm:max-w-xs">
                          {prod.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Price & Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <div className="text-right">
                        <span className="font-bubbly text-xs sm:text-base text-[#1a2e26] block leading-none">
                          {formatPrice(prod.priceINR)}
                        </span>
                        <span className="text-[9px] text-slate-400 uppercase font-semibold">
                          each
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleDirectBuy(prod, e)}
                        className="hidden sm:inline-flex px-3 py-1.5 rounded-full bg-[#f3b755] hover:bg-[#ebb04c] text-[#1a2e26] font-bubbly text-[11px] tracking-wide items-center gap-1 shadow-xs"
                      >
                        <Zap className="w-3 h-3 fill-current" />
                        <span>BUY</span>
                      </button>

                      <button
                        onClick={(e) => handleAddToCart(prod, e)}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1e4b3e] text-white flex items-center justify-center hover:bg-[#15342b] hover:scale-110 active:scale-95 transition-all shadow-xs"
                        title={`Add ${prod.name} to Cart`}
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ==============================================================
            EXPANDED COLLECTION DROPS (REQUIREMENT 1: 2 CARDS PER ROW ON MOBILE WITH BUY NOW & DISCOUNTS)
            ============================================================== */}
        <div id="drops" className="pt-4 sm:pt-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-[#1e4b3e] tracking-widest uppercase">
                造り · ALL DROPS
              </span>
              <h2 className="font-bubbly text-2xl sm:text-4xl text-[#1a2e26]">
                KYOTO-INDO 3D COLLECTION
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                25% festival discount applied on all drops. Tap to inspect or buy instantly.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-slate-200 shadow-2xs overflow-x-auto max-w-full">
              {['All', ...Array.from(new Set(displayProducts.map((p) => p.category).filter(Boolean)))].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#1e4b3e] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* REQUIREMENT 1: TWO CARDS ON MOBILE VIEW (grid-cols-2) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filteredProducts.map((prod) => {
              const discountPercent = prod.discountPercent || 25;
              const originalMRP = prod.originalMRPINR || Math.round(prod.priceINR * 1.35);

              return (
                <div
                  key={prod.id}
                  onClick={() => onSelectProduct(prod)}
                  className="bg-white rounded-[1.8rem] sm:rounded-[2rem] p-3 sm:p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group border border-slate-100 cursor-pointer"
                >
                  <div>
                    {/* Product Image Frame */}
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#e8ece1]/50 mb-2 sm:mb-3">
                      <img
                        src={formatMediaUrl(prod.imageUrl)}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Requirement 1: Discount Badge */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-[9px] sm:text-[10px] tracking-wider shadow-xs">
                        {discountPercent}% OFF
                      </span>
                    </div>

                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 font-mono block truncate">
                      {prod.japaneseName}
                    </span>

                    <h3 className="font-bubbly text-xs sm:text-base text-[#1a2e26] mt-0.5 group-hover:text-[#1e4b3e] transition-colors line-clamp-1">
                      {prod.name}
                    </h3>

                    {/* Price Row with Struck MRP */}
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="font-bubbly text-sm sm:text-lg text-[#1e4b3e]">
                        {formatPrice(prod.priceINR)}
                      </span>
                      <span className="text-[10px] sm:text-xs text-slate-400 line-through">
                        ₹{originalMRP}
                      </span>
                    </div>
                  </div>

                  {/* REQUIREMENT 1: Dual Buttons (BUY NOW & ADD) */}
                  <div className="pt-2 sm:pt-3 mt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2">
                    {/* Direct Buy Now Button */}
                    <button
                      onClick={(e) => handleDirectBuy(prod, e)}
                      className="flex-1 py-1.5 sm:py-2 px-2 rounded-full bg-[#f3b755] hover:bg-[#ebb04c] text-[#1a2e26] font-bubbly text-[10px] sm:text-xs flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all"
                    >
                      <Zap className="w-3 h-3 fill-current" />
                      <span>BUY NOW</span>
                    </button>

                    {/* Quick Add to Bag */}
                    <button
                      onClick={(e) => handleAddToCart(prod, e)}
                      className="py-1.5 sm:py-2 px-2.5 rounded-full bg-[#1e4b3e] hover:bg-[#15342b] text-white font-bubbly text-[10px] sm:text-xs flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all"
                      title="Add to Bag"
                    >
                      <Plus className="w-3 h-3" />
                      <span className="hidden sm:inline">BAG</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ==============================================================
            STUDIO ACADEMY & EVERYDAY DROPS (Requirement 1: After All Drops)
            ============================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 pt-3 sm:pt-6">
          {/* Studio Blue Card (#9dc4e8) */}
          <div
            id="studio"
            className="relative rounded-[2rem] sm:rounded-[2.5rem] bg-[#9dc4e8] p-5 sm:p-7 overflow-hidden shadow-2xs flex flex-col justify-between min-h-[280px] sm:min-h-[320px]"
          >
            <div className="text-center sm:text-left">
              <h3 className="font-bubbly text-2xl sm:text-4xl text-[#1a2e26] tracking-tight">
                STUDIO
              </h3>
              <p className="text-xs font-bold text-[#1a2e26]/80 mt-0.5">
                Learn to 3D craft & custom CAD slicing
              </p>
            </div>

            <div className="relative my-3 flex justify-center">
              <div className="relative">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                  <img
                    src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80"
                    alt="Maker Artisan"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="absolute -top-1 -left-4 sm:-left-6 bg-transparent text-white font-bubbly text-xs leading-none select-none rotate-[-12deg]">
                  <span className="block text-white font-black text-xs sm:text-sm drop-shadow-sm">
                    JOIN
                  </span>
                  <span className="block text-white font-black text-xs sm:text-sm drop-shadow-sm">
                    LAB
                  </span>
                  <span className="block text-xs mt-0.5">⤵</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleOpenCadSlicer}
                className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-full bg-[#1e4b3e] hover:bg-[#15342b] text-[#f3b755] font-bubbly text-xs tracking-wider flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                <span>EXPLORE CAD SLICER</span>
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#f3b755] text-[#1e4b3e] flex items-center justify-center text-[10px]">
                  ✎
                </div>
              </button>
            </div>
          </div>

          {/* Everyday Terracotta Card (#ea8f5a) */}
          <div className="relative rounded-[2rem] sm:rounded-[2.5rem] bg-[#ea8f5a] p-5 sm:p-7 overflow-hidden shadow-2xs flex flex-col justify-between min-h-[280px] sm:min-h-[320px]">
            <div className="text-center sm:text-left">
              <h3 className="font-bubbly text-2xl sm:text-4xl text-[#1a2e26] tracking-tight">
                EVERYDAY
              </h3>
            </div>

            <div className="relative my-2 sm:my-3 flex flex-col items-center justify-center">
              <div
                className="relative group cursor-pointer"
                onClick={() => onSelectProduct(displayProducts[3] || INITIAL_TSUKURI_PRODUCTS[3])}
              >
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-4 border-white transition-transform group-hover:scale-105">
                  <img
                    src={formatMediaUrl(displayProducts[3]?.imageUrl || INITIAL_TSUKURI_PRODUCTS[3].imageUrl)}
                    alt={displayProducts[3]?.name || 'Everyday Drop'}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="absolute top-2 -right-2 sm:-right-3 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-[#1e4b3e] text-white font-bubbly text-xs sm:text-sm shadow-md border-2 border-white rotate-6">
                  {formatPrice(displayProducts[3]?.priceINR || 1299)}
                </div>
              </div>

              <h4 className="font-bubbly text-base sm:text-lg text-white mt-2 text-center drop-shadow-xs">
                {displayProducts[3]?.name || 'Torii Headphone Rest'}
              </h4>
            </div>

            <div className="space-y-2 pt-1 text-center">
              <p className="text-[11px] sm:text-xs font-bold text-white/90 leading-relaxed max-w-xs mx-auto">
                Freshly printed, eco-PLA & bamboo teak, delivered to your door!
              </p>
              <button
                onClick={(e) => handleDirectBuy(displayProducts[3] || INITIAL_TSUKURI_PRODUCTS[3], e)}
                className="w-full py-2.5 sm:py-3 rounded-full bg-[#f3b755] text-[#1a2e26] font-bubbly text-xs tracking-wider hover:bg-[#ebb04c] transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>BUY NOW · {formatPrice(displayProducts[3]?.priceINR || 1299)}</span>
              </button>
            </div>
          </div>
        </div>

        {/* About / Brand Description & Why Tsukuri3d (Requirement 8) */}
        <div id="about" className="rounded-[2rem] sm:rounded-[2.5rem] bg-white p-6 sm:p-12 shadow-2xs space-y-8">
          {/* Brand Story */}
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="px-3.5 py-1 rounded-full bg-[#1e4b3e]/10 text-[#1e4b3e] text-[11px] font-bold uppercase tracking-widest inline-block">
              ABOUT TSUKURI3D · 作り
            </span>
            <h2 className="font-bubbly text-2xl sm:text-4xl text-[#1a2e26]">
              Made Layer by Layer. Made for You.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Tsukuri (作り) is Japanese for &ldquo;making&rdquo; or &ldquo;craft&rdquo;, and that&apos;s what we do. Tsukuri3d turns bold ideas into objects you&apos;ll actually want to show off. We design and print everything ourselves, from desk decor and phone stands to lamps, planters, and gifts. Each piece is made in small batches so it never feels mass-produced. No boring basics. Just cool, clean, one-of-a-kind stuff that fits your vibe.
            </p>
          </div>

          {/* Why Tsukuri3d (3 points) */}
          <div className="pt-4 border-t border-slate-100">
            <div className="text-center mb-6">
              <span className="font-bubbly text-lg sm:text-xl text-[#1a2e26]">
                WHY TSUKURI3D
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center md:text-left">
              <div className="p-5 rounded-2xl bg-[#e8ece1]/50 border border-[#1e4b3e]/10 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#1e4b3e] text-[#f3b755] flex items-center justify-center font-bubbly text-xl mx-auto md:mx-0 shadow-2xs">
                  ✦
                </div>
                <h3 className="font-bubbly text-base sm:text-lg text-[#1a2e26]">Unique designs</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Nothing you&apos;ll see in every other room.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#f3b755]/20 border border-[#f3b755]/40 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#f3b755] text-[#1a2e26] flex items-center justify-center font-bubbly text-xl mx-auto md:mx-0 shadow-2xs">
                  🖨️
                </div>
                <h3 className="font-bubbly text-base sm:text-lg text-[#1a2e26]">Made to order</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Printed fresh for you, in colors you pick.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#ea8f5a]/20 border border-[#ea8f5a]/40 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#ea8f5a] text-white flex items-center justify-center font-bubbly text-xl mx-auto md:mx-0 shadow-2xs">
                  🎁
                </div>
                <h3 className="font-bubbly text-base sm:text-lg text-[#1a2e26]">Giftable</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Quirky pieces that are easy to gift.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer with Small Admin Link */}
      <footer className="mt-12 sm:mt-16 bg-[#1a2e26] text-white pt-10 sm:pt-12 pb-8 px-4 sm:px-6 border-t-4 border-[#1e4b3e]">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#f3b755] text-[#1a2e26] flex items-center justify-center font-bubbly text-xs">
                  造
                </div>
                <span className="font-bubbly text-lg text-white">TSUKURI3D</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aesthetic 3D printed decor and gadgets for Gen Z. Designed bold, printed layer by layer.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bubbly text-xs sm:text-sm text-[#f3b755]">COLLECTIONS</h4>
              <ul className="text-xs text-slate-400 space-y-1 font-medium">
                <li><a href="#top-5" className="hover:text-white transition-colors">Top-5 Picks</a></li>
                <li><a href="#drops" className="hover:text-white transition-colors">Zen Wave Planters</a></li>
                <li><a href="#drops" className="hover:text-white transition-colors">Artisan Keycaps</a></li>
                <li><a href="#drops" className="hover:text-white transition-colors">Teak Desk Tidies</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bubbly text-xs sm:text-sm text-[#9dc4e8]">STUDIO LAB</h4>
              <ul className="text-xs text-slate-400 space-y-1 font-medium">
                <li>
                  <button onClick={() => setIsCadModalOpen(true)} className="hover:text-white transition-colors">
                    Upload Custom STL
                  </button>
                </li>
                <li><a href="#studio" className="hover:text-white transition-colors">Academy & Slicing</a></li>
                <li><a href="#philosophy" className="hover:text-white transition-colors">Bio-PLA Materials</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bubbly text-xs sm:text-sm text-[#ea8f5a]">OFFICIAL SUPPORT & TRACKING</h4>
              <p className="text-xs text-slate-400">
                Official Studio Support & Helpdesk:
              </p>
              <a
                href="mailto:commersgyan@gmail.com"
                className="text-xs text-[#f3b755] hover:underline font-mono font-bold block"
              >
                Official Studio Support Desk
              </a>
              <div className="pt-2">
                <button
                  onClick={() => setIsTrackingModalOpen(true)}
                  className="px-4 py-2 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs flex items-center gap-1.5 shadow-sm hover:bg-[#15342b] transition-colors cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5 text-[#ea8f5a]" />
                  <span>TRACK YOUR ORDER (3-4 DAYS)</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 text-center sm:text-left">
            <p>© 2024–2026 Tsukuri3d. Designed bold, printed layer by layer · Official Studio Support Desk</p>

            <button
              onClick={onOpenAdmin}
              className="group flex items-center gap-2 text-[11px] text-slate-400 hover:text-[#f3b755] transition-colors underline decoration-slate-600 hover:decoration-[#f3b755]"
              title="Open TsuKURI_3D Workshop Core & Admin Dashboard"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>⚙ TsuKURI_3D Studio Core [Live Admin Dashboard]</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <TsukuriCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCart([])}
        onOrderSuccess={() => {
          setAddedPopup('Order transmitted to Bambu print fleet!');
          setTimeout(() => setAddedPopup(null), 3000);
        }}
        onOpenTracking={(ordNum, ph) => {
          if (ordNum) setTrackingOrderNumber(ordNum);
          if (ph) setTrackingPhone(ph);
          setIsTrackingModalOpen(true);
        }}
      />

      {/* Order Tracking Modal (Requirement 15) */}
      <OrderTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        initialOrderNumber={trackingOrderNumber}
        initialPhone={trackingPhone}
      />

      {/* Custom CAD Modal */}
      <CustomCadModal
        isOpen={isCadModalOpen}
        onClose={() => setIsCadModalOpen(false)}
        user={user}
        onRequireAuth={() => {
          setPendingCadAfterAuth(true);
          setIsAuthModalOpen(true);
        }}
        onSubmitQuote={(quote) => {
          setAddedPopup(`Custom CAD "${quote.fileName}" queued for slicer!`);
          setTimeout(() => setAddedPopup(null), 3000);
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingCadAfterAuth(false);
        }}
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setAddedPopup(`Welcome, ${loggedInUser.name}!`);
          setTimeout(() => setAddedPopup(null), 2500);
          if (pendingCadAfterAuth) {
            setPendingCadAfterAuth(false);
            setIsCadModalOpen(true);
          }
        }}
      />
    </div>
  );
};
