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
  Volume2,
  VolumeX,
  Pause,
} from 'lucide-react';
import {
  TsukuriProduct,
  formatPrice,
  ProductReview,
  ComboTierOffer,
  formatMediaUrl,
} from './tsukuriData.ts';

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

  // Requirement 4: Multi-media state (Images + Product's Own Video positioned by Admin)
  interface MediaItem {
    type: 'image' | 'video';
    url: string;
  }

  const rawImages = (product.images && product.images.length > 0 ? product.images : [product.imageUrl])
    .map(formatMediaUrl);
  const cleanProductVideo = formatMediaUrl(product.videoUrl);

  const combinedMediaList: MediaItem[] = React.useMemo(() => {
    const list: MediaItem[] = rawImages.map((u) => ({ type: 'image', url: u }));
    if (!cleanProductVideo) return list;

    const vidItem: MediaItem = { type: 'video', url: cleanProductVideo };
    const pos = product.videoPosition || 'end';

    if (pos === 'first') {
      return [vidItem, ...list];
    } else if (pos === 'after_1st' && list.length >= 1) {
      return [list[0], vidItem, ...list.slice(1)];
    } else if (pos === 'after_2nd' && list.length >= 2) {
      return [list[0], list[1], vidItem, ...list.slice(2)];
    }
    // Default 'end': scrollable after images end!
    return [...list, vidItem];
  }, [rawImages, cleanProductVideo, product.videoPosition]);

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Requirement 5: Studio Offer Badge stuck on image disappears after 6 seconds
  const [showImageBadge, setShowImageBadge] = useState(true);
  useEffect(() => {
    setShowImageBadge(true);
    const timer = setTimeout(() => {
      setShowImageBadge(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [product?.id]);

  // Mobile finger sliding / swipe gestures for product images & video
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [touchOffset, setTouchOffset] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleNextMedia = () => {
    setActiveMediaIndex((prev) => (prev + 1) % combinedMediaList.length);
  };

  const handlePrevMedia = () => {
    setActiveMediaIndex((prev) => (prev - 1 + combinedMediaList.length) % combinedMediaList.length);
  };

  const onTouchStartMedia = (e: React.TouchEvent) => {
    if (combinedMediaList.length <= 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(true);
    setTouchOffset(0);
  };

  const onTouchMoveMedia = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = e.touches[0].clientY - touchStartY.current;
    // Only track if horizontal swipe motion is greater than vertical scroll
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setTouchOffset(diffX);
    }
  };

  const onTouchEndMedia = () => {
    if (touchStartX.current !== null && combinedMediaList.length > 1) {
      if (touchOffset < -35) {
        // Swiped left with finger -> next media
        handleNextMedia();
      } else if (touchOffset > 35) {
        // Swiped right with finger -> previous media
        handlePrevMedia();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    setTouchOffset(0);
    setIsSwiping(false);
  };

  // Requirement 3: 9:16 Modern Minimalist Video Carousel (Auto-advancing on video end & finger scrollable)
  const carouselVideos = (
    product.carouselVideos && product.carouselVideos.length > 0
      ? product.carouselVideos
      : product.videoUrl
      ? [{ id: 'vid-default', url: product.videoUrl, title: `${product.name} 3D Print Quality & Slicing Timelapse` }]
      : []
  ).map((v) => ({ ...v, url: formatMediaUrl(v.url) }));

  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [isCarouselMuted, setIsCarouselMuted] = useState(false);
  const [ownVideoMuted, setOwnVideoMuted] = useState(true);
  const [carouselPlayingIndex, setCarouselPlayingIndex] = useState<number | null>(0);
  const carouselScrollRef = useRef<HTMLDivElement | null>(null);
  const carouselSectionRef = useRef<HTMLDivElement | null>(null);
  const carouselVideoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const ownVideoRef = useRef<HTMLVideoElement | null>(null);

  // Helper to play a carousel video with audio (falls back to muted if blocked by browser policy)
  const playReelWithAudio = (v: HTMLVideoElement) => {
    v.muted = isCarouselMuted;
    const playPromise = v.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy: if audio blocked by browser without interaction, start muted immediately
        v.muted = true;
        v.play().catch(() => {});
      });
    }
  };

  // Requirement 5: Autoplay product's own video automatically whenever active in gallery
  useEffect(() => {
    if (combinedMediaList[activeMediaIndex]?.type === 'video') {
      const vid = ownVideoRef.current;
      if (vid) {
        vid.currentTime = 0;
        vid.muted = ownVideoMuted;
        vid.play().catch(() => {});
      }
    }
  }, [activeMediaIndex, combinedMediaList, ownVideoMuted]);

  // Requirement 6: IntersectionObserver - Stop all studio reels when user scrolls above or below section; resume active reel when back in view
  useEffect(() => {
    const el = carouselSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            // User scrolled above or below: immediately stop all reels until they return
            Object.values(carouselVideoRefs.current).forEach((v) => {
              if (v && !v.paused) v.pause();
            });
            setCarouselPlayingIndex(null);
          } else {
            // User returned to studio reels section: resume active reel automatically
            setCarouselPlayingIndex(activeCarouselIndex);
            const activeVid = carouselVideoRefs.current[activeCarouselIndex];
            if (activeVid) {
              playReelWithAudio(activeVid);
            }
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeCarouselIndex, isCarouselMuted]);

  // Smoothly switch to video: stops previous video completely and autoplays new video with sound
  const switchCarouselVideo = (newIdx: number) => {
    setActiveCarouselIndex(newIdx);
    setCarouselPlayingIndex(newIdx);

    // Stop all other videos in carousel immediately
    Object.keys(carouselVideoRefs.current).forEach((k) => {
      const idx = Number(k);
      const v = carouselVideoRefs.current[idx];
      if (v) {
        if (idx === newIdx) {
          v.currentTime = 0;
          playReelWithAudio(v);
        } else {
          v.pause();
        }
      }
    });

    if (carouselScrollRef.current) {
      const container = carouselScrollRef.current;
      const targetCard = container.children[newIdx] as HTMLElement;
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  // Detect which reel is centered when user swipes horizontally with finger
  const handleCarouselScroll = () => {
    if (!carouselScrollRef.current) return;
    const container = carouselScrollRef.current;
    const scrollLeft = container.scrollLeft;
    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) return;
    let closestIdx = 0;
    let minDiff = Infinity;
    const containerCenter = scrollLeft + container.clientWidth / 2;

    children.forEach((child, idx) => {
      const childCenter = child.offsetLeft + child.clientWidth / 2;
      const diff = Math.abs(containerCenter - childCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    if (closestIdx !== activeCarouselIndex) {
      setActiveCarouselIndex(closestIdx);
      setCarouselPlayingIndex(closestIdx);
      Object.keys(carouselVideoRefs.current).forEach((k) => {
        const idx = Number(k);
        const v = carouselVideoRefs.current[idx];
        if (v) {
          if (idx === closestIdx) {
            playReelWithAudio(v);
          } else {
            v.pause();
          }
        }
      });
    }
  };

  // Auto slide & play next video when current finished
  const handleCarouselVideoEnded = (finishedIdx: number) => {
    if (carouselVideos.length <= 1) return;
    const nextIdx = (finishedIdx + 1) % carouselVideos.length;
    switchCarouselVideo(nextIdx);
  };

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
              {/* Large Main Media Frame with Finger Sliding Touch Gestures (Requirement 4) */}
              <div
                onTouchStart={onTouchStartMedia}
                onTouchMove={onTouchMoveMedia}
                onTouchEnd={onTouchEndMedia}
                onTouchCancel={onTouchEndMedia}
                className="relative w-full aspect-square sm:aspect-4/3 rounded-2xl sm:rounded-3xl overflow-hidden bg-[#e8ece1]/40 touch-pan-y cursor-grab active:cursor-grabbing"
              >
                {combinedMediaList[activeMediaIndex]?.type === 'video' ? (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <video
                      ref={(el) => {
                        ownVideoRef.current = el;
                        if (el) el.play().catch(() => {});
                      }}
                      key={combinedMediaList[activeMediaIndex].url}
                      src={combinedMediaList[activeMediaIndex].url}
                      controls
                      autoPlay
                      muted={ownVideoMuted}
                      loop
                      playsInline
                      className="w-full h-full object-contain"
                    />
                    {/* Unmute/Mute Toggle on Product Own Video */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextMuted = !ownVideoMuted;
                        setOwnVideoMuted(nextMuted);
                        if (ownVideoRef.current) {
                          ownVideoRef.current.muted = nextMuted;
                        }
                      }}
                      className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                      title={ownVideoMuted ? 'Turn Sound On' : 'Mute Video'}
                    >
                      {ownVideoMuted ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[10px]">Unmute Video</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px]">Sound On</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div
                    className="w-full h-full transition-transform duration-200 ease-out"
                    style={{
                      transform: isSwiping && touchOffset !== 0 ? `translateX(${touchOffset * 0.45}px)` : undefined,
                    }}
                  >
                    <img
                      src={combinedMediaList[activeMediaIndex]?.url || formatMediaUrl(product.imageUrl)}
                      alt={product.name}
                      draggable={false}
                      className="w-full h-full object-cover transition-opacity duration-300 pointer-events-none"
                    />
                  </div>
                )}

                {/* Badge Overlay (Requirement 5: Disappears after 6 seconds) */}
                {(product.customOfferBadge || product.badge) && showImageBadge && (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs tracking-wider shadow-md pointer-events-none transition-all duration-700 ease-out">
                    {product.customOfferBadge || product.badge}
                  </div>
                )}

                {/* Left / Right Chevron Buttons for Finger Tapping / Sliding */}
                {combinedMediaList.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous Media"
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
                      aria-label="Next Media"
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
                      {combinedMediaList.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActiveMediaIndex(i)}
                          className={`h-1.5 rounded-full transition-all ${
                            activeMediaIndex === i ? 'w-5 bg-[#f3b755]' : 'w-1.5 bg-white/60'
                          }`}
                        />
                      ))}
                      <span className="text-[10px] font-mono ml-1 font-bold">
                        {activeMediaIndex + 1}/{combinedMediaList.length}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails row (Requirement 4: Images & Product Video in configured position) */}
              <div className="flex items-center gap-2.5 mt-3 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
                {combinedMediaList.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden border-2 shrink-0 transition-all relative ${
                      activeMediaIndex === idx
                        ? 'border-[#1e4b3e] ring-2 ring-[#1e4b3e] scale-105'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full bg-[#1e4b3e] flex flex-col items-center justify-center text-[#f3b755]">
                        <Play className="w-4 h-4 fill-current" />
                        <span className="text-[8px] font-bold mt-0.5 text-white">Video</span>
                      </div>
                    ) : (
                      <img src={item.url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                    )}
                    {item.type === 'video' && (
                      <span className="absolute bottom-1 right-1 bg-black/70 text-[#f3b755] rounded-full p-0.5">
                        <Film className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                ))}
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
                REQUIREMENT 5: OFFICIAL STUDIO OFFER DISPLAY BELOW PRODUCT
                Solid, bold, crisp, high-contrast banner with dynamic admin text.
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
                      <span>
                        {product.officialOfferText || product.customOfferBadge || '₹10 OFF ON ONLINE PAYMENT & UPI'}
                      </span>
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
                  <span>BUY NOW / ORDER PRINT</span>
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
                REQUIREMENT 3: 9:16 RATIO MODERN MINIMAL CAROUSEL VIDEOS
                Scrollable towards right side with fingers, smooth slide transition,
                and automatic next slide & play when video ends.
                ========================================================= */}
            {carouselVideos.length > 0 && (
              <div
                ref={carouselSectionRef}
                className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 shadow-xs border border-slate-100 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-[#ea8f5a]" />
                      <h3 className="font-bubbly text-lg sm:text-xl text-[#1a2e26]">
                        STUDIO REELS & CRAFT VIDEOS
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newMuted = !isCarouselMuted;
                        setIsCarouselMuted(newMuted);
                        // Apply mute setting to currently active video
                        const activeVid = carouselVideoRefs.current[activeCarouselIndex];
                        if (activeVid) {
                          activeVid.muted = newMuted;
                        }
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#e8ece1] hover:bg-[#1e4b3e] hover:text-white text-slate-700 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5"
                      title={isCarouselMuted ? 'Turn Sound On' : 'Mute Sound'}
                    >
                      {isCarouselMuted ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Unmute</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[10px] text-emerald-700 font-bold">Audio On</span>
                        </>
                      )}
                    </button>
                    {carouselVideos.length > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const prevIdx = activeCarouselIndex === 0 ? carouselVideos.length - 1 : activeCarouselIndex - 1;
                            switchCarouselVideo(prevIdx);
                          }}
                          className="w-7 h-7 rounded-full bg-[#e8ece1] hover:bg-[#1e4b3e] hover:text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                          title="Previous video"
                        >
                          ←
                        </button>
                        <span className="text-[10px] font-bold text-slate-500 font-mono">
                          {activeCarouselIndex + 1}/{carouselVideos.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const nextIdx = (activeCarouselIndex + 1) % carouselVideos.length;
                            switchCarouselVideo(nextIdx);
                          }}
                          className="w-7 h-7 rounded-full bg-[#e8ece1] hover:bg-[#1e4b3e] hover:text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                          title="Next video"
                        >
                          →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Horizontal Scrollable 9:16 Minimal Modern Frame Carousel with touch-pan-y for fluid vertical scrolling */}
                <div
                  ref={carouselScrollRef}
                  onScroll={handleCarouselScroll}
                  className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 pt-1 px-1 no-scrollbar touch-pan-y [touch-action:pan-x_pan-y]"
                >
                  {carouselVideos.map((vid, idx) => {
                    const isActive = activeCarouselIndex === idx;
                    const isCurrentlyPlaying = carouselPlayingIndex === idx;

                    return (
                      <div
                        key={vid.id || idx}
                        onClick={() => {
                          if (activeCarouselIndex !== idx) {
                            switchCarouselVideo(idx);
                          } else {
                            const el = carouselVideoRefs.current[idx];
                            if (el) {
                              if (el.paused) {
                                playReelWithAudio(el);
                                setCarouselPlayingIndex(idx);
                              } else {
                                el.pause();
                                setCarouselPlayingIndex(null);
                              }
                            }
                          }
                        }}
                        className={`relative shrink-0 snap-center w-[220px] sm:w-[260px] aspect-[9/16] rounded-[2rem] sm:rounded-[2.4rem] overflow-hidden bg-black shadow-md border-4 transition-all duration-300 cursor-pointer touch-pan-y [touch-action:pan-x_pan-y] select-none ${
                          isActive
                            ? 'border-[#1e4b3e] ring-4 ring-[#f3b755]/50 scale-[1.02]'
                            : 'border-slate-800 opacity-80 hover:opacity-100 hover:scale-[1.01]'
                        }`}
                      >
                        {/* Smartphone minimal speaker notch */}
                        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 w-12 h-1 bg-white/30 rounded-full pointer-events-none" />

                        {/* Top Badge: Index indicator & Title */}
                        <div className="absolute top-4 left-3 right-3 z-20 flex items-center justify-between text-white pointer-events-none">
                          <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono font-bold text-[#f3b755]">
                            {idx + 1}/{carouselVideos.length}
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-[#1e4b3e]/90 backdrop-blur-md text-[9px] font-bold tracking-wide uppercase text-white animate-pulse flex items-center gap-1">
                              {!isCarouselMuted ? <Volume2 className="w-2.5 h-2.5 text-[#f3b755]" /> : null}
                              <span>Now Playing</span>
                            </span>
                          )}
                        </div>

                        {/* Video Element - pointer-events-none ensures fingers pass vertical scrolling to page */}
                        <video
                          ref={(el) => {
                            carouselVideoRefs.current[idx] = el;
                          }}
                          src={vid.url}
                          playsInline
                          muted={isCarouselMuted}
                          autoPlay={idx === 0}
                          onEnded={() => handleCarouselVideoEnded(idx)}
                          className="w-full h-full object-cover pointer-events-none"
                          poster={vid.poster || formatMediaUrl(product.imageUrl)}
                        />

                        {/* Play/Pause Overlay indicator when tapped */}
                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                          {!isCurrentlyPlaying && (
                            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md text-[#f3b755] flex items-center justify-center shadow-lg">
                              <Play className="w-6 h-6 fill-current ml-0.5" />
                            </div>
                          )}
                        </div>

                        {/* Bottom Title Bar & Minimal Timeline Frame without distracting swipe text */}
                        <div className="absolute bottom-0 inset-x-0 z-20 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white pointer-events-none">
                          <p className="text-xs font-bold line-clamp-2 text-slate-100">
                            {vid.title || `${product.name} 3D Print Video ${idx + 1}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
