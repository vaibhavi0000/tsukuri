import React from 'react';
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck, Mail, Clock, Truck, Package, HelpCircle } from 'lucide-react';

interface RefundCancellationPolicyPageProps {
  onBackToStore: () => void;
  onOpenTermsOfService?: () => void;
}

export const RefundCancellationPolicyPage: React.FC<RefundCancellationPolicyPageProps> = ({
  onBackToStore,
  onOpenTermsOfService,
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
            <div className="w-6 h-6 rounded-lg bg-[#ea8f5a] text-white flex items-center justify-center font-bubbly text-xs">
              造
            </div>
            <span className="font-bubbly text-base text-[#1e4b3e] font-bold">
              TSUKURI·3D
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
              Buyer Protection Policy
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8 sm:pt-12 space-y-8">
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1e4b3e] via-[#214f42] to-[#122e26] text-white p-6 sm:p-10 shadow-xl border-4 border-white">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#ea8f5a]/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#f3b755]/15 blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 text-xs text-[#f3b755] font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#ea8f5a]" />
              <span>7-DAY MAKER GUARANTEE</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bubbly text-white tracking-tight">
              REFUND & CANCELLATION POLICY
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
              At <strong>TsuKURI_3D Studio</strong>, every piece is custom-printed on demand. Here is our transparent, hassle-free policy on order cancellations, damage in transit, reprints, and refund processing.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-300 font-mono">
              <span>Customer Satisfaction First</span>
              <span>•</span>
              <span>Free Reprint on Transit Damage</span>
              <span>•</span>
              <span>Prompt 5–7 Day Bank Reversals</span>
            </div>
          </div>
        </div>

        {/* 3 Pillars Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-[#1e4b3e]/15 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-2">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Cancellation Window</span>
            <p className="text-xs font-bold text-[#1e4b3e] mt-0.5">2-Hour Grace Period</p>
            <p className="text-[11px] text-slate-500 mt-1">Cancel before slicing and heating up print beds for an immediate 100% refund.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#1e4b3e]/15 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Transit Damage Cover</span>
            <p className="text-xs font-bold text-[#1e4b3e] mt-0.5">100% Free Reprint & Ship</p>
            <p className="text-[11px] text-slate-500 mt-1">If courier damages your parcel, email unboxing photos within 48 hours for immediate priority replacement.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#1e4b3e]/15 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mb-2">
              <RefreshCw className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Refund Processing</span>
            <p className="text-xs font-bold text-[#1e4b3e] mt-0.5">5 to 7 Business Days</p>
            <p className="text-[11px] text-slate-500 mt-1">Original payment channel (UPI / Credit Card / Debit Card / Net Banking) reversal.</p>
          </div>
        </div>

        {/* Detailed Sections Bento */}
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-xs border border-slate-200/80 space-y-8 text-xs leading-relaxed text-slate-700">
          {/* Section 1: Order Cancellation Policy */}
          <section className="space-y-3">
            <h2 className="font-bubbly text-base sm:text-lg text-[#1e4b3e] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#e8ece1] text-[#1e4b3e] flex items-center justify-center text-xs font-bold font-mono">1</span>
              <span>Order Cancellation Policy</span>
            </h2>
            <p>
              Because our solar-powered 3D printer fleet operates around the clock to meet our 3 to 4 days Pan-India promise, orders enter slicing and print queues rapidly:
            </p>
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <strong className="text-amber-900 block text-xs">⏰ 2-Hour Cancellation Window:</strong>
              <p className="text-[11px] text-slate-700">
                You may cancel your order within <strong>2 hours</strong> of placement with no cancellation penalty. If requested within this window, a <strong>100% full refund</strong> will be initiated immediately to your original payment mode.
              </p>
              <p className="text-[11px] text-slate-600">
                To cancel within 2 hours, email <a href="mailto:commersgyan@gmail.com" className="font-bold underline text-[#1e4b3e]">commersgyan@gmail.com</a> with subject line <em>"Cancel Order #[Your Order Number]"</em>.
              </p>
            </div>
            <p className="text-[11px] text-slate-500">
              * Once a 3D model has begun printing on our printer beds (after the 2-hour window), filament and machine run-time have been committed; therefore, cancellations cannot be accepted once printing is underway.
            </p>
          </section>

          {/* Section 2: Damaged, Defective, or Incorrect Deliveries */}
          <section className="space-y-3">
            <h2 className="font-bubbly text-base sm:text-lg text-[#1e4b3e] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#e8ece1] text-[#1e4b3e] flex items-center justify-center text-xs font-bold font-mono">2</span>
              <span>Damaged in Transit & Quality Guarantee</span>
            </h2>
            <p>
              We stand 100% behind the structural integrity and aesthetic craft of every model dispatched from our Kyoto-Indo workshop:
            </p>
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <strong className="text-emerald-950 block text-xs">🛡️ 7-Day Replacement Guarantee:</strong>
              <p className="text-[11px] text-slate-700">
                If your package arrives damaged due to rough courier handling, broken components, or if you received an incorrect color/variant, we will fabricate and ship a <strong>brand-new replacement completely free of charge</strong>.
              </p>
              <div className="pt-1 space-y-1 text-[11px] text-slate-600">
                <p><strong>Step 1:</strong> Take 2–3 clear photos or a short unboxing video showing the shipping box label and the damaged part.</p>
                <p><strong>Step 2:</strong> Email us at <a href="mailto:commersgyan@gmail.com" className="font-bold underline text-[#1e4b3e]">commersgyan@gmail.com</a> within <strong>48 hours</strong> of package delivery.</p>
                <p><strong>Step 3:</strong> Our engineering desk will review and queue a replacement print within 24 hours at zero extra charge.</p>
              </div>
            </div>
          </section>

          {/* Section 3: Return Eligibility & Exceptions */}
          <section className="space-y-3">
            <h2 className="font-bubbly text-base sm:text-lg text-[#1e4b3e] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#e8ece1] text-[#1e4b3e] flex items-center justify-center text-xs font-bold font-mono">3</span>
              <span>Non-Returnable Scenarios</span>
            </h2>
            <p>
              Due to the custom, made-to-order nature of 3D printing, the following situations are not eligible for returns or refunds:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong>Normal FDM 3D Layer Textures:</strong> Subtle microscopic layer lines (0.12mm to 0.16mm) and minor surface seam lines are standard engineering characteristics of bio-PLA additive manufacturing.
              </li>
              <li>
                <strong>Incorrect Customer Delivery Address:</strong> Parcels returned as undeliverable due to incomplete address or incorrect PIN code entered during checkout will be re-dispatched upon address verification for standard re-shipping courier fee.
              </li>
              <li>
                <strong>Change of Mind Post-Print:</strong> Because models are custom fabricated upon order, returns for change of mind after delivery are not eligible.
              </li>
              <li>
                <strong>Thermal Misuse:</strong> Warping caused by placing PLA items in dishwashers, boiling water, or inside hot parked vehicles under high heat (&gt;55°C).
              </li>
            </ul>
          </section>

          {/* Section 4: Refund Processing & Reversal Timelines */}
          <section className="space-y-3">
            <h2 className="font-bubbly text-base sm:text-lg text-[#1e4b3e] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#e8ece1] text-[#1e4b3e] flex items-center justify-center text-xs font-bold font-mono">4</span>
              <span>Refund Timelines & Method of Credit</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-[#1e4b3e] block mb-1">Prepaid Orders (UPI / Gateway)</strong>
                <p className="text-[11px] text-slate-600">
                  Approved refunds are reversed directly back to the original funding account (UPI ID, Debit Card, Credit Card, or Net Banking) within <strong>5 to 7 business days</strong> as per banking network standards.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-[#1e4b3e] block mb-1">Cash on Delivery (COD) Orders</strong>
                <p className="text-[11px] text-slate-600">
                  For eligible COD returns, refunds will be transferred electronically via instant UPI transfer (VPA) or NEFT bank transfer upon receiving your verified bank details.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Contact Helpdesk */}
          <section className="space-y-2.5 border-t border-slate-100 pt-6">
            <h2 className="font-bubbly text-base sm:text-lg text-[#1e4b3e] flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#ea8f5a]" />
              <span>Contact Support for Return / Replacement Claims</span>
            </h2>
            <p>
              We are dedicated to making sure you love what's on your desk or shelf. For immediate assistance:
            </p>
            <div className="p-4 rounded-2xl bg-[#e8ece1]/50 border border-[#1e4b3e]/20 space-y-1">
              <p><strong>Official Helpdesk:</strong> Official Studio Support</p>
              <p><strong>Email:</strong> <a href="mailto:commersgyan@gmail.com" className="text-[#1e4b3e] font-bold underline font-mono">commersgyan@gmail.com</a></p>
              <p><strong>Response Time:</strong> Within 4–8 business hours</p>
              <p><strong>Operating Hours:</strong> Monday – Saturday, 9:30 AM – 7:30 PM IST</p>
            </div>
          </section>
        </div>

        {/* Cross-Link Footer Callout */}
        <div className="p-6 rounded-[2rem] bg-[#1e4b3e]/10 border-2 border-[#1e4b3e]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1e4b3e] block">
              STORE POLICIES & CODE OF SERVICE
            </span>
            <h3 className="font-bubbly text-base text-[#1a2e26] mt-0.5">
              Want to Review General Store Terms?
            </h3>
            <p className="text-xs text-slate-600">
              Read our full Terms of Service covering custom fabrication rights, pricing rules, and logistics.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenTermsOfService}
            className="px-5 py-2.5 rounded-full bg-[#1e4b3e] hover:bg-[#15342b] text-[#f3b755] font-bubbly text-xs tracking-wider shrink-0 cursor-pointer transition-colors shadow-sm"
          >
            TERMS OF SERVICE →
          </button>
        </div>
      </main>
    </div>
  );
};
