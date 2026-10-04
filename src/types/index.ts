export type UserRole = 'owner' | 'staff' | 'viewer';

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
}

export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  priceAdjustment?: number | null;
  stock: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  photos?: string | null;
  description?: string | null;
  stlFileUrl?: string | null;
  material: string;
  colorOptions?: string | null;
  printTimeMinutes: number;
  filamentWeightGrams: number;
  sellingPrice: number;
  costPrice: number;
  stock: number;
  status: 'active' | 'draft';
  createdAt?: string;
  updatedAt?: string;
  variants?: ProductVariant[];
}

export type OrderStatus =
  | 'New'
  | 'Confirmed'
  | 'In Production'
  | 'Printed'
  | 'Post-processing'
  | 'Packed'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned/Cancelled';

export type PaymentStatus = 'Paid' | 'COD' | 'Pending' | 'Refunded';

export interface OrderItem {
  id?: number;
  orderId?: number;
  productId?: number | null;
  variantId?: number | null;
  productName: string;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  totalPrice: number;
  filamentGramsUsed?: number | null;
  printTimeMinutes?: number | null;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId?: number | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  channel: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string | null;
  courierName?: string | null;
  trackingNumber?: string | null;
  notes?: string | null;
  isCustomOrder: boolean;
  customFileUrl?: string | null;
  quoteAmount?: number | null;
  advancePaid?: number | null;
  customApprovalStatus?: 'none' | 'pending' | 'approved' | 'rejected' | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  currency: string;
  orderDate?: string | null;
  expectedDeliveryDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  items?: OrderItem[];
}

export interface Printer {
  id: number;
  name: string;
  model: string;
  status: 'idle' | 'printing' | 'maintenance' | 'offline';
  bedTemperature: number;
  nozzleTemperature: number;
  totalPrintHours: number;
  currentJobId?: number | null;
  maintenanceDueHours: number;
  location: string;
}

export interface FilamentSpool {
  id: number;
  name: string;
  material: string;
  brand: string;
  color: string;
  colorHex: string;
  initialWeightGrams: number;
  remainingWeightGrams: number;
  costPerKg: number;
  supplierId?: number | null;
  purchaseDate?: string;
  location: string;
  alertThresholdGrams: number;
  isLowStock: boolean;
}

export interface PrintJob {
  id: number;
  orderId?: number | null;
  orderNumber?: string | null;
  printerId?: number | null;
  printerName?: string | null;
  jobName: string;
  material: string;
  spoolId?: number | null;
  estimatedTimeMinutes: number;
  actualTimeMinutes?: number | null;
  filamentGramsEstimated: number;
  filamentGramsUsed?: number | null;
  status: 'Queued' | 'Printing' | 'Done' | 'Failed';
  failureReason?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  assignedTo?: string | null;
  createdAt?: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  sku: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  costPerUnit: number;
  supplierId?: number | null;
  location: string;
}

export interface Customer {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  totalOrders: number;
  totalSpend: number;
  isRepeatCustomer: boolean;
  notes?: string | null;
  createdAt?: string;
}

export interface Expense {
  id: number;
  title: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
  recurring: boolean;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  materialsSupplied?: string | null;
  leadTimeDays: number;
  rating: number;
  notes?: string | null;
}

export interface Campaign {
  id: number;
  name: string;
  channel: string;
  spend: number;
  impressions: number;
  clicks: number;
  ordersGenerated: number;
  revenueGenerated: number;
  roas: number;
  status: 'active' | 'paused' | 'completed';
  startDate?: string;
  endDate?: string | null;
  notes?: string | null;
}

export interface ContentPost {
  id: number;
  title: string;
  platform: string;
  postType: string;
  scheduledDate: string;
  status: 'Idea' | 'Drafting' | 'Ready' | 'Published';
  caption?: string | null;
  assetUrl?: string | null;
  notes?: string | null;
}

export interface BusinessSettings {
  id?: number;
  businessName: string;
  gstin?: string;
  email?: string;
  phone?: string;
  address?: string;
  currency: string;
  electricityRatePerKwh: number;
  defaultTaxRate: number;
  machineDepreciationRatePerHour: number;
  laborRatePerHour: number;
  logoUrl?: string | null;
}

export interface ActivityLogItem {
  id: number;
  userId?: number | null;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
  timestamp: string;
}

export interface StorefrontConfig {
  id?: number;
  storeName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroImageUrl?: string | null;
  announcementText?: string | null;
  themeColor: string;
  accentColor: string;
  isPublished: boolean;
  customQuoteEnabled: boolean;
  customQuoteTitle?: string | null;
  customQuoteSubtitle?: string | null;
  featuredProductIds?: string | null;
  brandStory?: string | null;
  trustBadges?: string | null;
  faqs?: string | null;
  socialLinks?: string | null;
  updatedAt?: string;
}

