import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Clock,
  Layers,
  Box,
  Plus,
  Minus,
  Zap,
  ShoppingBag,
  Sparkles,
  Play,
  Film,
  Image as ImageIcon,
  MessageSquare,
  ThumbsUp,
  Tag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TsukuriProduct, formatPrice, ProductReview, ComboTierOffer } from './tsukuriData.ts';

interface ProductDetailPageProps {
  product: TsukuriProduct;
  onBack: () => void;
  onAddToCart: (product: TsukuriProduct, quantity: number, selectedColor?: string, customPriceINR?: number, comboLabel?: string) => void;
  onBuyNow: (product: TsukuriProduct, quantity: number, selectedColor?: string, customPriceINR?: number, comboLabel?: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onBack,
  onAddToCart,
  onBuyNow,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [addedBanner, setAddedBanner] = useState(false);

  // Requirement 4: Ensure product page always opens scrolled to the very top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [product?.id]);

  // Variant & Combo state (Requirement 2)
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colorVariants && product.colorVariants.length > 0 ? product.colorVariants[0].name : 'Default Studio Finish'
  );
  const selectedVariant = product.colorVariants?.find((v) => v.name === selectedColor);
  const [selectedCombo, setSelectedCombo] = useState<ComboTierOffer | null>(null);

  // Multi-media state
  const mediaList = product.images && product.images.length > 0
    ? product.images
    : [product.imageUrl];
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isVideoActive, setIsVideoActive] = useState(false);

  // Mobile finger sliding / swipe gestures for product images
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [touchOffset, setTouchOffset] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleNextMedia = () => {
    setActiveMediaIndex((prev) => (prev + 1) % mediaList.length);
    setIsVideoActive(false);
  };

  const handlePrevMedia = () => {
    setActiveMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
    setIsVideoActive(false);
  };

  const onTouchStartMedia = (e: React.TouchEvent) => {
    if (isVideoActive || mediaList.length <= 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(true);
    setTouchOffset(0);
  };

  const onTouchMoveMedia = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || isVideoActive) return;
    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = e.touches[0].clientY - touchStartY.current;
    // Only track if horizontal swipe motion is greater than vertical scroll
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setTouchOffset(diffX);
    }
  };

  const onTouchEndMedia = () => {
    if (touchStartX.current !== null && !isVideoActive && mediaList.length > 1) {
      if (touchOffset < -35) {
        // Swiped left with finger -> next image
        handleNextMedia();
      } else if (touchOffset > 35) {
        // Swiped right with finger -> previous image
        handlePrevMedia();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    setTouchOffset(0);
    setIsSwiping(false);
  };

  // Video carousel state (Requirement 3: Carousel video just above Customer Reviews)
  const videoList = product.carouselVideos && product.carouselVideos.length > 0
    ? product.carouselVideos
    : product.videoUrl
    ? [{ url: product.videoUrl, title: `${product.name} 3D Print Quality & Slicing Timelapse` }]
    : [];
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  // Reviews state
  const [reviewsList, setReviewsList] = useState<ProductReview[]>(
    product.reviews && product.reviews.length > 0
      ? product.reviews
      : [
          {
            id: 'rev-default-1',
            author: 'Aarav Sharma',
            location: 'Bengaluru, KA',
            rating: 5,
            date: 'Yesterday',
            comment: 'Exceptional layer finish. No visible layer lines on the 0.12mm print, and the matte texture looks stunning.',
            verified: true,
          },
          {
            id: 'rev-default-2',
            author: 'Kenji M.',
            location: 'Kyoto, JP',
            rating: 5,
            date: '3 days ago',
            comment: 'True Kyoto artisan quality. Packed with Japanese wabi-sabi aesthetics and arrived safely.',
            verified: true,
          },
        ]
  );
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewCity, setNewReviewCity] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewImages, setNewReviewImages] = useState<string[]>([]);
  const [isWritingReview, setIsWritingReview] = useState(false);

  const handleReviewImagesFromDevice = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            setNewReviewImages((prev) => [...prev, ev.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Pricing calculations: Combo vs Single
  const variantAdjustment = selectedVariant?.priceAdjustment || 0;
  const effectiveBasePrice = product.priceINR + variantAdjustment;
  const currentTotalINR = selectedCombo
    ? selectedCombo.priceINR + variantAdjustment * selectedCombo.quantity
    : effectiveBasePrice * quantity;
  const effectiveUnitPrice = selectedCombo
    ? Math.round(currentTotalINR / selectedCombo.quantity)
    : effectiveBasePrice;

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedColor, currentTotalINR, selectedCombo?.label);
    setAddedBanner(true);
    setTimeout(() => setAddedBanner(false), 2500);
  };

  const handleBuy = () => {
    onBuyNow(product, quantity, selectedColor, currentTotalINR, selectedCombo?.label);
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor || !newReviewComment) return;
    const newRev: ProductReview = {
      id: `rev-${Date.now()}`,
      author: newReviewAuthor,
      location: newReviewCity || 'Verified Maker',
      rating: 5,
      date: 'Just now',
      comment: newReviewComment,
      verified: true,
      images: newReviewImages.length > 0 ? newReviewImages : undefined,
    };
    setReviewsList([newRev, ...reviewsList]);
    setNewReviewAuthor('');
    setNewReviewCity('');
    setNewReviewComment('');
    setNewReviewImages([]);
    setIsWritingReview(false);
  };

  const discountPercent = product.discountPercent || (product.originalMRPINR ? Math.round(((product.originalMRPINR - product.priceINR) / product.originalMRPINR) * 100) : 25);
  const originalMRP = (product.originalMRPINR || Math.round(product.priceINR * 1.35)) + variantAdjustment;

  return (
    <div className="min-h-screen bg-[#e8ece1] text-[#1a2e26] pb-24 sm:pb-12 pt-4 sm:pt-6 px-3 sm:px-6">
      {/* Toast */}
      {addedBanner && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-[#1e4b3e] text-white font-bubbly text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-[#f3b755]" />
          <span>Added {quantity}x {product.name} ({selectedColor}) to your bag!</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Back Navigation */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-700 hover:text-[#1e4b3e] hover:bg-slate-50 font-bubbly text-xs shadow-2xs border border-slate-200 transition-all hover:-translate-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO COLLECTION</span>
        </button>

        {/* Main Grid: Responsive layout matching Requirement 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
          {/* =========================================================
              LEFT COLUMN: LARGE PROMINENT PRODUCT IMAGE & MEDIA GALLERY
              ========================================================= */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4">
            <div className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-white p-3 sm:p-6 shadow-xs border-4 border-white select-none">
              {/* Large Main Media Frame with Finger Sliding Touch Gestures */}
              <div
                onTouchStart={onTouchStartMedia}
                onTouchMove={onTouchMoveMedia}
                onTouchEnd={onTouchEndMedia}
                onTouchCancel={onTouchEndMedia}
                className="relative w-full aspect-square sm:aspect-4/3 rounded-2xl sm:rounded-3xl overflow-hidden bg-[#e8ece1]/40 touch-pan-y cursor-grab active:cursor-grabbing"
              >
                {isVideoActive && product.videoUrl ? (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <video
                      src={product.videoUrl}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className="w-full h-full transition-transform duration-200 ease-out"
                    style={{
                      transform: isSwiping && touchOffset !== 0 ? `translateX(${touchOffset * 0.45}px)` : undefined,
                    }}
                  >
                    <img
                      src={mediaList[activeMediaIndex] || product.imageUrl}
                      alt={product.name}
                      draggable={false}
                      className="w-full h-full object-cover transition-opacity duration-300 pointer-events-none"
                    />
                  </div>
                )}

                {/* Badge Overlay */}
                {(product.customOfferBadge || product.badge) && (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs tracking-wider shadow-md pointer-events-none">
                    {product.customOfferBadge || product.badge}
                  </div>
                )}

                {/* Left / Right Chevron Buttons for Finger Tapping / Sliding */}
                {mediaList.length > 1 && !isVideoActive && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous Image"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevMedia();
                      }}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-md backdrop-blur-xs transition-all active:scale-90"
                    >
                      <ChevronLeft className="w-5 h-5 text-[#1e4b3e]" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next Image"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextMedia();
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-md backdrop-blur-xs transition-all active:scale-90"
                    >
                      <ChevronRight className="w-5 h-5 text-[#1e4b3e]" />
                    </button>

                    {/* Pagination Dots & Slide Counter for Phone */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-xs text-white">
                      {mediaList.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setActiveMediaIndex(i);
                            setIsVideoActive(false);
                          }}
                          className={`h-1.5 rounded-full transition-all ${
                            activeMediaIndex === i ? 'w-5 bg-[#f3b755]' : 'w-1.5 bg-white/60'
                          }`}
                        />
                      ))}
                      <span className="text-[10px] font-mono ml-1 font-bold">
                        {activeMediaIndex + 1}/{mediaList.length}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails row */}
              <div className="flex items-center gap-2.5 mt-3 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
                {mediaList.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveMediaIndex(idx);
                      setIsVideoActive(false);
                    }}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                      !isVideoActive && activeMediaIndex === idx
                        ? 'border-[#1e4b3e] ring-2 ring-[#1e4b3e] scale-105'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                  </button>
                ))}

                {product.videoUrl && (
                  <button
                    onClick={() => setIsVideoActive(true)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl border-2 shrink-0 flex flex-col items-center justify-center transition-all ${
                      isVideoActive
                        ? 'border-[#1e4b3e] bg-[#1e4b3e] text-[#f3b755] ring-2 ring-[#f3b755] scale-105'
                        : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span className="text-[9px] font-bold mt-0.5">Video</span>
                  </button>
                )}
              </div>

              {/* Japanese Subtext */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono font-bold text-[#1e4b3e]">
                  {product.japaneseName}
                </span>
                <span className="text-[11px]">SKU: {product.sku}</span>
              </div>
            </div>

            {/* =========================================================
                OFFICIAL STUDIO OFFER - HIGHLIGHTS ₹10 DISCOUNT ON ONLINE PAYMENT
                Solid, bold, crisp, high-contrast banner without opacity pulsing.
                ========================================================= */}
            <div className="relative overflow-hidden rounded-[2rem] bg-[#f3b755] p-4 sm:p-5 shadow-sm border-2 border-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1e4b3e] text-[#f3b755] flex items-center justify-center shrink-0 shadow-xs ring-2 ring-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 text-[#1a2e26]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-[10px] tracking-wider uppercase">
                      OFFICIAL STUDIO OFFER
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#1e4b3e] text-white font-black text-xs uppercase tracking-wide shadow-xs ring-2 ring-white flex items-center gap-1">
                      <span className="text-[#f3b755]">⚡</span>
                      <span>₹10 OFF ON ONLINE PAYMENT</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* =========================================================
                REQUIREMENT 2: COLOR VARIANTS SELECTOR
                ========================================================= */}
            {product.colorVariants && product.colorVariants.length > 0 && (
              <div className="p-4 sm:p-5 bg-white rounded-[2rem] shadow-xs border border-slate-100 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#1a2e26] uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#1e4b3e]" />
                    <span>Colour Variant: <strong className="text-[#1e4b3e]">{selectedColor}</strong></span>
                  </span>
                  {selectedVariant?.priceAdjustment ? (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      +{formatPrice(selectedVariant.priceAdjustment)}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {product.colorVariants.map((v) => (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => setSelectedColor(v.name)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-bold transition-all ${
                        selectedColor === v.name
                          ? 'border-[#1e4b3e] bg-[#1e4b3e] text-white shadow-xs ring-2 ring-[#f3b755]'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: v.colorHex }}
                      />
                      <span>{v.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* =========================================================
                REQUIREMENT 2: COMBO & QUANTITY TIER PRICING DEALS
                ========================================================= */}
            {product.comboOffers && product.comboOffers.length > 0 && (
              <div className="p-4 sm:p-5 bg-white rounded-[2rem] shadow-xs border border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-[#ea8f5a]" />
                    <span className="font-bubbly text-xs text-[#1a2e26] uppercase tracking-wider">
                      SELECT COMBO / QUANTITY DEAL
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    SPECIAL PRICING
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {product.comboOffers.map((combo) => {
                    const isSelected = selectedCombo?.quantity === combo.quantity;
                    return (
                      <button
                        key={combo.quantity}
                        type="button"
                        onClick={() => {
                          setSelectedCombo(combo);
                          setQuantity(combo.quantity);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all relative ${
                          isSelected
                            ? 'border-[#1e4b3e] bg-[#1e4b3e] text-white shadow-sm ring-2 ring-[#f3b755]'
                            : 'border-slate-200 bg-[#e8ece1]/30 text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        {combo.popular && (
                          <span className="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-[#f3b755] text-[#1a2e26] font-bubbly text-[9px] font-bold shadow-xs">
                            BEST VALUE
                          </span>
                        )}
                        <span className="text-xs font-bold block leading-tight">
                          {combo.label}
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-1.5">
                          <span className={`font-bubbly text-base font-bold ${isSelected ? 'text-[#f3b755]' : 'text-[#1e4b3e]'}`}>
                            {formatPrice(combo.priceINR + variantAdjustment * combo.quantity)}
                          </span>
                          {combo.savePercent ? (
                            <span className={`text-[10px] font-bold ${isSelected ? 'text-emerald-300' : 'text-emerald-700'}`}>
                              Save {combo.savePercent}%
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =========================================================
                BUY NOW & ADD TO BAG DIRECT BUTTONS + PRICING
                ========================================================= */}
            <div className="p-4 sm:p-5 bg-white rounded-[2rem] shadow-xs border border-slate-100 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    PRICE (INCL. TAXES)
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bubbly text-3xl sm:text-4xl text-[#1e4b3e]">
                      {formatPrice(currentTotalINR)}
                    </span>
                    <span className="text-sm font-bold text-slate-400 line-through">
                      ₹{originalMRP * quantity}
                    </span>
                    <span className="text-xs font-extrabold text-[#ea8f5a]">
                      ({discountPercent}% OFF)
                    </span>
                  </div>
                </div>

                {/* Quantity adjuster */}
                <div className="flex items-center gap-2 bg-[#e8ece1] p-1 rounded-full">
                  <button
                    onClick={() => {
                      setSelectedCombo(null);
                      setQuantity((q) => Math.max(1, q - 1));
                    }}
                    className="w-7 h-7 rounded-full bg-white text-slate-800 flex items-center justify-center hover:bg-[#1e4b3e] hover:text-white transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bubbly text-sm w-5 text-center font-bold">
                    {quantity}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedCombo(null);
                      setQuantity((q) => Math.min(product.stockCount, q + 1));
                    }}
                    className="w-7 h-7 rounded-full bg-white text-slate-800 flex items-center justify-center hover:bg-[#1e4b3e] hover:text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* DUAL ACTION BUTTONS (HIGH CONVERSION) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={handleBuy}
                  className="w-full py-4 rounded-full bg-[#f3b755] hover:bg-[#ebb04c] text-[#1a2e26] font-bubbly text-base tracking-wide flex items-center justify-center gap-2 shadow-md hover:scale-102 active:scale-98 transition-all cursor-pointer"
                >
                  <Zap className="w-5 h-5 fill-current text-[#1a2e26]" />
                  <span>BUY NOW (COD / UPI)</span>
                </button>

                <button
                  onClick={handleAdd}
                  className="w-full py-4 rounded-full bg-[#1e4b3e] hover:bg-[#15342b] text-white font-bubbly text-sm tracking-wide flex items-center justify-center gap-2 shadow-xs hover:scale-102 active:scale-98 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>ADD TO BAG</span>
                </button>
              </div>

              {/* DELIVERY & CHARGES */}
              <div className="p-3.5 bg-[#e8ece1]/50 rounded-2xl border border-[#1e4b3e]/15 space-y-2 mt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1e4b3e]">
                  <Truck className="w-4 h-4 text-[#ea8f5a] shrink-0" />
                  <span>
                    <span className="text-[#1e4b3e] font-extrabold">
                      {product.deliveryCharges ? `₹${product.deliveryCharges} Shipping` : 'FREE Delivery'}
                    </span>{' '}
                    · ETA: {product.deliveryEta || '3 to 4 Days Pan-India'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1e4b3e] shrink-0" />
                    <span>100% Quality Inspected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1e4b3e] shrink-0" />
                    <span>Bio-PLA Eco Materials</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#1e4b3e] shrink-0" />
                    <span>7-Day Replacement Cover</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#1e4b3e] shrink-0" />
                    <span>Encrypted UPI & Verified COD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================
              RIGHT COLUMN: PRODUCT DETAILS, VIDEO CAROUSEL & REVIEWS
              ========================================================= */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            {/* 1. PRODUCT DETAILS BENTO */}
            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 shadow-xs border border-slate-100 space-y-5">
              <div>
                <span className="text-[11px] font-bold text-[#1e4b3e] tracking-widest uppercase">
                  造り · {product.category}
                </span>
                <h1 className="font-bubbly text-2xl sm:text-3xl text-[#1a2e26] mt-1 leading-tight">
                  {product.name}
                </h1>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {product.japaneseName}
                </p>

                <div className="flex items-center gap-2 mt-2.5 text-xs">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="font-bold text-[#1a2e26] font-mono">{product.rating}</span>
                  <span className="text-slate-400">({reviewsList.length} verified reviews)</span>
                </div>
              </div>

              {/* 3D Print Specs Bento Cards */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-[#e8ece1]/60">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Filament Material</span>
                  <span className="font-bold text-[#1a2e26] line-clamp-1">{product.filamentType}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#e8ece1]/60">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Print Duration</span>
                  <span className="font-bold text-[#1a2e26]">{product.printTimeHours} Hours</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#e8ece1]/60">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Dimensions</span>
                  <span className="font-bold text-[#1a2e26]">{product.dimensions}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#e8ece1]/60">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Bio-PLA Weight</span>
                  <span className="font-bold text-[#1a2e26]">{product.weightGrams}g</span>
                </div>
              </div>

              {/* Narrative Description */}
              <div>
                <h3 className="text-xs font-bold text-[#1a2e26] uppercase tracking-wider mb-1.5">
                  Artisan Craft Story
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Key Features Checklist */}
              {product.features && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-[#1a2e26] uppercase tracking-wider block">
                    Precision Highlights
                  </span>
                  <ul className="space-y-1.5">
                    {product.features.map((feat, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1e4b3e] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* =========================================================
                REQUIREMENT 3: CAROUSEL VIDEO JUST ABOVE CUSTOMER REVIEWS
                ========================================================= */}
            {videoList.length > 0 && (
              <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 shadow-xs border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-[#ea8f5a]" />
                      <h3 className="font-bubbly text-lg sm:text-xl text-[#1a2e26]">
                        STUDIO PRINT & FINISH VIDEOS
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      High-precision Bambu Lab layer adhesion and 360° tactile video.
                    </p>
                  </div>
                  {videoList.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setActiveVideoIndex((i) => (i === 0 ? videoList.length - 1 : i - 1))}
                        className="w-7 h-7 rounded-full bg-[#e8ece1] hover:bg-[#1e4b3e] hover:text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                        title="Previous video"
                      >
                        ←
                      </button>
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        {activeVideoIndex + 1}/{videoList.length}
                      </span>
                      <button
                        onClick={() => setActiveVideoIndex((i) => (i === videoList.length - 1 ? 0 : i + 1))}
                        className="w-7 h-7 rounded-full bg-[#e8ece1] hover:bg-[#1e4b3e] hover:text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                        title="Next video"
                      >
                        →
                      </button>
                    </div>
                  )}
                </div>

                {/* Responsive Carousel Video Player */}
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-inner">
                  <video
                    key={videoList[activeVideoIndex]?.url}
                    src={videoList[activeVideoIndex]?.url}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                    poster={videoList[activeVideoIndex]?.poster || product.imageUrl}
                  />
                </div>
                {videoList[activeVideoIndex]?.title && (
                  <p className="text-xs font-bold text-[#1e4b3e] flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                    <span>{videoList[activeVideoIndex].title}</span>
                  </p>
                )}
              </div>
            )}

            {/* 3. CUSTOMER REVIEWS SECTION */}
            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 shadow-xs border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bubbly text-xl text-[#1a2e26]">
                    CUSTOMER REVIEWS
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verified feedback from 3D print collectors across India & Japan.
                  </p>
                </div>
                <button
                  onClick={() => setIsWritingReview(!isWritingReview)}
                  className="px-3.5 py-1.5 rounded-full bg-[#e8ece1] hover:bg-[#1e4b3e] hover:text-white text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  {isWritingReview ? 'Cancel' : '+ Write Review'}
                </button>
              </div>

              {/* Add Review Form */}
              {isWritingReview && (
                <form onSubmit={handleAddReview} className="p-4 bg-[#e8ece1]/50 rounded-2xl space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      value={newReviewAuthor}
                      onChange={(e) => setNewReviewAuthor(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl p-2 font-bold"
                    />
                    <input
                      type="text"
                      placeholder="City / State"
                      value={newReviewCity}
                      onChange={(e) => setNewReviewCity(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl p-2 font-bold"
                    />
                  </div>
                  <textarea
                    rows={2}
                    required
                    placeholder="Write your thoughts on print quality, finish, or delivery..."
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-medium"
                  />

                  {/* Device Image Upload */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="review-images-upload"
                      className="flex items-center justify-center gap-2 p-2.5 bg-white border-2 border-dashed border-[#1e4b3e]/30 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors text-[#1e4b3e] font-bold text-[11px]"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>📸 Attach Photos from Device (Select as many as you want)</span>
                    </label>
                    <input
                      id="review-images-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleReviewImagesFromDevice}
                      className="hidden"
                    />
                    {newReviewImages.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {newReviewImages.map((img, idx) => (
                          <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                            <img src={img} alt="review upload" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs tracking-wider cursor-pointer"
                  >
                    SUBMIT VERIFIED REVIEW
                  </button>
                </form>
              )}

              {/* Reviews List */}
              <div className="divide-y divide-slate-100 space-y-3">
                {reviewsList.map((rev) => (
                  <div key={rev.id} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#1a2e26]">
                          {rev.author}
                        </span>
                        {rev.verified && (
                          <span className="flex items-center gap-0.5 text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-bold">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Verified Collector
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {rev.date}
                      </span>
                    </div>

                    <div className="flex text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      "{rev.comment}"
                    </p>

                    {/* Customer review photos */}
                    {rev.images && rev.images.length > 0 && (
                      <div className="flex gap-2 pt-1 flex-wrap">
                        {rev.images.map((rImg, rIdx) => (
                          <a
                            key={rIdx}
                            href={rImg}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:scale-105 transition-transform"
                          >
                            <img src={rImg} alt="Customer photo" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM BUY BAR FOR MOBILE */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-white/95 backdrop-blur-md p-3 border-t border-slate-200 shadow-2xl z-40 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-400 block font-bold leading-none">TOTAL</span>
          <span className="font-bubbly text-xl text-[#1e4b3e] leading-none">
            {formatPrice(currentTotalINR)}
          </span>
        </div>

        <button
          onClick={handleBuy}
          className="flex-1 py-3 rounded-full bg-[#f3b755] text-[#1a2e26] font-bubbly text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-current text-[#1a2e26]" />
          <span>BUY NOW (COD / UPI)</span>
        </button>
      </div>
    </div>
  );
};
