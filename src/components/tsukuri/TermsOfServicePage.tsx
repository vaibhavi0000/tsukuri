import React from 'react';
import { ArrowLeft, Shield, FileText, CheckCircle2, Scale, Mail, HelpCircle, ExternalLink } from 'lucide-react';

interface TermsOfServicePageProps {
  onBackToStore: () => void;
  onOpenRefundPolicy?: () => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({
  onBackToStore,
  onOpenRefundPolicy,
}) => {
  return (
    <div className="min-h-screen bg-[#faf9f5] text-[#1a2e26] selection:bg-[#f3b755] selection:text-[#1a2e26] pb-20">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#1e4b3e]/10 py-3.5 px-4 sm:px-8 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToStore}
            className="flex items-center gap-2 text-xs font-bold text-[#1e4b3e] hover:text-[#2d6a56] cursor-pointer transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Return to Storefront</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#1e4b3e] text-[#f3b755] flex items-center justify-center font-bubbly text-xs">
              造
            </div>
            <span className="font-bubbly text-base text-[#1e4b3e] font-bold">
              TSUKURI·3D
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
              Legal Documentation
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8 sm:pt-12 space-y-8">
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1e4b3e] via-[#16382e] to-[#0f241e] text-white p-6 sm:p-10 shadow-xl border-4 border-white">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#f3b755]/15 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 text-xs text-[#f3b755] font-mono font-bold">
              <Scale className="w-3.5 h-3.5" />
              <span>OFFICIAL STORE AGREEMENT</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bubbly text-white tracking-tight">
              TERMS OF SERVICE
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
              These Terms of Service govern your purchase, customized 3D printing orders, and usage of the <strong>TsuKURI_3D Studio</strong> storefront and online services.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-300 font-mono">
              <span>Effective Date: January 1, 2026</span>
              <span>•</span>
              <span>Last Revised: October 2026</span>
              <span>•</span>
              <span>Jurisdiction: Bengaluru, India</span>
            </div>
          </div>
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-[#1e4b3e]/15 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">1. Custom Crafted</span>
            <p className="text-xs font-bold text-[#1e4b3e] mt-0.5">On-Demand 3D Fabrication</p>
            <p className="text-[11px] text-slate-500 mt-1">Every drop is printed layer-by-layer in bio-PLA with 0.12mm micro-precision.</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#1e4b3e]/15 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">2. Pan-India Delivery</span>
            <p className="text-xs font-bold text-[#1e4b3e] mt-0.5">3 to 4 Days Express ETA</p>
            <p className="text-[11px] text-slate-500 mt-1">Dispatched via BlueDart / Shiprocket with real-time AWB tracking numbers.</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#1e4b3e]/15 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">3. Buyer Cover</span>
            <p className="text-xs font-bold text-[#1e4b3e] mt-0.5">7-Day Transit Cover</p>
            <p className="text-[11px] text-slate-500 mt-1">Damaged in transit? Free reprint & replacement cover upon unboxing photo proof.</p>
          </div>
        </div>

        {/* Legal Sections Bento */}
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-xs border border-slate-200/80 space-y-8 text-xs leading-relaxed text-slate-700">
          {/* Section 1 */}
          <section className="space-y-2.5">
            <h2 className="font-bubbly text-base sm:text-lg text-[#1e4b3e] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#e8ece1] text-[#1e4b3e] flex items-center justify-center text-xs font-bold font-mono">1</span>
              <span>Acceptance of Terms</span>
            </h2>
            <p>
              By accessing, browsing, or placing an order on the <strong>TsuKURI_3D Studio</strong> storefront (including checkout via Cash on Delivery, Inline UPI QR, or Apex Live Payment Gateway), you acknowledge that you have read, understood, and agree to be legally bound by these Terms of Service and our associated <button type="button" onClick={onOpenRefundPolicy} className="text-[#1e4b3e] font-bold underline cursor-pointer hover:text-[#ea8f5a]">Refund and Cancellation Policy</button>. If you do not agree to these terms, please do not use our payment services or place orders.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2.5">
            <h2 className="font-bubbly text-base sm:text-lg text-[#1e4b3e] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#e8ece1] text-[#1e4b3e] flex items-center justify-center text-xs font-bold font-mono">2</span>
              <span>Nature of 3D Printing & Fabrication Characteristics</span>
            </h2>
            <p>
              TsuKURI_3D products are manufactured using state-of-the-art additive manufacturing (3D printing) utilizing sustainable Bio-Matte PLA and engineering-grade PETG filaments:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong>Additive Layer Lines:</strong> High-precision FDM 3D printing forms objects layer-by-layer (0.12mm to 0.20mm layer height). Subtle microscopic layer striations, seam lines, or organic matte textures are inherent characteristics of artisan 3D printing and are celebrated as maker hallmarks rather than defects.
              </li>
              <li>
                <strong>Color Variations:</strong> Raw biodegradable filament batches may display minor shade or sheen variations between print runs. Studio product photography is shot under balanced daylight studio lighting.
              </li>
              <li>
                <strong>Thermal Caution:</strong> Standard PLA products should not be exposed to temperatures exceeding 55°C (131°F), such as prolonged exposure inside enclosed cars in direct summer sunlight or boiling dishwashers.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2.5">
            <h2 className="font-bubbly text-base sm:text-lg text-[#1e4b3e] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#e8ece1] text-[#1e4b3e] flex items-center justify-center text-xs font-bold font-mono">3</span>
              <span>Pricing, Payments & Discounts</span>
            </h2>
            <p>
              All prices listed on the website are in <strong>Indian Rupees (INR / ₹)</strong> and are inclusive of standard applicable GST unless otherwise stated on official tax invoices.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-[#1e4b3e] block mb-1">Instant Online Discount</strong>
                <p className="text-[11px] text-slate-600">
                  Orders paid via Online Gateway or verified UPI QR receive an automatic ₹10 studio discount to encourage seamless digital payments.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
                <strong className="text-amber-900 block mb-1">Cash on Delivery (COD) Terms</strong>
                <p className="text-[11px] text-slate-700">
                  A ₹50 handling charge applies to COD orders. Customers must provide an active phone number and accept the parcel upon courier delivery.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-2.5">
            <h2 className="font-bubbly text-base sm:text-lg text-[#1e4b3e] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#e8ece1] text-[#1e4b3e] flex items-center justify-center text-xs font-bold font-mono">4</span>
              <span>Shipping, Delivery & Pan-India Logistics</span>
            </h2>
            <p>
              Orders are dispatched Pan-India through our logistics partners (BlueDart Surface Express, Xpressbees, Shadowfax, and Shiprocket Express):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Fulfillment & Slicing Timeline:</strong> 12 to 24 hours printing and quality deburring.</li>
              <li><strong>Courier Transit Time:</strong> 3 to 4 business days Pan-India express delivery.</li>
              <li><strong>Tracking:</strong> Live Shiprocket AWB tracking numbers are generated and emailed with your automated GST invoice receipt upon shipment manifestation.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-2.5">
            <h2 className="font-bubbly text-base sm:text-lg text-[#1e4b3e] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#e8ece1] text-[#1e4b3e] flex items-center justify-center text-xs font-bold font-mono">5</span>
              <span>Intellectual Property & Custom CAD Models</span>
            </h2>
            <p>
              Designs showcased under the TsuKURI_3D catalog are proprietary creations or used under commercial fabrication licenses. When uploading custom STL/OBJ files through our CAD studio portal, you represent and warrant that you own or have obtained all necessary copyright permissions and licenses to fabricate the 3D model.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-2.5">
            <h2 className="font-bubbly text-base sm:text-lg text-[#1e4b3e] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#e8ece1] text-[#1e4b3e] flex items-center justify-center text-xs font-bold font-mono">6</span>
              <span>Governing Law & Dispute Resolution</span>
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of <strong>India</strong>. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>Bengaluru, Karnataka</strong>.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-2.5 border-t border-slate-100 pt-6">
            <h2 className="font-bubbly text-base sm:text-lg text-[#1e4b3e] flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#ea8f5a]" />
              <span>Official Studio Support Desk</span>
            </h2>
            <p>
              For any legal questions, order clarifications, or assistance with terms:
            </p>
            <div className="p-4 rounded-2xl bg-[#e8ece1]/50 border border-[#1e4b3e]/20 space-y-1">
              <p><strong>Studio:</strong> TsuKURI_3D Studio (Kyoto × Nusantara 3D Fabrication Lab)</p>
              <p><strong>Support Email:</strong> <a href="mailto:commersgyan@gmail.com" className="text-[#1e4b3e] font-bold underline font-mono">commersgyan@gmail.com</a></p>
              <p><strong>Registered Base:</strong> Plot 42, HSR Layout Sector 1, Bengaluru, Karnataka, 560102 · GSTIN: 29AABCT3921Z1Z8</p>
            </div>
          </section>
        </div>

        {/* Cross-Link Footer Callout */}
        <div className="p-6 rounded-[2rem] bg-[#ea8f5a]/15 border-2 border-[#ea8f5a]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#ea8f5a] block">
              RETURN & REFUND PROVISIONS
            </span>
            <h3 className="font-bubbly text-base text-[#1a2e26] mt-0.5">
              Need Details on Returns or Slicing Cancellations?
            </h3>
            <p className="text-xs text-slate-600">
              View our complete, customer-first policy covering transit damage, reprinting guarantees, and cancellation windows.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenRefundPolicy}
            className="px-5 py-2.5 rounded-full bg-[#1e4b3e] hover:bg-[#15342b] text-[#f3b755] font-bubbly text-xs tracking-wider shrink-0 cursor-pointer transition-colors shadow-sm"
          >
            REFUND & CANCELLATION POLICY →
          </button>
        </div>
      </main>
    </div>
  );
};
