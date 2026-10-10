import React, { useState, useEffect } from 'react';
import { TsukuriStorefront } from './components/tsukuri/TsukuriStorefront.tsx';
import { TsukuriAdminPanel } from './components/tsukuri/TsukuriAdminPanel.tsx';
import { ProductDetailPage } from './components/tsukuri/ProductDetailPage.tsx';
import { TsukuriCartDrawer } from './components/tsukuri/TsukuriCartDrawer.tsx';
import { OrderTrackingModal } from './components/tsukuri/OrderTrackingModal.tsx';
import { OrderSuccessPage } from './components/tsukuri/OrderSuccessPage.tsx';
import {
  TsukuriProduct,
  INITIAL_TSUKURI_PRODUCTS,
  CartItem,
} from './components/tsukuri/tsukuriData.ts';
import { TermsOfServicePage } from './components/tsukuri/TermsOfServicePage.tsx';
import { RefundCancellationPolicyPage } from './components/tsukuri/RefundCancellationPolicyPage.tsx';
import {
  saveProductToFirestore,
  deleteProductFromFirestore,
  subscribeToProducts,
  seedProductsIfEmpty,
} from './lib/firebase.ts';

export const App: React.FC = () => {
  // Helper to get permanently deleted product IDs
  const getStoredDeletedIds = (): number[] => {
    try {
      const stored = localStorage.getItem('tsukuri_deleted_product_ids');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.map(Number);
      }
    } catch {}
    return [];
  };

  // Best Seller product ID (Admin configurable)
  const [bestSellerProductId, setBestSellerProductId] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('tsukuri_bestseller_product_id');
      if (stored && !isNaN(Number(stored))) return Number(stored);
    } catch {}
    return 1;
  });

  const handleSelectBestSeller = async (id: number) => {
    setBestSellerProductId(id);
    try {
      localStorage.setItem('tsukuri_bestseller_product_id', String(id));
      await fetch('/api/tsukuri-products/bestseller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id }),
      });
    } catch {}
  };

  // Products List State (Managed by Admin CRUD & Cloud Server Sync)
  const [productsList, setProductsList] = useState<TsukuriProduct[]>(() => {
    const deletedIds = getStoredDeletedIds();
    try {
      const stored = localStorage.getItem('tsukuri_products');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .filter((p: any) => !deletedIds.includes(Number(p.id)))
            .map((p: any, idx: number) => {
              if (typeof p.id === 'number' && p.id > 2147483647) {
                return { ...p, id: (p.id % 90000) + 1000 + idx };
              }
              return p;
            });
        }
      }
    } catch {}
    return INITIAL_TSUKURI_PRODUCTS.filter((p) => !deletedIds.includes(Number(p.id)));
  });

  // Sync products to local storage for persistence across reloads
  useEffect(() => {
    const deletedIds = getStoredDeletedIds();
    const clean = productsList.filter((p) => !deletedIds.includes(Number(p.id)));
    try {
      localStorage.setItem('tsukuri_products', JSON.stringify(clean));
    } catch {}
  }, [productsList]);

  // Load bestseller from server
  useEffect(() => {
    fetch('/api/tsukuri-products/bestseller')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.productId) {
          setBestSellerProductId(Number(data.productId));
          try {
            localStorage.setItem('tsukuri_bestseller_product_id', String(data.productId));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Real-time Cloud Sync with Firebase Firestore (Works on Vercel, mobile & desktop) + Local Express Fallback
  useEffect(() => {
    let isMounted = true;
    const deletedIds = getStoredDeletedIds();

    // 1. Seed initial products if Firestore is empty so Vercel gets all drops immediately
    const seedCandidates = INITIAL_TSUKURI_PRODUCTS.filter((p) => !deletedIds.includes(Number(p.id)));
    seedProductsIfEmpty(seedCandidates).catch(() => {});

    // 2. Real-time Firestore sync (Works across devices, on Vercel, without needing a backend server)
    const unsubscribeFirestore = subscribeToProducts((firestoreProducts) => {
      if (isMounted && Array.isArray(firestoreProducts) && firestoreProducts.length > 0) {
        const currentDeleted = getStoredDeletedIds();
        setProductsList((prevList) => {
          const map = new Map<number, TsukuriProduct>();
          // First add Firestore products that are not marked as deleted
          firestoreProducts.forEach((p) => {
            const id = Number(p.id);
            if (!currentDeleted.includes(id)) {
              map.set(id, p);
            }
          });
          // Preserve any newly added products from local list that aren't deleted
          prevList.forEach((p) => {
            const id = Number(p.id);
            if (!currentDeleted.includes(id)) {
              if (!map.has(id)) {
                map.set(id, p);
                // Also persist to firestore in background
                saveProductToFirestore(p).catch(() => {});
              }
            }
          });
          const merged = Array.from(map.values());
          merged.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
          try {
            localStorage.setItem('tsukuri_products', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    });

    // 3. Fallback to local server API + fetch server-side deleted tombstones
    const loadFromLocalApi = async () => {
      try {
        // Fetch deleted product IDs from server to ensure deletions are in sync across devices & reloads
        const delRes = await fetch('/api/tsukuri-products/deleted-ids');
        if (delRes.ok) {
          const serverDeletedIds = await delRes.json();
          if (Array.isArray(serverDeletedIds) && serverDeletedIds.length > 0) {
            const currentDeleted = getStoredDeletedIds();
            const merged = Array.from(new Set([...currentDeleted, ...serverDeletedIds.map(Number)]));
            try {
              localStorage.setItem('tsukuri_deleted_product_ids', JSON.stringify(merged));
            } catch {}
          }
        }
      } catch {}

      try {
        const res = await fetch('/api/tsukuri-products');
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const serverProducts = await res.json();
            if (Array.isArray(serverProducts) && isMounted) {
              const currentDeleted = getStoredDeletedIds();
              const active = serverProducts.filter((p: any) => !currentDeleted.includes(Number(p.id)));
              if (active.length > 0) {
                setProductsList(active);
                try {
                  localStorage.setItem('tsukuri_products', JSON.stringify(active));
                } catch {}
                return;
              }
            }
          }
        }
      } catch {}

      // Fallback for Vercel static hosting: ONLY if localStorage is empty and user never modified catalog
      try {
        const stored = localStorage.getItem('tsukuri_products');
        const hasDeleted = localStorage.getItem('tsukuri_deleted_product_ids');
        if (!stored && !hasDeleted) {
          const staticRes = await fetch('/data/tsukuri_products.json');
          if (staticRes.ok) {
            const staticProducts = await staticRes.json();
            if (Array.isArray(staticProducts) && staticProducts.length > 0 && isMounted) {
              setProductsList(staticProducts);
              try {
                localStorage.setItem('tsukuri_products', JSON.stringify(staticProducts));
              } catch {}
            }
          }
        }
      } catch {}
    };

    loadFromLocalApi();

    return () => {
      isMounted = false;
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  // Determine initial view from URL path or search query
  const getInitialView = (): 'storefront' | 'product' | 'admin' | 'order-success' | 'terms' | 'refund' => {
    if (typeof window === 'undefined') return 'storefront';
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();
    
    // Check for /order-success page (from Apex Live Gateway or UPI QR redirect)
    if (
      path === '/order-success' ||
      path.startsWith('/order-success') ||
      params.get('checkout') === 'success' ||
      (params.get('order_id') && (params.get('payment_id') || params.get('utr')))
    ) {
      return 'order-success';
    }

    if (
      path === '/terms' ||
      path === '/terms-of-service' ||
      params.get('page') === 'terms' ||
      window.location.hash === '#terms'
    ) {
      return 'terms';
    }

    if (
      path === '/refund' ||
      path === '/refund-policy' ||
      path === '/refund-cancellation-policy' ||
      params.get('page') === 'refund' ||
      window.location.hash === '#refund'
    ) {
      return 'refund';
    }

    if (params.get('view') === 'admin' || path === '/admin' || window.location.hash === '#admin') {
      return 'admin';
    }
    if (path.startsWith('/product/') || params.get('product')) {
      return 'product';
    }
    return 'storefront';
  };

  const [viewMode, setViewMode] = useState<'storefront' | 'product' | 'admin' | 'order-success' | 'terms' | 'refund'>(getInitialView);

  // Listen to popstate for browser navigation
  useEffect(() => {
    const handlePopState = () => {
      setViewMode(getInitialView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [selectedProduct, setSelectedProduct] = useState<TsukuriProduct>(productsList[0]);
  const [liveVisitors, setLiveVisitors] = useState<number>(14);

  // Direct Buy Now state
  const [directBuyItem, setDirectBuyItem] = useState<CartItem | null>(null);
  const [isDirectBuyOpen, setIsDirectBuyOpen] = useState(false);

  // Tracking Modal State
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState('');
  const [trackingPhone, setTrackingPhone] = useState('');

  // Poll live telemetry for visitor count & synchronization
  useEffect(() => {
    const fetchTelemetry = () => {
      fetch('/api/telemetry')
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.activeVisitors === 'number') {
            setLiveVisitors(data.activeVisitors);
          }
        })
        .catch(() => {
          const jitter = Math.floor(Math.sin(Date.now() / 12000) * 3);
          setLiveVisitors((prev) => Math.max(8, 14 + jitter));
        });
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handlers for Views
  const handleOpenAdmin = () => {
    setViewMode('admin');
    window.history.pushState({}, '', '/admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToStore = () => {
    setViewMode('storefront');
    window.history.pushState({}, '', '/');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const handleOpenTerms = () => {
    setViewMode('terms');
    window.history.pushState({}, '', '/terms');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const handleOpenRefund = () => {
    setViewMode('refund');
    window.history.pushState({}, '', '/refund');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const handleSelectProduct = (product: TsukuriProduct) => {
    setSelectedProduct(product);
    setViewMode('product');
    window.history.pushState({}, '', `/product/${product.id}`);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  // Requirement 2 & 4: Buy Now handler on Product Page with Variants & Combos
  const handleBuyNow = (
    product: TsukuriProduct,
    quantity: number,
    selectedColor?: string,
    customPriceINR?: number,
    selectedComboLabel?: string
  ) => {
    setDirectBuyItem({ product, quantity, selectedColor, customPriceINR, selectedComboLabel });
    setIsDirectBuyOpen(true);
  };

  // Admin CRUD handlers (Persisted to Cloud Firestore & Synced to Mobile/Vercel)
  const handleAddProduct = async (newProd: TsukuriProduct) => {
    // 1. Remove from deleted tombstones if it was ever marked deleted
    try {
      const currentDeleted = getStoredDeletedIds().filter((id) => id !== Number(newProd.id));
      localStorage.setItem('tsukuri_deleted_product_ids', JSON.stringify(currentDeleted));
    } catch {}

    // 2. Set product in state immediately so it displays without waiting for network
    setProductsList((prev) => {
      const updated = [newProd, ...prev.filter((p) => Number(p.id) !== Number(newProd.id))];
      try {
        localStorage.setItem('tsukuri_products', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 3. Save to Firestore (Real-time cloud database, works on Vercel & mobile!)
    await saveProductToFirestore(newProd);

    // 4. Also notify local backend if running in fullstack Express
    try {
      await fetch('/api/tsukuri-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd),
      });
    } catch {}
  };

  const handleUpdateProduct = async (id: number, updatedFields: Partial<TsukuriProduct>) => {
    let mergedProd: TsukuriProduct | undefined;
    setProductsList((prev) => {
      const updated = prev.map((p) => {
        if (p.id === id) {
          mergedProd = { ...p, ...updatedFields };
          return mergedProd;
        }
        return p;
      });
      try {
        localStorage.setItem('tsukuri_products', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Save to Firestore (Real-time cloud database, works on Vercel & mobile!)
    if (mergedProd) {
      await saveProductToFirestore(mergedProd);
    } else {
      await saveProductToFirestore({ id, ...updatedFields });
    }

    // Also notify local backend if running in fullstack Express
    try {
      await fetch(`/api/tsukuri-products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
    } catch {}
  };

  const handleDeleteProduct = async (id: number) => {
    const idNum = Number(id);
    // 1. Permanently record as deleted in localStorage tombstone
    try {
      const storedDeleted = localStorage.getItem('tsukuri_deleted_product_ids');
      const delArr: number[] = storedDeleted ? JSON.parse(storedDeleted) : [];
      if (!delArr.includes(idNum)) {
        delArr.push(idNum);
        localStorage.setItem('tsukuri_deleted_product_ids', JSON.stringify(delArr));
      }
    } catch {}

    // 2. Filter state and update products localStorage immediately
    setProductsList((prev) => {
      const updated = prev.filter((p) => Number(p.id) !== idNum);
      try {
        localStorage.setItem('tsukuri_products', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 3. Delete from Firestore (Real-time cloud database, works on Vercel & mobile!)
    await deleteProductFromFirestore(idNum);

    // 4. Also notify local backend if running in fullstack Express
    try {
      await fetch(`/api/tsukuri-products/${idNum}`, { method: 'DELETE' });
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#e8ece1] text-[#1a2e26]">
      {viewMode === 'storefront' && (
        <TsukuriStorefront
          onOpenAdmin={handleOpenAdmin}
          onSelectProduct={handleSelectProduct}
          onBuyNowDirect={(prod) => handleBuyNow(prod, 1)}
          liveVisitorsCount={liveVisitors}
          productsList={productsList}
          bestSellerProductId={bestSellerProductId}
          onOpenTerms={handleOpenTerms}
          onOpenRefund={handleOpenRefund}
        />
      )}

      {viewMode === 'terms' && (
        <TermsOfServicePage
          onBackToStore={handleBackToStore}
          onOpenRefundPolicy={handleOpenRefund}
        />
      )}

      {viewMode === 'refund' && (
        <RefundCancellationPolicyPage
          onBackToStore={handleBackToStore}
          onOpenTermsOfService={handleOpenTerms}
        />
      )}

      {viewMode === 'product' && selectedProduct && (
        <ProductDetailPage
          product={selectedProduct}
          onBack={handleBackToStore}
          onAddToCart={(prod, qty) => {
            // Trigger toast or update
          }}
          onBuyNow={handleBuyNow}
        />
      )}

      {viewMode === 'admin' && (
        <TsukuriAdminPanel
          onBackToStore={handleBackToStore}
          liveVisitors={liveVisitors}
          productsList={productsList}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          bestSellerProductId={bestSellerProductId}
          onSelectBestSeller={handleSelectBestSeller}
        />
      )}

      {viewMode === 'order-success' && (
        <OrderSuccessPage
          onBackToStore={handleBackToStore}
          onOpenTracking={(ordNum, ph) => {
            if (ordNum) setTrackingOrderNumber(ordNum);
            if (ph) setTrackingPhone(ph);
            setIsTrackingModalOpen(true);
          }}
        />
      )}

      {/* Direct Buy Now Checkout Drawer */}
      {isDirectBuyOpen && directBuyItem && (
        <TsukuriCartDrawer
          isOpen={isDirectBuyOpen}
          onClose={() => {
            setIsDirectBuyOpen(false);
            setDirectBuyItem(null);
          }}
          cart={[]}
          directBuyItem={directBuyItem}
          onUpdateQuantity={() => {}}
          onRemoveItem={() => {}}
          onClearCart={() => {}}
          onOrderSuccess={() => {
            setTimeout(() => {
              setIsDirectBuyOpen(false);
              setDirectBuyItem(null);
            }, 3000);
          }}
          onOpenTracking={(ordNum, ph) => {
            if (ordNum) setTrackingOrderNumber(ordNum);
            if (ph) setTrackingPhone(ph);
            setIsTrackingModalOpen(true);
          }}
          onOpenTerms={handleOpenTerms}
          onOpenRefund={handleOpenRefund}
        />
      )}

      {/* Customer Tracking Modal (Requirement 15) */}
      <OrderTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        initialOrderNumber={trackingOrderNumber}
        initialPhone={trackingPhone}
      />
    </div>
  );
};

export default App;
