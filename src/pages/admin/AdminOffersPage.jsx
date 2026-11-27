import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BadgePercent,
  PlusCircle,
  Tag,
  Calendar,
  CheckCircle2,
  Trash2,
  Percent,
  Search,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { formatINR, formatDate, todayISO, addDays } from "@/lib/hotel/pricing.js";
import {
  addOffer,
  toggleOffer,
  useHotelState,
} from "@/lib/hotel/store.jsx";

export default function AdminOffersPage() {
  const state = useHotelState();
  const today = todayISO();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Form State for New Offer
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [discountType, setDiscountType] = useState("percentage"); // "percentage" | "fixed"
  const [discountValue, setDiscountValue] = useState("");
  const [minSpend, setMinSpend] = useState("3000");
  const [maxDiscount, setMaxDiscount] = useState("2000");
  const [validUntil, setValidUntil] = useState(addDays(today, 30));

  const offers = state.offers || [];

  const filteredOffers = offers.filter((o) => {
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        o.code.toLowerCase().includes(q) ||
        (o.title && o.title.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreateOffer = (e) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Please enter a coupon code.");
      return;
    }
    const val = Number(discountValue);
    if (!val || val <= 0) {
      toast.error("Please enter a valid discount value.");
      return;
    }

    addOffer({
      code: code.trim().toUpperCase(),
      title: title.trim() || `${code.toUpperCase()} Special Discount`,
      discountType,
      discountValue: val,
      minSpend: Number(minSpend) || 0,
      maxDiscount: Number(maxDiscount) || null,
      validUntil,
      active: true,
      usedCount: 0,
    });

    toast.success(`Promotional code ${code.toUpperCase()} published successfully!`);
    setCreateModalOpen(false);
    setCode("");
    setTitle("");
    setDiscountValue("");
  };

  const handleToggleActive = (offer) => {
    toggleOffer(offer.code);
    toast.success(`Offer ${offer.code} status updated to ${offer.active ? "Inactive" : "Active"}.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold/20 border border-gold/40 px-3 py-0.5 text-[11px] font-bold text-[#061830] uppercase tracking-wider">
              Marketing &amp; Revenue Yield
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-[#061830] mt-1">
            Promotional Coupons &amp; Special Rates
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Configure promotional discount vouchers, seasonal rate adjustments, corporate concessions, and min-spend validation rules.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110 transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="size-4" /> Create Promo Code
        </button>
      </div>

      {/* Offers Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredOffers.map((o) => (
          <div
            key={o.code}
            className={`rounded-2xl border bg-white p-5 shadow-card hover:shadow-lift transition flex flex-col justify-between ${
              o.active ? "border-gold/30" : "border-slate-300 opacity-60"
            }`}
          >
            <div>
              <div className="flex items-center justify-between border-b border-gold/15 pb-3">
                <span className="rounded-xl bg-gold/15 border border-gold/30 px-3 py-1 font-mono text-sm font-bold text-[#061830]">
                  {o.code}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    o.active
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {o.active ? "Active" : "Disabled"}
                </span>
              </div>

              <div className="pt-3 space-y-2">
                <h3 className="font-display text-base font-bold text-[#061830]">
                  {o.title}
                </h3>
                <div className="text-2xl font-bold text-gold">
                  {o.discountType === "percentage" ? `${o.discountValue}% OFF` : `₹${o.discountValue} FLAT OFF`}
                </div>
                <div className="text-xs text-[#64748b] space-y-1">
                  <div>Min Booking Spend: <strong>{formatINR(o.minSpend || 0)}</strong></div>
                  <div>Valid Until: <strong>{formatDate(o.validUntil)}</strong></div>
                  <div>Total Times Redeemed: <strong>{o.usedCount || 0} times</strong></div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gold/15 mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleToggleActive(o)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
                  o.active
                    ? "border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    : "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                {o.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Promo Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-gold/30 bg-white p-6 shadow-lift text-[#061830] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gold/15 pb-3">
              <h2 className="font-display text-lg font-bold">New Promotional Offer</h2>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-full p-1 hover:bg-slate-100 text-[#64748b]"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Coupon Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ROYAL20"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold uppercase text-[#061830]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Flat INR (₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Offer Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bareilly Winter Royal Escape"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Discount Value ({discountType === "percentage" ? "%" : "₹"}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder={discountType === "percentage" ? "15" : "1000"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Min Booking Spend (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="3000"
                    value={minSpend}
                    onChange={(e) => setMinSpend(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Valid Until Date
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-[#64748b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gold-gradient px-5 py-2 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110"
                >
                  Publish Offer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
