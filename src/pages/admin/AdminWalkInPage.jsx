import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  PlusCircle,
  Printer,
  FileText,
  UserCheck,
  Zap,
  Bed,
  Search,
  IndianRupee,
  ShieldCheck,
  Tag,
  CreditCard,
  UserPlus,
  Clock,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  addDays,
  formatDate,
  formatINR,
  quoteStay,
  todayISO,
  validatePhoneNumber,
  validateEmail,
} from "@/lib/hotel/pricing.js";
import {
  availableUnits,
  createWalkInBooking,
  freeRoomsFor,
  getCategory,
  useHotelState,
} from "@/lib/hotel/store.jsx";

export default function AdminWalkInPage() {
  const state = useHotelState();
  const navigate = useNavigate();
  const today = todayISO();

  // Guest Information
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [idType, setIdType] = useState("Aadhaar Card");
  const [idNumber, setIdNumber] = useState("");
  const [city, setCity] = useState("Bareilly");

  // Reservation Details
  const [categoryId, setCategoryId] = useState(state.categories[0]?.id || "ac-family-double");
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(addDays(today, 1));
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [roomNumber, setRoomNumber] = useState("");
  const [extraGuestNames, setExtraGuestNames] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Tariff, Discounts & Financials
  const [overrideRate, setOverrideRate] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountFixed, setDiscountFixed] = useState(0);
  const [payMethod, setPayMethod] = useState("Cash");
  const [advancePaid, setAdvancePaid] = useState("");
  const [checkInDirectly, setCheckInDirectly] = useState(true);

  // Search & UI state
  const [existingGuestSearch, setExistingGuestSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const cat = getCategory(state, categoryId);
  const effectiveBasePrice = overrideRate !== "" ? Number(overrideRate) || 0 : cat.price;
  const taxRate = state.settings?.taxRate ?? 0.05;

  // Pricing Calculation
  const stayQuote = quoteStay(effectiveBasePrice, checkIn, checkOut, rooms, taxRate);
  const grossTotal = stayQuote.total;
  const discountTotal = Math.min(grossTotal, Math.round((grossTotal * (discountPercent / 100)) + Number(discountFixed || 0)));
  const netTotal = Math.max(0, grossTotal - discountTotal);

  // Available Rooms for the chosen Category
  const availableRoomsList = freeRoomsFor(state, categoryId, checkIn, checkOut);
  const unitsLeft = availableUnits(state, categoryId, checkIn, checkOut);

  // Existing Guest Search suggestions
  const guestSuggestions = useMemo(() => {
    if (!existingGuestSearch.trim()) return [];
    const q = existingGuestSearch.toLowerCase().trim();
    return (state.guests || []).filter(
      (g) =>
        (g.name && g.name.toLowerCase().includes(q)) ||
        (g.phone && g.phone.includes(q)) ||
        (g.email && g.email.toLowerCase().includes(q))
    ).slice(0, 5);
  }, [state.guests, existingGuestSearch]);

  const handleSelectExistingGuest = (guest) => {
    setName(guest.name || "");
    setPhone(guest.phone || "");
    setEmail(guest.email || "");
    if (guest.idType) setIdType(guest.idType);
    if (guest.idNumber) setIdNumber(guest.idNumber);
    if (guest.city) setCity(guest.city);
    setExistingGuestSearch("");
    toast.success(`Loaded profile for ${guest.name}!`);
  };

  const handleCreateWalkIn = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter the primary guest name.");
      return;
    }
    if (!phone.trim() || !validatePhoneNumber(phone)) {
      toast.error("Please provide a valid 10-digit mobile number.");
      return;
    }
    if (email.trim() && !validateEmail(email)) {
      toast.error("Please provide a valid email address.");
      return;
    }
    if (checkOut <= checkIn) {
      toast.error("Check-out date must be strictly after check-in date.");
      return;
    }

    setBusy(true);

    const paidNum = advancePaid !== "" ? Number(advancePaid) : (checkInDirectly ? netTotal : 0);

    try {
      const newBooking = createWalkInBooking({
        guestName: name.trim(),
        phone: phone.trim(),
        email: email.trim() || `${phone.trim()}@guest.hotelmeri.com`,
        idType,
        idNumber: idNumber.trim(),
        city: city.trim(),
        categoryId,
        roomNumber: roomNumber ? String(roomNumber) : (availableRoomsList[0] ? String(availableRoomsList[0]) : ""),
        checkIn,
        checkOut,
        guests: Number(guests) || 1,
        rooms: Number(rooms) || 1,
        extraGuestNames: extraGuestNames.trim(),
        specialRequests: specialRequests.trim(),
        internalNotes: internalNotes.trim(),
        overridePrice: overrideRate !== "" ? Number(overrideRate) : null,
        discount: discountTotal,
        total: netTotal,
        amountPaid: Math.min(netTotal, paidNum),
        paymentMethod: payMethod,
        paymentStatus: paidNum >= netTotal ? "Paid" : paidNum > 0 ? "Partial" : "Pending",
        checkInNow: checkInDirectly,
        source: "Walk-in Executive",
      });

      setBusy(false);
      setBookingSuccess(newBooking);
      toast.success(
        `Walk-in reservation #${newBooking.id} created! ${
          checkInDirectly ? `Guest checked in to Room ${newBooking.roomNumber || "assigned"}.` : "Status: Confirmed."
        }`
      );
    } catch (err) {
      setBusy(false);
      toast.error(err.message || "Failed to create walk-in reservation.");
    }
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold/20 border border-gold/40 px-3 py-0.5 text-[11px] font-bold text-[#061830] uppercase tracking-wider">
              Front Desk &amp; Executive Walk-in
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-[#061830] mt-1">
            Express Walk-In Reservation
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Instantly register arriving guests, allocate verified clean suites, collect advance tariffs, and execute immediate check-in.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/bookings"
            className="rounded-full border border-gold/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#061830] hover:bg-gold/10 transition shadow-sm"
          >
            All Reservations
          </Link>
          <Link
            to="/admin/rooms"
            className="rounded-full bg-[#061830] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-navy-deep transition shadow-sm"
          >
            Room Grid
          </Link>
        </div>
      </div>

      {bookingSuccess ? (
        /* Booking Confirmation Card & Receipt */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-emerald-500/40 bg-white p-6 sm:p-8 shadow-card max-w-3xl mx-auto space-y-6"
        >
          <div className="flex items-center gap-4 border-b border-emerald-200 pb-5">
            <div className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-7" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Reservation Successful
              </span>
              <h2 className="font-display text-2xl font-bold text-[#061830]">
                Booking Reference #{bookingSuccess.id}
              </h2>
              <p className="text-xs text-[#64748b]">
                {bookingSuccess.status === "Checked-In"
                  ? "Guest is officially Checked-In and registered in active in-house inventory."
                  : "Reservation is Confirmed and awaiting arrival."}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 rounded-2xl bg-[#FAF7F2] p-5 border border-gold/20 text-xs">
            <div>
              <span className="text-[#64748b] font-medium block">Guest Name</span>
              <strong className="text-sm font-bold text-[#061830]">{bookingSuccess.guestName}</strong>
              <div className="text-[#475569]">{bookingSuccess.phone} • {bookingSuccess.email}</div>
            </div>
            <div>
              <span className="text-[#64748b] font-medium block">Assigned Suite</span>
              <strong className="text-sm font-bold text-gold">
                Room {bookingSuccess.roomNumber || "Unassigned"} ({cat.name})
              </strong>
              <div className="text-[#475569]">
                {formatDate(bookingSuccess.checkIn)} → {formatDate(bookingSuccess.checkOut)} ({stayQuote.nights} Nights)
              </div>
            </div>
            <div>
              <span className="text-[#64748b] font-medium block">Folio Total</span>
              <strong className="text-base font-bold text-[#061830]">{formatINR(bookingSuccess.total)}</strong>
              <div className="text-emerald-700 font-semibold">
                Paid: {formatINR(bookingSuccess.amountPaid)} ({bookingSuccess.paymentMethod || "Cash"})
              </div>
            </div>
            <div>
              <span className="text-[#64748b] font-medium block">Outstanding Balance</span>
              <strong className={`text-base font-bold ${bookingSuccess.total - bookingSuccess.amountPaid > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                {bookingSuccess.total - bookingSuccess.amountPaid > 0
                  ? formatINR(bookingSuccess.total - bookingSuccess.amountPaid)
                  : "Fully Settled"}
              </strong>
              <div className="text-[#64748b]">Status: {bookingSuccess.status}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <button
              type="button"
              onClick={handlePrintVoucher}
              className="flex items-center gap-2 rounded-full border border-gold/40 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#061830] hover:bg-gold/15 transition cursor-pointer shadow-sm"
            >
              <Printer className="size-4 text-gold" /> Print Registration Voucher
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setBookingSuccess(null);
                  setName("");
                  setPhone("");
                  setEmail("");
                  setRoomNumber("");
                  setAdvancePaid("");
                }}
                className="rounded-full bg-gold-gradient px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110 transition cursor-pointer"
              >
                + Another Walk-in
              </button>
              <Link
                to="/admin/bookings"
                className="rounded-full bg-[#061830] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-navy-deep transition shadow-sm"
              >
                View in Ledger
              </Link>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Walk-In Form Grid */
        <form onSubmit={handleCreateWalkIn} className="grid lg:grid-cols-3 gap-6">
          {/* Main Left Columns (2 cols): Guest Details & Stay Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Guest Information & CRM Search */}
            <div className="rounded-2xl border border-gold/30 bg-white p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-gold/15 pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid size-7 place-items-center rounded-lg bg-gold/15 text-gold font-bold text-xs">
                    1
                  </div>
                  <h2 className="font-display text-base font-bold text-[#061830]">
                    Guest Identification &amp; CRM Profile
                  </h2>
                </div>

                {/* Live Existing Guest Search */}
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 size-3.5 text-[#94a3b8]" />
                  <input
                    type="text"
                    placeholder="Search existing guest..."
                    value={existingGuestSearch}
                    onChange={(e) => setExistingGuestSearch(e.target.value)}
                    className="w-full rounded-full border border-gold/30 bg-[#FAF7F2] pl-8 pr-3 py-1.5 text-xs text-[#061830] focus:border-gold focus:outline-none"
                  />
                  {guestSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-9 z-20 rounded-xl border border-gold/30 bg-white p-1.5 shadow-lift space-y-1">
                      {guestSuggestions.map((g) => (
                        <button
                          key={g.id || g.phone}
                          type="button"
                          onClick={() => handleSelectExistingGuest(g)}
                          className="w-full text-left rounded-lg p-2 hover:bg-gold/10 transition text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-[#061830] block">{g.name}</span>
                            <span className="text-[10px] text-[#64748b]">{g.phone}</span>
                          </div>
                          {g.vip && (
                            <span className="rounded-full bg-gold/20 text-gold px-2 py-0.5 text-[9px] font-bold">
                              VIP
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                    Primary Guest Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikramaditya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                    Mobile Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="guest@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                    City / Native Location
                  </label>
                  <input
                    type="text"
                    placeholder="Bareilly / New Delhi / Lucknow"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                    Govt ID Type
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none focus:bg-white"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                    Govt ID Number
                  </label>
                  <input
                    type="text"
                    placeholder="XXXX-XXXX-XXXX"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Stay Dates & Room Selection */}
            <div className="rounded-2xl border border-gold/30 bg-white p-6 shadow-card space-y-4">
              <div className="flex items-center gap-2 border-b border-gold/15 pb-3">
                <div className="grid size-7 place-items-center rounded-lg bg-gold/15 text-gold font-bold text-xs">
                  2
                </div>
                <h2 className="font-display text-base font-bold text-[#061830]">
                  Stay Dates &amp; Room Assignment
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                    Check-In Date
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                    Check-Out Date
                  </label>
                  <input
                    type="date"
                    min={addDays(checkIn, 1)}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                    Total Occupants
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830] focus:border-gold focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} Guest{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                    Number of Suites
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={rooms}
                    onChange={(e) => setRooms(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Room Category Cards */}
              <div>
                <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-2">
                  Select Room Category
                </label>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {state.categories.map((c) => {
                    const freeCount = freeRoomsFor(state, c.id).length;
                    const isSelected = categoryId === c.id;

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCategoryId(c.id);
                          setRoomNumber("");
                        }}
                        className={`text-left rounded-xl p-3 border transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-gold bg-gold/10 shadow-sm"
                            : "border-gold/20 bg-[#FAF7F2] hover:border-gold/50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#061830]">{c.name}</span>
                            <span className="text-[11px] font-bold text-gold">{formatINR(c.price)}</span>
                          </div>
                          <p className="text-[10px] text-[#64748b] mt-0.5 line-clamp-1">{c.bed}</p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gold/15 flex items-center justify-between text-[10px]">
                          <span className={freeCount > 0 ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
                            {freeCount > 0 ? `${freeCount} Suites Ready` : "Sold Out"}
                          </span>
                          {isSelected && <span className="font-bold text-gold">Selected ✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assign Specific Room */}
              <div className="rounded-xl bg-[#FAF7F2] p-4 border border-gold/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider">
                    Assign Specific Clean Room ({availableRoomsList.length} ready)
                  </label>
                  <span className="text-[11px] text-[#64748b]">
                    Category: <strong className="text-gold font-bold">{cat.name}</strong>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setRoomNumber("")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      roomNumber === ""
                        ? "bg-[#061830] text-white"
                        : "border border-gold/30 bg-white text-[#061830] hover:bg-gold/10"
                    }`}
                  >
                    Auto-Assign
                  </button>
                  {availableRoomsList.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRoomNumber(num)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                        roomNumber === num
                          ? "bg-gold text-gold-foreground shadow-sm"
                          : "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      }`}
                    >
                      Room {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Guest details & Requests */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                    Accompanying Guest Names
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mrs. Sunita Sharma, Master Aryan"
                    value={extraGuestNames}
                    onChange={(e) => setExtraGuestNames(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                    Special Requests / Internal Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Early morning wake-up call, extra towels..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar Column: Tariff Matrix, Advance Payment & Instant Check-in */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gold/30 bg-white p-6 shadow-card space-y-4">
              <div className="flex items-center gap-2 border-b border-gold/15 pb-3">
                <div className="grid size-7 place-items-center rounded-lg bg-gold/15 text-gold font-bold text-xs">
                  3
                </div>
                <h2 className="font-display text-base font-bold text-[#061830]">
                  Tariff, Discounts &amp; Billing
                </h2>
              </div>

              {/* Rate Override (Admin Privilege) */}
              <div>
                <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                  Base Nightly Tariff (₹)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder={`Default: ₹${cat.price}`}
                    value={overrideRate}
                    onChange={(e) => setOverrideRate(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-1.5 text-xs font-bold text-[#061830] focus:border-gold focus:outline-none"
                  />
                  {overrideRate !== "" && (
                    <button
                      type="button"
                      onClick={() => setOverrideRate("")}
                      className="text-xs text-rose-600 underline font-semibold shrink-0"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Discounts */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-1.5 text-xs font-bold text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                    Flat Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discountFixed}
                    onChange={(e) => setDiscountFixed(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-1.5 text-xs font-bold text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="rounded-xl bg-[#FAF7F2] p-4 border border-gold/20 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#64748b]">
                  <span>Stay Duration:</span>
                  <span className="font-bold text-[#061830]">{stayQuote.nights} Night{stayQuote.nights > 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center justify-between text-[#64748b]">
                  <span>Room Tariff:</span>
                  <span className="font-bold text-[#061830]">{formatINR(stayQuote.roomRate * stayQuote.nights * rooms)}</span>
                </div>
                <div className="flex items-center justify-between text-[#64748b]">
                  <span>GST Taxes ({(taxRate * 100).toFixed(0)}%):</span>
                  <span className="font-bold text-[#061830]">{formatINR(stayQuote.tax)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 font-semibold">
                    <span>Discount Applied:</span>
                    <span>-{formatINR(discountTotal)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gold/20 flex items-center justify-between font-bold text-sm text-[#061830]">
                  <span>Net Payable:</span>
                  <span className="text-gold font-display text-base">{formatINR(netTotal)}</span>
                </div>
              </div>

              {/* Payment Method & Advance Collection */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Cash", "UPI / QR", "Credit Card", "Debit Card"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPayMethod(m)}
                        className={`rounded-lg py-1.5 px-2 text-xs font-bold transition cursor-pointer border ${
                          payMethod === m
                            ? "bg-gold text-gold-foreground border-gold"
                            : "bg-[#FAF7F2] border-gold/20 text-[#061830] hover:bg-gold/10"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider">
                      Advance Collected (₹)
                    </label>
                    <button
                      type="button"
                      onClick={() => setAdvancePaid(String(netTotal))}
                      className="text-[10px] text-gold font-bold hover:underline"
                    >
                      Collect Full
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={netTotal}
                    placeholder={`Enter amount (Max: ₹${netTotal})`}
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm font-bold text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>

                {/* Instant Check-In Switch */}
                <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-900 block">
                      Immediate Express Check-In
                    </span>
                    <span className="text-[10px] text-emerald-700">
                      Instantly marks suite Occupied and adds guest to in-house ledger
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={checkInDirectly}
                    onChange={(e) => setCheckInDirectly(e.target.checked)}
                    className="size-5 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-gold-gradient py-3 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Finalizing Folio...
                  </>
                ) : (
                  <>
                    <Zap className="size-4" /> Confirm Walk-In {checkInDirectly ? "& Check-In" : "Booking"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
