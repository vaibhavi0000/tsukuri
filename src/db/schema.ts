import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. Users & Authentication
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name').notNull().default('PrintHub Staff'),
  role: text('role').notNull().default('owner'), // 'owner' | 'staff' | 'viewer'
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Products Catalog
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(),
  category: text('category').notNull().default('General'), // 'Home & Decor', 'Gadgets & Tools', 'Cosplay & Props', 'Miniatures', 'Custom'
  photos: text('photos'), // JSON array string of photo URLs
  description: text('description'),
  stlFileUrl: text('stl_file_url'),
  material: text('material').notNull().default('PLA'),
  colorOptions: text('color_options'), // JSON array string of colors
  printTimeMinutes: integer('print_time_minutes').notNull().default(60),
  filamentWeightGrams: doublePrecision('filament_weight_grams').notNull().default(50),
  sellingPrice: doublePrecision('selling_price').notNull().default(0),
  costPrice: doublePrecision('cost_price').notNull().default(0),
  stock: integer('stock').notNull().default(0),
  status: text('status').notNull().default('active'), // 'active' | 'draft'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. Product Variants
export const productVariants = pgTable('product_variants', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  name: text('name').notNull(),
  sku: text('sku').notNull(),
  size: text('size'),
  color: text('color'),
  priceAdjustment: doublePrecision('price_adjustment').default(0),
  stock: integer('stock').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Customers (CRM)
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  pincode: text('pincode'),
  totalOrders: integer('total_orders').notNull().default(0),
  totalSpend: doublePrecision('total_spend').notNull().default(0),
  isRepeatCustomer: boolean('is_repeat_customer').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Orders
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(), // e.g. PH-1001
  customerId: integer('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email'),
  customerPhone: text('customer_phone'),
  shippingAddress: text('shipping_address'),
  channel: text('channel').notNull().default('Own website'), // 'Own website', 'Instagram', 'WhatsApp', 'Amazon', 'Etsy', 'Meesho', 'Flipkart', 'Other'
  status: text('status').notNull().default('New'), // 'New', 'Confirmed', 'In Production', 'Printed', 'Post-processing', 'Packed', 'Shipped', 'Delivered', 'Returned/Cancelled'
  paymentStatus: text('payment_status').notNull().default('Pending'), // 'Paid', 'COD', 'Pending', 'Refunded'
  paymentMethod: text('payment_method').default('Online (UPI/Cards)'),
  courierName: text('courier_name'),
  trackingNumber: text('tracking_number'),
  notes: text('notes'),
  isCustomOrder: boolean('is_custom_order').default(false),
  customFileUrl: text('custom_file_url'),
  quoteAmount: doublePrecision('quote_amount').default(0),
  advancePaid: doublePrecision('advance_paid').default(0),
  customApprovalStatus: text('custom_approval_status').default('none'), // 'none', 'pending', 'approved', 'rejected'
  subtotal: doublePrecision('subtotal').notNull().default(0),
  taxAmount: doublePrecision('tax_amount').notNull().default(0),
  discountAmount: doublePrecision('discount_amount').notNull().default(0),
  shippingFee: doublePrecision('shipping_fee').notNull().default(0),
  totalAmount: doublePrecision('total_amount').notNull().default(0),
  currency: text('currency').notNull().default('INR'),
  orderDate: timestamp('order_date').defaultNow(),
  expectedDeliveryDate: timestamp('expected_delivery_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 6. Order Items
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id)
    .notNull(),
  productId: integer('product_id').references(() => products.id),
  variantId: integer('variant_id').references(() => productVariants.id),
  productName: text('product_name').notNull(),
  sku: text('sku'),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: doublePrecision('unit_price').notNull().default(0),
  unitCost: doublePrecision('unit_cost').notNull().default(0),
  totalPrice: doublePrecision('total_price').notNull().default(0),
  filamentGramsUsed: doublePrecision('filament_grams_used').default(0),
  printTimeMinutes: integer('print_time_minutes').default(0),
});

