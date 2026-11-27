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
  ArrowLeft,
  Copy,
  Printer,
  Sparkles,
  FileText,
  MapPin,
  Lock,
  Phone,
  Mail,
  User,
  UploadCloud,
  FileCheck,
  AlertCircle,
  Home,
  LayoutDashboard,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout.jsx";
import {
  useHotelState,
  getCategory,
  createBooking,
  recordPayment,
  availableUnits,
  isPhysicalRoomAvailable,
} from "@/lib/hotel/store.jsx";
import {
  todayISO,
  addDays,
  quoteStay,
  formatINR,
  formatDate,
} from "@/lib/hotel/pricing.js";
import {
  validatePhoneNumber,
  validateEmail,
  validateName,
  validateText,
  validatePostalCode,
  validateIdNumber,
  validateInteger,
  validateUploadFile,
  sanitizePhoneInput,
  sanitizeNameInput,
  sanitizeIdInput,
} from "@/lib/hotel/validation.js";

const GOV_ID_TYPES = [
  "Aadhaar Card",
  "Passport",
  "Driving License",
  "Voter ID",
  "Other Government ID",
];

const STEPS = [
  { id: 1, label: "Dates & Guests" },
  { id: 2, label: "Guest Information" },
  { id: 3, label: "Summary & Review" },
  { id: 4, label: "Confirmation" },
];

