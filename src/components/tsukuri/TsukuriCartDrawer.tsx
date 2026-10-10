import React, { useState, useEffect } from 'react';
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
  QrCode,
  Zap,
  Copy,
  Check,
  Building2,
} from 'lucide-react';
import {
  CartItem,
  formatPrice,
  calculatePaymentAdjustedTotal,
} from './tsukuriData.ts';
import { recordLiveActivity } from '../../lib/firebase.ts';
import {
  TSUKURI_UPI_DETAILS,
  buildApexCheckoutUrl,
  buildUpiDeepLink,
} from '../../lib/apexpay.ts';

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
  onOpenTerms?: () => void;
  onOpenRefund?: () => void;
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
  onOpenTerms,
  onOpenRefund,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmed'>(
    directBuyItem ? 'checkout' : 'cart'
  );
  const [policyModal, setPolicyModal] = useState<'terms' | 'refund' | null>(null);
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
  const [paymentMethod, setPaymentMethod] = useState<'ApexGateway' | 'UPI_QR' | 'COD'>('ApexGateway');
  const [customerUtr, setCustomerUtr] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // REQUIREMENT 10: Option on checkout of adding a discount code
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [availableDiscounts, setAvailableDiscounts] = useState<any[]>([
    { code: 'TSUKURI10', discountType: 'percentage', value: 10, description: '10% Studio Welcome Discount' },
    { code: 'PRINT15', discountType: 'percentage', value: 15, description: '15% Maker Slicing Discount' },
    { code: 'FESTIVE100', discountType: 'flat', value: 100, description: 'Flat ₹100 Festival Savings' },
    { code: 'MAKER20', discountType: 'percentage', value: 20, description: '20% Print Enthusiast Discount' },
  ]);
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

  // Fetch active discount codes from backend
  useEffect(() => {
    fetch('/api/discounts')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableDiscounts(data.filter((d: any) => d.isActive !== false));
        }
      })
      .catch(() => {});
  }, []);

  // Requirement 7: Automatically save customer details into specific tab when customer fills information
  useEffect(() => {
    const cleanName = customerName.trim();
    if (cleanName.length >= 2 || phone.trim().length >= 5 || email.trim().length >= 4) {
      try {
        const stored = localStorage.getItem('tsukuri_customers');
        let list: any[] = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(list)) list = [];

        const key = (email || phone || cleanName).toLowerCase().trim();
        const existingIdx = list.findIndex((c: any) =>
          (c.email && c.email.toLowerCase() === key) ||
          (c.phone && c.phone === phone.trim()) ||
          (c.name && c.name.toLowerCase() === cleanName.toLowerCase())
        );

        const customerEntry = {
          id: existingIdx >= 0 ? list[existingIdx].id : `cust-${Date.now()}`,
          name: cleanName || 'Customer',
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          pincode: pincode.trim(),
          totalOrders: existingIdx >= 0 ? list[existingIdx].totalOrders : 0,
          totalSpend: existingIdx >= 0 ? list[existingIdx].totalSpend : 0,
          isRepeatCustomer: existingIdx >= 0 ? list[existingIdx].isRepeatCustomer : false,
          notes: 'Auto-saved from checkout form input',
          createdAt: existingIdx >= 0 ? list[existingIdx].createdAt : new Date().toISOString(),
          lastActive: new Date().toISOString(),
        };

        if (existingIdx >= 0) {
          list[existingIdx] = { ...list[existingIdx], ...customerEntry };
        } else {
          list.unshift(customerEntry);
        }
        localStorage.setItem('tsukuri_customers', JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('tsukuri_customer_saved', { detail: customerEntry }));
      } catch {}
    }
  }, [customerName, email, phone, address, city, pincode]);

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

  const handleApplyDiscount = async (codeOverride?: string) => {
    const rawCode = (codeOverride || discountCodeInput).trim().toUpperCase();
    if (!rawCode) {
      setDiscountMessage({ type: 'error', text: 'Please enter a coupon code' });
      return;
    }

    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: rawCode, subtotal: subtotalINR }),
      });
      if (res.ok) {
        const valData = await res.json();
        if (valData.valid) {
          if (valData.discountType === 'percentage') {
            setAppliedDiscount({
              code: valData.code,
              percent: valData.value,
              description: valData.description || `${valData.value}% Discount`,
            });
          } else {
            setAppliedDiscount({
              code: valData.code,
              amount: valData.discountINR,
              description: valData.description || `Flat ₹${valData.value} Discount`,
            });
          }
          setDiscountMessage({ type: 'success', text: valData.message || `${valData.code} applied!` });
          return;
        } else {
          setDiscountMessage({ type: 'error', text: valData.message || 'Invalid or expired discount code' });
          return;
        }
      }
    } catch {}

    // Fallback in-memory matching if offline/error
    const found = availableDiscounts.find((d) => d.code.toUpperCase() === rawCode);
    if (found) {
      if (found.discountType === 'flat') {
        setAppliedDiscount({ code: rawCode, amount: found.value, description: found.description || `Flat ₹${found.value} Discount` });
      } else {
        setAppliedDiscount({ code: rawCode, percent: found.value, description: found.description || `${found.value}% Discount` });
      }
      setDiscountMessage({ type: 'success', text: `${rawCode} applied! Savings deducted.` });
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

    if (paymentMethod === 'UPI_QR') {
      const cleanUtr = customerUtr.trim();
      if (!cleanUtr || cleanUtr.length !== 12 || !/^\d{12}$/.test(cleanUtr)) {
        alert('Please enter a valid 12-digit numeric UPI UTR number from your payment app.');
        return;
      }
    }

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
          paymentMethod:
            paymentMethod === 'ApexGateway'
              ? 'Apex Live Gateway'
              : paymentMethod === 'UPI_QR'
              ? 'Inline UPI QR'
              : 'COD',
          notes:
            paymentMethod === 'UPI_QR'
              ? `Customer UPI QR Payment to joshi2010@slc. 12-Digit UTR: ${customerUtr.trim()}`
              : undefined,
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

      // Persist order in localStorage so it appears in Admin Orders & Customer Data immediately (Vercel resilient)
      try {
        const storedOrders = localStorage.getItem('tsukuri_orders');
        let ordersArr: any[] = storedOrders ? JSON.parse(storedOrders) : [];
        if (!Array.isArray(ordersArr)) ordersArr = [];
        const newOrderObj = {
          id: String(orderResult.id || Date.now()),
          orderNumber: orderResult.orderNumber,
          customerName: customerName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: fullAddress,
          city: city.trim() || 'India',
          items: activeItems.map((i) => ({
            productId: i.product.id,
            name: `${i.product.name}${i.selectedColor ? ` (${i.selectedColor})` : ''}`,
            quantity: i.quantity,
            priceINR: i.customPriceINR ? Math.round(i.customPriceINR / i.quantity) : i.product.priceINR,
          })),
          subtotalINR: discountedSubtotal,
          paymentMethod:
            paymentMethod === 'ApexGateway'
              ? 'Apex Live Gateway'
              : paymentMethod === 'UPI_QR'
              ? 'Inline UPI QR'
              : 'COD',
          codFee,
          onlineDiscount,
          totalAmountINR: finalTotal,
          status: paymentMethod === 'COD' ? 'New' : 'In Production',
          paymentStatus: paymentMethod === 'COD' ? 'COD' : 'Paid',
          orderDate: new Date().toISOString(),
          courier: activeDeliveryPartner,
          trackingNumber: `SR12482565${Math.floor(100000 + Math.random() * 900000)}`,
          notes:
            paymentMethod === 'UPI_QR'
              ? `Paid via UPI QR (joshi2010@slc). 12-Digit UTR: ${customerUtr.trim()}`
              : `Customer Order via ${paymentMethod}`,
        };
        ordersArr.unshift(newOrderObj);
        localStorage.setItem('tsukuri_orders', JSON.stringify(ordersArr));

        // Update customer total spend and orders count in tsukuri_customers
        const storedCusts = localStorage.getItem('tsukuri_customers');
        let custsArr: any[] = storedCusts ? JSON.parse(storedCusts) : [];
        const key = (email || phone || customerName).toLowerCase().trim();
        const cIdx = custsArr.findIndex((c: any) =>
          (c.email && c.email.toLowerCase() === key) ||
          (c.phone && c.phone === phone.trim()) ||
          (c.name && c.name.toLowerCase() === customerName.toLowerCase().trim())
        );
        if (cIdx >= 0) {
          custsArr[cIdx].totalOrders = (custsArr[cIdx].totalOrders || 0) + 1;
          custsArr[cIdx].totalSpend = (custsArr[cIdx].totalSpend || 0) + finalTotal;
          custsArr[cIdx].isRepeatCustomer = custsArr[cIdx].totalOrders > 1;
          custsArr[cIdx].lastActive = new Date().toISOString();
        } else {
          custsArr.unshift({
            id: `cust-${Date.now()}`,
            name: customerName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            address: fullAddress,
            city: city.trim(),
            pincode: pincode.trim(),
            totalOrders: 1,
            totalSpend: finalTotal,
            isRepeatCustomer: false,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
          });
        }
        localStorage.setItem('tsukuri_customers', JSON.stringify(custsArr));
        window.dispatchEvent(new CustomEvent('tsukuri_order_placed', { detail: newOrderObj }));
      } catch {}

      // Requirement 1 & 2: Redirect to Apex Live Gateway or /order-success
      if (paymentMethod === 'ApexGateway') {
        const productTitle = activeItems.map((i) => `${i.product.name}${i.quantity > 1 ? ` x${i.quantity}` : ''}`).join(', ') || 'Tsukuri3D Custom Print';
        const orderId = orderResult.orderNumber || `TSU-${Math.floor(1000 + Math.random() * 9000)}`;
        const returnUrl = `${window.location.origin}/order-success`;
        
        // Exact URL specified in user prompt:
        // https://apex-seven-ashy.vercel.app/?checkout=live&amount=${totalAmount}&order_id=${orderId}&description=${encodeURIComponent(productTitle)}&customer_name=${customerName}&customer_email=${customerEmail}&return_url=${window.location.origin}/order-success
        const gatewayUrl = `https://apex-seven-ashy.vercel.app/?checkout=live&amount=${finalTotal}&order_id=${encodeURIComponent(orderId)}&description=${encodeURIComponent(productTitle)}&customer_name=${encodeURIComponent(customerName)}&customer_email=${encodeURIComponent(email)}&return_url=${returnUrl}`;
        
        if (!directBuyItem) onClearCart();
        window.location.href = gatewayUrl;
        return;
      }

      if (paymentMethod === 'UPI_QR') {
        const orderId = orderResult.orderNumber || `TSU-${Math.floor(1000 + Math.random() * 9000)}`;
        const successUrl = `/order-success?order_id=${encodeURIComponent(orderId)}&utr=${encodeURIComponent(customerUtr.trim())}&payment_id=UPI-${encodeURIComponent(customerUtr.trim())}`;
        
        if (!directBuyItem) onClearCart();
        window.location.href = successUrl;
        return;
      }

      // COD Flow
      setConfirmedOrder({
        ...orderResult,
        email,
        phone,
        items: activeItems,
        address: fullAddress,
        city,
        pincode,
        paymentMethod: 'Cash on Delivery',
        courier: activeDeliveryPartner,
        orderDate: new Date().toISOString(),
      });
      onOrderSuccess(orderResult);
      if (!directBuyItem) {
        onClearCart();
      }
      // Auto-dispatch invoice email only if not already dispatched by checkout server
      if (email && !orderResult?.invoiceAutoSent) {
        fetch('/api/send-invoice-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: orderResult.orderNumber,
            customerName,
            customerEmail: email,
            totalAmount: finalTotal,
            subtotal: discountedSubtotal,
            taxAmount: 0,
            shippingFee: shippingINR,
            paymentMethod: paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Online Payment (UPI/Card)',
            shippingAddress: fullAddress,
            items: activeItems.map((i) => ({
              productName: i.product.name,
              quantity: i.quantity,
              totalPrice: (i.customPriceINR || i.product.priceINR * i.quantity),
            })),
          }),
        }).catch(() => {});
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

      // Requirement 5: Dispatch tax invoice email in background
      if (email) {
        fetch('/api/send-invoice-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: fallbackOrder.orderNumber,
            customerName,
            customerEmail: email,
            totalAmount: finalTotal,
            subtotal: discountedSubtotal,
            taxAmount: 0,
            shippingFee: shippingINR,
            paymentMethod: paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Online Payment (UPI/Card)',
            shippingAddress: `${address}, ${city} - ${pincode}`,
            items: activeItems.map((i) => ({
              productName: i.product.name,
              quantity: i.quantity,
              totalPrice: (i.customPriceINR || i.product.priceINR * i.quantity),
            })),
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
                    <label className="text-[11px] font-bold text-[#1a2e26]">Mobile Number (Customer Data) *</label>
                    <input
                      type="tel"
                      inputMode="tel"
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
                    {availableDiscounts.slice(0, 4).map((d) => (
                      <button
                        key={d.code}
                        type="button"
                        onClick={() => {
                          setDiscountCodeInput(d.code);
                          handleApplyDiscount(d.code);
                        }}
                        className="text-[10px] font-mono font-bold bg-[#e8ece1] hover:bg-[#f3b755] text-slate-700 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                      >
                        {d.code} ({d.discountType === 'flat' ? `-₹${d.value}` : `-${d.value}%`})
                      </button>
                    ))}
                  </div>
                </div>

                {/* PAYMENT METHOD SELECTOR */}
                <div className="space-y-3 pt-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-[#1a2e26]">Payment Method</label>
                    <span className="text-[10px] text-[#1e4b3e] font-bold">Pricing Rule Applied</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* 1. Apex Live Payment Gateway (-₹10) */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('ApexGateway')}
                      className={`p-3 rounded-2xl border text-left transition-all relative cursor-pointer ${
                        paymentMethod === 'ApexGateway'
                          ? 'bg-[#1e4b3e] text-white border-[#1e4b3e] shadow-xs ring-2 ring-[#f3b755]'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bubbly text-xs">
                        <Zap className="w-4 h-4 text-[#f3b755]" />
                        <span>Apex Gateway</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold block mt-1 ${
                          paymentMethod === 'ApexGateway' ? 'text-[#f3b755]' : 'text-emerald-700'
                        }`}
                      >
                        ⚡ Live Cards/NetBank (-₹10)
                      </span>
                    </button>

                    {/* 2. Inline UPI QR & Transfer (-₹10) */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI_QR')}
                      className={`p-3 rounded-2xl border text-left transition-all relative cursor-pointer ${
                        paymentMethod === 'UPI_QR'
                          ? 'bg-[#1e4b3e] text-white border-[#1e4b3e] shadow-xs ring-2 ring-[#f3b755]'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bubbly text-xs">
                        <QrCode className="w-4 h-4 text-[#f3b755]" />
                        <span>Inline UPI QR</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold block mt-1 ${
                          paymentMethod === 'UPI_QR' ? 'text-[#f3b755]' : 'text-emerald-700'
                        }`}
                      >
                        📱 Scan & Pay (-₹10)
                      </span>
                    </button>

                    {/* 3. Cash on Delivery (+₹50) */}
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

                  {/* APEX LIVE GATEWAY BANNER */}
                  {paymentMethod === 'ApexGateway' && (
                    <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl text-xs space-y-1.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-950 font-bold">
                          <Zap className="w-4 h-4 text-emerald-700" />
                          <span>Apex Live Payment Gateway (Zero Redirect Hassle)</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                          apex-seven-ashy.vercel.app
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                        Clicking confirm will securely connect to your live payment gateway hosted at <strong>apex-seven-ashy.vercel.app</strong>. Upon completion, you will be automatically returned to Tsukuri3D with your 3D printing preparation triggered!
                      </p>
                    </div>
                  )}

                  {/* INLINE UPI QR & BANK DETAILS */}
                  {paymentMethod === 'UPI_QR' && (
                    <div className="p-4 bg-white rounded-2xl border-2 border-[#1e4b3e]/20 space-y-3.5 shadow-xs animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-[#1e4b3e]" />
                          <span className="font-bubbly text-xs text-[#1e4b3e] font-bold">
                            SCAN TO PAY VIA ANY UPI APP
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Amount: {formatPrice(finalTotal)}
                        </span>
                      </div>

                      {/* QR Code and Quick Pay Link */}
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-36 h-36 sm:w-40 sm:h-40 bg-white p-2 rounded-2xl border-2 border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(
                              `upi://pay?pa=joshi2010@slc&pn=Aditya%20Joshi&am=${finalTotal}&cu=INR&tn=Tsukuri3D%20Order`
                            )}`}
                            alt="Tsukuri3D UPI QR Code"
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>

                        <div className="flex-1 space-y-2 text-xs w-full">
                          <p className="text-[11px] text-slate-600 leading-tight">
                            Scan with <strong>Google Pay, PhonePe, Paytm, CRED, or BHIM</strong> to transfer exactly <strong>{formatPrice(finalTotal)}</strong>.
                          </p>

                          {/* Bank & Beneficiary Details */}
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 font-mono text-[11px]">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-sans text-[10px]">UPI VPA:</span>
                              <div className="flex items-center gap-1">
                                <strong className="text-slate-800 font-bold">joshi2010@slc</strong>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText('joshi2010@slc');
                                    setCopiedKey('vpa');
                                    setTimeout(() => setCopiedKey(null), 2000);
                                  }}
                                  className="p-0.5 rounded hover:bg-slate-200 text-slate-500 cursor-pointer"
                                  title="Copy UPI VPA"
                                >
                                  {copiedKey === 'vpa' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-sans text-[10px]">Beneficiary:</span>
                              <strong className="text-slate-800 font-sans font-bold">Aditya Joshi</strong>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-sans text-[10px]">Bank:</span>
                              <span className="text-slate-700 font-sans text-[10px]">North East Small Finance Bank</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-sans text-[10px]">A/C No:</span>
                              <div className="flex items-center gap-1">
                                <strong className="text-slate-800 font-bold">033311501086572</strong>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText('033311501086572');
                                    setCopiedKey('ac');
                                    setTimeout(() => setCopiedKey(null), 2000);
                                  }}
                                  className="p-0.5 rounded hover:bg-slate-200 text-slate-500 cursor-pointer"
                                  title="Copy Account Number"
                                >
                                  {copiedKey === 'ac' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-sans text-[10px]">IFSC:</span>
                              <div className="flex items-center gap-1">
                                <strong className="text-slate-800 font-bold">NESF0000333</strong>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText('NESF0000333');
                                    setCopiedKey('ifsc');
                                    setTimeout(() => setCopiedKey(null), 2000);
                                  }}
                                  className="p-0.5 rounded hover:bg-slate-200 text-slate-500 cursor-pointer"
                                  title="Copy IFSC"
                                >
                                  {copiedKey === 'ifsc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Deep link button for phone devices */}
                          <a
                            href={`upi://pay?pa=joshi2010@slc&pn=Aditya%20Joshi&am=${finalTotal}&cu=INR&tn=Tsukuri3D%20Order`}
                            className="block w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-center font-bold text-[11px] transition-colors"
                          >
                            📱 Open in UPI App (GPay / PhonePe / Paytm)
                          </a>
                        </div>
                      </div>

                      {/* 12-Digit Customer UTR Number Input */}
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] font-bold text-[#1a2e26]">
                            Customer 12-Digit UTR / UPI Reference Number *
                          </label>
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            {customerUtr.length}/12 Digits
                          </span>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={12}
                          pattern="[0-9]{12}"
                          value={customerUtr}
                          onChange={(e) => setCustomerUtr(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 428901238475"
                          className="w-full text-xs font-mono font-bold bg-[#faf9f5] border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
                        />
                        <span className="text-[10px] text-slate-500 block">
                          Found in transaction details of your UPI app after completing payment.
                        </span>
                      </div>
                    </div>
                  )}
                  {/* Terms & Refund Policy Notice for Customers Making a Payment (Requirement 1) */}
                  <div className="p-2.5 bg-[#e8ece1]/60 rounded-xl border border-[#1e4b3e]/15 text-center">
                    <p className="text-[10px] sm:text-[11px] text-slate-600 leading-normal font-normal">
                      These will be displayed to customers when they make a payment, so they know your terms in advance.{' '}
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenTerms) {
                            onClose();
                            onOpenTerms();
                          } else {
                            setPolicyModal('terms');
                          }
                        }}
                        className="font-bold text-[#1e4b3e] bg-[#f3b755]/25 hover:bg-[#f3b755]/45 px-1 py-0.5 rounded underline decoration-[#1e4b3e]/60 hover:decoration-[#1e4b3e] cursor-pointer transition-colors"
                      >
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenRefund) {
                            onClose();
                            onOpenRefund();
                          } else {
                            setPolicyModal('refund');
                          }
                        }}
                        className="font-bold text-[#1e4b3e] bg-[#f3b755]/25 hover:bg-[#f3b755]/45 px-1 py-0.5 rounded underline decoration-[#1e4b3e]/60 hover:decoration-[#1e4b3e] cursor-pointer transition-colors"
                      >
                        Refund and Cancellation Policy
                      </button>
                      .
                    </p>
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
                {paymentMethod !== 'COD' && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Instant Online Payment Discount</span>
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
                    {paymentMethod === 'ApexGateway' ? (
                      <Zap className="w-4 h-4 text-[#f3b755]" />
                    ) : paymentMethod === 'UPI_QR' ? (
                      <QrCode className="w-4 h-4 text-[#f3b755]" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-[#f3b755]" />
                    )}
                    <span>
                      {isSubmitting
                        ? 'CONNECTING TO GATEWAY...'
                        : paymentMethod === 'ApexGateway'
                        ? `PAY VIA APEX GATEWAY · ${formatPrice(finalTotal)}`
                        : paymentMethod === 'UPI_QR'
                        ? `SUBMIT UTR & CONFIRM · ${formatPrice(finalTotal)}`
                        : `CONFIRM ORDER · ${formatPrice(finalTotal)}`}
                    </span>
                  </button>
                </div>
              )}

              {step === 'checkout' && (
                <p className="text-[10px] text-slate-500 text-center leading-normal px-2 pt-0.5 font-normal">
                  These will be displayed to customers when they make a payment, so they know your terms in advance.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenTerms) {
                        onClose();
                        onOpenTerms();
                      } else {
                        setPolicyModal('terms');
                      }
                    }}
                    className="font-bold text-[#1e4b3e] bg-[#f3b755]/25 hover:bg-[#f3b755]/45 px-1 py-0.5 rounded underline decoration-[#1e4b3e]/60 hover:decoration-[#1e4b3e] cursor-pointer"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenRefund) {
                        onClose();
                        onOpenRefund();
                      } else {
                        setPolicyModal('refund');
                      }
                    }}
                    className="font-bold text-[#1e4b3e] bg-[#f3b755]/25 hover:bg-[#f3b755]/45 px-1 py-0.5 rounded underline decoration-[#1e4b3e]/60 hover:decoration-[#1e4b3e] cursor-pointer"
                  >
                    Refund and Cancellation Policy
                  </button>
                  .
                </p>
              )}
            </div>
          )}

          {/* Policy Quick-View Modal Overlay */}
          {policyModal && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border-2 border-[#1e4b3e]/20 overflow-hidden">
                <div className="p-4 bg-[#1e4b3e] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#f3b755] text-[#1a2e26] flex items-center justify-center font-bubbly text-xs">
                      造
                    </span>
                    <h3 className="font-bubbly text-sm text-[#f3b755]">
                      {policyModal === 'terms' ? 'TERMS OF SERVICE' : 'REFUND & CANCELLATION POLICY'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPolicyModal(null)}
                    className="p-1 rounded-full hover:bg-white/20 text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
                  {policyModal === 'terms' ? (
                    <>
                      <div className="p-3 bg-[#e8ece1]/50 rounded-xl border border-[#1e4b3e]/15">
                        <strong className="text-[#1e4b3e] block text-xs">Custom 3D Printing Agreement</strong>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          TsuKURI_3D items are custom-fabricated on-demand with 0.12mm bio-PLA precision layers.
                        </p>
                      </div>
                      <p>
                        <strong>1. Custom Fabrication:</strong> Every product is made-to-order. Microscopic FDM layer striations are natural maker hallmarks of additive manufacturing.
                      </p>
                      <p>
                        <strong>2. Pricing & GST:</strong> Prices in INR include applicable GST. Instant ₹10 discount applies to online UPI / Gateway payments. A ₹50 courier fee applies to COD.
                      </p>
                      <p>
                        <strong>3. Pan-India Delivery:</strong> Dispatched in biodegradable packaging within 12–24h. Express transit ETA is 3 to 4 days Pan-India with live AWB tracking.
                      </p>
                      <p>
                        <strong>4. Jurisdiction:</strong> Subject to Bengaluru, India courts. Support desk: commersgyan@gmail.com.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <strong className="text-amber-900 block text-xs">7-Day Transit Cover & 2-Hour Cancellation</strong>
                        <p className="text-[11px] text-slate-700 mt-0.5">
                          Cancel within 2 hours for a 100% refund. Transit damages get free immediate reprints!
                        </p>
                      </div>
                      <p>
                        <strong>1. 2-Hour Cancellation:</strong> Cancel within 2 hours of placing your order for a 100% full reversal to your original payment mode before slicing begins.
                      </p>
                      <p>
                        <strong>2. Damaged in Transit:</strong> If courier damages your piece, email unboxing photos within 48 hours to commersgyan@gmail.com for a free reprint and replacement dispatch.
                      </p>
                      <p>
                        <strong>3. Refund Reversals:</strong> Approved refunds credit back to your original payment account (UPI / Cards / Net Banking) within 5 to 7 business days.
                      </p>
                      <p>
                        <strong>4. Non-Refundable:</strong> Slight layer textures standard to FDM, customer address mistakes, or heat misuse (&gt;55°C).
                      </p>
                    </>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const targetModal = policyModal;
                      setPolicyModal(null);
                      onClose();
                      if (targetModal === 'terms' && onOpenTerms) onOpenTerms();
                      if (targetModal === 'refund' && onOpenRefund) onOpenRefund();
                    }}
                    className="text-[11px] font-bold text-[#1e4b3e] hover:underline cursor-pointer"
                  >
                    Open Full Dedicated Page →
                  </button>
                  <button
                    type="button"
                    onClick={() => setPolicyModal(null)}
                    className="px-4 py-2 rounded-full bg-[#1e4b3e] text-[#f3b755] font-bubbly text-xs cursor-pointer"
                  >
                    Back to Checkout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
