import React, { useState, useEffect } from 'react';
import { TsukuriStorefront } from './components/tsukuri/TsukuriStorefront.tsx';
import { TsukuriAdminPanel } from './components/tsukuri/TsukuriAdminPanel.tsx';
import { ProductDetailPage } from './components/tsukuri/ProductDetailPage.tsx';
import { TsukuriCartDrawer } from './components/tsukuri/TsukuriCartDrawer.tsx';
import { OrderTrackingModal } from './components/tsukuri/OrderTrackingModal.tsx';
import {
  TsukuriProduct,
  INITIAL_TSUKURI_PRODUCTS,
  CartItem,
} from './components/tsukuri/tsukuriData.ts';

export const App: React.FC = () => {
  // Products List State (Managed by Admin CRUD & Cloud Server Sync)
  const [productsList, setProductsList] = useState<TsukuriProduct[]>(() => {
    try {
      const stored = localStorage.getItem('tsukuri_products');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any, idx: number) => {
            if (typeof p.id === 'number' && p.id > 2147483647) {
              return { ...p, id: (p.id % 90000) + 1000 + idx };
            }
            return p;
          });
        }
      }
    } catch {}
    return INITIAL_TSUKURI_PRODUCTS;
  });

  // Sync products to local storage for persistence across reloads
  useEffect(() => {
    try {
      localStorage.setItem('tsukuri_products', JSON.stringify(productsList));
    } catch {}
  }, [productsList]);

  // Load products from server & sync across preview & personal mobile website in real time
  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const res = await fetch('/api/tsukuri-products');
        if (res.ok) {
          const serverProducts = await res.json();
          if (Array.isArray(serverProducts) && serverProducts.length > 0 && isMounted) {
            setProductsList(serverProducts);
            try {
              localStorage.setItem('tsukuri_products', JSON.stringify(serverProducts));
            } catch {}
          }
        }
      } catch (err) {
        console.warn('Could not load products from server, using local cache:', err);
      }
    };

    loadProducts();

    // Periodic sync so mobile website receives changes immediately when published from admin panel
    const syncTimer = setInterval(async () => {
      try {
        const res = await fetch('/api/tsukuri-products');
        if (res.ok) {
          const serverProducts = await res.json();
          if (Array.isArray(serverProducts) && serverProducts.length > 0 && isMounted) {
            setProductsList((prev) => {
              const prevIds = prev.map((p) => p.id).join(',');
              const serverIds = serverProducts.map((p: any) => p.id).join(',');
              if (prevIds !== serverIds || JSON.stringify(prev) !== JSON.stringify(serverProducts)) {
                try {
                  localStorage.setItem('tsukuri_products', JSON.stringify(serverProducts));
                } catch {}
                return serverProducts;
              }
              return prev;
            });
          }
        }
      } catch {}
    }, 3500);

    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        loadProducts();
      }
    };
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      isMounted = false;
      clearInterval(syncTimer);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, []);

  // Determine initial view from URL path or search query
  const getInitialView = (): 'storefront' | 'product' | 'admin' => {
    if (typeof window === 'undefined') return 'storefront';
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();
    if (params.get('view') === 'admin' || path === '/admin' || window.location.hash === '#admin') {
      return 'admin';
    }
    if (path.startsWith('/product/') || params.get('product')) {
      return 'product';
    }
    return 'storefront';
  };

  const [viewMode, setViewMode] = useState<'storefront' | 'product' | 'admin'>(getInitialView);
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

  // Admin CRUD handlers (Persisted to Cloud Server & Synced to Mobile)
  const handleAddProduct = async (newProd: TsukuriProduct) => {
    setProductsList((prev) => {
      const updated = [newProd, ...prev.filter((p) => p.id !== newProd.id)];
      try {
        localStorage.setItem('tsukuri_products', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    try {
      const res = await fetch('/api/tsukuri-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd),
      });
      if (res.ok) {
        const saved = await res.json();
        if (saved && saved.id) {
          setProductsList((prev) =>
            prev.map((p) => (p.sku === newProd.sku || p.id === newProd.id ? { ...p, ...saved } : p))
          );
        }
      }
    } catch (err) {
      console.error('Failed to save product to server:', err);
    }
  };

  const handleUpdateProduct = async (id: number, updatedFields: Partial<TsukuriProduct>) => {
    setProductsList((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p));
      try {
        localStorage.setItem('tsukuri_products', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    try {
      await fetch(`/api/tsukuri-products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
    } catch (err) {
      console.error('Failed to update product on server:', err);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    // Delete immediately (confirmation modal is presented inside TsukuriAdminPanel UI)
    setProductsList((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem('tsukuri_products', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    try {
      await fetch(`/api/tsukuri-products/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete product on server:', err);
    }
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
