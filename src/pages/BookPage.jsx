import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Bed,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  CheckCircle,
  Check,
  ArrowRight,
  Copy,
  X,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout.jsx";
import { PageHero } from "@/components/site/PageHero.jsx";
import {
  useHotelState,
  getCategory,
  createBooking,
  recordPayment,
  availableUnits,
} from "@/lib/hotel/store.jsx";
import {
  todayISO,
  addDays,
  quoteStay,
  formatINR,
  formatDate,
  validatePhoneNumber,
  validateEmail,
} from "@/lib/hotel/pricing.js";
import { StatusBadge, PaymentBadge } from "@/components/site/StatusBadge.jsx";
import { IMG } from "@/lib/hotel/images.js";

const EASE = [0.22, 1, 0.36, 1];

export default function BookPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const state = useHotelState();

  const today = todayISO();
  const initialCat = params.get("category") || state.categories[0]?.id || "deluxe";
  const initialIn = params.get("checkIn") || today;
  const initialOut = params.get("checkOut") || addDays(today, 2);
  const initialGuests = parseInt(params.get("guests") || "2", 10);

  const [categoryId, setCategoryId] = useState(initialCat);
  const [checkIn, setCheckIn] = useState(initialIn);
  const [checkOut, setCheckOut] = useState(initialOut);
  const [guests, setGuests] = useState(initialGuests);
  const [rooms, setRooms] = useState(1);

  // Guest details
  const [guestName, setGuestName] = useState(state.session?.name || "");
  const [email, setEmail] = useState(state.session?.email || "");
  const [phone, setPhone] = useState("");
  const [requests, setRequests] = useState("");
  const [successBooking, setSuccessBooking] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [payChoice, setPayChoice] = useState("property"); // "property" | "online"

  const selectedCategory = getCategory(state, categoryId);
  const quote = quoteStay(
    selectedCategory.price,
    checkIn,
    checkOut,
    rooms,
    state.settings.taxRate
  );

  const available = availableUnits(state, categoryId, checkIn, checkOut);

  // Step 1: Validate and open confirmation review modal
  const handleReviewBooking = (e) => {
    e.preventDefault();

    // 1. Name validation
    if (!guestName.trim() || guestName.trim().length < 2) {
      toast.error("Please enter your full name (at least 2 characters).");
      return;
    }

    // 2. Mobile validation (strict 10-digit Indian mobile validation)
    const phoneRes = validatePhoneNumber(phone);
    if (!phoneRes.valid) {
      toast.error(phoneRes.error);
      return;
    }

    // 3. Email validation
    const emailRes = validateEmail(email);
    if (!emailRes.valid) {
      toast.error(emailRes.error);
      return;
    }

    // 4. Dates validation
    if (!checkIn || !checkOut) {
      toast.error("Please select valid stay dates.");
      return;
    }
    if (checkOut <= checkIn) {
      toast.error("Check-out date must be strictly after check-in date.");
      return;
    }
    if (checkIn < today) {
      toast.error("Check-in date cannot be in the past.");
      return;
    }

    // 5. Rooms and Availability
    if (rooms < 1) {
      toast.error("Please reserve at least 1 room.");
      return;
    }
    if (available < rooms) {
      toast.error(`Only ${available} unit(s) available in this category for selected dates.`);
      return;
    }

    // 6. Occupancy validation
    const maxOccupancy = (selectedCategory?.maxGuests || 3) * rooms;
    if (guests < 1) {
      toast.error("Guest count must be at least 1.");
      return;
    }
    if (guests > maxOccupancy) {
      toast.error(`Maximum occupancy for ${rooms} ${selectedCategory?.name} room(s) is ${maxOccupancy} guests.`);
      return;
    }

    setShowConfirmModal(true);
  };

  // Step 2: Final confirmation
  const handleFinalConfirm = () => {
    const phoneRes = validatePhoneNumber(phone);
    const emailRes = validateEmail(email);
    const isPaidOnline = payChoice === "online";

    const booking = createBooking({
      guestName: guestName.trim(),
      email: emailRes.email,
      phone: phoneRes.formatted,
      categoryId,
      checkIn,
      checkOut,
      guests,
      rooms,
      requests: requests.trim() || undefined,
      source: "Website",
      status: "Confirmed",
      payment: isPaidOnline ? "Paid" : "Unpaid",
      amountPaid: isPaidOnline ? quote.total : 0,
    });

    setShowConfirmModal(false);
    setSuccessBooking(booking);
    toast.success(`Royal Reservation ${booking.id} confirmed successfully!`);
  };

  // Fresh live reference if on success screen
  const liveSuccess = successBooking
    ? state.bookings.find((b) => b.id === successBooking.id) || successBooking
    : null;
  const liveBalance = liveSuccess ? Math.max(0, liveSuccess.total - liveSuccess.amountPaid) : 0;

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Direct Reservation"
        title="Reserve Your Stay"
        subtitle="Enjoy guaranteed best rates, complimentary breakfast, and personalized royal concierge."
        image={IMG.exterior}
      />

      <section className="py-16 px-6 max-w-6xl mx-auto">
        {liveSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="rounded-3xl border border-gold/40 bg-navy p-8 md:p-12 text-center max-w-2xl mx-auto shadow-2xl"
          >
            <div className="inline-flex size-16 items-center justify-center rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 mb-4 shadow-lg">
              <CheckCircle2 className="size-10" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-navy-foreground">
              Reservation Confirmed!
            </h2>
            <p className="mt-2 text-sm text-navy-foreground/75">
              Thank you, <strong className="text-navy-foreground">{liveSuccess.guestName}</strong>.
              Your royal suite has been reserved and registered in the front desk queue.
            </p>

            {/* Live Folio Card */}
            <div className="mt-6 rounded-2xl border border-gold/25 bg-navy-deep p-6 text-xs text-navy-foreground/80 space-y-3 text-left">
              <div className="flex items-center justify-between border-b border-gold/15 pb-3">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-navy-foreground/50">Booking Reference</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <strong className="text-champagne font-mono text-base">{liveSuccess.id}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(liveSuccess.id);
                        toast.success("Booking ID copied to clipboard!");
                      }}
                      className="p-1 rounded text-gold hover:bg-white/10"
                      title="Copy ID"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={liveSuccess.status} />
                  <PaymentBadge payment={liveSuccess.payment} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-b border-gold/15 pb-3">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-navy-foreground/50">Room / Suite</span>
                  <p className="font-semibold text-navy-foreground mt-0.5">
                    {selectedCategory.name} ({liveSuccess.rooms} room{liveSuccess.rooms > 1 ? "s" : ""})
                  </p>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-navy-foreground/50">Assigned Room</span>
                  <p className="font-semibold text-champagne mt-0.5">
                    {liveSuccess.roomNumber ? `Room ${liveSuccess.roomNumber}` : "Assigned upon arrival"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-b border-gold/15 pb-3">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-navy-foreground/50">Check-In</span>
                  <p className="font-semibold text-navy-foreground mt-0.5">{formatDate(liveSuccess.checkIn)} (12:00 PM)</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-navy-foreground/50">Check-Out</span>
                  <p className="font-semibold text-navy-foreground mt-0.5">{formatDate(liveSuccess.checkOut)} (11:00 AM)</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-navy-foreground/50">Total Stay Charges</span>
                  <p className="text-gold font-display text-xl font-bold">{formatINR(liveSuccess.total)}</p>
                </div>
                {liveBalance > 0 ? (
                  <div className="text-right">
                    <span className="text-[11px] uppercase tracking-wider text-amber-400">Balance Due</span>
                    <p className="text-amber-400 font-display text-xl font-bold">{formatINR(liveBalance)}</p>
                  </div>
                ) : (
                  <span className="rounded-full bg-emerald-950/40 border border-emerald-500/40 px-3 py-1 text-xs font-semibold text-emerald-300">
                    Paid in Full
                  </span>
                )}
              </div>

              {/* Instant Online Payment if balance is unpaid */}
              {liveBalance > 0 && (
                <div className="mt-3 pt-3 border-t border-gold/15 flex items-center justify-between gap-3 bg-gold/5 p-3 rounded-xl border border-gold/20">
                  <div>
                    <p className="text-xs font-semibold text-navy-foreground">Settle Remaining Balance</p>
                    <p className="text-[11px] text-navy-foreground/60">Pay online with UPI or Card</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      recordPayment(liveSuccess.id, liveBalance);
                      toast.success(`Online payment of ${formatINR(liveBalance)} completed!`);
                    }}
                    className="rounded-full bg-gold-gradient px-4 py-2 text-xs font-semibold uppercase text-gold-foreground shadow-gold hover:brightness-110 transition"
                  >
                    Pay {formatINR(liveBalance)} Now
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link
                to={`/invoice/${liveSuccess.id}`}
                className="rounded-full bg-gold-gradient px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-gold-foreground shadow-gold hover:brightness-110 transition"
              >
                View / Print Tax Invoice
              </Link>
              <Link
                to="/account/bookings"
                className="rounded-full border border-gold/30 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-champagne hover:bg-white/5 transition"
              >
                View My Bookings &amp; Stays
              </Link>
              <Link
                to="/"
                className="rounded-full border border-gold/20 px-6 py-2.5 text-xs uppercase tracking-wider text-navy-foreground/70 hover:text-navy-foreground transition"
              >
                Back to Home
              </Link>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleReviewBooking} className="grid gap-12 lg:grid-cols-3">
            {/* Left 2 Cols: Form options */}
            <div className="lg:col-span-2 space-y-10">
              {/* Category selector */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-2xl font-semibold text-navy-foreground">
                    1. Select Room &amp; Suite
                  </h3>
                  <span className="text-xs text-champagne/70">5 Royal Categories</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {state.categories.map((cat, idx) => {
                    const isSelected = categoryId === cat.id;
                    return (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-30px" }}
                        transition={{ duration: 0.55, delay: idx * 0.08, ease: EASE }}
                        whileHover={{ y: -4, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setCategoryId(cat.id)}
                        className={`cursor-pointer rounded-2xl border p-4 transition-all duration-300 flex flex-col justify-between ${
                          isSelected
                            ? "border-gold bg-navy shadow-gold ring-1 ring-gold"
                            : "border-gold/20 bg-navy/70 hover:border-gold/40 hover:bg-navy"
                        }`}
                      >
                        <div className="flex gap-4 items-center">
                          <div className="size-20 rounded-xl overflow-hidden shrink-0 border border-gold/20">
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="size-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="font-display text-lg font-semibold text-navy-foreground truncate">
                                {cat.name}
                              </h4>
                              {isSelected && (
                                <span className="grid size-5 place-items-center rounded-full bg-gold text-gold-foreground shrink-0 shadow-sm">
                                  <Check className="size-3 stroke-[3]" />
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gold mt-0.5">{cat.bed} • {cat.size}</p>
                            <p className="text-sm font-semibold text-champagne mt-1.5 font-display">
                              {formatINR(cat.price)} <span className="text-[10px] font-sans font-normal text-navy-foreground/60">/ night</span>
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Stay Dates */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
              >
                <h3 className="font-display text-2xl font-semibold text-navy-foreground mb-4">
                  2. Dates &amp; Occupancy
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 bg-navy p-6 rounded-2xl border border-gold/25 shadow-card">
                  <div>
                    <label className="text-xs font-semibold text-champagne/80 block mb-1.5">Check-In</label>
                    <input
                      type="date"
                      value={checkIn}
                      min={today}
                      onChange={(e) => {
                        setCheckIn(e.target.value);
                        if (e.target.value >= checkOut) setCheckOut(addDays(e.target.value, 1));
                      }}
                      className="w-full rounded-lg border border-gold/30 bg-navy-deep px-3.5 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-champagne/80 block mb-1.5">Check-Out</label>
                    <input
                      type="date"
                      value={checkOut}
                      min={addDays(checkIn, 1)}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full rounded-lg border border-gold/30 bg-navy-deep px-3.5 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-champagne/80 block mb-1.5">Number of Rooms</label>
                    <input
                      type="number"
                      min={1}
                      max={available || 4}
                      value={rooms}
                      onChange={(e) => setRooms(Math.max(1, parseInt(e.target.value || "1", 10)))}
                      className="w-full rounded-lg border border-gold/30 bg-navy-deep px-3.5 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-champagne/80 block mb-1.5">Number of Guests</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value || "1", 10))}
                      className="w-full rounded-lg border border-gold/30 bg-navy-deep px-3.5 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Guest Details */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
              >
                <h3 className="font-display text-2xl font-semibold text-navy-foreground mb-4">
                  3. Guest Contact Information
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 bg-navy p-6 rounded-2xl border border-gold/25 shadow-card">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-champagne/80 block mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full rounded-lg border border-gold/30 bg-navy-deep px-3.5 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-champagne/80 block mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. priya@example.com"
                      className="w-full rounded-lg border border-gold/30 bg-navy-deep px-3.5 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-champagne/80">Phone Number (10 Digits)</label>
                      <span className="text-[10px] text-champagne/60">e.g. 98765 43210</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d+ -]/g, "");
                        setPhone(val.slice(0, 15));
                      }}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-lg border border-gold/30 bg-navy-deep px-3.5 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-champagne/80 block mb-1.5">Special Requests (Optional)</label>
                    <textarea
                      rows={2}
                      value={requests}
                      onChange={(e) => setRequests(e.target.value)}
                      placeholder="e.g. Upper floor, quiet corner, early arrival"
                      className="w-full rounded-lg border border-gold/30 bg-navy-deep px-3.5 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right 1 Col: Summary & Price breakdown */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
                className="sticky top-28 rounded-2xl border border-gold/30 bg-navy p-6 shadow-lift"
              >
                <h3 className="font-display text-2xl font-semibold text-navy-foreground border-b border-gold/15 pb-3">
                  Reservation Summary
                </h3>

                <div className="mt-4 aspect-video rounded-xl overflow-hidden border border-gold/20">
                  <img
                    src={selectedCategory.image}
                    alt={selectedCategory.name}
                    className="size-full object-cover"
                  />
                </div>

                <div className="mt-4 space-y-2 text-xs text-navy-foreground/80 border-b border-gold/15 pb-4">
                  <p className="flex justify-between">
                    <span>Category:</span>
                    <strong className="text-navy-foreground font-semibold">{selectedCategory.name}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span>Duration:</span>
                    <span>{quote.nights} Night{quote.nights > 1 ? "s" : ""}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Rooms:</span>
                    <span>{rooms}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Availability:</span>
                    <span className={available > 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                      {available > 0 ? `${available} available` : "Sold Out"}
                    </span>
                  </p>
                </div>

                {/* Pricing Breakdown */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-navy-foreground/75">
                    <span>Rate ({quote.nights}n × {formatINR(selectedCategory.price)})</span>
                    <span>{formatINR(quote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-navy-foreground/75">
                    <span>GST / Taxes (12%)</span>
                    <span>{formatINR(quote.tax)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-navy-foreground pt-3 border-t border-gold/20">
                    <span>Total Amount</span>
                    <span className="text-gold font-display text-2xl font-semibold">{formatINR(quote.total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={available < rooms}
                  className="mt-6 w-full rounded-full bg-gold-gradient py-3.5 text-xs font-semibold tracking-wider text-gold-foreground uppercase shadow-gold hover:brightness-110 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  Review &amp; Confirm Booking <ArrowRight className="size-4" />
                </button>

                <p className="mt-3 text-[11px] text-center text-navy-foreground/60 flex items-center justify-center gap-1">
                  <ShieldCheck className="size-3.5 text-gold" /> Pay at property or via guest dashboard
                </p>
              </motion.div>
            </div>
          </form>
        )}
      </section>

      {/* Royal Reservation Review & Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg rounded-3xl border border-gold/40 bg-navy p-6 shadow-2xl relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gold/20">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gold flex items-center gap-1.5">
                  <Sparkles className="size-3" /> Final Step
                </span>
                <h3 className="font-display text-2xl font-semibold text-navy-foreground">Confirm Your Reservation</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg p-1.5 text-navy-foreground/60 hover:text-navy-foreground hover:bg-white/10 transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-navy-foreground/80">
              <div className="flex items-center gap-3.5 rounded-2xl bg-navy-deep p-3.5 border border-gold/20">
                <img src={selectedCategory.image} alt="" className="size-16 rounded-xl object-cover shrink-0 border border-gold/20" />
                <div>
                  <p className="font-display text-lg font-bold text-navy-foreground">{selectedCategory.name}</p>
                  <p className="text-xs text-gold font-medium">{rooms} Room{rooms > 1 ? "s" : ""} · {guests} Guest{guests > 1 ? "s" : ""}</p>
                  <p className="text-[11px] text-champagne/70 mt-0.5">
                    {formatDate(checkIn)} → {formatDate(checkOut)} ({quote.nights} night{quote.nights > 1 ? "s" : ""})
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-navy-deep/60 p-4 space-y-2 border border-gold/15">
                <div className="flex justify-between">
                  <span className="text-navy-foreground/60">Guest Name</span>
                  <strong className="text-navy-foreground">{guestName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-navy-foreground/60">Contact Mobile</span>
                  <strong className="text-navy-foreground">{phone}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-navy-foreground/60">Confirmation Email</span>
                  <strong className="text-navy-foreground">{email}</strong>
                </div>
                {requests && (
                  <div className="flex justify-between">
                    <span className="text-navy-foreground/60">Special Requests</span>
                    <span className="text-champagne max-w-[220px] truncate">{requests}</span>
                  </div>
                )}
              </div>

              {/* Payment selection */}
              <div className="rounded-2xl border border-gold/25 bg-navy-deep p-4">
                <p className="font-semibold text-gold uppercase tracking-wider text-[11px] mb-2.5">
                  Select Payment Preference:
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs text-navy-foreground cursor-pointer rounded-xl p-2 hover:bg-white/5 border border-transparent has-[:checked]:border-gold/30 has-[:checked]:bg-gold/5 transition">
                    <input
                      type="radio"
                      name="payChoice"
                      value="property"
                      checked={payChoice === "property"}
                      onChange={() => setPayChoice("property")}
                      className="size-4 accent-gold"
                    />
                    <div>
                      <p className="font-semibold text-navy-foreground">Pay on Arrival at Property</p>
                      <p className="text-[10px] text-navy-foreground/60">Settle via Cash, UPI, or Card at Front Desk during check-in</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-navy-foreground cursor-pointer rounded-xl p-2 hover:bg-white/5 border border-transparent has-[:checked]:border-gold/30 has-[:checked]:bg-gold/5 transition">
                    <input
                      type="radio"
                      name="payChoice"
                      value="online"
                      checked={payChoice === "online"}
                      onChange={() => setPayChoice("online")}
                      className="size-4 accent-gold"
                    />
                    <div>
                      <p className="font-semibold text-navy-foreground">Prepay Online Now (Full Settlement)</p>
                      <p className="text-[10px] text-navy-foreground/60">Simulate instant online payment and receive an all-paid receipt</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 text-sm font-semibold border-t border-gold/15">
                <span>Total Folio Amount:</span>
                <span className="font-display text-2xl text-gold font-bold">{formatINR(quote.total)}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 rounded-full border border-gold/30 py-3 text-xs font-semibold uppercase text-champagne hover:bg-white/5 transition cursor-pointer"
              >
                Modify Details
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                className="flex-1 rounded-full bg-gold-gradient py-3 text-xs font-semibold uppercase text-gold-foreground shadow-gold hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer transition font-bold"
              >
                <CheckCircle className="size-4" /> Confirm Booking
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </SiteLayout>
  );
}
