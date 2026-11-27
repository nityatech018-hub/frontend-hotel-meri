import React, { useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bed,
  Calendar,
  Users,
  Maximize2,
  Compass,
  Star,
  Check,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Camera,
  Coffee,
  Tv,
  Wifi,
  Wind,
  Bath,
  Clock,
  MapPin,
  Heart,
  Share2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout.jsx";
import { AmenitiesSection } from "@/components/site/AmenitiesSection.jsx";
import {
  useHotelState,
  availableUnits,
} from "@/lib/hotel/store.jsx";
import {
  todayISO,
  addDays,
  quoteStay,
  formatINR,
  formatDate,
} from "@/lib/hotel/pricing.js";
import { IMG } from "@/lib/hotel/images.js";

const AMENITY_ICONS = {
  "High-speed Wi-Fi": Wifi,
  "King Bed": Bed,
  "Twin Beds": Bed,
  "Air Conditioning": Wind,
  "Smart TV": Tv,
  "Tea & Coffee Maker": Coffee,
  "Marble Bathroom": Bath,
  "24/7 Concierge Support": Clock,
  "In-Room Safe": ShieldCheck,
};

export default function RoomDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const state = useHotelState();
  const today = todayISO();

  // Category-first resolution (guests view categories; reception assigns physical rooms)
  const roomObj = state.rooms.find((r) => String(r.number) === String(id));
  const category = roomObj
    ? (state.categories.find((c) => c.id === roomObj.categoryId) || state.categories[0])
    : (state.categories.find((c) => c.id === id) || state.categories[0]);

  const isAc = category.isAc !== false && category.id !== "non-ac" && category.id !== "non-ac-double";
  const basePrice = category.price;
  const gstAmount = Math.round(basePrice * 0.05);
  const totalPrice = basePrice + gstAmount;
  const bedType = category.bedType || category.bed;
  const maxGuests = category.maxGuests;
  const roomTitle = category.name;
  const roomImage = category.image;

  // Filter out Air conditioning for Non-AC rooms (Section 8 Requirement)
  const filteredAmenities = (roomObj?.amenities || category.amenities || [
    "High-speed Wi-Fi",
    "Double Bed",
    "Smart TV",
    "Tea & Coffee Maker",
    "Marble Bathroom",
    "24/7 Concierge Support",
    "In-Room Safe",
  ]).filter((am) => {
    if (!isAc && /air condition|ac/i.test(am)) return false;
    return true;
  });

  // Booking widget state (pre-filled from searchParams if coming from RoomsPage/BookingWidget)
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || today);
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || addDays(today, 2));
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(
    Math.min(maxGuests || 2, Math.max(1, Number(searchParams.get("guests")) || 1))
  );
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Quote and availability calculations (category-based with extra guest & GST rule)
  const extraGuestsCount = Math.max(0, guests - (maxGuests || 2) * rooms);
  const extraGuestRate = category.extraGuestPrice ?? state.settings?.extraGuestPrice ?? 300;
  const quote = quoteStay(
    basePrice,
    checkIn,
    checkOut,
    rooms,
    state.settings?.taxRate ?? 0.05,
    {
      extraGuests: extraGuestsCount,
      extraGuestPrice: extraGuestRate,
      gstRule: state.settings?.gstRule || "above_1000",
    }
  );
  const available = availableUnits(state, category.id, checkIn, checkOut);
  const isHeld = available < rooms;
  const maxAllowedGuests = ((maxGuests || 2) + (category.maxExtraGuests ?? 1)) * rooms;

  // Gallery images (minimum 5 photos for luxury grid)
  const gallery = [
    roomImage || category.image || IMG.suite,
    IMG.bath,
    IMG.lobby,
    IMG.exterior,
    IMG.deluxe,
  ].filter(Boolean);

  const handleProceedToBooking = () => {
    if (available < rooms) {
      toast.error(`Only ${available} room(s) available in ${category.name} for selected dates.`);
      return;
    }
    navigate(
      `/book?category=${category.id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`
    );
  };

  return (
    <SiteLayout>
      <div className="bg-[#FAF7F2] text-[#061830] min-h-screen pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Top Breadcrumbs & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5">
            <div className="flex items-center gap-2 text-xs text-[#64748b] font-medium">
              <Link to="/" className="hover:text-[#061830] transition">
                Home
              </Link>
              <span>/</span>
              <Link to="/rooms" className="hover:text-[#061830] transition">
                Rooms &amp; Suites
              </Link>
              <span>/</span>
              <span className="text-[#061830] font-semibold">{category.name}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  toast.success("Room link copied to clipboard!");
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-white px-4 py-1.5 text-xs text-[#061830] font-medium hover:bg-gold/15 transition cursor-pointer shadow-sm"
              >
                <Share2 className="size-3.5 text-gold" /> Share
              </button>
              <button
                type="button"
                onClick={() => toast.success("Added to your saved wishlist!")}
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-white px-4 py-1.5 text-xs text-[#061830] font-medium hover:bg-gold/15 transition cursor-pointer shadow-sm"
              >
                <Heart className="size-3.5 text-rose-500" /> Save
              </button>
            </div>
          </div>

          {/* Room Header Title & Meta */}
          <div className="mt-1 mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 border ${
                isAc ? "bg-cyan-50 border-cyan-300 text-cyan-800" : "bg-amber-50 border-amber-300 text-amber-800"
              }`}>
                <Wind className="size-3" /> {isAc ? "Air Conditioned (AC)" : "Non-AC Room"}
              </span>
              <span className="rounded-full bg-gold/15 border border-gold/40 px-3 py-0.5 text-[11px] font-bold text-gold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="size-3" /> {category.badge || "Verified Inventory"}
              </span>
              <span className="flex items-center gap-1 text-xs text-[#061830] font-semibold">
                <Star className="size-3.5 fill-gold text-gold" />
                {category.rating || 4.8}
                <span className="text-[#64748b] font-normal">
                  ({category.reviewsCount || 83} reviews)
                </span>
              </span>
              <span className="text-xs text-gold/40">•</span>
              <span className="text-xs text-[#475569] flex items-center gap-1">
                <MapPin className="size-3 text-gold" /> No-30, Narmadapuram Rd, Misrod, Bhopal
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#061830]">
              {roomTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <p className="text-sm md:text-base text-gold font-medium">{category.tagline}</p>
              {category.extraGuestPrice > 0 && (
                <>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-medium text-slate-600">
                    Extra guest charge: <strong className="text-[#061830]">{formatINR(category.extraGuestPrice)}</strong>/night
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 5-Photo Luxury Showcase Grid */}
          <div className="relative rounded-3xl overflow-hidden border border-gold/30 shadow-card bg-white">
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 md:h-[440px]">
              {/* Main Hero Photo (Left 2 cols, 2 rows) */}
              <div
                className="md:col-span-2 md:row-span-2 relative h-[260px] sm:h-[340px] md:h-full min-h-0 overflow-hidden cursor-pointer group"
                onClick={() => {
                  setActivePhotoIdx(0);
                  setShowGalleryModal(true);
                }}
              >
                <img
                  src={gallery[0]}
                  alt={roomTitle}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = IMG.suite;
                  }}
                  className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              </div>

              {/* Photos 2–5 (Right 2x2 Grid on Desktop) */}
              {[
                { src: gallery[1], alt: "Attached bathroom" },
                { src: gallery[2], alt: "Reception lobby" },
                { src: gallery[3], alt: "Hotel exterior" },
                { src: gallery[4], alt: "Deluxe room interior" },
              ].map((photo, idx) => (
                <div
                  key={idx}
                  className="hidden md:block relative h-full min-h-0 overflow-hidden cursor-pointer group"
                  onClick={() => {
                    setActivePhotoIdx(idx + 1);
                    setShowGalleryModal(true);
                  }}
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = IMG.suite;
                    }}
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>

            {/* Mobile Thumbnail Strip (so all 5 photos are visible on mobile too) */}
            <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-white md:hidden">
              {gallery.slice(1).map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActivePhotoIdx(idx + 1);
                    setShowGalleryModal(true);
                  }}
                  className="aspect-[4/3] overflow-hidden rounded-lg cursor-pointer"
                >
                  <img
                    src={src}
                    alt={`Room view ${idx + 2}`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = IMG.suite;
                    }}
                    className="size-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Floating "Show All Photos" Button */}
            <button
              type="button"
              onClick={() => setShowGalleryModal(true)}
              className="absolute bottom-4 right-4 z-10 rounded-xl bg-white/95 hover:bg-white border border-gold/40 px-4 py-2 text-xs font-semibold text-[#061830] backdrop-blur-md shadow-card transition flex items-center gap-2 cursor-pointer"
            >
              <Camera className="size-3.5 text-gold" />
              <span>Show all {gallery.length} photos</span>
            </button>
          </div>

          {/* Main Layout: Details (7 Cols) + Sticky Booking Card (5 Cols) */}
          <div className="mt-12 grid gap-12 lg:grid-cols-12 relative">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-7 space-y-10">
              {/* Quick Specs Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 rounded-2xl bg-white border border-gold/25 shadow-card text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-[#64748b] font-medium">Bed Arrangement</span>
                  <p className="font-semibold text-[#061830] flex items-center gap-1.5">
                    <Bed className="size-4 text-gold" /> {bedType}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-[#64748b] font-medium">Room Climate</span>
                  <p className="font-semibold text-[#061830] flex items-center gap-1.5">
                    <Wind className="size-4 text-gold" /> {isAc ? "AC Room" : "Non-AC"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-[#64748b] font-medium">Max Occupancy</span>
                  <p className="font-semibold text-[#061830] flex items-center gap-1.5">
                    <Users className="size-4 text-gold" /> Up to {maxGuests} Guests
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-[#64748b] font-medium">Room Dimension</span>
                  <p className="font-semibold text-[#061830] flex items-center gap-1.5">
                    <Maximize2 className="size-4 text-gold" /> {category.size}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h2 className="font-display text-2xl font-semibold text-[#061830]">
                  {roomObj ? `About Room ${roomObj.number} (${category.name})` : `About ${category.name}`}
                </h2>
                <p className="text-sm leading-relaxed text-[#475569]">
                  {roomObj?.notes || category.description}
                </p>
                <p className="text-sm leading-relaxed text-[#475569]">
                  {isAc
                    ? "Equipped with split air conditioning, premium plush mattresses, attached marble bathroom, and daily housekeeping."
                    : "Clean, comfortable, and budget-friendly non-air-conditioned room featuring comfortable double bedding, ceiling fan, attached bathroom, and peaceful atmosphere."}
                </p>
              </div>

              {/* Category-Wise Amenities, Hotel Facilities & Additional Charges */}
              <div className="space-y-4 border-t border-gold/20 pt-8">
                <h2 className="font-display text-2xl font-semibold text-[#061830]">
                  Amenities &amp; Hotel Facilities
                </h2>
                <AmenitiesSection
                  categoryGroup={category.groupCategory || (isAc ? "Family Room" : "Classic Room")}
                />
              </div>

              {/* Hotel Meri Guarantee */}
              <div className="rounded-2xl border border-gold/30 bg-white p-6 shadow-card space-y-3">
                <div className="flex items-center gap-2 text-gold font-semibold text-sm">
                  <ShieldCheck className="size-5" />
                  <span>The Hotel Meri Hospitality Guarantee</span>
                </div>
                <ul className="grid sm:grid-cols-2 gap-2 text-xs text-[#475569]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Free cancellation up to 24 hours prior</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Complimentary high-speed fibre Wi-Fi</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Daily housekeeping &amp; turndown service</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Guaranteed best direct reservation rates</span>
                  </li>
                </ul>
              </div>

              {/* Bottom Prominent Proceed to Reserve CTA */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D5A43D]/40 bg-[#071A32] p-6 text-[#F8F6F1]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#D5A43D]">
                    Ready to book {roomObj ? `Room ${roomObj.number}` : category.name}?
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-white">
                    {formatINR(quote.total)}
                    <span className="ml-2 text-xs font-normal text-white/70">
                      for {quote.nights} {quote.nights === 1 ? "night" : "nights"} (incl. 5% GST)
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleProceedToBooking}
                  disabled={isHeld}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-xs font-bold uppercase tracking-wider transition ${
                    isHeld
                      ? "bg-slate-600 text-slate-300 cursor-not-allowed"
                      : "bg-[#D5A43D] text-[#071A32] hover:bg-[#e2b656] cursor-pointer"
                  }`}
                >
                  <span>{isHeld ? "Unavailable for Dates" : "Proceed to Reserve"}</span>
                  {!isHeld && <ArrowRight className="size-4" />}
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: Sticky Booking Panel */}
            <div className="lg:col-span-5">
              <div className="sticky top-28 rounded-3xl border border-gold/35 bg-white p-6 sm:p-8 shadow-lift space-y-6">
                <div className="flex items-baseline justify-between border-b border-gold/15 pb-4">
                  <div>
                    <span className="font-display text-3xl font-bold text-[#061830]">
                      {formatINR(basePrice)}
                    </span>
                    <span className="text-xs text-[#64748b] ml-1.5 uppercase tracking-wider font-semibold">
                      / day (Base)
                    </span>
                    <p className="text-[11px] font-bold text-gold mt-1">
                      Total with 5% GST: {formatINR(totalPrice)}/day
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-800">
                    {available > 0 ? `${available} available` : "Sold out"}
                  </span>
                </div>

                {/* Stay Date Pickers */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl border border-gold/30 bg-[#FAF7F2]">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#64748b] block mb-1">
                      Check-In Date
                    </label>
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
                      className="w-full bg-transparent text-xs font-semibold text-[#061830] focus:outline-none cursor-pointer"
                    />
                  </div>
                  <div className="border-l border-gold/20 pl-3">
                    <label className="text-[10px] uppercase font-bold text-[#64748b] block mb-1">
                      Check-Out Date
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      min={addDays(checkIn, 1)}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-[#061830] focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Guests & Rooms Selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#475569] block mb-1.5">Rooms</label>
                    <select
                      value={rooms}
                      onChange={(e) => setRooms(parseInt(e.target.value, 10))}
                      className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2.5 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none"
                    >
                      <option value={1}>1 Room</option>
                      <option value={2}>2 Rooms</option>
                      <option value={3}>3 Rooms</option>
                      <option value={4}>4 Rooms</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#475569] block mb-1.5">Guests</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value, 10))}
                      className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2.5 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none"
                    >
                      {Array.from({ length: maxAllowedGuests }, (_, i) => i + 1).map((g) => (
                        <option key={g} value={g}>
                          {g} {g === 1 ? "Guest" : "Guests"}
                          {g > (maxGuests || 2) * rooms ? " (incl. extra guest)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2.5 border-t border-gold/15 pt-4 text-xs text-[#475569]">
                  <div className="flex justify-between">
                    <span>
                      Base Room ({formatINR(basePrice)} × {quote.nights} night{quote.nights > 1 ? "s" : ""})
                    </span>
                    <span className="font-semibold text-[#061830]">{formatINR(quote.baseRoomTotal)}</span>
                  </div>
                  {quote.extraGuestTotal > 0 && (
                    <div className="flex justify-between">
                      <span>
                        Extra Guest ({quote.extraGuests} × {formatINR(quote.extraGuestPrice)} × {quote.nights}N)
                      </span>
                      <span className="font-semibold text-[#061830]">+{formatINR(quote.extraGuestTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>
                      GST (5%{quote.gstAmount === 0 ? " — ₹0 on ₹1,000 room bill" : ""})
                    </span>
                    <span className="font-semibold text-emerald-700">+{formatINR(quote.tax)}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-gold/15 font-semibold text-sm text-[#061830]">
                    <span>Total Stay Bill</span>
                    <span className="font-display text-2xl font-bold text-gold">{formatINR(quote.total)}</span>
                  </div>
                </div>

                {isHeld && (
                  <div className="rounded-xl bg-amber-50 border border-amber-300 p-3 text-xs text-amber-900">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="size-4 text-amber-700 shrink-0" />
                      {roomObj ? `Room ${roomObj.number} is Held for these Dates` : "Suite Unavailable for Dates"}
                    </p>
                    <p className="mt-1 text-[11px] text-amber-800 leading-relaxed">
                      Confirmed booking exists covering {formatDate(checkIn)} → {formatDate(checkOut)}. Please change your dates above to reserve.
                    </p>
                  </div>
                )}

                {/* Action CTA */}
                <button
                  type="button"
                  onClick={handleProceedToBooking}
                  disabled={isHeld}
                  className={`w-full rounded-full py-3.5 text-center text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 ${
                    isHeld
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-gold-gradient text-navy-deep shadow-gold hover:brightness-110 cursor-pointer"
                  }`}
                >
                  {isHeld ? "Held / Unavailable for Dates" : (
                    <>
                      Proceed to Reserve <ArrowRight className="size-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-[#64748b]">
                  No upfront charge required if choosing "Pay on Arrival"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Photo Modal */}
      <AnimatePresence>
        {showGalleryModal && (
          <div
            className="fixed inset-0 z-[200] grid place-items-center bg-black/90 p-4 backdrop-blur-md"
            onClick={() => setShowGalleryModal(false)}
          >
            <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowGalleryModal(false)}
                className="absolute -top-12 right-0 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
              >
                <X className="size-6" />
              </button>
              <img
                src={gallery[activePhotoIdx]}
                alt="Room detail gallery view"
                className="w-full max-h-[75vh] object-contain rounded-2xl"
              />
              <div className="flex gap-2 justify-center mt-4">
                {gallery.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhotoIdx(i)}
                    className={`size-14 rounded-lg overflow-hidden border-2 transition ${
                      i === activePhotoIdx ? "border-gold scale-105" : "border-white/30 opacity-60"
                    }`}
                  >
                    <img src={img} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </SiteLayout>
  );
}