export default function BookPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const state = useHotelState();
  const today = todayISO();

  const [currentStep, setCurrentStep] = useState(1);

  // Initial params
  const initialCat = params.get("category") || state.categories[0]?.id || "ac-family-double";
  const initialRoomNum = params.get("room") || params.get("roomNumber") || "";
  const initialIn = params.get("checkIn") || today;
  const initialOut = params.get("checkOut") || addDays(today, 2);
  const initialGuests = parseInt(params.get("guests") || "2", 10);
  const initialRooms = parseInt(params.get("rooms") || "1", 10);

  // Step 1: Room & Stay State
  const [categoryId, setCategoryId] = useState(initialCat);
  const [roomNumber, setRoomNumber] = useState(initialRoomNum);
  const [checkIn, setCheckIn] = useState(initialIn);
  const [checkOut, setCheckOut] = useState(initialOut);
  const [guests, setGuests] = useState(initialGuests);
  const [rooms, setRooms] = useState(initialRooms);

  // Step 2: Primary Guest State
  const [primaryGuest, setPrimaryGuest] = useState({
    name: state.session?.name || "",
    phone: "",
    email: state.session?.email || "",
    gender: "Male",
    address: "",
    city: "Bhopal",
    state: "Madhya Pradesh",
    country: "India",
    postalCode: "",
    purposeOfVisit: "Leisure",
    idType: "Aadhaar Card",
    idNumber: "",
    specialRequests: "",
  });

  // Step 2: Primary + Additional Guests State (preserved when guest count changes)
  const [additionalGuests, setAdditionalGuests] = useState([
    {
      name: "",
      age: "",
      gender: "Female",
      idType: "Aadhaar Card",
      idNumber: "",
      verified: true,
      docUploaded: false,
      docFileName: "",
    },
    {
      name: "",
      age: "",
      gender: "Male",
      idType: "Aadhaar Card",
      idNumber: "",
      verified: true,
      docUploaded: false,
      docFileName: "",
    },
  ]);

  const handleGuestsChange = (newGuestCount) => {
    setGuests(newGuestCount);
    const needed = Math.max(0, newGuestCount - 1);
    setAdditionalGuests((prev) => {
      if (prev.length >= needed) return prev;
      const extra = Array.from({ length: needed - prev.length }, () => ({
        name: "",
        age: "",
        gender: "Male",
        idType: "Aadhaar Card",
        idNumber: "",
        verified: true,
        docUploaded: false,
        docFileName: "",
      }));
      return [...prev, ...extra];
    });
  };

  // Payment choice & submission state
  const [paymentMethod, setPaymentMethod] = useState("property"); // "property" | "online"
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Step 5: Confirmed Booking Record
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Selected Category and Room objects
  const selectedRoomObj = roomNumber ? state.rooms.find((r) => r.number === roomNumber) : null;
  const selectedCategory = getCategory(state, selectedRoomObj?.categoryId || categoryId);
  const baseRate = selectedRoomObj?.price || selectedCategory.price;

  // Maximum occupancy validation (included guests + configurable extra guest)
  const includedCapacityPerRoom = selectedCategory.maxGuests || 2;
  const maxExtraPerRoom = selectedCategory.maxExtraGuests ?? 1;
  const maxCapacityPerRoom = includedCapacityPerRoom + maxExtraPerRoom;
  const maxCapacityTotal = maxCapacityPerRoom * rooms;
  const extraGuestsCount = Math.max(0, guests - includedCapacityPerRoom * rooms);
  const extraGuestRate = selectedCategory.extraGuestPrice ?? state.settings?.extraGuestPrice ?? 300;

  const quote = quoteStay(
    baseRate,
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

  const available = availableUnits(state, selectedCategory.id, checkIn, checkOut);

  // Step 1 Validation -> Step 2
  const handleProceedFromStep1 = () => {
    if (!checkIn || !checkOut) {
      toast.error("Please select valid check-in and check-out dates.");
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
    if (rooms < 1) {
      toast.error("Please select at least 1 room.");
      return;
    }
    if (available < rooms) {
      toast.error(`Only ${available} room(s) available in this category for selected dates (${formatDate(checkIn)} to ${formatDate(checkOut)}).`);
      return;
    }
    if (roomNumber && !isPhysicalRoomAvailable(state, roomNumber, checkIn, checkOut)) {
      toast.error(`Room ${roomNumber} is already held/booked between ${formatDate(checkIn)} and ${formatDate(checkOut)}. Please choose another available room.`);
      return;
    }
    if (guests > maxCapacityTotal) {
      toast.error(
        `Selected room accommodates up to ${maxCapacityPerRoom} guests per room. Total capacity for ${rooms} room(s) is ${maxCapacityTotal} guests.`
      );
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  // Step 2 Validation (Merged Primary + Dynamic Additional Guests) -> Step 3 (Summary & Review)
  const handleProceedFromStep2 = () => {
    const nextErrors = {};

    const nameRes = validateName(primaryGuest.name, { label: "Primary Guest full name" });
    if (!nameRes.valid) nextErrors.name = nameRes.error;

    const phoneRes = validatePhoneNumber(primaryGuest.phone);
    if (!phoneRes.valid) nextErrors.phone = phoneRes.error;

    const emailRes = validateEmail(primaryGuest.email);
    if (!emailRes.valid) nextErrors.email = emailRes.error;

    const addrRes = validateText(primaryGuest.address, { label: "Residential address", min: 5, max: 300 });
    if (!addrRes.valid) nextErrors.address = addrRes.error;

    const cityRes = validateText(primaryGuest.city, { label: "City", min: 2, max: 60 });
    if (!cityRes.valid) nextErrors.city = cityRes.error;

    const stateRes = validateText(primaryGuest.state, { label: "State", min: 2, max: 60 });
    if (!stateRes.valid) nextErrors.state = stateRes.error;

    const pinRes = validatePostalCode(primaryGuest.postalCode);
    if (!pinRes.valid) nextErrors.postalCode = pinRes.error;

    const idRes = validateIdNumber(primaryGuest.idNumber, primaryGuest.idType);
    if (!idRes.valid) nextErrors.idNumber = idRes.error;

    const additionalCount = Math.max(0, guests - 1);
    for (let i = 0; i < additionalCount; i++) {
      const g = additionalGuests[i] || { name: "", age: "", idType: "Aadhaar Card", idNumber: "" };
      const gNameRes = validateName(g.name, { label: `Guest ${i + 2} full name` });
      if (!gNameRes.valid) nextErrors[`guest_${i}_name`] = gNameRes.error;

      const gAgeRes = validateInteger(g.age, { label: `Guest ${i + 2} age`, min: 1, max: 120 });
      if (!gAgeRes.valid) nextErrors[`guest_${i}_age`] = gAgeRes.error;

      const gIdRes = validateIdNumber(g.idNumber, g.idType);
      if (!gIdRes.valid) nextErrors[`guest_${i}_idNumber`] = gIdRes.error;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error(Object.values(nextErrors)[0]);
      return;
    }

    setErrors({});
    setCurrentStep(3);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  // Step 3 Final Booking Confirmation -> Step 4
  const handleFinalBookingSubmission = () => {
    if (submitting) return;
    setSubmitting(true);
    const phoneRes = validatePhoneNumber(primaryGuest.phone);
    const emailRes = validateEmail(primaryGuest.email);
    const isPaidOnline = paymentMethod === "online";

    const additionalCount = Math.max(0, guests - 1);
    const activeAdditional = additionalGuests.slice(0, additionalCount).map((g) => ({
      name: g.name.trim(),
      age: g.age,
      gender: g.gender,
      idType: g.idType,
      idNumber: g.idNumber.trim().toUpperCase(),
      verified: g.verified,
      docUploaded: g.docUploaded,
    }));

    const newBooking = createBooking({
      guestName: primaryGuest.name.trim(),
      email: emailRes.email,
      phone: phoneRes.formatted,
      gender: primaryGuest.gender,
      address: `${primaryGuest.address}, ${primaryGuest.city}, ${primaryGuest.state} - ${primaryGuest.postalCode}`,
      purposeOfVisit: primaryGuest.purposeOfVisit,
      idType: primaryGuest.idType.trim(),
      idNumber: primaryGuest.idNumber.trim().toUpperCase(),
      additionalGuests: activeAdditional,
      categoryId: selectedCategory.id,
      tariffRate: baseRate,
      checkIn,
      checkOut,
      guests,
      extraGuests: extraGuestsCount,
      rooms,
      total: quote.total,
      requests: primaryGuest.specialRequests.trim() || undefined,
      source: "Website",
      status: "Confirmed",
      payment: isPaidOnline ? "Pending (Razorpay)" : "Unpaid",
      amountPaid: 0,
      paymentMethod: isPaidOnline ? "Razorpay (Placeholder)" : "Pay at Hotel",
    });

    if (isPaidOnline) {
      recordPayment({
        bookingId: newBooking.id,
        amount: quote.total,
        mode: "Online UPI",
        notes: "Direct booking payment via website portal",
      });
    }

    setConfirmedBooking(newBooking);
    setSubmitting(false);
    setCurrentStep(4);
    window.scrollTo({ top: 80, behavior: "smooth" });
    toast.success(`Booking ${newBooking.id} confirmed successfully!`);
  };

  return (
    <SiteLayout>
      <div className="bg-[#FAF7F2] text-[#061830] min-h-screen pt-28 pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="eyebrow text-gold font-semibold uppercase tracking-wider">
              Hotel Meri Reservations
            </span>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl font-bold text-[#061830]">
              Complete Your Stay
            </h1>
            <p className="mt-2 text-sm text-[#64748b]">
              Transparent base room pricing + verified 5% GST accommodation billing.
            </p>
          </div>

          {/* 4-Step Progress Stepper */}
          <div className="mb-12">
            <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-3xl mx-auto">
              {STEPS.map((step) => {
                const isPassed = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                return (
                  <div key={step.id} className="flex flex-col items-center text-center">
                    <div
                      className={`size-9 sm:size-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 border-2 ${
                        isPassed
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : isCurrent
                          ? "bg-navy text-champagne border-gold shadow-md scale-105"
                          : "bg-white text-slate-400 border-slate-200"
                      }`}
                    >
                      {isPassed ? <Check className="size-4" /> : step.id}
                    </div>
                    <span
                      className={`mt-2 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-1 ${
                        isCurrent
                          ? "text-navy font-bold"
                          : isPassed
                          ? "text-emerald-700"
                          : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stepper Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Content (8 Cols on Desktop) */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-gold/30 p-6 sm:p-8 shadow-card">
              {/* ================= STEP 1: Dates & Guests (Selected Room Carried Forward) ================= */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="font-display text-2xl font-bold text-[#061830]">
                      Step 1: Select Dates &amp; Guests
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Confirm your check-in and check-out dates and number of guests for your selected room.
                    </p>
                  </div>

                  {/* Selected Room Summary Banner (Carried Forward) */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[#D5A43D]/40 bg-[#FAF7F2] p-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedRoomObj?.image || selectedCategory.image}
                        alt={selectedCategory.name}
                        className="h-16 w-20 rounded-xl object-cover border border-gold/25 shrink-0"
                      />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#b58726]">
                          Selected Room Category
                        </span>
                        <h3 className="font-display text-lg font-bold text-[#061830] leading-snug">
                          {selectedCategory.name}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {selectedCategory.bed} · Up to {maxCapacityPerRoom} Guests
                          {selectedCategory.size ? ` · ${selectedCategory.size}` : ""} ·{" "}
                          <strong className="text-[#061830]">{formatINR(baseRate)} / night</strong>
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/rooms"
                      className="text-xs font-semibold text-[#061830] underline decoration-[#D5A43D] underline-offset-4 hover:text-[#b58726] shrink-0"
                    >
                      Change Room
                    </Link>
                  </div>

                  {roomNumber && !isPhysicalRoomAvailable(state, roomNumber, checkIn, checkOut) && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                      <AlertCircle className="size-4 shrink-0 text-amber-700" />
                      <span>
                        Room {roomNumber} is currently held for {formatDate(checkIn)} to {formatDate(checkOut)}. Please adjust your dates below or{" "}
                        <Link to="/rooms" className="underline font-semibold">
                          choose another room
                        </Link>
                        .
                      </span>
                    </div>
                  )}

                  {/* Stay Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                        Check-In Date *
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
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                        Check-Out Date *
                      </label>
                      <input
                        type="date"
                        value={checkOut}
                        min={addDays(checkIn, 1)}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Rooms and Guests */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                        Number of Rooms
                      </label>
                      <select
                        value={rooms}
                        onChange={(e) => {
                          const newRooms = parseInt(e.target.value, 10);
                          setRooms(newRooms);
                          const newMax = maxCapacityPerRoom * newRooms;
                          if (guests > newMax) {
                            handleGuestsChange(newMax);
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none"
                      >
                        <option value="1">1 Room</option>
                        <option value="2">2 Rooms</option>
                        <option value="3">3 Rooms</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                          Total Guests *
                        </label>
                        <span className="text-[10px] text-amber-700 font-semibold">
                          Up to {maxCapacityTotal} {maxCapacityTotal === 1 ? "Guest" : "Guests"}
                        </span>
                      </div>
                      <select
                        value={guests}
                        onChange={(e) => handleGuestsChange(parseInt(e.target.value, 10))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none"
                      >
                        {Array.from({ length: maxCapacityTotal }, (_, i) => i + 1).map((count) => (
                          <option key={count} value={count}>
                            {count} {count === 1 ? "Guest" : "Guests"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Warning if capacity exceeded */}
                  {guests > maxCapacityTotal && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="size-4 shrink-0" />
                      <span>Warning: {guests} guests exceeds maximum room capacity ({maxCapacityTotal} guests).</span>
                    </div>
                  )}

                  {/* Next Button */}
                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleProceedFromStep1}
                      className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-7 py-3 text-xs font-bold text-navy-deep uppercase tracking-wider shadow-gold hover:brightness-105 transition cursor-pointer"
                    >
                      Continue to Guest Information <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ================= STEP 2: Merged Guest Information ================= */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-[#061830]">
                        Step 2: Guest Information
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        {guests === 1
                          ? "Enter details for the Primary Guest (1 guest selected)."
                          : `Enter contact details for Guest 1 (Primary Guest) and details for ${guests - 1} additional ${guests - 1 === 1 ? "guest" : "guests"}.`}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#FAF7F2] border border-gold/40 px-3 py-1 text-[11px] font-bold text-[#061830]">
                      {guests} {guests === 1 ? "Guest" : "Guests"}
                    </span>
                  </div>

                  {/* Guest 1 — Primary Guest Card */}
                  <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-gold/30 space-y-4">
                    <div className="flex items-center justify-between border-b border-gold/20 pb-2.5">
                      <span className="font-bold text-sm text-[#061830] flex items-center gap-2">
                        <User className="size-4 text-gold" /> Guest 1 — Primary Guest
                      </span>
                      <span className="text-[10px] font-bold text-[#061830] bg-gold/20 border border-gold/40 px-2.5 py-0.5 rounded-full">
                        Primary Contact &amp; Billing
                      </span>
                    </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Full Name (as per Govt ID) *
                      </label>
                      <input
                        type="text"
                        maxLength={80}
                        placeholder="e.g. Ramesh Kumar Verma"
                        value={primaryGuest.name}
                        onChange={(e) => {
                          setPrimaryGuest({ ...primaryGuest, name: sanitizeNameInput(e.target.value) });
                          clearError("name");
                        }}
                        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-[#061830] font-medium focus:outline-none ${
                          errors.name ? "border-rose-500" : "border-slate-200 focus:border-gold"
                        }`}
                      />
                      {errors.name && <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.name}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Mobile Phone Number (10 digits) *
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="9876543210"
                        value={primaryGuest.phone}
                        onChange={(e) => {
                          setPrimaryGuest({ ...primaryGuest, phone: sanitizePhoneInput(e.target.value) });
                          clearError("phone");
                        }}
                        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-[#061830] font-medium focus:outline-none ${
                          errors.phone ? "border-rose-500" : "border-slate-200 focus:border-gold"
                        }`}
                      />
                      {errors.phone && <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.phone}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        maxLength={254}
                        placeholder="e.g. ramesh@example.com"
                        value={primaryGuest.email}
                        onChange={(e) => {
                          setPrimaryGuest({ ...primaryGuest, email: e.target.value });
                          clearError("email");
                        }}
                        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-[#061830] font-medium focus:outline-none ${
                          errors.email ? "border-rose-500" : "border-slate-200 focus:border-gold"
                        }`}
                      />
                      {errors.email && <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.email}</p>}
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Gender *
                      </label>
                      <select
                        value={primaryGuest.gender}
                        onChange={(e) => setPrimaryGuest({ ...primaryGuest, gender: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#061830] font-semibold focus:border-gold focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Purpose of Visit */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Purpose of Visit *
                      </label>
                      <select
                        value={primaryGuest.purposeOfVisit}
                        onChange={(e) => setPrimaryGuest({ ...primaryGuest, purposeOfVisit: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#061830] font-semibold focus:border-gold focus:outline-none"
                      >
                        <option value="Leisure">Leisure / Holiday</option>
                        <option value="Business">Business / Corporate</option>
                        <option value="Family">Family Function / Wedding</option>
                        <option value="Transit">Transit / Overnight</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Full Address */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Full Residential Address *
                      </label>
                      <input
                        type="text"
                        maxLength={300}
                        placeholder="Street, locality, landmark"
                        value={primaryGuest.address}
                        onChange={(e) => {
                          setPrimaryGuest({ ...primaryGuest, address: e.target.value });
                          clearError("address");
                        }}
                        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-[#061830] font-medium focus:outline-none ${
                          errors.address ? "border-rose-500" : "border-slate-200 focus:border-gold"
                        }`}
                      />
                      {errors.address && <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.address}</p>}
                    </div>

                    {/* City */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        maxLength={60}
                        value={primaryGuest.city}
                        onChange={(e) => {
                          setPrimaryGuest({ ...primaryGuest, city: sanitizeNameInput(e.target.value, 60) });
                          clearError("city");
                        }}
                        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-[#061830] font-medium focus:outline-none ${
                          errors.city ? "border-rose-500" : "border-slate-200 focus:border-gold"
                        }`}
                      />
                      {errors.city && <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.city}</p>}
                    </div>

                    {/* State */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        maxLength={60}
                        value={primaryGuest.state}
                        onChange={(e) => {
                          setPrimaryGuest({ ...primaryGuest, state: sanitizeNameInput(e.target.value, 60) });
                          clearError("state");
                        }}
                        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-[#061830] font-medium focus:outline-none ${
                          errors.state ? "border-rose-500" : "border-slate-200 focus:border-gold"
                        }`}
                      />
                      {errors.state && <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.state}</p>}
                    </div>

                    {/* Postal Code */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Postal / PIN Code *
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="e.g. 462001"
                        value={primaryGuest.postalCode}
                        onChange={(e) => {
                          setPrimaryGuest({ ...primaryGuest, postalCode: e.target.value.replace(/\D/g, "").slice(0, 6) });
                          clearError("postalCode");
                        }}
                        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-[#061830] font-medium focus:outline-none ${
                          errors.postalCode ? "border-rose-500" : "border-slate-200 focus:border-gold"
                        }`}
                      />
                      {errors.postalCode && <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.postalCode}</p>}
                    </div>

                    {/* Country */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        disabled
                        value={primaryGuest.country}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-[#061830] font-semibold"
                      />
                    </div>

                    {/* Gov ID Type */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Govt ID Document *
                      </label>
                      <select
                        value={primaryGuest.idType}
                        onChange={(e) => {
                          const nextType = e.target.value;
                          setPrimaryGuest({
                            ...primaryGuest,
                            idType: nextType,
                            idNumber: sanitizeIdInput(primaryGuest.idNumber, nextType),
                          });
                          clearError("idNumber");
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#061830] font-semibold focus:border-gold focus:outline-none"
                      >
                        {GOV_ID_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* Gov ID Number */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Govt ID Number *
                      </label>
                      <input
                        type="text"
                        inputMode={primaryGuest.idType === "Aadhaar Card" ? "numeric" : "text"}
                        maxLength={primaryGuest.idType === "Aadhaar Card" ? 14 : 20}
                        placeholder={
                          primaryGuest.idType === "Aadhaar Card"
                            ? "e.g. 1234 5678 9012 (12 digits)"
                            : primaryGuest.idType === "PAN Card"
                            ? "e.g. ABCDE1234F (10 chars)"
                            : primaryGuest.idType === "Passport"
                            ? "e.g. A1234567 (8-9 chars)"
                            : "Enter ID number"
                        }
                        value={primaryGuest.idNumber}
                        onChange={(e) => {
                          setPrimaryGuest({
                            ...primaryGuest,
                            idNumber: sanitizeIdInput(e.target.value, primaryGuest.idType),
                          });
                          clearError("idNumber");
                        }}
                        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-[#061830] font-medium uppercase focus:outline-none ${
                          errors.idNumber ? "border-rose-500" : "border-slate-200 focus:border-gold"
                        }`}
                      />
                      {errors.idNumber && <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.idNumber}</p>}
                    </div>

                      {/* Special Requests */}
                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                          Special Requests (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. High floor, early check-in, quiet room"
                          value={primaryGuest.specialRequests}
                          onChange={(e) => setPrimaryGuest({ ...primaryGuest, specialRequests: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#061830] font-medium focus:border-gold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Additional Guest Cards (only shown when guests > 1) */}
                  {guests > 1 && (
                    <div className="space-y-4">
                      {Array.from({ length: guests - 1 }).map((_, idx) => {
                        const guestIdx = idx;
                        const guestData = additionalGuests[guestIdx] || {
                          name: "",
                          age: "",
                          gender: "Male",
                          idType: "Aadhaar Card",
                          idNumber: "",
                          verified: true,
                          docUploaded: false,
                          docFileName: "",
                        };
                        return (
                          <div
                            key={guestIdx}
                            className="p-5 rounded-2xl bg-[#FAF7F2] border border-gold/30 space-y-4"
                          >
                            <div className="flex items-center justify-between border-b border-gold/20 pb-2">
                              <span className="font-bold text-sm text-[#061830] flex items-center gap-2">
                                <User className="size-4 text-gold" /> Guest {guestIdx + 2} Details
                              </span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <FileCheck className="size-3" /> Govt ID Required
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                                  Full Name *
                                </label>
                                <input
                                  type="text"
                                  maxLength={80}
                                  placeholder="Full Name as per ID"
                                  value={guestData.name}
                                  onChange={(e) => {
                                    const updated = [...additionalGuests];
                                    updated[guestIdx] = { ...guestData, name: sanitizeNameInput(e.target.value) };
                                    setAdditionalGuests(updated);
                                    clearError(`guest_${guestIdx}_name`);
                                  }}
                                  className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-[#061830] focus:outline-none font-medium ${
                                    errors[`guest_${guestIdx}_name`] ? "border-rose-500" : "border-slate-200 focus:border-gold"
                                  }`}
                                />
                                {errors[`guest_${guestIdx}_name`] && (
                                  <p className="mt-1 text-[10px] font-medium text-rose-600">{errors[`guest_${guestIdx}_name`]}</p>
                                )}
                              </div>

                              <div>
                                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                                  Age (Years) *
                                </label>
                                <input
                                  type="number"
                                  placeholder="e.g. 28"
                                  min="1"
                                  max="120"
                                  step="1"
                                  value={guestData.age}
                                  onChange={(e) => {
                                    const cleanAge = e.target.value.replace(/\D/g, "").slice(0, 3);
                                    const updated = [...additionalGuests];
                                    updated[guestIdx] = { ...guestData, age: cleanAge };
                                    setAdditionalGuests(updated);
                                    clearError(`guest_${guestIdx}_age`);
                                  }}
                                  className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-[#061830] focus:outline-none font-medium ${
                                    errors[`guest_${guestIdx}_age`] ? "border-rose-500" : "border-slate-200 focus:border-gold"
                                  }`}
                                />
                                {errors[`guest_${guestIdx}_age`] && (
                                  <p className="mt-1 text-[10px] font-medium text-rose-600">{errors[`guest_${guestIdx}_age`]}</p>
                                )}
                              </div>

                              <div>
                                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                                  Gender *
                                </label>
                                <select
                                  value={guestData.gender}
                                  onChange={(e) => {
                                    const updated = [...additionalGuests];
                                    updated[guestIdx] = { ...guestData, gender: e.target.value };
                                    setAdditionalGuests(updated);
                                  }}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none font-semibold"
                                >
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                                  Govt ID Type *
                                </label>
                                <select
                                  value={guestData.idType}
                                  onChange={(e) => {
                                    const updated = [...additionalGuests];
                                    updated[guestIdx] = { ...guestData, idType: e.target.value };
                                    setAdditionalGuests(updated);
                                  }}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none font-semibold"
                                >
                                  {GOV_ID_TYPES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                                  Govt ID Number *
                                </label>
                                <input
                                  type="text"
                                  inputMode={guestData.idType === "Aadhaar Card" ? "numeric" : "text"}
                                  maxLength={guestData.idType === "Aadhaar Card" ? 14 : 20}
                                  placeholder={guestData.idType === "Aadhaar Card" ? "5482 1290 4589" : "ID Document Number"}
                                  value={guestData.idNumber}
                                  onChange={(e) => {
                                    const updated = [...additionalGuests];
                                    updated[guestIdx] = {
                                      ...guestData,
                                      idNumber: sanitizeIdInput(e.target.value, guestData.idType),
                                    };
                                    setAdditionalGuests(updated);
                                    clearError(`guest_${guestIdx}_idNumber`);
                                  }}
                                  className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-[#061830] focus:outline-none font-medium uppercase ${
                                    errors[`guest_${guestIdx}_idNumber`] ? "border-rose-500" : "border-slate-200 focus:border-gold"
                                  }`}
                                />
                                {errors[`guest_${guestIdx}_idNumber`] && (
                                  <p className="mt-1 text-[10px] font-medium text-rose-600">{errors[`guest_${guestIdx}_idNumber`]}</p>
                                )}
                              </div>

                              <div>
                                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                                  Upload ID (Optional)
                                </label>
                                <label className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-gold/60 bg-white px-3 py-2 text-[11px] font-semibold text-[#061830] hover:bg-gold/10 transition cursor-pointer">
                                  <UploadCloud className="size-3.5 text-gold" />
                                  <span>{guestData.docUploaded ? guestData.docFileName : "Upload Scan/Photo"}</span>
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,.pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const fileRes = validateUploadFile(file);
                                        if (!fileRes.valid) {
                                          toast.error(fileRes.error);
                                          e.target.value = "";
                                          return;
                                        }
                                        const updated = [...additionalGuests];
                                        updated[guestIdx] = { ...guestData, docUploaded: true, docFileName: file.name };
                                        setAdditionalGuests(updated);
                                        toast.success(`Attached ${file.name} for Guest ${guestIdx + 2}`);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <ArrowLeft className="size-4" /> Back to Dates &amp; Guests
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedFromStep2}
                      className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-7 py-3 text-xs font-bold text-navy-deep uppercase tracking-wider shadow-gold hover:brightness-105 transition cursor-pointer"
                    >
                      Review Booking Summary <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ================= STEP 3: Summary & Review ================= */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="font-display text-2xl font-bold text-[#061830]">
                      Step 3: Booking Summary &amp; Review
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Carefully review your reservation details and payment preference before final confirmation.
                    </p>
                  </div>

                  {/* Room & Stay Overview Card */}
                  <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-gold/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-[#061830]">
                        {roomNumber ? `Room ${roomNumber} — ${selectedCategory.name}` : selectedCategory.name}
                      </span>
                      <span className="rounded-full bg-navy text-champagne text-[11px] font-bold px-3 py-0.5">
                        {quote.nights} {quote.nights === 1 ? "Night" : "Nights"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 pt-2 border-t border-gold/15">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Check-In</span>
                        <p className="font-bold text-[#061830]">{formatDate(checkIn)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Check-Out</span>
                        <p className="font-bold text-[#061830]">{formatDate(checkOut)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bed Configuration</span>
                        <p className="font-bold text-[#061830]">{selectedCategory.bed}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Guests</span>
                        <p className="font-bold text-[#061830]">{guests} Guests ({rooms} Room)</p>
                      </div>
                    </div>
                  </div>

                  {/* Registered Guests Summary */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 text-xs">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                      Registered Guests
                    </span>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                        <div>
                          <span className="font-bold text-navy">Primary: {primaryGuest.name}</span>
                          <span className="text-slate-500 text-[11px] ml-2">({primaryGuest.phone} · {primaryGuest.email})</span>
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-slate-600 bg-white border px-2 py-0.5 rounded">
                          {primaryGuest.idType}: {primaryGuest.idNumber}
                        </span>
                      </div>

                      {guests > 1 &&
                        additionalGuests.slice(0, guests - 1).map((g, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                            <div>
                              <span className="font-bold text-navy">Guest {idx + 2}: {g.name}</span>
                              <span className="text-slate-500 text-[11px] ml-2">({g.age} yrs · {g.gender})</span>
                            </div>
                            <span className="text-[10px] font-mono font-semibold text-slate-600 bg-white border px-2 py-0.5 rounded">
                              {g.idType}: {g.idNumber}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Payment Choice Selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Payment Preference *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setPaymentMethod("property")}
                        className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                          paymentMethod === "property"
                            ? "border-gold bg-[#FAF7F2] shadow-sm"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#061830]">Pay at Hotel upon Check-In</span>
                          <input
                            type="radio"
                            checked={paymentMethod === "property"}
                            onChange={() => setPaymentMethod("property")}
                            className="text-gold"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Settle your bill with Cash, UPI, or Credit/Debit Card at the reception desk.
                        </p>
                      </div>

                      <div
                        onClick={() => setPaymentMethod("online")}
                        className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                          paymentMethod === "online"
                            ? "border-gold bg-[#FAF7F2] shadow-sm"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#061830]">Pay Online (Razorpay — Frontend Placeholder)</span>
                          <input
                            type="radio"
                            checked={paymentMethod === "online"}
                            onChange={() => setPaymentMethod("online")}
                            className="text-gold"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Prepared for Razorpay checkout integration. No live payment is processed until backend integration is enabled.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <ArrowLeft className="size-4" /> Back to Guest Information
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleFinalBookingSubmission}
                      className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-8 py-3.5 text-xs font-bold text-navy-deep uppercase tracking-wider shadow-gold hover:brightness-105 transition cursor-pointer active:scale-95 disabled:opacity-60"
                    >
                      {submitting ? "Confirming…" : `Confirm Reservation (${formatINR(quote.total)})`} <Check className="size-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ================= STEP 4: Confirmation ================= */}
              {currentStep === 4 && confirmedBooking && (
                <div className="space-y-6 text-center py-4">
                  <div className="size-16 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center mx-auto shadow-sm">
                    <CheckCircle className="size-8" />
                  </div>

                  <div>
                    <span className="eyebrow text-emerald-700 font-bold uppercase tracking-wider text-xs">
                      Reservation Preview Created
                    </span>
                    <h2 className="mt-1 font-display text-3xl font-bold text-[#061830]">
                      Thank You, {confirmedBooking.guestName}!
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      Temporary frontend reservation stored in browser state. Persistent database saving and live Razorpay confirmation will be enabled upon backend integration.
                    </p>
                  </div>

                  {/* Booking ID Banner */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-gold/40 max-w-md mx-auto flex items-center justify-between">
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Booking Reference ID
                      </span>
                      <span className="font-mono text-xl font-bold text-navy">
                        {confirmedBooking.id}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(confirmedBooking.id);
                        toast.success("Booking ID copied to clipboard!");
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-gold/40 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-gold/10 transition"
                    >
                      <Copy className="size-3.5 text-gold" /> Copy
                    </button>
                  </div>

                  {/* Summary Breakdown Details */}
                  <div className="rounded-2xl border border-slate-200 p-5 text-left text-xs space-y-3 bg-white max-w-lg mx-auto">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Room Category</span>
                      <span className="font-bold text-[#061830]">{selectedCategory.name}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Assigned Room</span>
                      <span className="font-bold text-navy">
                        {confirmedBooking.roomNumber ? `Room ${confirmedBooking.roomNumber}` : "To be assigned at check-in"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Dates of Stay</span>
                      <span className="font-semibold text-slate-700">
                        {formatDate(confirmedBooking.checkIn)} → {formatDate(confirmedBooking.checkOut)} ({quote.nights} Nights)
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Base Room Charges</span>
                      <span className="font-semibold text-slate-700">{formatINR(quote.baseRoomTotal)}</span>
                    </div>
                    {quote.extraGuestTotal > 0 && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-slate-500">Extra Guest Charges</span>
                        <span className="font-semibold text-slate-700">{formatINR(quote.extraGuestTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500">Applicable GST (5%)</span>
                      <span className="font-semibold text-emerald-700">{formatINR(quote.gstAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-1 text-sm font-bold">
                      <span className="text-[#061830]">Grand Total Amount</span>
                      <span className="text-navy">{formatINR(confirmedBooking.total)}</span>
                    </div>
                    <div className="flex justify-between pt-1 text-xs">
                      <span className="text-slate-500">Payment Status</span>
                      <span className={`font-bold ${confirmedBooking.payment === "Paid" ? "text-emerald-700" : "text-amber-700"}`}>
                        {confirmedBooking.payment === "Paid"
                          ? "Paid in Full (Online)"
                          : confirmedBooking.paymentMethod?.includes("Razorpay")
                          ? "Pending (Razorpay Placeholder)"
                          : "Pay at Reception on Check-In"}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons (Guest-side only — no Reception Desk link) */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 hover:border-gold px-5 py-2.5 text-xs font-bold text-slate-800 transition cursor-pointer"
                    >
                      <Printer className="size-4 text-gold" /> Print Summary Slip
                    </button>
                    <Link
                      to="/"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-5 py-2.5 text-xs font-bold text-slate-800 transition"
                    >
                      <Home className="size-4" /> Return to Home
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sticky Financial Summary Sidebar (4 Cols) */}
            <div className="lg:col-span-4 sticky top-28 space-y-4">
              <div className="rounded-3xl border border-gold/30 bg-white p-6 shadow-card space-y-4">
                <span className="eyebrow text-gold font-bold uppercase tracking-wider text-[11px] block">
                  Stay Billing Breakdown
                </span>

                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <img
                    src={selectedRoomObj?.image || selectedCategory.image}
                    alt={selectedCategory.name}
                    className="size-16 rounded-xl object-cover border border-gold/20 shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-[#061830] leading-snug">
                      {roomNumber ? `Room ${roomNumber}` : selectedCategory.name}
                    </h3>
                    <p className="text-[11px] text-slate-500">{selectedCategory.bed}</p>
                    <p className="text-[10px] font-semibold text-emerald-700 mt-0.5">
                      Max {maxCapacityPerRoom} Guests per room
                    </p>
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Room Tariff</span>
                    <span className="font-medium">{formatINR(baseRate)} / night</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Duration &amp; Rooms</span>
                    <span className="font-medium">
                      {quote.nights} {quote.nights === 1 ? "Night" : "Nights"} × {rooms} {rooms === 1 ? "Room" : "Rooms"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-semibold pt-1 border-t border-slate-100">
                    <span>Base Room Charges</span>
                    <span>{formatINR(quote.baseRoomTotal)}</span>
                  </div>
                  {quote.extraGuestTotal > 0 && (
                    <div className="flex justify-between text-slate-700 font-semibold">
                      <span>Extra Guest ({quote.extraGuests} × {formatINR(quote.extraGuestPrice)} × {quote.nights}N)</span>
                      <span>+ {formatINR(quote.extraGuestTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-emerald-800 font-semibold">
                    <span>Applicable GST (5%{quote.gstAmount === 0 ? " — ₹0 on ₹1,000" : ""})</span>
                    <span>+ {formatINR(quote.gstAmount)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-navy pt-3 border-t-2 border-gold/30">
                    <span>Final Amount</span>
                    <span className="font-display">{formatINR(quote.total)}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 text-right">
                    Food &amp; water bottles charged extra at property.
                  </p>
                </div>

                {/* Verification Assurance */}
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-gold/20 space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5 text-navy font-bold">
                    <ShieldCheck className="size-4 text-gold shrink-0" />
                    <span>Guaranteed Reservation Privileges</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-500">
                    24-hour reception desk, instant check-in confirmation, free high-speed Wi-Fi, and authentic GST tax receipt provided at arrival.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
