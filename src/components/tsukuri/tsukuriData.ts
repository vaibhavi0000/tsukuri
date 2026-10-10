export interface ProductReview {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
  images?: string[];
}

export interface ColorVariant {
  name: string;
  colorHex: string;
  priceAdjustment?: number;
  inStock?: boolean;
}

export interface ComboTierOffer {
  quantity: number;
  label: string; // e.g. "Buy 1 (Single Drop)", "Buy 2 (Duo Combo Pack)", "Buy 3 (Studio Mega Pack)"
  priceINR: number;
  savePercent?: number;
  popular?: boolean;
}

export interface CarouselVideoItem {
  id?: string;
  title?: string;
  url: string;
  poster?: string;
}

export interface TsukuriProduct {
  id: number;
  name: string;
  japaneseName: string;
  sku: string;
  category: 'Home & Zen' | 'Desk & Tech' | 'Wearables' | 'Custom CAD';
  priceINR: number;
  originalMRPINR?: number;
  discountPercent?: number;
  rating: number;
  reviewsCount: number;
  description: string;
  tagline: string;
  material: string;
  filamentType: 'Matte Matcha PLA' | 'Terracotta PETG' | 'Teak Wood Composite' | 'Silk Obsidian PLA' | 'Volcanic Basalt Ceramic';
  printTimeHours: number;
  weightGrams: number;
  imageUrl: string;
  images?: string[];
  videoUrl?: string;
  carouselVideos?: CarouselVideoItem[];
  badge?: string;
  customOfferBadge?: string;
  inStock: boolean;
  stockCount: number;
  dimensions: string;
  colorHex: string;
  colorVariants?: ColorVariant[];
  comboOffers?: ComboTierOffer[];
  features?: string[];
  reviews?: ProductReview[];
  deliveryPartner?: string;
  deliveryCharges?: number;
  deliveryEta?: string;
  videoPosition?: 'first' | 'after_1st' | 'after_2nd' | 'end';
  officialOfferText?: string;
}

export function formatMediaUrl(url?: string): string {
  if (!url) return '';
  if (typeof url !== 'string') return '';
  if (url.startsWith('/api/uploads/')) {
    return url.replace('/api/uploads/', '/uploads/');
  }
  return url;
}

export function formatPrice(priceINR: number): string {
  return `₹${Math.round(priceINR).toLocaleString('en-IN')}`;
}