// 7. 3D Printers
export const printers = pgTable('printers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  model: text('model').notNull(),
  status: text('status').notNull().default('idle'), // 'idle' | 'printing' | 'maintenance' | 'offline'
  bedTemperature: integer('bed_temperature').default(0),
  nozzleTemperature: integer('nozzle_temperature').default(0),
  totalPrintHours: doublePrecision('total_print_hours').default(0),
  currentJobId: integer('current_job_id'),
  maintenanceDueHours: doublePrecision('maintenance_due_hours').default(300),
  location: text('location').default('Lab A'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. Filament Spools Inventory
export const filamentSpools = pgTable('filament_spools', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  material: text('material').notNull().default('PLA'), // 'PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'Resin', 'Other'
  brand: text('brand').notNull(),
  color: text('color').notNull(),
  colorHex: text('color_hex').default('#3b82f6'),
  initialWeightGrams: doublePrecision('initial_weight_grams').notNull().default(1000),
  remainingWeightGrams: doublePrecision('remaining_weight_grams').notNull().default(1000),
  costPerKg: doublePrecision('cost_per_kg').notNull().default(1200),
  supplierId: integer('supplier_id'),
  purchaseDate: timestamp('purchase_date').defaultNow(),
  location: text('location').default('Shelf 1'),
  alertThresholdGrams: doublePrecision('alert_threshold_grams').default(200),
  isLowStock: boolean('is_low_stock').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. Print Jobs Queue
export const printJobs = pgTable('print_jobs', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id),
  orderNumber: text('order_number'),
  printerId: integer('printer_id').references(() => printers.id),
  printerName: text('printer_name'),
  jobName: text('job_name').notNull(),
  material: text('material').notNull().default('PLA'),
  spoolId: integer('spool_id').references(() => filamentSpools.id),
  estimatedTimeMinutes: integer('estimated_time_minutes').notNull().default(120),
  actualTimeMinutes: integer('actual_time_minutes').default(0),
  filamentGramsEstimated: doublePrecision('filament_grams_estimated').notNull().default(50),
  filamentGramsUsed: doublePrecision('filament_grams_used').default(0),
  status: text('status').notNull().default('Queued'), // 'Queued' | 'Printing' | 'Done' | 'Failed'
  failureReason: text('failure_reason'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  assignedTo: text('assignedTo'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 10. General Inventory (Packaging, spare parts, consumables)
export const inventoryItems = pgTable('inventory_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull().default('Packaging'), // 'Packaging', 'Spare Parts', 'Consumables', 'Hardware'
  sku: text('sku').notNull(),
  quantity: integer('quantity').notNull().default(0),
  unit: text('unit').notNull().default('pcs'), // 'pcs', 'meters', 'rolls', 'bottles'
  minThreshold: integer('min_threshold').notNull().default(10),
  costPerUnit: doublePrecision('cost_per_unit').notNull().default(0),
  supplierId: integer('supplier_id'),
  location: text('location').default('Box 1'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 11. Suppliers Directory
export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  contactPerson: text('contact_person'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  materialsSupplied: text('materials_supplied'),
  leadTimeDays: integer('lead_time_days').default(3),
  rating: doublePrecision('rating').default(4.8),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 12. Purchases & POs
export const purchases = pgTable('purchases', {
  id: serial('id').primaryKey(),
  purchaseNumber: text('purchase_number').notNull().unique(),
  supplierId: integer('supplier_id').references(() => suppliers.id),
  supplierName: text('supplier_name').notNull(),
  items: text('items'), // JSON array string
  totalAmount: doublePrecision('total_amount').notNull().default(0),
  status: text('status').notNull().default('draft'), // 'draft' | 'ordered' | 'received' | 'cancelled'
  orderDate: timestamp('order_date').defaultNow(),
  expectedDate: timestamp('expected_date'),
  receivedDate: timestamp('received_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 13. Expenses
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull().default('filament'), // 'filament', 'electricity', 'rent', 'ads', 'packaging', 'courier', 'software', 'salaries', 'maintenance', 'other'
  amount: doublePrecision('amount').notNull().default(0),
  date: timestamp('date').defaultNow(),
  paymentMethod: text('payment_method').default('Bank Transfer'),
  receiptUrl: text('receipt_url'),
  notes: text('notes'),
  recurring: boolean('recurring').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 14. Marketing & Ad Campaigns
export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  channel: text('channel').notNull().default('Instagram'), // 'Instagram', 'Facebook', 'Google', 'YouTube', 'Influencer', 'Other'
  spend: doublePrecision('spend').notNull().default(0),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
  ordersGenerated: integer('orders_generated').default(0),
  revenueGenerated: doublePrecision('revenue_generated').default(0),
  roas: doublePrecision('roas').default(0),
  status: text('status').notNull().default('active'), // 'active' | 'paused' | 'completed'
  startDate: timestamp('start_date').defaultNow(),
  endDate: timestamp('end_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 15. Content Calendar Posts
export const contentPosts = pgTable('content_posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  platform: text('platform').notNull().default('Instagram'),
  postType: text('post_type').notNull().default('Reel'),
  scheduledDate: timestamp('scheduled_date').defaultNow(),
  status: text('status').notNull().default('Idea'), // 'Idea', 'Drafting', 'Ready', 'Published'
  caption: text('caption'),
  assetUrl: text('asset_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 16. Invoices
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  orderId: integer('order_id').references(() => orders.id),
  customerName: text('customer_name').notNull(),
  customerGstin: text('customer_gstin'),
  billToAddress: text('bill_to_address'),
  subtotal: doublePrecision('subtotal').notNull().default(0),
  cgst: doublePrecision('cgst').notNull().default(0),
  sgst: doublePrecision('sgst').notNull().default(0),
  igst: doublePrecision('igst').notNull().default(0),
  totalAmount: doublePrecision('total_amount').notNull().default(0),
  status: text('status').notNull().default('issued'), // 'draft', 'issued', 'paid', 'cancelled'
  issueDate: timestamp('issue_date').defaultNow(),
  dueDate: timestamp('due_date'),
  pdfUrl: text('pdf_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 17. Activity Log
export const activityLog = pgTable('activity_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  userName: text('user_name').notNull().default('System'),
  action: text('action').notNull(), // e.g. "Created Order", "Completed Print Job"
  entityType: text('entity_type').notNull(), // "order", "printer", "filament", "expense"
  entityId: text('entity_id'),
  details: text('details'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// 18. Business Settings
export const businessSettings = pgTable('business_settings', {
  id: serial('id').primaryKey(),
  businessName: text('business_name').notNull().default('PrintHub 3D Labs'),
  gstin: text('gstin').default('29AAAAA0000A1Z5'),
  email: text('email').default('support@printhub3d.com'),
  phone: text('phone').default('+91 98765 43210'),
  address: text('address').default('104 Tech Spark Hub, Indiranagar, Bengaluru, KA 560038'),
  currency: text('currency').notNull().default('INR'),
  electricityRatePerKwh: doublePrecision('electricity_rate_per_kwh').notNull().default(8.5),
  defaultTaxRate: doublePrecision('default_tax_rate').notNull().default(18), // 18% GST default for 3D printed plastic items
  machineDepreciationRatePerHour: doublePrecision('machine_depreciation_rate_per_hour').notNull().default(25),
  laborRatePerHour: doublePrecision('labor_rate_per_hour').notNull().default(100),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 19. Storefront Website Configuration
export const storefrontConfig = pgTable('storefront_config', {
  id: serial('id').primaryKey(),
  storeName: text('store_name').notNull().default('PrintHub 3D Atelier'),
  tagline: text('tagline').notNull().default('Custom 3D Printed Creations & High-Precision Functional Parts'),
  heroTitle: text('hero_title').notNull().default('Next-Gen 3D Printed Objects Crafted for Living'),
  heroSubtitle: text('hero_subtitle').notNull().default('From articulated mythical dragons to aesthetic home planters and custom mechanical enclosures. Printed locally with industrial-grade precision.'),
  heroCtaText: text('hero_cta_text').notNull().default('Shop Collection'),
  heroImageUrl: text('hero_image_url').default('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200'),
  announcementText: text('announcement_text').default('⚡ Free Shipping across India on orders over ₹999 | Fast 48h Dispatch'),
  themeColor: text('theme_color').notNull().default('#4f46e5'),
  accentColor: text('accent_color').notNull().default('#06b6d4'),
  isPublished: boolean('is_published').notNull().default(true),
  customQuoteEnabled: boolean('custom_quote_enabled').notNull().default(true),
  customQuoteTitle: text('custom_quote_title').default('Got a 3D File? Get Instant Production Quote'),
  customQuoteSubtitle: text('custom_quote_subtitle').default('Upload your STL, STEP, or 3MF file. Our engineers analyze layer height, volume, and material for prompt quoting.'),
  featuredProductIds: text('featured_product_ids'),
  brandStory: text('brand_story').default('We operate a high-precision print farm powered by Bambu Lab and Prusa machines in Bengaluru, India. Every object is calibrated for zero-defect layer adhesion and hand-finished with care.'),
  trustBadges: text('trust_badges'),
  faqs: text('faqs'),
  socialLinks: text('social_links'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
  orderItems: many(orderItems),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  printJobs: many(printJobs),
  invoices: many(invoices),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const printJobsRelations = relations(printJobs, ({ one }) => ({
  order: one(orders, {
    fields: [printJobs.orderId],
    references: [orders.id],
  }),
  printer: one(printers, {
    fields: [printJobs.printerId],
    references: [printers.id],
  }),
  spool: one(filamentSpools, {
    fields: [printJobs.spoolId],
    references: [filamentSpools.id],
  }),
}));
