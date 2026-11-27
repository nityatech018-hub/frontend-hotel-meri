import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, BedDouble, Wind, Users, Check, Sparkles, Filter, RotateCcw, Calendar } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout.jsx";
import { PageHero } from "@/components/site/PageHero.jsx";
import { RoomCard } from "@/components/site/RoomCard.jsx";
import { AmenitiesSection } from "@/components/site/AmenitiesSection.jsx";
import { Marquee } from "@/components/site/Motion.jsx";
import { useHotelState, availableUnits } from "@/lib/hotel/store.jsx";
import { formatINR, todayISO, addDays } from "@/lib/hotel/pricing.js";
import { IMG } from "@/lib/hotel/images.js";

const ROOM_PERKS = [
  "Marble Bathrooms",
  "High-Speed Wi-Fi",
  "24-Hour Front Desk & Concierge",
  "Plush Orthopedic Mattresses",
  "Daily Housekeeping",
  "Soundproof Windows",
  "Authentic 5% GST Accommodation Billing",
];

export default function RoomsPage() {
  const [params] = useSearchParams();
  const state = useHotelState();
  const today = todayISO();

  // Filters State (Category-only view for guests; physical room numbers assigned by Reception)
  const [acFilter, setAcFilter] = useState("all"); // "all" | "ac" | "non-ac"
  const [categoryFilter, setCategoryFilter] = useState(params.get("category") || "all");
  const [bedFilter, setBedFilter] = useState("all");
  const [capacityFilter, setCapacityFilter] = useState(params.get("guests") || "all");
  const [priceMax, setPriceMax] = useState(2000);
  const [priceMin, setPriceMin] = useState(900);
  const [checkIn, setCheckIn] = useState(params.get("checkIn") || today);
  const [checkOut, setCheckOut] = useState(params.get("checkOut") || addDays(today, 1));
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("number"); // "number" | "price-asc" | "price-desc" | "capacity"

  // Bed Types in actual inventory
  const bedTypes = ["Double Bed", "Triple Bed", "Queen Round Bed"];

  const resetFilters = () => {
    setAcFilter("all");
    setCategoryFilter("all");
    setBedFilter("all");
    setCapacityFilter("all");
    setPriceMin(900);
    setPriceMax(2000);
    setSearch("");
    setSortBy("number");
  };

  const hasActiveFilters =
    acFilter !== "all" ||
    categoryFilter !== "all" ||
    bedFilter !== "all" ||
    capacityFilter !== "all" ||
    priceMin > 900 ||
    priceMax < 2000 ||
    search.trim() !== "";

  // Filtered physical rooms (Rooms 101–110)
  const filteredRooms = useMemo(() => {
    return state.rooms
      .filter((r) => r.isPublished !== false)
      .filter((r) => {
        const isAcRoom = r.isAc !== false && r.categoryId !== "non-ac" && r.categoryId !== "non-ac-double";
        if (acFilter === "ac" && !isAcRoom) return false;
        if (acFilter === "non-ac" && isAcRoom) return false;
        if (categoryFilter !== "all" && r.categoryId !== categoryFilter) return false;
        if (bedFilter !== "all" && (r.bedType || r.bed) !== bedFilter) return false;
        if (capacityFilter !== "all" && String(r.capacity || 2) !== String(capacityFilter)) return false;
        if (r.price < priceMin || r.price > priceMax) return false;

        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const matchNum = String(r.number).includes(q);
          const matchCat = (r.categoryId || "").toLowerCase().includes(q);
          const matchBed = (r.bedType || r.bed || "").toLowerCase().includes(q);
          return matchNum || matchCat || matchBed;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") {
          return (a.price || 1200) - (b.price || 1200);
        }
        if (sortBy === "price-desc") {
          return (b.price || 1200) - (a.price || 1200);
        }
        if (sortBy === "capacity") {
          return (b.capacity || 2) - (a.capacity || 2);
        }
        return String(a.number).localeCompare(String(b.number), undefined, { numeric: true });
      });
  }, [state.rooms, acFilter, categoryFilter, bedFilter, capacityFilter, priceMin, priceMax, search, sortBy]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return state.categories.filter((cat) => {
      const isAcCat = cat.id !== "non-ac" && cat.id !== "non-ac-double";
      if (acFilter === "ac" && !isAcCat) return false;
      if (acFilter === "non-ac" && isAcCat) return false;
      if (categoryFilter !== "all" && cat.id !== categoryFilter) return false;
      if (bedFilter !== "all" && cat.bed !== bedFilter) return false;
      if (capacityFilter !== "all" && String(cat.maxGuests) !== String(capacityFilter)) return false;
      if (cat.price < priceMin || cat.price > priceMax) return false;
      return true;
    });
  }, [state.categories, acFilter, categoryFilter, bedFilter, capacityFilter, priceMin, priceMax]);

  return (
    <SiteLayout>
      <PageHero
        image={IMG.suite}
        eyebrow="Accommodations"
        title={
          <>
            Rest like <em className="text-gold">royalty</em>
          </>
        }
        subtitle="10 impeccably appointed rooms across four distinct configurations: AC Family Double Bed, AC Family Triple Bed, AC Premium Queen Round Bed, and Non-AC Double Bed."
      />

      {/* Ribbon */}
      <div className="mt-4">
        <Marquee items={ROOM_PERKS} />
      </div>

      {/* Rooms & Suites Catalog */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gold/20 pb-5">
            <div>
              <p className="eyebrow text-gold font-semibold uppercase tracking-wider">Accommodations</p>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-[#061830]">
                Explore Our Room Categories
              </h2>
              <p className="mt-1 text-xs text-[#64748b]">
                Family Room (AC Double, AC Triple, AC Queen Round) and Classic Room (Non-AC Double). Room numbers are assigned at Reception.
              </p>
            </div>
          </div>

          {/* Interactive Multi-Filter Control Box */}
          <div className="rounded-2xl border border-gold/30 bg-white p-4 sm:p-5 shadow-card space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              {/* Search */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Room # or Bed..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#FAF7F2] pl-8 pr-3 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Climate (AC / Non-AC) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Climate Type
                </label>
                <select
                  value={acFilter}
                  onChange={(e) => setAcFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#FAF7F2] px-3 py-2 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none"
                >
                  <option value="all">All Climate (AC & Non-AC)</option>
                  <option value="ac">AC Rooms (5)</option>
                  <option value="non-ac">Non-AC Rooms (5)</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Room Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#FAF7F2] px-3 py-2 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {state.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bed Type */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Bed Configuration
                </label>
                <select
                  value={bedFilter}
                  onChange={(e) => setBedFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#FAF7F2] px-3 py-2 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none"
                >
                  <option value="all">All Bed Types</option>
                  {bedTypes.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Max Guests
                </label>
                <select
                  value={capacityFilter}
                  onChange={(e) => setCapacityFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#FAF7F2] px-3 py-2 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none"
                >
                  <option value="all">Any Occupancy</option>
                  <option value="2">2 Guests (Double Bed)</option>
                  <option value="3">3 Guests (Triple Bed)</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#FAF7F2] px-3 py-2 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none"
                >
                  <option value="number">Room Number (101-110)</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="capacity">Capacity: High to Low</option>
                </select>
              </div>
            </div>

            {/* Bottom Row: Date Filter & Reset Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
                  <Calendar className="size-3.5 text-gold" /> Check Availability:
                </span>
                <input
                  type="date"
                  value={checkIn}
                  min={today}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    if (e.target.value >= checkOut) {
                      setCheckOut(addDays(e.target.value, 1));
                    }
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 font-semibold"
                  title="Check-In"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={checkOut}
                  min={addDays(checkIn, 1)}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 font-semibold"
                  title="Check-Out"
                />
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 text-[11px] font-bold transition cursor-pointer"
                >
                  <RotateCcw className="size-3" /> Reset All Filters
                </button>
              )}
            </div>
          </div>

          {/* Category Grid View */}
          {filteredCategories.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredCategories.map((cat, i) => (
                <RoomCard
                  key={cat.id}
                  category={cat}
                  index={i}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  guests={capacityFilter !== "all" ? capacityFilter : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gold/40 p-12 text-center bg-white shadow-sm">
              <p className="font-display text-xl font-bold text-[#061830]">No room categories match your filter criteria.</p>
              <p className="mt-1 text-xs text-[#64748b]">Try clearing or adjusting filters to view all room categories.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-full bg-gold-gradient px-5 py-2 text-xs font-bold text-[#120e03] uppercase tracking-wider shadow"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Category-wise Amenities & Hotel Facilities */}
          <div className="mt-12 rounded-2xl border border-[#071A32]/10 bg-white p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <p className="eyebrow text-gold font-semibold uppercase tracking-wider">Amenities &amp; Services</p>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#061830]">
                Room Amenities &amp; Hotel Facilities
              </h2>
            </div>
            <AmenitiesSection categoryGroup="all" />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