export function formatIndianDate(dateStringOrTimestamp?: string | number | Date): string {
  if (!dateStringOrTimestamp) return 'N/A';
  try {
    const d = new Date(dateStringOrTimestamp);
    if (isNaN(d.getTime())) return String(dateStringOrTimestamp);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${day}/${month}/${year} at ${formattedHours}:${minutes} ${ampm}`;
  } catch {
    return String(dateStringOrTimestamp);
  }
}

export function formatIndianDateShort(dateStringOrTimestamp?: string | number | Date): string {
  if (!dateStringOrTimestamp) return 'N/A';
  try {
    const d = new Date(dateStringOrTimestamp);
    if (isNaN(d.getTime())) return String(dateStringOrTimestamp);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateStringOrTimestamp);
  }
}

export function calculatePaymentAdjustedTotal(
  subtotalINR: number,
  paymentMethod: 'COD' | 'Online' | 'ApexGateway' | 'UPI_QR',
  discountAmountINR: number = 0
): {
  codFee: number;
  onlineDiscount: number;
  finalTotal: number;
} {
  const isCod = paymentMethod === 'COD';
  const codFee = isCod ? 50 : 0;
  const onlineDiscount = !isCod ? 10 : 0;
  const discountedSubtotal = Math.max(0, subtotalINR - discountAmountINR);
  const finalTotal = Math.max(0, discountedSubtotal + codFee - onlineDiscount);
  return { codFee, onlineDiscount, finalTotal };
}

export const INITIAL_TSUKURI_PRODUCTS: TsukuriProduct[] = [
  {
    id: 57005,
    name: 'LL',
    sku: 'TSU-GEN-34',
    japaneseName: 'LL (造り)',
    category: 'Home & Zen',
    priceINR: 599,
    originalMRPINR: 999,
    discountPercent: 35,
    customOfferBadge: 'SPECIAL STUDIO DEAL: 20% OFF ON UPI',
    officialOfferText: 'SPECIAL STUDIO DEAL: 20% OFF ON UPI / ONLINE PAYMENT',
    videoPosition: 'end',
    colorVariants: [],
    comboOffers: [
      {
        quantity: 1,
        label: 'Single Piece (1x)',
        priceINR: 599,
        popular: false,
      },
      {
        quantity: 2,
        label: 'Duo Combo Pack (2x)',
        priceINR: 1099,
        savePercent: 12,
        popular: true,
      },
      {
        quantity: 3,
        label: 'Studio Trio Pack (3x)',
        priceINR: 1499,
        savePercent: 20,
        popular: false,
      },
    ],
    carouselVideos: [
      {
        id: 'vid-demo-1',
        title: '3D Print Timelapse & Slicing Quality',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-modern-minimalist-living-room-with-plants-41617-large.mp4',
      },
      {
        id: 'vid-1791273885128',
        title: 'Bambu Lab High-Precision Layer Finish',
        url: '/uploads/ll_carousel_vid_1_57005.mp4',
      },
      {
        id: 'vid-1791273904518',
        title: '360° Tactile Texture & Bio-PLA Craft',
        url: '/uploads/ll_carousel_vid_2_57005.mp4',
      },
      {
        id: 'vid-1791273951214',
        title: 'Self-Watering Chamber Water Flow Test',
        url: '/uploads/ll_carousel_vid_3_57005.mp4',
      },
    ],
    deliveryPartner: 'BlueDart Surface Express',
    deliveryCharges: 49,
    deliveryEta: '3 to 4 Days Pan-India',
    rating: 5,
    reviewsCount: 1,
    description: 'Parametric golden ratio ribbed architecture with self-watering chamber. The chamber GOD.',
    tagline: 'Parametric golden ratio ribbed architecture w',
    material: 'Bio-Matte Matcha PLA',
    filamentType: 'Matte Matcha PLA',
    weightGrams: 165,
    printTimeHours: 4.5,
    dimensions: '140 × 140 × 120 mm',
    imageUrl: '/uploads/messho_5_png_1791273714584_2337.png',
    images: [
      '/uploads/messho_5_png_1791273714584_2337.png',
      '/uploads/mesho_6_png_1791273715184_93.png',
      '/uploads/mesho_4_png_1791273715828_7926.png',
      '/uploads/mesho_3_png_1791273716653_2808.png',
      '/uploads/mesho_2_png_1791273717397_4048.png',
    ],
    videoUrl: '/uploads/ll_hero_timelapse_57005.mp4',
    inStock: true,
    stockCount: 24,
    colorHex: '#607d64',
    badge: '35% OFF',
  },
  {
    id: 1,
    name: 'Zen Wave Planter',
    japaneseName: '波・植木鉢 (Nami Hachi)',
    sku: 'TSU-PLN-01',
    category: 'Home & Zen',
    priceINR: 599,
    originalMRPINR: 799,
    discountPercent: 25,
    rating: 4.9,
    reviewsCount: 128,
    description: 'Organic ribbed architecture sculpted with golden ratio parametric waves. Features hidden self-watering capillary reservoir and Japanese drainage grid.',
    tagline: 'Organic ribbed planter with self-watering reservoir',
    material: 'Bio-Matte Matcha PLA',
    filamentType: 'Matte Matcha PLA',
    printTimeHours: 4.5,
    weightGrams: 165,
    imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=700&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=700&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=700&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=700&auto=format&fit=crop&q=80',
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-modern-minimalist-living-room-with-plants-41617-large.mp4',
    carouselVideos: [
      {
        id: 'vid-1',
        title: 'Parametric Water Flow Test & Slicing Quality',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-modern-minimalist-living-room-with-plants-41617-large.mp4',
      },
      {
        id: 'vid-2',
        title: '360° Studio Craft Presentation & Matte Finish',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-curved-white-ceramic-decorations-on-a-table-41618-large.mp4',
      },
    ],
    badge: '25% OFF',
    customOfferBadge: 'LIMITED DROP COMBO: BUY 2 GET ₹99 OFF',
    inStock: true,
    stockCount: 24,
    dimensions: '140 × 140 × 120 mm',
    colorHex: '#607d64',
    colorVariants: [
      { name: 'Kyoto Matcha Green', colorHex: '#607d64', priceAdjustment: 0, inStock: true },
      { name: 'Earthy Terracotta', colorHex: '#ea8f5a', priceAdjustment: 0, inStock: true },
      { name: 'Obsidian Matte Black', colorHex: '#222222', priceAdjustment: 50, inStock: true },
      { name: 'Wabi-Sabi Sandstone', colorHex: '#d8cbb8', priceAdjustment: 0, inStock: true },
    ],
    comboOffers: [
      { quantity: 1, label: 'Single Piece', priceINR: 599, popular: false },
      { quantity: 2, label: 'Duo Combo (Pair for Desk & Shelf)', priceINR: 1099, savePercent: 12, popular: true },
      { quantity: 3, label: 'Studio Trio Pack (3 Colors)', priceINR: 1499, savePercent: 20, popular: false },
    ],
    features: [
      'Hidden internal water chamber prevents root rot',
      'Matte matcha green finish with subtle layer ribbing',
      '100% biodegradable cornstarch-based bio-PLA',
      'Precision printed on Bambu Lab X1-Carbon',
    ],
    reviews: [
      {
        id: 'rev-1',
        author: 'Arjun K.',
        location: 'Bengaluru, KA',
        rating: 5,
        date: '2 days ago',
        comment: 'The self-watering capillary design works like magic for my desk succulent. The matte matcha texture feels super premium.',
        verified: true,
      },
      {
        id: 'rev-2',
        author: 'Ren Tanaka',
        location: 'Higashiyama, Kyoto',
        rating: 5,
        date: '1 week ago',
        comment: 'Beautiful parametric curves. Exactly matches the modern Japanese wabi-sabi vibe on my monitor riser.',
        verified: true,
      },
      {
        id: 'rev-3',
        author: 'Sneha Roy',
        location: 'Mumbai, MH',
        rating: 4.8,
        date: '2 weeks ago',
        comment: 'Fast delivery! Got ₹10 off on UPI payment. Packed securely in an eco origami box with zero plastic.',
        verified: true,
      },
    ],
  },
  {
    id: 2,
    name: 'Matcha Artisan Keycaps',
    japaneseName: '抹茶キーキャップ (Matcha)',
    sku: 'TSU-KCP-02',
    category: 'Desk & Tech',
    priceINR: 749,
    originalMRPINR: 999,
    discountPercent: 25,
    rating: 5.0,
    reviewsCount: 94,
    description: 'Set of 4 artisan MX mechanical keycaps embossed with Kyoto cyber kanji and tactile organic ripple texture.',
    tagline: 'Set of 4 tactile MX mechanical keycaps with Kyoto kanji',
    material: 'Resin-Coated Silk PLA',
    filamentType: 'Matte Matcha PLA',
    printTimeHours: 2.1,
    weightGrams: 35,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=700&auto=format&fit=crop&q=80',
    ],
    badge: 'BESTSELLER',
    inStock: true,
    stockCount: 42,
    dimensions: '18 × 18 × 12 mm each',
    colorHex: '#8da88a',
    features: [
      'Universal Cherry MX stem fit',
      'Dual-extrusion cyber kanji legends that never fade',
      'Ergonomic R4 sculpted profile',
      'Smooth UV-cured tactile matte coat',
    ],
    reviews: [
      {
        id: 'rev-4',
        author: 'Dhruv M.',
        location: 'Delhi NCR',
        rating: 5,
        date: '3 days ago',
        comment: 'Fits my Keychron Q1 perfectly! The thock acoustic profile is incredible thanks to the dense infill.',
        verified: true,
      },
    ],
  },
  {
    id: 3,
    name: 'Bento Desk Organizer',
    japaneseName: '弁当・整理箱 (Bento Tidy)',
    sku: 'TSU-ORG-03',
    category: 'Desk & Tech',
    priceINR: 999,
    originalMRPINR: 1299,
    discountPercent: 23,
    rating: 4.8,
    reviewsCount: 67,
    description: 'Modular magnetic desk organizer inspired by traditional Kyoto lacquered bento boxes with teak wood filament inlay.',
    tagline: 'Modular magnetic teak & PLA stationery station',
    material: 'Recycled Teak Wood PLA',
    filamentType: 'Teak Wood Composite',
    printTimeHours: 6.8,
    weightGrams: 280,
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584727638096-042c45049ebe?w=700&auto=format&fit=crop&q=80',
    ],
    badge: 'GEN Z FAV',
    inStock: true,
    stockCount: 18,
    dimensions: '210 × 120 × 45 mm',
    colorHex: '#8b5a2b',
    features: [
      'Neodymium magnetic snaps join modular compartments',
      'Real Indonesian reclaimed teak wood flour infused filament',
      'Dedicated slots for Apple Pencil, AirPods, keys, and phone',
      'Anti-scratch cork base pads included',
    ],
    reviews: [
      {
        id: 'rev-5',
        author: 'Kavya N.',
        location: 'Hyderabad, TS',
        rating: 5,
        date: '5 days ago',
        comment: 'Actually smells like real teak wood! Magnetic snaps feel so satisfying when organizing my EDC items.',
        verified: true,
      },
    ],
  },
  {
    id: 4,
    name: 'Torii Headphone Rest',
    japaneseName: '鳥居・スタンド (Torii Stand)',
    sku: 'TSU-HST-04',
    category: 'Desk & Tech',
    priceINR: 1299,
    originalMRPINR: 1699,
    discountPercent: 24,
    rating: 4.9,
    reviewsCount: 112,
    description: 'Minimalist architectural headphone cradle evoking the sacred Torii gates of Fushimi Inari with heavy anti-slip weighted base.',
    tagline: 'Architectural Kyoto Torii gate headphone rest',
    material: 'Terracotta Matte PETG',
    filamentType: 'Terracotta PETG',
    printTimeHours: 8.2,
    weightGrams: 340,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80',
    badge: 'ARCHITECTURAL',
    inStock: true,
    stockCount: 15,
    dimensions: '130 × 110 × 260 mm',
    colorHex: '#ea8f5a',
    features: [
      'Ergonomic curved beam prevents headband creasing',
      'Integrated rear cable management spool hook',
      'Solid 25% gyroid infill for rock-solid stability',
      'Terracotta orange matte ceramic feel',
    ],
    reviews: [
      {
        id: 'rev-6',
        author: 'Ishan B.',
        location: 'Pune, MH',
        rating: 5,
        date: '1 week ago',
        comment: 'Holds my Sony WH-1000XM5 perfectly without denting the padding. Stunning architectural design piece.',
        verified: true,
      },
    ],
  },
  {
    id: 5,
    name: 'Origami Crane Lithophane Lamp',
    japaneseName: '折鶴・行灯 (Tsuru Lamp)',
    sku: 'TSU-LMP-05',
    category: 'Home & Zen',
    priceINR: 1499,
    originalMRPINR: 1999,
    discountPercent: 25,
    rating: 5.0,
    reviewsCount: 88,
    description: 'Geometric folded-paper aesthetic ambient night lamp. 100% infill translucent lithophane shell casting serene origami shadow play.',
    tagline: 'Ambient night lamp with USB-C warm LED base',
    material: 'Translucent Opal White PLA',
    filamentType: 'Silk Obsidian PLA',
    printTimeHours: 9.5,
    weightGrams: 240,
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=700&auto=format&fit=crop&q=80',
    badge: 'LIMITED DROP',
    inStock: true,
    stockCount: 9,
    dimensions: '160 × 160 × 190 mm',
    colorHex: '#faf6ee',
    features: [
      'High-precision 0.12mm fine layer lithophane folding',
      'Warm 2700K ambient LED puck with magnetic USB-C charging',
      'Touch capacitive 3-step dimmer switch',
      'Hypnotic geometric origami shadow projection',
    ],
  },
  {
    id: 6,
    name: 'Lotus Basalt Incense Altar',
    japaneseName: '蓮華・香炉 (Renka Koro)',
    sku: 'TSU-INC-06',
    category: 'Home & Zen',
    priceINR: 499,
    originalMRPINR: 699,
    discountPercent: 28,
    rating: 4.7,
    reviewsCount: 53,
    description: 'Heat-resistant textured volcanic basalt composite holder for Japanese stick incense and Indonesian sandalwood cones.',
    tagline: 'Zen backflow aroma vessel with ash tray',
    material: 'Volcanic Basalt Ceramic PLA',
    filamentType: 'Volcanic Basalt Ceramic',
    printTimeHours: 3.8,
    weightGrams: 145,
    imageUrl: 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=700&auto=format&fit=crop&q=80',
    inStock: true,
    stockCount: 31,
    dimensions: '110 × 110 × 35 mm',
    colorHex: '#3b3e3c',
    features: [
      'Heat safe up to 110°C with mineral composite infill',
      'Dual-hole brass insert holds both thin and thick incense',
      'Textured volcanic rock tactile matte finish',
      'Removable magnetic ash catching dish',
    ],
  },
  {
    id: 7,
    name: 'Cyber Oni Desk Mascot',
    japaneseName: '鬼・マスコット (Cyber Oni)',
    sku: 'TSU-FIG-07',
    category: 'Wearables',
    priceINR: 899,
    originalMRPINR: 1199,
    discountPercent: 25,
    rating: 4.9,
    reviewsCount: 140,
    description: 'Dual-extrusion neon Japanese folkloric demon mask with hollow LED eyes and magnetic wall/desk mount.',
    tagline: 'High-poly neon desk guardian',
    material: 'Silk Obsidian PLA + Neon PETG',
    filamentType: 'Silk Obsidian PLA',
    printTimeHours: 7.2,
    weightGrams: 195,
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=700&auto=format&fit=crop&q=80',
    badge: 'COLLECTOR',
    inStock: true,
    stockCount: 12,
    dimensions: '120 × 90 × 140 mm',
    colorHex: '#1e4b3e',
    features: [
      'Dual-color filament transition with neon accents',
      'Aggressive cyberpunk low-poly geometric styling',
      'Dual high-grade rear neodymium magnets',
    ],
  },
  {
    id: 8,
    name: 'Indo Teak Hex Coasters (Set of 4)',
    japaneseName: '六角・茶托 (Rokkaku Chaku)',
    sku: 'TSU-CST-08',
    category: 'Home & Zen',
    priceINR: 399,
    originalMRPINR: 549,
    discountPercent: 27,
    rating: 4.8,
    reviewsCount: 76,
    description: 'Set of 4 interlocking hexagonal drink coasters printed with real aromatic teak wood grain and waterproof organic beeswax coat.',
    tagline: 'Interlocking geometric tea coasters',
    material: 'Recycled Teak Wood PLA',
    filamentType: 'Teak Wood Composite',
    printTimeHours: 3.2,
    weightGrams: 110,
    imageUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=700&auto=format&fit=crop&q=80',
    inStock: true,
    stockCount: 50,
    dimensions: '95 × 95 × 8 mm each',
    colorHex: '#9c6f44',
    features: [
      'Interlocking tessellation creates instant hot pot trivet',
      'Real Indonesian reclaimed teak aroma',
      'Water resistant organic beeswax hand buffed finish',
    ],
  },
];

export interface CartItem {
  product: TsukuriProduct;
  quantity: number;
  selectedColor?: string;
  selectedComboLabel?: string;
  customPriceINR?: number;
}

export interface WorkshopOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  items: Array<{
    productId?: number;
    name: string;
    quantity: number;
    priceINR: number;
  }>;
  subtotalINR: number;
  paymentMethod: 'COD' | 'Online';
  codFee: number;
  onlineDiscount: number;
  totalAmountINR: number;
  status: 'New' | 'Confirmed' | 'In Production' | 'Printed' | 'Post-processing' | 'Packed' | 'Shipped' | 'Delivered' | 'Returned/Cancelled';
  paymentStatus: 'Paid' | 'COD' | 'Pending' | 'Refunded';
  orderDate: string;
  courier?: string;
  trackingNumber?: string;
  notes?: string;
}

export interface UserAccount {
  name: string;
  email: string;
  phone?: string;
  token?: string;
}

export interface StudioSettings {
  brandName: string;
  gstinNumber: string;
  workshopAddress: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  deliveryPartner: string;
  deliveryCharges: number;
  deliveryEta: string;
  chargeGst?: boolean;
  gstRate?: number;
}

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  brandName: 'Tsukuri3D',
  gstinNumber: '',
  workshopAddress: 'Plot 42, HSR Layout Sector 1, Bengaluru, Karnataka 560102',
  supportEmail: 'commersgyan@gmail.com',
  supportPhone: '+91 98450 33021',
  currency: 'INR (₹)',
  deliveryPartner: 'Shadowfax Express Logistics (Production Token: a6a05ac9ce3595a4b1461d07fd83363e1f32d32d)',
  deliveryCharges: 0,
  deliveryEta: '3 to 4 Days Pan-India',
  chargeGst: false,
  gstRate: 18,
};
