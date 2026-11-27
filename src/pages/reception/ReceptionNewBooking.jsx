import React, { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  PlusCircle,
  MessageCircle,
  Printer,
  FileText,
  UserCheck,
  Zap,
  Bed,
  ShieldCheck,
  RotateCcw,
  DoorOpen,
} from "lucide-react";
import { toast } from "sonner";
import { Panel } from "@/components/dashboard/ui.jsx";
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
  createBooking,
  freeRoomsFor,
  freePhysicalRoomsForCategory,
  isPhysicalRoomAvailable,
  getCategory,
  useHotelState,
} from "@/lib/hotel/store.jsx";

export default function ReceptionNewBooking() {
  const state = useHotelState();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const today = todayISO();
  const isWalkInParam = searchParams.get("walkin") === "true";

  // Guest details
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [idType, setIdType] = useState("Aadhaar Card");
  const [idNumber, setIdNumber] = useState("");

  // Reservation details - Default to actual AC Family Room
  const [categoryId, setCategoryId] = useState(
    searchParams.get("category") || state.categories[0]?.id || "ac-family-double"
  );
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(addDays(today, 1));
  const [guests, setGuests] = useState(1);
  const [additionalGuests, setAdditionalGuests] = useState([
    { name: "", age: "", gender: "Female", idType: "Aadhaar Card", idNumber: "" },
    { name: "", age: "", gender: "Male", idType: "Aadhaar Card", idNumber: "" },
  ]);

  const handleGuestsChange = (newCount) => {
    const count = Math.max(1, Number(newCount) || 1);
    setGuests(count);
    const needed = Math.max(0, count - 1);
    setAdditionalGuests((prev) => {
      if (prev.length >= needed) return prev;
      const extra = Array.from({ length: needed - prev.length }, () => ({
        name: "",
        age: "",
        gender: "Male",
        idType: "Aadhaar Card",
        idNumber: "",
      }));
      return [...prev, ...extra];
    });
  };
  const [rooms, setRooms] = useState(1);
  const [roomNumber, setRoomNumber] = useState(searchParams.get("room") || "");
  const [source, setSource] = useState(isWalkInParam ? "Walk-in" : "Front Desk");
  const [bookingStatusType, setBookingStatusType] = useState(isWalkInParam ? "Checked-In" : "Confirmed");

  // Pricing & Payment details
  const [payMethod, setPayMethod] = useState("Cash");
  const [paid, setPaid] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [requests, setRequests] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [showGuestSuggestions, setShowGuestSuggestions] = useState(false);

  const cat = getCategory(state, categoryId);
  const taxRate = state.settings?.taxRate ?? 0.05;

  // Selected room object and applicable tariff rate
  const selectedRoomObj = roomNumber ? state.rooms.find((r) => String(r.number) === String(roomNumber)) : null;
  const applicableRate = selectedRoomObj?.price || cat.price;
  const q = quoteStay(applicableRate, checkIn, checkOut, rooms, taxRate);

  const discountVal = Math.min(q.total, Math.max(0, Number(discountAmount) || 0));
  const netTotal = Math.max(0, q.total - discountVal);
  const numPaid = Math.min(netTotal, Math.max(0, Number(paid) || 0));
  const balanceDue = Math.max(0, netTotal - numPaid);

  // Filter available physical rooms among actual 10 rooms (101-110)
  const normCategory = categoryId === "ac-family" ? "ac-family-double" : categoryId === "ac-premium" ? "ac-premium-round" : categoryId === "non-ac" ? "non-ac-double" : categoryId;
  const availableRoomObjects = state.rooms.filter(
    (r) =>
      (r.categoryId === normCategory || r.categoryId === categoryId) &&
      isPhysicalRoomAvailable(state, r.number, checkIn, checkOut)
  );
  const left = availableRoomObjects.length;
  const canCheckIn = checkIn === today && rooms === 1;

  // Past guest search from CRM & bookings
  const guestSuggestions = useMemo(() => {
    if (!name.trim() && !phone.trim()) return [];
    const t = (name || phone).toLowerCase().trim();
    const map = new Map();

    // From CRM guests
    (state.guests || []).forEach((g) => {
      if ((g.name && g.name.toLowerCase().includes(t)) || (g.phone && g.phone.includes(t))) {
        map.set(g.phone, {
          name: g.name,
          phone: g.phone,
          email: g.email,
          address: g.address,
          idType: g.idType,
          idNumber: g.idNumber,
        });
      }
    });

    // From bookings
    (state.bookings || []).forEach((b) => {
      if (
        (b.guestName.toLowerCase().includes(t) || b.phone.includes(t)) &&
        !map.has(b.phone)
      ) {
        map.set(b.phone, {
          name: b.guestName,
          phone: b.phone,
          email: b.email,
          address: "",
          idType: b.idType || "Aadhaar Card",
          idNumber: b.idNumber || "",
        });
      }
    });

    return Array.from(map.values()).slice(0, 4);
  }, [name, phone, state.guests, state.bookings]);

  const selectPastGuest = (g) => {
    setName(g.name);
    setPhone(g.phone);
    if (g.email && !g.email.endsWith(".local")) setEmail(g.email);
    if (g.address) setAddress(g.address);
    if (g.idType) setIdType(g.idType);
    if (g.idNumber) setIdNumber(g.idNumber);
    setShowGuestSuggestions(false);
    toast.success(`Selected past guest record: ${g.name}`);
  };

  const applyPreset = (days) => {
    setCheckIn(today);
    setCheckOut(addDays(today, days));
  };

  const handleResetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setIdNumber("");
    setRoomNumber("");
    setPaid("");
    setDiscountAmount("");
    setRequests("");
    setInternalNotes("");
    setCheckIn(today);
    setCheckOut(addDays(today, 1));
    toast.info("Booking form reset.");
  };

  function submit(e) {
    e.preventDefault();

    // 1. Name validation
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Please enter a valid guest full name (at least 2 characters).");
      return;
    }

    // 2. Phone validation
    const phoneRes = validatePhoneNumber(phone);
    if (!phoneRes.valid) {
      toast.error(phoneRes.error);
      return;
    }

    // 3. Email validation
    let finalEmail = email.trim();
    if (finalEmail) {
      const emailRes = validateEmail(finalEmail);
      if (!emailRes.valid) {
        toast.error(emailRes.error);
        return;
      }
      finalEmail = emailRes.email;
    } else {
      finalEmail = `${name.trim().toLowerCase().replace(/\s+/g, ".")}@walkin.local`;
    }

    // 4. Dates validation
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

    // 5. Availability
    if (left < rooms) {
      toast.error(`Only ${left} ${cat.name} room(s) available for selected dates.`);
      return;
    }

    // 6. Occupancy validation (Section 7: Enforce guest limits - Room 103 allows up to 3 guests; all other rooms allow up to 2 guests)
    const maxOccupancyPerRoom = selectedRoomObj
      ? (selectedRoomObj.capacity || 2)
      : (categoryId === "ac-family-triple" ? 3 : 2);
    const totalAllowed = maxOccupancyPerRoom * rooms;
    if (guests < 1 || guests > totalAllowed) {
      toast.error(
        selectedRoomObj
          ? `Room ${roomNumber} allows a maximum of ${selectedRoomObj.capacity || 2} guests. (Note: Only Room 103 supports 3 guests, all other rooms have a max occupancy of 2)`
          : `Guest count must be between 1 and ${totalAllowed} for the selected room tier.`
      );
      return;
    }

    // Validate additional guests if guests > 1
    const additionalCount = Math.max(0, guests - 1);
    for (let i = 0; i < additionalCount; i++) {
      const g = additionalGuests[i] || {};
      if (!g.name || g.name.trim().length < 2) {
        toast.error(`Please enter Full Name for Guest ${i + 2}.`);
        return;
      }
    }

    // 7. Express check-in room assignment check
    let finalRoom = roomNumber;
    if (bookingStatusType === "Checked-In") {
      if (!canCheckIn) {
        toast.error("Instant check-in is only available for reservations starting today.");
        return;
      }
      if (!finalRoom) {
        if (availableRoomObjects.length > 0) {
          finalRoom = availableRoomObjects[0].number;
        } else {
          toast.error("No ready clean rooms available for immediate check-in.");
          return;
        }
      }
    }

    setBusy(true);

    setTimeout(() => {
      const b = createBooking({
        guestName: name.trim(),
        phone: phoneRes.formatted,
        email: finalEmail,
        categoryId,
        checkIn,
        checkOut,
        guests,
        additionalGuests: additionalGuests.slice(0, Math.max(0, guests - 1)).map((g) => ({
          name: g.name.trim(),
          age: g.age || undefined,
          gender: g.gender || "Male",
          idType: g.idType || "Aadhaar Card",
          idNumber: g.idNumber ? g.idNumber.trim().toUpperCase() : undefined,
        })),
        rooms,
        tariffRate: applicableRate,
        requests: requests.trim() || undefined,
        internalNotes: internalNotes.trim() || `Booked at front desk (${source})`,
        source,
        status: bookingStatusType,
        payment: numPaid >= netTotal ? "Paid" : numPaid > 0 ? "Partial" : "Unpaid",
        amountPaid: numPaid,
        total: netTotal,
        discountAmount: discountVal,
        depositAmount: numPaid,
        roomNumber: finalRoom || undefined,
        idType,
        idNumber: idNumber.trim() || undefined,
        idName: name.trim(),
        idVerified: Boolean(idNumber.trim()),
        paymentMethod: payMethod.toLowerCase(),
      });

      setBusy(false);
      setDone(b);
      toast.success(
        b.status === "Checked-In"
          ? `Guest checked in directly to Room ${finalRoom}! Booking #${b.id}`
          : `Reservation #${b.id} saved as ${b.status}!`
      );
    }, 400);
  }

  // Print Registration Slip from success screen
  const handlePrintSlip = () => {
    if (!done) return;
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(`
      <html>
        <head>
          <title>Guest Registration Slip - ${done.id}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #111; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 20px; }
            .hotel-name { font-size: 24px; font-weight: bold; letter-spacing: 2px; }
            .sub { font-size: 12px; color: #555; margin-top: 4px; }
            .title { font-size: 16px; font-weight: bold; margin: 15px 0; text-transform: uppercase; text-align: center; }
            .grid { display: flex; flex-wrap: wrap; margin-bottom: 20px; }
            .col { width: 50%; margin-bottom: 12px; font-size: 14px; }
            .label { font-size: 11px; text-transform: uppercase; color: #666; font-weight: bold; }
            .val { font-size: 14px; font-weight: 600; margin-top: 2px; }
            .sign-box { margin-top: 50px; display: flex; justify-content: space-between; }
            .sign-line { border-top: 1px solid #444; width: 220px; text-align: center; padding-top: 5px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hotel-name">${state.settings?.hotelName || "HOTEL MERI & RESIDENCY"}</div>
            <div class="sub">${state.settings?.address || "Civil Lines, Bareilly"} · Ph: ${state.settings?.phone || "+91 94122 56789"}</div>
          </div>
          <div class="title">Guest Registration &amp; Check-In Card</div>
          <div class="grid">
            <div class="col"><div class="label">Booking ID</div><div class="val">${done.id}</div></div>
            <div class="col"><div class="label">Room Number</div><div class="val">${done.roomNumber || "Assigned at desk"}</div></div>
            <div class="col"><div class="label">Guest Name</div><div class="val">${done.guestName}</div></div>
            <div class="col"><div class="label">Phone / Mobile</div><div class="val">${done.phone}</div></div>
            <div class="col"><div class="label">Room Category</div><div class="val">${getCategory(state, done.categoryId)?.name} (${done.rooms} room)</div></div>
            <div class="col"><div class="label">Check-In Date</div><div class="val">${formatDate(done.checkIn)}</div></div>
            <div class="col"><div class="label">Check-Out Date</div><div class="val">${formatDate(done.checkOut)}</div></div>
            <div class="col"><div class="label">Total Amount (5% GST)</div><div class="val">₹${done.total}</div></div>
            <div class="col"><div class="label">Amount Paid / Balance</div><div class="val">₹${done.amountPaid} / ₹${done.total - done.amountPaid} (${done.payment})</div></div>
          </div>
          <div style="font-size: 11px; color: #666; margin-top: 20px; line-height: 1.5;">
            * I agree to comply with hotel accommodation regulations and check-out at 11:00 AM on scheduled date.
          </div>
          <div class="sign-box">
            <div class="sign-line">Guest Signature</div>
            <div class="sign-line">Front Desk Receptionist</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // WhatsApp confirmation url
  let waUrl = "";
  if (done) {
    const cleanPhone = done.phone.replace(/\D/g, "");
    const waPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const waMsg = encodeURIComponent(
      `*Hotel Meri & Residency — Reservation Confirmation*\n\nDear ${done.guestName},\nWe look forward to welcoming you! Here are your booking details:\n• Booking ID: *${done.id}*\n• Category: *${getCategory(state, done.categoryId)?.name}*\n• Check-in: *${formatDate(done.checkIn)}*\n• Check-out: *${formatDate(done.checkOut)}*\n• Assigned Room: *${done.roomNumber || "To be assigned on arrival"}*\n• Total Folio: *${formatINR(done.total)}* (Paid: ${formatINR(done.amountPaid)})\n\nAddress: ${state.settings?.address || "Civil Lines, Bareilly"}\nHelpline: ${state.settings?.phone || "+91 94122 56789"}`
    );
    waUrl = `https://wa.me/${waPhone}?text=${waMsg}`;
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-lg rounded-3xl border border-gold/40 bg-white p-8 text-center shadow-2xl text-[#061830]"
      >
        <div className="mx-auto size-16 rounded-full bg-emerald-100 border border-emerald-300 grid place-items-center">
          <CheckCircle2 className="size-10 text-emerald-600" />
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold text-[#061830]">
          Reservation Created!
        </h2>
        <p className="mt-1 text-xs text-[#64748b]">
          {done.guestName} · {getCategory(state, done.categoryId)?.name}
          {done.roomNumber ? ` · Room ${done.roomNumber}` : ""}
        </p>
        <p className="mt-3 font-display text-2xl font-bold tracking-widest text-gold">{done.id}</p>

        {/* Communication & Print Shortcuts */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-sm"
          >
            <MessageCircle className="size-3.5 text-emerald-600" /> Send WhatsApp
          </a>
          <button
            onClick={handlePrintSlip}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-[#FAF7F2] px-4 py-2 text-xs font-bold text-[#061830] hover:bg-gold/15 transition cursor-pointer shadow-sm"
          >
            <Printer className="size-3.5 text-gold" /> Print Reg Card
          </button>
          <Link
            to={`/invoice/${done.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-[#FAF7F2] px-4 py-2 text-xs font-bold text-[#061830] hover:bg-gold/15 transition shadow-sm"
          >
            <FileText className="size-3.5 text-gold" /> View Invoice
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3 border-t border-gold/15 pt-6">
          <button
            onClick={handleResetForm}
            className="rounded-full bg-gold-gradient px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gold-foreground shadow-gold hover:brightness-110 cursor-pointer"
          >
            + New Reservation
          </button>
          <button
            onClick={() => navigate("/reception/bookings")}
            className="rounded-full border border-gold/40 bg-[#FAF7F2] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#061830] hover:bg-gold/15 cursor-pointer shadow-sm"
          >
            All Bookings
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-3">
      <Panel
        title="Front Desk Reservation Creation"
        subtitle="Register walk-in guests, create phone reservations, and assign rooms with real-time availability"
        className="xl:col-span-2"
        action={
          <button
            type="button"
            onClick={handleResetForm}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-[#FAF7F2] px-3 py-1.5 text-xs font-bold text-[#061830] hover:bg-gold/15 transition cursor-pointer"
          >
            <RotateCcw className="size-3.5 text-gold" /> Reset
          </button>
        }
      >
        {/* Quick Date Presets */}
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-gold/30 bg-[#FAF7F2] p-2.5 shadow-sm">
          <span className="flex items-center gap-1 text-[11px] font-bold text-gold uppercase tracking-wider mr-1">
            <Zap className="size-3 text-gold" /> Stay Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset(1)}
            className="rounded-lg border border-gold/30 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#061830] hover:bg-gold/15 transition cursor-pointer"
          >
            Tonight (1 N)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(2)}
            className="rounded-lg border border-gold/30 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#061830] hover:bg-gold/15 transition cursor-pointer"
          >
            2 Nights
          </button>
          <button
            type="button"
            onClick={() => applyPreset(3)}
            className="rounded-lg border border-gold/30 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#061830] hover:bg-gold/15 transition cursor-pointer"
          >
            3 Nights
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 text-xs text-[#061830]">
          {/* Section Header: Guest Details */}
          <div className="sm:col-span-2 border-b border-gold/15 pb-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gold">
              1. Guest Profile &amp; Contact Details
            </h4>
          </div>

          {/* Guest Name & Past Search */}
          <div className="space-y-1.5 sm:col-span-2 relative">
            <div className="flex items-center justify-between">
              <label className="text-gold font-bold uppercase tracking-wide">
                Guest Full Name *
              </label>
              {guestSuggestions.length > 0 && (
                <span className="text-[10px] text-gold font-semibold">
                  {guestSuggestions.length} CRM profile matches
                </span>
              )}
            </div>
            <input
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setShowGuestSuggestions(true);
              }}
              onFocus={() => setShowGuestSuggestions(true)}
              placeholder="e.g. Vikramaditya Rathore"
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#061830] focus:border-gold focus:outline-none"
            />

            {/* Suggestions Popover */}
            {showGuestSuggestions && guestSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-gold/40 bg-white p-2 shadow-xl">
                <p className="px-2 py-1 text-[10px] uppercase font-bold text-gold">
                  Matching Guest Records (Click to auto-fill):
                </p>
                {guestSuggestions.map((g, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectPastGuest(g)}
                    className="flex w-full items-center justify-between rounded-lg p-2 text-left hover:bg-gold/10 transition cursor-pointer"
                  >
                    <div>
                      <p className="font-bold text-[#061830]">{g.name}</p>
                      <p className="text-[10px] text-[#64748b]">
                        {g.phone} · {g.email || "No email"}
                      </p>
                    </div>
                    <UserCheck className="size-4 text-emerald-600" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-gold font-bold uppercase tracking-wide">
              Phone / Mobile (10-digits) *
            </label>
            <input
              required
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="9876543210"
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#061830] focus:border-gold focus:outline-none"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-gold font-bold uppercase tracking-wide">
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="guest@example.com"
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#061830] focus:border-gold focus:outline-none"
            />
          </div>

          {/* ID Proof Type */}
          <div className="space-y-1.5">
            <label className="text-gold font-bold uppercase tracking-wide">ID Proof Type</label>
            <select
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#061830] focus:border-gold focus:outline-none"
            >
              <option value="Aadhaar Card">Aadhaar Card</option>
              <option value="Passport">Passport</option>
              <option value="Driving License">Driving License</option>
              <option value="Voter ID">Voter ID</option>
            </select>
          </div>

          {/* ID Number */}
          <div className="space-y-1.5">
            <label className="text-gold font-bold uppercase tracking-wide">ID Document Number</label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="e.g. 5421-8890-1234"
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#061830] focus:border-gold focus:outline-none"
            />
          </div>

          {/* Guest City / Address */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-gold font-bold uppercase tracking-wide">City &amp; Residential Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Civil Lines, Bareilly / New Delhi"
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none"
            />
          </div>

          {/* Section Header: Reservation Details */}
          <div className="sm:col-span-2 border-b border-gold/15 pt-2 pb-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gold">
              2. Stay Dates, Room Category &amp; Occupancy
            </h4>
          </div>

          {/* Check-In */}
          <div className="space-y-1.5">
            <label className="text-gold font-bold uppercase tracking-wide">Check-In Date *</label>
            <input
              type="date"
              required
              value={checkIn}
              min={today}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#061830] focus:border-gold focus:outline-none"
            />
          </div>

          {/* Check-Out */}
          <div className="space-y-1.5">
            <label className="text-gold font-bold uppercase tracking-wide">Check-Out Date *</label>
            <input
              type="date"
              required
              value={checkOut}
              min={checkIn || today}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#061830] focus:border-gold focus:outline-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-gold font-bold uppercase tracking-wide">Room Category *</label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setRoomNumber("");
              }}
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#061830] focus:border-gold focus:outline-none font-semibold"
            >
              {state.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — ₹{c.price.toLocaleString("en-IN")}/night
                </option>
              ))}
            </select>
          </div>

          {/* Room Number Assignment */}
          <div className="space-y-1.5">
            <label className="text-gold font-bold uppercase tracking-wide">
              Assign Available Room (Rooms 101–110)
            </label>
            <select
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#061830] focus:border-gold focus:outline-none"
            >
              <option value="">Auto-assign or assign on arrival</option>
              {availableRoomObjects.map((rm) => (
                <option key={rm.number} value={rm.number}>
                  Room {rm.number} ({rm.bedType || rm.bed}, max {rm.capacity || 2} guests) — ₹{(rm.price || cat.price).toLocaleString("en-IN")}/day + 5% GST
                </option>
              ))}
            </select>
            {roomNumber && selectedRoomObj && (
              <span className="text-[11px] text-gold block font-semibold">
                Selected: Room {roomNumber} • {selectedRoomObj.bedType || selectedRoomObj.bed} • Max {selectedRoomObj.capacity || 2} Guests • ₹{(selectedRoomObj.price || cat.price).toLocaleString("en-IN")}/day + 5% GST
              </span>
            )}
          </div>

          {/* Guests count */}
          <div className="space-y-1.5">
            <label className="text-gold font-bold uppercase tracking-wide">Total Guests</label>
            <select
              value={guests}
              onChange={(e) => handleGuestsChange(Number(e.target.value))}
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#061830] focus:border-gold focus:outline-none font-semibold"
            >
              {Array.from(
                {
                  length:
                    (selectedRoomObj
                      ? selectedRoomObj.capacity || 2
                      : categoryId === "ac-family-triple"
                      ? 3
                      : 2) * rooms,
                },
                (_, i) => i + 1
              ).map((count) => (
                <option key={count} value={count}>
                  {count} {count === 1 ? "Guest" : "Guests"}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Additional Guest Details (when guests > 1) */}
          {guests > 1 && (
            <div className="sm:col-span-2 space-y-3 rounded-2xl border border-gold/25 bg-[#FAF7F2] p-4">
              <div className="flex items-center justify-between border-b border-gold/20 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#061830]">
                  Additional Guest Details ({guests - 1})
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  Based on {guests} guests selected
                </span>
              </div>
              {Array.from({ length: guests - 1 }).map((_, idx) => {
                const g = additionalGuests[idx] || {
                  name: "",
                  age: "",
                  gender: "Male",
                  idType: "Aadhaar Card",
                  idNumber: "",
                };
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 rounded-xl border border-gold/20 bg-white p-3"
                  >
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Guest {idx + 2} Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={g.name}
                        onChange={(e) => {
                          const updated = [...additionalGuests];
                          updated[idx] = { ...g, name: e.target.value.replace(/[^A-Za-z\s.'-]/g, "") };
                          setAdditionalGuests(updated);
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-[#061830] focus:border-gold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Age
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        placeholder="Age"
                        value={g.age}
                        onChange={(e) => {
                          const updated = [...additionalGuests];
                          updated[idx] = { ...g, age: e.target.value.replace(/\D/g, "").slice(0, 3) };
                          setAdditionalGuests(updated);
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-[#061830] focus:border-gold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Gender
                      </label>
                      <select
                        value={g.gender}
                        onChange={(e) => {
                          const updated = [...additionalGuests];
                          updated[idx] = { ...g, gender: e.target.value };
                          setAdditionalGuests(updated);
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-[#061830] focus:border-gold focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Govt ID Type
                      </label>
                      <select
                        value={g.idType}
                        onChange={(e) => {
                          const updated = [...additionalGuests];
                          updated[idx] = { ...g, idType: e.target.value };
                          setAdditionalGuests(updated);
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-[#061830] focus:border-gold focus:outline-none"
                      >
                        <option value="Aadhaar Card">Aadhaar Card</option>
                        <option value="Passport">Passport</option>
                        <option value="Driving License">Driving License</option>
                        <option value="Voter ID">Voter ID</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Govt ID Number
                      </label>
                      <input
                        type="text"
                        placeholder="Optional ID #"
                        value={g.idNumber}
                        onChange={(e) => {
                          const updated = [...additionalGuests];
                          updated[idx] = { ...g, idNumber: e.target.value.toUpperCase() };
                          setAdditionalGuests(updated);
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-[#061830] uppercase focus:border-gold focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Source */}
          <div className="space-y-1.5">
            <label className="text-gold font-bold uppercase tracking-wide">Booking Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#061830] focus:border-gold focus:outline-none"
            >
              <option value="Walk-in">Walk-in at Reception</option>
              <option value="Phone">Phone Inquiry</option>
              <option value="Corporate">Corporate / VIP Desk</option>
              <option value="Front Desk">Front Desk Direct</option>
            </select>
          </div>

          {/* Requests & Notes */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-gold font-bold uppercase tracking-wide">Special Requests &amp; Notes</label>
            <input
              type="text"
              value={requests}
              onChange={(e) => setRequests(e.target.value)}
              placeholder="e.g. Quiet floor, early arrival, feather pillows, extra rollaway bed"
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none"
            />
          </div>
        </div>
      </Panel>

      {/* Right Column: Pricing, Folio & Confirmation Actions */}
      <div className="space-y-6">
        <Panel title="Tariff &amp; Billing Folio" subtitle="5% GST accommodation billing">
          <div className="space-y-3 text-xs text-[#061830]">
            <div className="flex justify-between py-1 border-b border-gold/15">
              <span className="text-[#64748b]">Base Tariff ({q.nights}N × ₹{(applicableRate || 0).toLocaleString("en-IN")})</span>
              <span className="font-bold">₹{(q.subtotal ?? q.basePrice ?? 0).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gold/15">
              <span className="text-[#64748b]">GST on Accommodation (5%)</span>
              <span className="font-bold text-emerald-700">+₹{(q.taxes ?? q.gstAmount ?? q.tax ?? 0).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gold/15">
              <span className="text-[#64748b]">Total with 5% GST</span>
              <span className="font-bold text-gold">₹{(q.total || 0).toLocaleString("en-IN")}</span>
            </div>

            {/* Authorized Concession / Discount */}
            <div className="space-y-1 pt-1">
              <label className="text-gold font-bold uppercase tracking-wide block">
                Authorized Discount (₹)
              </label>
              <input
                type="number"
                min={0}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-1.5 text-xs text-[#061830] font-bold"
              />
            </div>

            {/* Net Total */}
            <div className="flex justify-between py-2 border-y-2 border-gold/40 text-sm font-bold bg-[#FAF7F2] px-2 rounded-lg">
              <span className="text-navy-deep">Final Folio Total</span>
              <span className="text-gold font-display text-base">₹{netTotal.toLocaleString("en-IN")}</span>
            </div>

            {/* Advance Collection */}
            <div className="space-y-1.5 pt-1">
              <label className="text-gold font-bold uppercase tracking-wide block">
                Payment Collected Now (₹)
              </label>
              <input
                type="number"
                min={0}
                max={netTotal}
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
                placeholder={`0 to ${netTotal}`}
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm text-[#061830] font-bold"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <label className="text-gold font-bold uppercase tracking-wide block">
                Payment Method
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-1.5 text-xs text-[#061830]"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Card">Debit / Credit Card</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
              </select>
            </div>

            {/* Balance Due Display */}
            <div className="flex justify-between py-1 text-xs">
              <span className="text-[#64748b]">Remaining Balance Due:</span>
              <span className={`font-bold ${balanceDue > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                ₹{balanceDue.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </Panel>

        <Panel title="Action &amp; Desk Execution">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-gold font-bold uppercase tracking-wide text-xs block">
                Booking Status on Creation
              </label>
              <select
                value={bookingStatusType}
                onChange={(e) => setBookingStatusType(e.target.value)}
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830] font-bold"
              >
                {canCheckIn && (
                  <option value="Checked-In">
                    ⚡ Check-In Immediately (Walk-In Arrival)
                  </option>
                )}
                <option value="Confirmed">Confirm Reservation</option>
                <option value="Pending">Save as Pending</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient py-3 text-xs font-bold uppercase tracking-wider text-gold-foreground shadow-gold hover:brightness-110 transition cursor-pointer"
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving...
                </>
              ) : bookingStatusType === "Checked-In" ? (
                <>
                  <DoorOpen className="size-4" /> Check-In Guest Directly
                </>
              ) : (
                <>
                  <PlusCircle className="size-4" /> Create Reservation
                </>
              )}
            </button>
          </div>
        </Panel>
      </div>
    </form>
  );
}
