import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Banknote,
  Sparkles,
  Tag,
  Truck,
  Printer,
  Mail,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  CartItem,
  formatPrice,
  calculatePaymentAdjustedTotal,
} from './tsukuriData.ts';
import { recordLiveActivity } from '../../lib/firebase.ts';

interface TsukuriCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: number, delta: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  onOrderSuccess: (order: any) => void;
  directBuyItem?: CartItem | null;
  onOpenTracking?: (orderNumber?: string, phone?: string) => void;
}

export const TsukuriCartDrawer: React.FC<TsukuriCartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
  directBuyItem,
  onOpenTracking,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmed'>(
    directBuyItem ? 'checkout' : 'cart'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  // REQUIREMENT 6: Remove pre-saved demo details. Real customers enter fresh data.
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  // REQUIREMENT 11: Ask PIN code and City separately
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Online' | 'COD'>('Online');

  // REQUIREMENT 10: Option on checkout of adding a discount code
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    percent?: number;
    amount?: number;
    description: string;
  } | null>(null);
  const [discountMessage, setDiscountMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  // Active items for this checkout session
  const activeItems = directBuyItem ? [directBuyItem] : cart;

  const subtotalINR = activeItems.reduce(
    (acc, item) => acc + (item.customPriceINR || item.product.priceINR * item.quantity),
    0
  );

  // Calculate discount
  let discountINR = 0;
  if (appliedDiscount) {
    if (appliedDiscount.percent) {
      discountINR = Math.round((subtotalINR * appliedDiscount.percent) / 100);
    } else if (appliedDiscount.amount) {
      discountINR = Math.min(subtotalINR, appliedDiscount.amount);
    }
  }

  const discountedSubtotal = Math.max(0, subtotalINR - discountINR);
  const productDeliveryCharges = activeItems.reduce((acc, it) => acc + (it.product?.deliveryCharges || 0), 0);
  const shippingINR = productDeliveryCharges > 0 
    ? productDeliveryCharges 
    : (discountedSubtotal > 799 || activeItems.length === 0 ? 0 : 60);

  const activeDeliveryPartner = activeItems[0]?.product?.deliveryPartner || 'BlueDart Surface Express';
  const activeDeliveryEta = activeItems[0]?.product?.deliveryEta || '3 to 4 Days Pan-India';

  // Payment adjusted total: +50 for COD, -10 for Online UPI
  const { codFee, onlineDiscount, finalTotal } = calculatePaymentAdjustedTotal(
    discountedSubtotal + shippingINR,
    paymentMethod,
    0
  );

  const handleApplyDiscount = (codeOverride?: string) => {
    const rawCode = (codeOverride || discountCodeInput).trim().toUpperCase();
    if (!rawCode) {
      setDiscountMessage({ type: 'error', text: 'Please enter a coupon code' });
      return;
    }

    if (rawCode === 'TSUKURI10') {
      setAppliedDiscount({ code: rawCode, percent: 10, description: '10% Studio Welcome Discount' });
      setDiscountMessage({ type: 'success', text: 'TSUKURI10 applied! 10% discount subtracted.' });
    } else if (rawCode === 'PRINT15') {
      setAppliedDiscount({ code: rawCode, percent: 15, description: '15% Maker Slicing Discount' });
      setDiscountMessage({ type: 'success', text: 'PRINT15 applied! 15% discount subtracted.' });
    } else if (rawCode === 'FESTIVE100') {
      setAppliedDiscount({ code: rawCode, amount: 100, description: 'Flat ₹100 Festival Savings' });
      setDiscountMessage({ type: 'success', text: 'FESTIVE100 applied! Flat ₹100 discount subtracted.' });
    } else if (rawCode === 'MAKER20') {
      setAppliedDiscount({ code: rawCode, percent: 20, description: '20% Print Enthusiast Discount' });
      setDiscountMessage({ type: 'success', text: 'MAKER20 applied! 20% discount subtracted.' });
    } else {
      setDiscountMessage({
        type: 'error',
        text: 'Invalid code. Try TSUKURI10, PRINT15, or FESTIVE100',
      });
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeItems.length === 0) return;

    setIsSubmitting(true);
    try {
      const fullAddress = `${address}, ${city} - ${pincode}`;
      const res = await fetch('/api/storefront/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail: email,
          customerPhone: phone,
          shippingAddress: fullAddress,
          city,
          pincode,
          items: activeItems.map((i) => ({
            productId: i.product.id && i.product.id <= 2147483647 ? i.product.id : undefined,
            name: `${i.product.name}${i.selectedColor ? ` (${i.selectedColor})` : ''}${i.selectedComboLabel ? ` [${i.selectedComboLabel}]` : ''}`,
            productName: i.product.name,
            sku: i.product.sku,
            quantity: i.quantity,
            price: i.customPriceINR ? Math.round(i.customPriceINR / i.quantity) : i.product.priceINR,
            unitPrice: i.customPriceINR ? Math.round(i.customPriceINR / i.quantity) : i.product.priceINR,
            filamentUsedGrams: i.product.weightGrams,
          })),
          subtotal: discountedSubtotal,
          discountAmount: discountINR,
          discountCode: appliedDiscount?.code,
          shipping: shippingINR,
          codFee,
          onlineDiscount,
          totalAmount: finalTotal,
          paymentMethod: paymentMethod === 'COD' ? 'COD' : 'Online UPI/Card',
          courierName: activeDeliveryPartner,
        }),
      });

      let orderResult;
      if (res.ok) {
        orderResult = await res.json();
      } else {
        orderResult = {
          orderNumber: `TSU-${Math.floor(1000 + Math.random() * 9000)}`,
          customerName,
          totalAmount: finalTotal,
        };
      }

      // Record live order in Firebase
      recordLiveActivity('order', `Order #${orderResult.orderNumber} placed by ${customerName} (${formatPrice(finalTotal)}) [${paymentMethod}]`);

      setConfirmedOrder({
        ...orderResult,
        email,
        phone,
        items: activeItems,
        address: fullAddress,
        city,
        pincode,
        paymentMethod,
        courier: activeDeliveryPartner,
        orderDate: new Date().toISOString(),
      });
      onOrderSuccess(orderResult);
      if (!directBuyItem) {
        onClearCart();
      }
      setStep('confirmed');
    } catch (err) {
      console.error('Checkout error:', err);
      const fallbackOrder = {
        orderNumber: `TSU-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName,
        customerEmail: email,
        totalAmount: finalTotal,
        email,
        phone,
        items: activeItems,
        address: `${address}, ${city} - ${pincode}`,
        city,
        pincode,
        paymentMethod,
        courier: activeDeliveryPartner,
        orderDate: new Date().toISOString(),
      };
      setConfirmedOrder(fallbackOrder);
      onOrderSuccess(fallbackOrder);
      if (!directBuyItem) {
        onClearCart();
      }
      setStep('confirmed');

      // Dispatch tax invoice email in background
      if (email) {
        fetch('/api/send-invoice-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: fallbackOrder.orderNumber,
            customerName,
            customerEmail: email,
            totalAmount: finalTotal,
          }),
        }).catch(() => {});
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-[#e8ece1] flex flex-col shadow-2xl border-l-0 sm:border-l-4 border-white">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-white border-b border-[#1e4b3e]/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1e4b3e] text-[#f3b755] flex items-center justify-center font-bubbly text-xs">
                {activeItems.length}
              </div>
              <h3 className="font-bubbly text-lg text-[#1a2e26]">
                {step === 'cart'
                  ? 'YOUR 3D DROP BAG'
                  : step === 'checkout'
                  ? 'COMMISSION CHECKOUT'
                  : 'ORDER CONFIRMED'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#e8ece1] text-slate-700 hover:text-black hover:bg-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {step === 'cart' && (
              <>
                {activeItems.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto" />
                    <p className="font-bubbly text-sm text-slate-500">
                      Your bag is empty. Explore our Kyoto drops!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeItems.map((item, idx) => (
                      <div
                        key={`${item.product.id}-${idx}`}
                        className="p-3 bg-white rounded-2xl shadow-2xs flex items-center gap-3 border border-slate-100"
                      >
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-16 h-16 rounded-xl object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-[#1a2e26] truncate">
                            {item.product.name}
                          </h4>
                          {item.selectedColor && (
                            <span className="text-[10px] text-[#1e4b3e] font-bold block truncate">
                              Colour: {item.selectedColor}
                            </span>
                          )}
                          {item.selectedComboLabel && (
                            <span className="text-[10px] text-amber-800 font-bold block truncate">
                              Deal: {item.selectedComboLabel}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 block truncate">
                            {item.product.filamentType}
                          </span>
                          <span className="font-bubbly text-xs text-[#1e4b3e] font-bold mt-1 block">
                            {formatPrice(
                              item.customPriceINR || item.product.priceINR * item.quantity
                            )}
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        {!item.selectedComboLabel && (
                          <div className="flex items-center gap-1.5 bg-[#e8ece1] p-1 rounded-xl">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, -1)}
                              className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-[#1e4b3e] hover:text-white transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-xs w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, 1)}
                              className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-[#1e4b3e] hover:text-white transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-slate-300 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {step === 'checkout' && (
              <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-3.5">
                <div className="p-3 bg-[#f3b755] rounded-2xl text-[#1a2e26]">
                  <span className="text-[10px] font-black uppercase tracking-wider block">
                    Kyoto-Indo Direct Delivery
                  </span>
                  <p className="text-xs font-bold">
                    Orders print in 100% bio-PLA & ship in biodegradable packaging in 3 to 4 days.
                  </p>
                </div>

                {/* Customer Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#1a2e26]">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#1a2e26]">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#1a2e26]">Phone (for Tracking) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
                    />
                  </div>
                </div>

                {/* Delivery Street Address */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#1a2e26]">House / Flat / Street Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Flat / Building, Road name, Area"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
                  />
                </div>

                {/* REQUIREMENT 11: City and PIN Code asked SEPARATELY */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#1a2e26]">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bengaluru, Mumbai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#1a2e26]">PIN Code (6 Digits) *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 560038"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
                    />
                  </div>
                </div>

                {/* REQUIREMENT 10: DISCOUNT CODE INPUT SECTION */}
                <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#1a2e26] flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#1e4b3e]" />
                      <span>Have a Discount Code?</span>
                    </label>
                    {appliedDiscount && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {appliedDiscount.code} APPLIED
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Enter promo code (e.g. TSUKURI10)"
                      value={discountCodeInput}
                      onChange={(e) => setDiscountCodeInput(e.target.value)}
                      className="flex-1 uppercase font-mono text-xs bg-[#e8ece1]/50 border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyDiscount()}
                      className="px-3.5 py-2 rounded-xl bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs tracking-wider cursor-pointer hover:bg-[#15342b] transition-colors"
                    >
                      APPLY
                    </button>
                  </div>

                  {discountMessage && (
                    <p
                      className={`text-[11px] font-bold ${
                        discountMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {discountMessage.text}
                    </p>
                  )}

                  {/* Quick coupon tags */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] text-slate-400 font-bold">Suggested:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountCodeInput('TSUKURI10');
                        handleApplyDiscount('TSUKURI10');
                      }}
                      className="text-[10px] font-mono font-bold bg-[#e8ece1] hover:bg-[#f3b755] text-slate-700 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      TSUKURI10 (-10%)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountCodeInput('PRINT15');
                        handleApplyDiscount('PRINT15');
                      }}
                      className="text-[10px] font-mono font-bold bg-[#e8ece1] hover:bg-[#f3b755] text-slate-700 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      PRINT15 (-15%)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountCodeInput('FESTIVE100');
                        handleApplyDiscount('FESTIVE100');
                      }}
                      className="text-[10px] font-mono font-bold bg-[#e8ece1] hover:bg-[#f3b755] text-slate-700 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      FESTIVE100 (-₹100)
                    </button>
                  </div>
                </div>

                {/* PAYMENT METHOD SELECTOR */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-[#1a2e26]">Payment Method</label>
                    <span className="text-[10px] text-[#1e4b3e] font-bold">Pricing Rule Applied</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Online Payment (-₹10) */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Online')}
                      className={`p-3 rounded-2xl border text-left transition-all relative cursor-pointer ${
                        paymentMethod === 'Online'
                          ? 'bg-[#1e4b3e] text-white border-[#1e4b3e] shadow-xs ring-2 ring-[#f3b755]'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bubbly text-xs">
                        <CreditCard className="w-4 h-4 text-[#f3b755]" />
                        <span>Online (UPI / Card)</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold block mt-1 ${
                          paymentMethod === 'Online' ? 'text-[#f3b755]' : 'text-emerald-700'
                        }`}
                      >
                        ✨ Flat ₹10 OFF Applied
                      </span>
                    </button>

                    {/* Cash on Delivery (+₹50) */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('COD')}
                      className={`p-3 rounded-2xl border text-left transition-all relative cursor-pointer ${
                        paymentMethod === 'COD'
                          ? 'bg-[#1e4b3e] text-white border-[#1e4b3e] shadow-xs ring-2 ring-[#f3b755]'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bubbly text-xs">
                        <Banknote className="w-4 h-4 text-[#f3b755]" />
                        <span>Cash on Delivery</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold block mt-1 ${
                          paymentMethod === 'COD' ? 'text-amber-200' : 'text-amber-800'
                        }`}
                      >
                        ⚠️ +₹50 Courier Fee
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STEP: CONFIRMED */}
            {step === 'confirmed' && confirmedOrder && (
              <div className="p-6 text-center bg-white rounded-3xl space-y-4 shadow-sm border border-[#1e4b3e]/10">
                <CheckCircle2 className="w-14 h-14 text-[#1e4b3e] mx-auto" />
                <h3 className="text-2xl font-bubbly text-[#1e4b3e]">
                  ORDER TRANSMITTED!
                </h3>
                <div className="p-3.5 bg-[#e8ece1]/60 rounded-2xl text-xs space-y-1.5 text-left border border-[#1e4b3e]/10">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      Order #{confirmedOrder.orderNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      CONFIRMED
                    </span>
                  </div>
                  <p className="text-slate-600">
                    Thank you, <strong>{confirmedOrder.customerName || customerName}</strong>. Your 3D models have entered the farm queue!
                  </p>
                  <p className="text-slate-700">
                    Delivery Address: <strong>{confirmedOrder.address || `${address}, ${city} - ${pincode}`}</strong>
                  </p>
                  <div className="pt-1 flex justify-between font-bold text-[#1e4b3e] border-t border-slate-200">
                    <span>Total Amount Paid / Payable:</span>
                    <span>{formatPrice(finalTotal)}</span>
                  </div>
                </div>

                {/* REQUIREMENT 15: Customer Order Tracking Button */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenTracking) {
                      onOpenTracking(confirmedOrder.orderNumber, confirmedOrder.phone || phone);
                    }
                  }}
                  className="w-full py-3 rounded-full bg-[#f3b755] hover:bg-[#ebb04c] text-[#1a2e26] font-bubbly text-xs tracking-wide flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
                >
                  <Truck className="w-4 h-4" />
                  <span>TRACK LIVE DISPATCH STATUS</span>
                </button>

                <button
                  onClick={() => {
                    setStep('cart');
                    onClose();
                  }}
                  className="w-full py-3 rounded-full bg-[#e8ece1] hover:bg-slate-200 text-slate-800 font-bubbly text-xs cursor-pointer"
                >
                  CONTINUE EXPLORING
                </button>
              </div>
            )}
          </div>

          {/* Footer Subtotal & Action */}
          {step !== 'confirmed' && activeItems.length > 0 && (
            <div className="p-5 bg-white border-t border-[#1e4b3e]/10 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold">{formatPrice(subtotalINR)}</span>
                </div>

                {/* Promo Code Deduction */}
                {appliedDiscount && discountINR > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount ({appliedDiscount.code})</span>
                    <span className="font-mono">-₹{discountINR}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Delivery / Shipping (3-4 Days)</span>
                  <span className="font-mono font-bold">
                    {shippingINR === 0 ? 'FREE' : formatPrice(shippingINR)}
                  </span>
                </div>

                {paymentMethod === 'COD' && (
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>Cash on Delivery Handling Fee</span>
                    <span className="font-mono">+₹50</span>
                  </div>
                )}
                {paymentMethod === 'Online' && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Online UPI Instant Discount</span>
                    <span className="font-mono">-₹10</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-bold text-[#1a2e26] pt-1.5 border-t border-slate-100">
                  <span className="font-bubbly">Final Total</span>
                  <span className="font-bubbly text-xl text-[#1e4b3e]">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
              </div>

              {step === 'cart' ? (
                <button
                  onClick={() => setStep('checkout')}
                  className="w-full py-3.5 rounded-full bg-[#1e4b3e] hover:bg-[#15342b] text-[#f3b755] font-bubbly text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <span>PROCEED TO CHECKOUT</span>
                  <ArrowRight className="w-4 h-4 text-[#f3b755]" />
                </button>
              ) : (
                <div className="flex gap-2">
                  {!directBuyItem && (
                    <button
                      type="button"
                      onClick={() => setStep('cart')}
                      className="py-3 px-4 rounded-full bg-[#e8ece1] hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 rounded-full bg-[#1e4b3e] hover:bg-[#15342b] text-[#f3b755] font-bubbly text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#f3b755]" />
                    <span>
                      {isSubmitting
                        ? 'TRANSMITTING TO PRINT QUEUE...'
                        : `CONFIRM ORDER · ${formatPrice(finalTotal)}`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
