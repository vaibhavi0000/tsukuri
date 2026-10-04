import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Download,
  Printer as PrintIcon,
  ChevronRight,
  Truck,
  ExternalLink,
  Edit,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Package,
  X,
  FileCode,
} from 'lucide-react';
import { Order, OrderStatus, PaymentStatus, Product, Customer } from '../../types/index.ts';
import { formatCurrency, formatDate } from '../../lib/utils.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface OrdersModuleProps {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  onAddOrder: (order: Partial<Order>) => Promise<void>;
  onUpdateOrder: (id: number, order: Partial<Order>) => Promise<void>;
  onViewInvoice: (order: Order) => void;
}

const STATUS_FLOW: OrderStatus[] = [
  'New',
  'Confirmed',
  'In Production',
  'Printed',
  'Post-processing',
  'Packed',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const CHANNELS = [
  'All',
  'Own website',
  'Instagram',
  'WhatsApp',
  'Amazon',
  'Etsy',
  'Meesho',
  'Flipkart',
  'Other',
];

export const OrdersModule: React.FC<OrdersModuleProps> = ({
  orders,
  products,
  customers,
  onAddOrder,
  onUpdateOrder,
  onViewInvoice,
}) => {
  const { canEdit } = useAuth();
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);

  // Form states for new order
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [channel, setChannel] = useState('Own website');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isCustomOrder, setIsCustomOrder] = useState(false);
  const [customFileUrl, setCustomFileUrl] = useState('');
  const [quoteAmount, setQuoteAmount] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      (o.shippingAddress && o.shippingAddress.toLowerCase().includes(q)) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q));

    const matchesChannel = channelFilter === 'All' || o.channel === channelFilter;
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    const matchesPayment = paymentFilter === 'All' || o.paymentStatus === paymentFilter;

    return matchesSearch && matchesChannel && matchesStatus && matchesPayment;
  });

  const openCreateModal = () => {
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setShippingAddress('');
    setChannel('Instagram');
    setPaymentStatus('Paid');
    setPaymentMethod('UPI');
    setIsCustomOrder(false);
    setCustomFileUrl('');
    setQuoteAmount(0);
    setAdvancePaid(0);
    setSelectedProductId(products.length > 0 ? products[0].id : '');
    setItemQuantity(1);
    setNotes('');
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    setExpectedDeliveryDate(nextWeek.toISOString().slice(0, 10));
    setIsModalOpen(true);
  };

  const handleCustomerSelect = (custId: number) => {
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setCustomerName(found.name);
      setCustomerEmail(found.email || '');
      setCustomerPhone(found.phone || '');
      setShippingAddress(found.address ? `${found.address}, ${found.city || ''} ${found.pincode || ''}` : '');
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    let items = [];
    let subtotal = 0;

    if (isCustomOrder) {
      subtotal = quoteAmount;
      items.push({
        productName: 'Custom 3D Print Commission',
        quantity: 1,
        unitPrice: quoteAmount,
        unitCost: quoteAmount * 0.35,
        totalPrice: quoteAmount,
        filamentGramsUsed: 120,
        printTimeMinutes: 300,
      });
    } else {
      const prod = products.find((p) => p.id === Number(selectedProductId));
      const price = prod ? prod.sellingPrice : 499;
      const cost = prod ? prod.costPrice : 150;
      subtotal = price * itemQuantity;

      items.push({
        productId: prod?.id,
        productName: prod?.name || 'Standard 3D Print',
        sku: prod?.sku,
        quantity: itemQuantity,
        unitPrice: price,
        unitCost: cost,
        totalPrice: subtotal,
        filamentGramsUsed: (prod?.filamentWeightGrams || 50) * itemQuantity,
        printTimeMinutes: (prod?.printTimeMinutes || 60) * itemQuantity,
      });
    }

    const taxAmount = Number((subtotal * 0.18).toFixed(2));
    const totalAmount = subtotal + taxAmount;

    await onAddOrder({
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      channel,
      status: 'New',
      paymentStatus,
      paymentMethod,
      isCustomOrder,
      customFileUrl: customFileUrl || null,
      quoteAmount: isCustomOrder ? quoteAmount : 0,
      advancePaid: isCustomOrder ? advancePaid : 0,
      customApprovalStatus: isCustomOrder ? 'pending' : 'none',
      subtotal,
      taxAmount,
      totalAmount,
      currency: 'INR',
      notes,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate).toISOString() : undefined,
      items,
    });

    setIsModalOpen(false);
  };

  // Status badge colors
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'New':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300';
      case 'In Production':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300';
      case 'Printed':
      case 'Post-processing':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300';
      case 'Packed':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300';
      case 'Shipped':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300';
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300';
      case 'Cancelled':
      case 'Returned/Cancelled':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  // Payment badge colors
  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'COD':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
      case 'Pending':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
      case 'Refunded':
        return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      default:
        return 'bg-slate-100';
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Order #', 'Date', 'Customer', 'Channel', 'Status', 'Payment', 'Total', 'Courier', 'Tracking'];
    const rows = orders.map((o) => [
      o.orderNumber,
      formatDate(o.orderDate),
      `"${o.customerName.replace(/"/g, '""')}"`,
      o.channel,
      o.status,
      o.paymentStatus,
      o.totalAmount,
      o.courierName || '',
      o.trackingNumber || '',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `printhub_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            Orders Management ({filtered.length})
          </h2>
          <p className="text-xs text-slate-500">
            Multi-channel sales pipeline, custom quotes, STL models, shipping tracking, and tax invoices.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          {canEdit && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              New Order
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative md:col-span-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search order #, customer, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
          />
        </div>

        {/* Channel Filter */}
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          {CHANNELS.map((ch) => (
            <option key={ch} value={ch}>
              Channel: {ch}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="All">Status: All</option>
          {STATUS_FLOW.map((st) => (
            <option key={st} value={st}>
              Status: {st}
            </option>
          ))}
        </select>

        {/* Payment Filter */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="All">Payment: All</option>
          <option value="Paid">Paid</option>
          <option value="COD">COD</option>
          <option value="Pending">Pending</option>
          <option value="Refunded">Refunded</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Status Flow</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Courier & AWB</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((ord) => {
                const isOverdue =
                  ord.status !== 'Delivered' &&
                  ord.status !== 'Cancelled' &&
                  ord.expectedDeliveryDate &&
                  new Date(ord.expectedDeliveryDate) < new Date();

                return (
                  <tr
                    key={ord.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Order Number & Type */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                          {ord.orderNumber}
                        </span>
                        {ord.isCustomOrder && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatDate(ord.orderDate)}
                      </p>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{ord.customerName}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                        {ord.customerPhone || ord.customerEmail || 'No contact'}
                      </p>
                    </td>

                    {/* Channel */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {ord.channel}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusBadge(ord.status)}`}>
                          {ord.status}
                        </span>
                        {isOverdue && (
                          <span
                            title="Order is overdue expected delivery date!"
                            className="text-rose-500 font-bold text-[10px] px-1 rounded bg-rose-50 dark:bg-rose-950"
                          >
                            OVERDUE
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Payment */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPaymentBadge(ord.paymentStatus)}`}>
                        {ord.paymentStatus}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{ord.paymentMethod}</p>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(ord.totalAmount)}
                      </p>
                      {ord.taxAmount > 0 && (
                        <p className="text-[10px] text-slate-400">
                          GST: {formatCurrency(ord.taxAmount)}
                        </p>
                      )}
                    </td>

                    {/* Courier & Tracking */}
                    <td className="py-3.5 px-4">
                      {ord.trackingNumber ? (
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {ord.courierName || 'Courier'}
                          </p>
                          <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                            {ord.trackingNumber}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Not assigned</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Printable Invoice Button */}
                        <button
                          onClick={() => onViewInvoice(ord)}
                          title="Print GST Invoice / Packing Slip"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700 transition-colors"
                        >
                          <PrintIcon className="w-4 h-4" />
                        </button>

                        {/* Order Detail & Status Progression */}
                        <button
                          onClick={() => setSelectedOrderForDetail(ord)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail & Fast Status Progression Drawer/Modal */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Order {selectedOrderForDetail.orderNumber}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(selectedOrderForDetail.status)}`}>
                    {selectedOrderForDetail.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Channel: {selectedOrderForDetail.channel} &bull; Placed: {formatDate(selectedOrderForDetail.orderDate)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onViewInvoice(selectedOrderForDetail)}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg flex items-center gap-1.5"
                >
                  <PrintIcon className="w-3.5 h-3.5" />
                  Print Invoice
                </button>
                <button
                  onClick={() => setSelectedOrderForDetail(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Quick Status Progression Stepper */}
              {canEdit && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-[10px] mb-2">
                    Update Order Status Pipeline:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {STATUS_FLOW.map((st) => (
                      <button
                        key={st}
                        onClick={async () => {
                          await onUpdateOrder(selectedOrderForDetail.id, { status: st });
                          setSelectedOrderForDetail({ ...selectedOrderForDetail, status: st });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          selectedOrderForDetail.status === st
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Order details & CAD File */}
              {selectedOrderForDetail.isCustomOrder && (
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                      <FileCode className="w-4 h-4" />
                      Custom 3D CAD Print Order
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 uppercase">
                      Approval: {selectedOrderForDetail.customApprovalStatus || 'pending'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                    <p>Quote Amount: <strong>{formatCurrency(selectedOrderForDetail.quoteAmount || 0)}</strong></p>
                    <p>Advance Paid: <strong>{formatCurrency(selectedOrderForDetail.advancePaid || 0)}</strong></p>
                  </div>
                  {selectedOrderForDetail.customFileUrl && (
                    <a
                      href={selectedOrderForDetail.customFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 font-semibold underline mt-1"
                    >
                      Download Client STL/3MF Model <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Customer & Shipping info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Customer Info</h4>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedOrderForDetail.customerName}</p>
                  <p className="text-slate-500">{selectedOrderForDetail.customerPhone || 'No phone'}</p>
                  <p className="text-slate-500">{selectedOrderForDetail.customerEmail || 'No email'}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Shipping & Logistics</h4>
                  <p className="text-slate-700 dark:text-slate-300">{selectedOrderForDetail.shippingAddress || 'No address'}</p>
                  <p className="mt-2 text-slate-500">
                    Courier: <strong>{selectedOrderForDetail.courierName || 'None'}</strong> | AWB: <strong>{selectedOrderForDetail.trackingNumber || 'Pending'}</strong>
                  </p>
                </div>
              </div>

              {/* Courier Update Form */}
              {canEdit && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-cyan-600" /> Dispatch & Courier Tracking
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Courier Name (e.g. Delhivery, Bluedart, DTDC)"
                      defaultValue={selectedOrderForDetail.courierName || ''}
                      id="update-courier-input"
                      className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="AWB / Tracking Number"
                      defaultValue={selectedOrderForDetail.trackingNumber || ''}
                      id="update-tracking-input"
                      className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      const courier = (document.getElementById('update-courier-input') as HTMLInputElement).value;
                      const tracking = (document.getElementById('update-tracking-input') as HTMLInputElement).value;
                      await onUpdateOrder(selectedOrderForDetail.id, {
                        courierName: courier,
                        trackingNumber: tracking,
                        status: tracking ? 'Shipped' : selectedOrderForDetail.status,
                      });
                      setSelectedOrderForDetail({
                        ...selectedOrderForDetail,
                        courierName: courier,
                        trackingNumber: tracking,
                        status: tracking ? 'Shipped' : selectedOrderForDetail.status,
                      });
                    }}
                    className="mt-2 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                  >
                    Save Logistics Tracking
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-indigo-600" />
                Create New 3D Print Order
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Customer Selector / autofill */}
              {customers.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Existing CRM Customer (Optional Autofill)
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleCustomerSelect(Number(e.target.value));
                    }}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Choose Customer or Enter Below --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone || c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Shipping Address (with Pincode)
                  </label>
                  <textarea
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Flat 202, Palm Woods, Indiranagar, Bengaluru - 560038"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sales Channel
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="Own website">Own website</option>
                    <option value="Instagram">Instagram</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Amazon">Amazon</option>
                    <option value="Etsy">Etsy</option>
                    <option value="Meesho">Meesho</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="Paid">Paid</option>
                    <option value="COD">COD (Cash on Delivery)</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                {/* Custom Order Switch */}
                <div className="col-span-2 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-900 dark:text-purple-300">
                    <input
                      type="checkbox"
                      checked={isCustomOrder}
                      onChange={(e) => setIsCustomOrder(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    Is this a Custom 3D Order / Client CAD file?
                  </label>

                  {isCustomOrder && (
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                      <div className="col-span-2">
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Client STL / File URL
                        </label>
                        <input
                          type="text"
                          value={customFileUrl}
                          onChange={(e) => setCustomFileUrl(e.target.value)}
                          placeholder="https://drive.google.com/... or storage link"
                          className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Quoted Amount (₹)
                        </label>
                        <input
                          type="number"
                          value={quoteAmount}
                          onChange={(e) => setQuoteAmount(Number(e.target.value))}
                          className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Advance Paid (₹)
                        </label>
                        <input
                          type="number"
                          value={advancePaid}
                          onChange={(e) => setAdvancePaid(Number(e.target.value))}
                          className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Standard product selection if not custom */}
                {!isCustomOrder && (
                  <>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Select Catalog Product
                      </label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatCurrency(p.sellingPrice)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expected Dispatch Date
                  </label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Special Production / Color Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Print in Silk Gold, 20% gyroid infill"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Create & Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
