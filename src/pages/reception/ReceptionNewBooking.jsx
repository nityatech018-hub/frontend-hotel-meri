import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  getCategory,
  useHotelState,
} from "@/lib/hotel/store.jsx";

export default function ReceptionNewBooking() {
  const state = useHotelState();
  const navigate = useNavigate();
  const today = todayISO();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [categoryId, setCategoryId] = useState("deluxe");
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(addDays(today, 1));
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [roomNumber, setRoomNumber] = useState("");
  const [source, setSource] = useState("Walk-in");
  const [payMethod, setPayMethod] = useState("Cash");
  const [paid, setPaid] = useState(0);
  const [checkInNow, setCheckInNow] = useState(true);
  const [requests, setRequests] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [showGuestSuggestions, setShowGuestSuggestions] = useState(false);

  const cat = getCategory(state, categoryId);
  const q = quoteStay(cat.price, checkIn, checkOut, rooms, state.settings?.taxRate || 0.12);
  const left = availableUnits(state, categoryId, checkIn, checkOut);
  const free = freeRoomsFor(state, categoryId);
  const canCheckIn = checkIn === today && rooms === 1;

  // Past guest search
  const guestSuggestions = useMemo(() => {
    if (!name.trim() && !phone.trim()) return [];
    const t = (name || phone).toLowerCase().trim();
    const map = new Map();
    state.bookings.forEach((b) => {
      if (
        (b.guestName.toLowerCase().includes(t) || b.phone.includes(t)) &&
        !map.has(b.phone)
      ) {
        map.set(b.phone, { name: b.guestName, phone: b.phone, email: b.email });
      }
    });
    return Array.from(map.values()).slice(0, 4);
  }, [name, phone, state.bookings]);

  const selectPastGuest = (g) => {
    setName(g.name);
    setPhone(g.phone);
    if (g.email && !g.email.endsWith(".local")) setEmail(g.email);
    setShowGuestSuggestions(false);
    toast.success(`Selected past guest: ${g.name}`);
  };

  // Date Preset Buttons
  const applyPreset = (days) => {
    const cin = today;
    const cout = addDays(today, days);
    setCheckIn(cin);
    setCheckOut(cout);
  };

  function submit(e) {
    e.preventDefault();

    // 1. Guest Name validation
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Please enter a valid guest name (at least 2 characters).");
      return;
    }

    // 2. Phone validation (strict 10-digit mobile number)
    const phoneRes = validatePhoneNumber(phone);
    if (!phoneRes.valid) {
      toast.error(phoneRes.error);
      return;
    }

    // 3. Email validation (if provided)
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

    // 5. Rooms and Availability
    if (rooms < 1) {
      toast.error("At least 1 room must be selected.");
      return;
    }
    if (left < rooms) {
      toast.error(`Only ${left} ${cat.name} room(s) available for selected dates.`);
      return;
    }

    // 6. Occupancy validation
    const maxOccupancy = (cat.maxGuests || 3) * rooms;
    if (guests < 1) {
      toast.error("Guest count must be at least 1.");
      return;
    }
    if (guests > maxOccupancy) {
      toast.error(`Maximum occupancy for ${rooms} ${cat.name} room(s) is ${maxOccupancy} guests.`);
      return;
    }

    // 7. Express check-in room assignment
    let finalRoom = roomNumber;
    if (checkInNow && canCheckIn) {
      if (!finalRoom) {
        if (free.length > 0) {
          finalRoom = free[0];
        } else {
          toast.error("No ready rooms available for instant check-in. Please pick another category or uncheck express check-in.");
          return;
        }
      }
    }

    // 8. Payment bounds
    if (paid < 0) {
      toast.error("Payment collected cannot be negative.");
      return;
    }
    if (paid > q.total) {
      toast.error(`Payment cannot exceed the total bill (${formatINR(q.total)}).`);
      return;
    }

    setBusy(true);

    setTimeout(() => {
      const amount = Math.min(q.total, Math.max(0, paid));
      const b = createBooking({
        guestName: name.trim(),
        phone: phoneRes.formatted,
        email: finalEmail,
        categoryId,
        checkIn,
        checkOut,
        guests,
        rooms,
        requests: requests.trim() ? `${requests.trim()} [Paid via: ${payMethod}]` : `[Paid via: ${payMethod}]`,
        source,
        status: checkInNow && canCheckIn ? "Checked-In" : "Confirmed",
        payment: amount >= q.total ? "Paid" : amount > 0 ? "Partial" : "Unpaid",
        amountPaid: amount,
        roomNumber: finalRoom || undefined,
      });

      setBusy(false);
      setDone(b);
      toast.success(
        checkInNow && canCheckIn
          ? `Guest checked in directly to Room ${finalRoom}! Booking ${b.id}`
          : `Reservation ${b.id} confirmed successfully!`
      );
    }, 450);
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
            <div class="col"><div class="label">Email Address</div><div class="val">${done.email}</div></div>
            <div class="col"><div class="label">Room Category</div><div class="val">${getCategory(state, done.categoryId)?.name} (${done.rooms} room)</div></div>
            <div class="col"><div class="label">Check-In Date</div><div class="val">${formatDate(done.checkIn)}</div></div>
            <div class="col"><div class="label">Check-Out Date</div><div class="val">${formatDate(done.checkOut)}</div></div>
            <div class="col"><div class="label">Total Amount</div><div class="val">₹${done.total}</div></div>
            <div class="col"><div class="label">Amount Paid / Balance</div><div class="val">₹${done.amountPaid} / ₹${done.total - done.amountPaid} (${done.payment})</div></div>
          </div>
          <div style="font-size: 11px; color: #666; margin-top: 20px; line-height: 1.5;">
            * I agree to comply with hotel policies and check-out at 11:00 AM on scheduled date.
          </div>
          <div class="sign-box">
            <div class="sign-line">Guest Signature</div>
            <div class="sign-line">Front Desk Officer</div>
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
        className="mx-auto max-w-lg rounded-3xl border border-gold/30 bg-[#061830] p-8 text-center shadow-2xl"
      >
        <div className="mx-auto size-16 rounded-full bg-emerald-950/50 border border-emerald-500/40 grid place-items-center">
          <CheckCircle2 className="size-10 text-emerald-400" />
        </div>
        <h2 className="mt-4 font-display text-3xl font-semibold text-navy-foreground">
          Reservation Created!
        </h2>
        <p className="mt-1 text-xs text-navy-foreground/70">
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
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40 transition"
          >
            <MessageCircle className="size-3.5 text-emerald-400" /> Send WhatsApp
          </a>
          <button
            onClick={handlePrintSlip}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-navy px-4 py-2 text-xs font-semibold text-champagne hover:bg-white/5 transition cursor-pointer"
          >
            <Printer className="size-3.5 text-gold" /> Print Reg Card
          </button>
          <Link
            to={`/invoice/${done.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-navy px-4 py-2 text-xs font-semibold text-champagne hover:bg-white/5 transition"
          >
            <FileText className="size-3.5 text-gold" /> View Invoice
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3 border-t border-gold/15 pt-6">
          <button
            onClick={() => {
              setDone(null);
              setName("");
              setPhone("");
              setEmail("");
              setRoomNumber("");
              setPaid(0);
              setRequests("");
            }}
            className="rounded-full bg-gold-gradient px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-gold-foreground shadow-gold hover:brightness-110"
          >
            + Next Reservation
          </button>
          <button
            onClick={() => navigate("/reception/bookings")}
            className="rounded-full border border-gold/30 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-champagne hover:bg-white/5"
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
        title="Walk-In &amp; Direct Reservation"
        subtitle="Quick guest check-in, phone reservation or direct walk-in creation"
        className="xl:col-span-2"
      >
        {/* Quick Date Presets */}
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-gold/20 bg-navy-deep/80 p-2.5">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-gold uppercase tracking-wider mr-1">
            <Zap className="size-3 text-gold" /> Quick Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset(1)}
            className="rounded-lg border border-gold/25 px-2.5 py-1 text-[11px] text-navy-foreground/80 hover:bg-gold hover:text-gold-foreground transition"
          >
            Tonight (1 N)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(2)}
            className="rounded-lg border border-gold/25 px-2.5 py-1 text-[11px] text-navy-foreground/80 hover:bg-gold hover:text-gold-foreground transition"
          >
            2 Nights
          </button>
          <button
            type="button"
            onClick={() => applyPreset(3)}
            className="rounded-lg border border-gold/25 px-2.5 py-1 text-[11px] text-navy-foreground/80 hover:bg-gold hover:text-gold-foreground transition"
          >
            3 Nights
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 text-xs">
          {/* Guest Name & Past Search */}
          <div className="space-y-1.5 sm:col-span-2 relative">
            <div className="flex items-center justify-between">
              <label className="text-gold font-medium uppercase tracking-wide">
                Guest Name *
              </label>
              {guestSuggestions.length > 0 && (
                <span className="text-[10px] text-champagne">
                  {guestSuggestions.length} past guest matches
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
              placeholder="Full name as on identity proof"
              className="w-full rounded-xl border border-gold/30 bg-navy-deep px-4 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
            />

            {/* Suggestions dropdown */}
            {showGuestSuggestions && guestSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-gold/30 bg-[#061830] p-1.5 shadow-2xl">
                {guestSuggestions.map((g) => (
                  <button
                    key={g.phone}
                    type="button"
                    onClick={() => selectPastGuest(g)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="size-3.5 text-gold" />
                      <span className="font-semibold text-navy-foreground">{g.name}</span>
                    </div>
                    <span className="text-[11px] text-champagne/70">{g.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-gold font-medium uppercase tracking-wide">Phone (10 Digits) *</label>
              <span className="text-[10px] text-champagne/60">e.g. 98765 43210</span>
            </div>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/[^\d+ -]/g, "");
                setPhone(val.slice(0, 15));
                setShowGuestSuggestions(true);
              }}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-gold/30 bg-navy-deep px-4 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-gold font-medium uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="guest@example.com (optional)"
              className="w-full rounded-xl border border-gold/30 bg-navy-deep px-4 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
            />
          </div>

          {/* Room Category Cards */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-gold font-medium uppercase tracking-wide">
              Select Category
            </label>
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-5">
              {state.categories.map((c) => {
                const l = availableUnits(state, c.id, checkIn, checkOut);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => {
                      setCategoryId(c.id);
                      setRoomNumber("");
                    }}
                    className={`rounded-xl border p-3 text-left transition ${
                      categoryId === c.id
                        ? "border-gold bg-gold/15 shadow-gold"
                        : "border-gold/20 hover:border-gold/50 bg-navy-deep/40"
                    }`}
                  >
                    <p className="font-semibold text-navy-foreground truncate">{c.name}</p>
                    <p className="text-[11px] text-champagne font-mono">{formatINR(c.price)}</p>
                    <p
                      className={`mt-1 text-[10px] uppercase font-semibold ${
                        l === 0 ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {l} free
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-gold font-medium uppercase tracking-wide">Check-In Date</label>
            <input
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (e.target.value >= checkOut) setCheckOut(addDays(e.target.value, 1));
              }}
              className="w-full rounded-xl border border-gold/30 bg-navy-deep px-4 py-2 text-xs text-navy-foreground focus:border-gold focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-gold font-medium uppercase tracking-wide">Check-Out Date</label>
            <input
              type="date"
              min={addDays(checkIn, 1)}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-navy-deep px-4 py-2 text-xs text-navy-foreground focus:border-gold focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-gold font-medium uppercase tracking-wide">Guests Count</label>
            <input
              type="number"
              min={1}
              max={12}
              value={guests}
              onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-xl border border-gold/30 bg-navy-deep px-4 py-2 text-xs text-navy-foreground focus:border-gold focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-gold font-medium uppercase tracking-wide">Rooms Count</label>
            <input
              type="number"
              min={1}
              max={4}
              value={rooms}
              onChange={(e) => setRooms(Math.min(4, Math.max(1, Number(e.target.value))))}
              className="w-full rounded-xl border border-gold/30 bg-navy-deep px-4 py-2 text-xs text-navy-foreground focus:border-gold focus:outline-none"
            />
          </div>

          {/* Room Selection Badges */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-gold font-medium uppercase tracking-wide flex items-center justify-between">
              <span>Assign Specific Room</span>
              <span className="text-[11px] text-champagne/70 font-normal">
                {free.length} ready room{free.length > 1 ? "s" : ""}
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRoomNumber("")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  roomNumber === ""
                    ? "bg-gold text-gold-foreground shadow-gold"
                    : "border border-gold/25 bg-navy text-navy-foreground/75 hover:bg-white/5"
                }`}
              >
                Auto-Assign at Desk
              </button>
              {free.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => {
                    setRoomNumber(r);
                    if (canCheckIn) setCheckInNow(true);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    roomNumber === r
                      ? "bg-emerald-500 text-white shadow-md font-bold"
                      : "border border-gold/25 bg-navy text-navy-foreground/80 hover:border-gold"
                  }`}
                >
                  Room {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-gold font-medium uppercase tracking-wide">Booking Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-navy-deep px-4 py-2 text-xs text-navy-foreground focus:border-gold focus:outline-none"
            >
              <option>Walk-in</option>
              <option>Phone</option>
              <option>Website</option>
              <option>OTA / Travel Agent</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-gold font-medium uppercase tracking-wide">Payment Mode</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-navy-deep px-4 py-2 text-xs text-navy-foreground focus:border-gold focus:outline-none"
            >
              <option>Cash</option>
              <option>UPI / QR Code</option>
              <option>Debit / Credit Card</option>
              <option>Net Banking / Transfer</option>
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-gold font-medium uppercase tracking-wide">
              Special Requests / Remarks
            </label>
            <textarea
              rows={2}
              value={requests}
              onChange={(e) => setRequests(e.target.value)}
              placeholder="e.g. Extra key card, quiet corner room, luggage storage"
              className="w-full rounded-xl border border-gold/30 bg-navy-deep px-4 py-2 text-xs text-navy-foreground focus:border-gold focus:outline-none"
            />
          </div>
        </div>
      </Panel>

      {/* Pricing & Summary Card */}
      <Panel title="Folio &amp; Settlement" className="h-fit">
        <img src={cat.image} alt="" className="aspect-video w-full rounded-xl object-cover" />
        <dl className="mt-4 space-y-2 text-xs border-b border-gold/15 pb-4">
          <div className="flex justify-between">
            <dt className="text-navy-foreground/60">Dates</dt>
            <dd className="font-medium text-navy-foreground">
              {formatDate(checkIn)} → {formatDate(checkOut)} ({q.nights} night
              {q.nights > 1 ? "s" : ""})
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-navy-foreground/60">Rate per night</dt>
            <dd className="font-medium text-navy-foreground">{formatINR(cat.price)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-navy-foreground/60">Subtotal</dt>
            <dd className="font-medium text-navy-foreground">{formatINR(q.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-navy-foreground/60">GST (12%)</dt>
            <dd className="font-medium text-navy-foreground">{formatINR(q.tax)}</dd>
          </div>
          <div className="flex justify-between pt-2">
            <dt className="font-display text-base font-semibold text-navy-foreground">
              Grand Total
            </dt>
            <dd className="font-display text-xl font-bold text-gold">{formatINR(q.total)}</dd>
          </div>
        </dl>

        {/* Collection presets */}
        <div className="mt-4 space-y-2 text-xs">
          <label className="text-gold font-medium uppercase tracking-wide">
            Payment Collected Now (₹)
          </label>
          <input
            type="number"
            min={0}
            value={paid || ""}
            onChange={(e) => setPaid(Number(e.target.value))}
            placeholder="0"
            className="w-full rounded-xl border border-gold/30 bg-navy-deep px-4 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
          />
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setPaid(q.total)}
              className="rounded-full bg-emerald-950/40 border border-emerald-500/40 px-3 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-900/40 transition"
            >
              100% Full ({formatINR(q.total)})
            </button>
            <button
              type="button"
              onClick={() => setPaid(Math.round(q.total * 0.5))}
              className="rounded-full border border-gold/25 px-3 py-1 text-[11px] text-navy-foreground/70 hover:border-gold hover:text-gold transition"
            >
              50% Advance
            </button>
            <button
              type="button"
              onClick={() => setPaid(0)}
              className="rounded-full border border-gold/25 px-3 py-1 text-[11px] text-navy-foreground/70 hover:border-gold hover:text-gold transition"
            >
              Unpaid
            </button>
          </div>
        </div>

        {canCheckIn && (
          <label className="mt-4 flex items-center gap-2 text-xs text-navy-foreground/90 cursor-pointer rounded-lg bg-navy-deep/60 p-2.5 border border-gold/20">
            <input
              type="checkbox"
              checked={checkInNow}
              onChange={(e) => setCheckInNow(e.target.checked)}
              className="size-4 accent-gold"
            />
            <span>
              Express Check-In immediately{" "}
              {checkInNow && !roomNumber && "(Select room number above)"}
            </span>
          </label>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-full bg-gold-gradient py-3 text-xs font-semibold uppercase tracking-wider text-gold-foreground shadow-gold disabled:opacity-50 hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
          {busy ? "Processing…" : "Complete & Confirm Booking"}
        </button>
      </Panel>
    </form>
  );
}
