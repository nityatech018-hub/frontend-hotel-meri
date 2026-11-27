import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarCheck,
  LogIn,
  Search,
  MessageCircle,
  Printer,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  UserCheck,
  DoorOpen,
  Plus,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState, FilterChips, Panel } from "@/components/dashboard/ui.jsx";
import { StatusBadge, PaymentBadge } from "@/components/site/StatusBadge.jsx";
import { formatDate, formatINR, todayISO } from "@/lib/hotel/pricing.js";
import {
  checkInBooking,
  freeRoomsFor,
  getCategory,
  recordPayment,
  useHotelState,
} from "@/lib/hotel/store.jsx";

const VIEWS = [
  "Due today",
  "Pending Arrivals",
  "Overdue Arrivals",
  "Already Checked-In",
  "All Active",
];

export default function ReceptionCheckIn() {
  const state = useHotelState();
  const today = todayISO();
  const [view, setView] = useState("Due today");
  const [q, setQ] = useState("");

  const term = q.trim().toLowerCase();

  const list = state.bookings
    .filter((b) => {
      if (view === "Already Checked-In") return b.status === "Checked-In";
      if (view === "Due today") return (b.status === "Pending" || b.status === "Confirmed") && b.checkIn === today;
      if (view === "Overdue Arrivals") return (b.status === "Pending" || b.status === "Confirmed") && b.checkIn < today;
      if (view === "Pending Arrivals") return (b.status === "Pending" || b.status === "Confirmed") && b.checkIn >= today;
      return b.status === "Pending" || b.status === "Confirmed";
    })
    .filter(
      (b) =>
        !term ||
        b.guestName.toLowerCase().includes(term) ||
        b.id.toLowerCase().includes(term) ||
        (b.phone && b.phone.includes(term)) ||
        (b.roomNumber && b.roomNumber.toLowerCase().includes(term))
    )
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  return (
    <Panel
      title="Front Desk Arrivals &amp; Express Check-In"
      subtitle="Verify guest identity proofs, assign room numbers, register additional occupants, collect deposits, and complete check-in"
      action={
        <div className="flex flex-wrap items-center gap-3">
          <FilterChips options={VIEWS} value={view} onChange={setView} />
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gold" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search guest or ID..."
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] pl-8 pr-3 py-1.5 text-xs text-[#061830] placeholder:text-[#64748b] focus:border-gold focus:outline-none"
            />
          </div>
        </div>
      }
    >
      {list.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No arrivals in this queue"
          text={
            view === "Due today"
              ? "All guests scheduled for arrival today have already completed check-in."
              : "No reservations currently match this filter criteria."
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {list.map((b) => (
              <ArrivalCard key={b.id} booking={b} isAlreadyCheckedIn={b.status === "Checked-In"} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </Panel>
  );
}

function ArrivalCard({ booking: b, isAlreadyCheckedIn }) {
  const state = useHotelState();
  const free = freeRoomsFor(state, b.categoryId);
  const [room, setRoom] = useState(
    b.roomNumber && (free.includes(b.roomNumber) || isAlreadyCheckedIn)
      ? b.roomNumber
      : free[0] || ""
  );
  const [idType, setIdType] = useState(b.idType || "Aadhaar Card");
  const [idNumber, setIdNumber] = useState(b.idNumber || "");
  const [idVerified, setIdVerified] = useState(Boolean(b.idVerified));
  const [extraOccupants, setExtraOccupants] = useState("");
  const [checkInNotes, setCheckInNotes] = useState("");
  const [collectAmount, setCollectAmount] = useState("");

  const cat = getCategory(state, b.categoryId);
  const balance = Math.max(0, b.total - b.amountPaid);

  // Check if assigned room is ready
  const assignedRoomObj = state.rooms.find((r) => r.number === room);
  const isRoomDirtyOrMaint = assignedRoomObj && (assignedRoomObj.status === "maintenance" || assignedRoomObj.status === "dirty" || assignedRoomObj.status === "blocked");

  const cleanPhone = b.phone.replace(/\D/g, "");
  const waPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  const waMsg = encodeURIComponent(
    `Welcome to Hotel Meri & Residency! Your check-in is complete for ${cat?.name}. Assigned Room: ${room || "at desk"}. Wishing you a royal stay!`
  );

  const handleCheckInNow = () => {
    if (!room) {
      toast.error("Please assign an available room number.");
      return;
    }

    if (isRoomDirtyOrMaint) {
      if (!window.confirm(`Warning: Room ${room} is currently marked as ${assignedRoomObj.status}. Do you have authorized override to check-in anyway?`)) {
        return;
      }
    }

    // Collect payment if entered
    if (collectAmount !== "") {
      const amt = parseFloat(collectAmount);
      if (isNaN(amt) || amt < 0) {
        toast.error("Please enter a valid positive payment amount.");
        return;
      }
      if (amt > balance) {
        toast.error(`Payment cannot exceed outstanding balance of ${formatINR(balance)}.`);
        return;
      }
      if (amt > 0) {
        recordPayment(b.id, amt);
      }
    }

    checkInBooking(b.id, room, {
      idType,
      idNumber: idNumber.trim() || undefined,
      idVerified: Boolean(idVerified || idNumber.trim()),
      internalNotes: `${b.internalNotes ? b.internalNotes + " | " : ""}Check-in completed. Extra occupants: ${extraOccupants || "None"}. ${checkInNotes}`,
    });

    toast.success(`${b.guestName} successfully checked into Room ${room}!`);
  };

  const handlePrintSlip = () => {
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(`
      <html>
        <head>
          <title>Guest Registration Card - ${b.id}</title>
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
            <div class="col"><div class="label">Booking ID</div><div class="val">${b.id}</div></div>
            <div class="col"><div class="label">Room Assigned</div><div class="val">${room || b.roomNumber || "Desk Assignment"}</div></div>
            <div class="col"><div class="label">Primary Guest</div><div class="val">${b.guestName}</div></div>
            <div class="col"><div class="label">Phone / Mobile</div><div class="val">${b.phone}</div></div>
            <div class="col"><div class="label">Gov ID Proof</div><div class="val">${idType}: ${idNumber || b.idNumber || "Verified"}</div></div>
            <div class="col"><div class="label">Accompanying Occupants</div><div class="val">${extraOccupants || "None"}</div></div>
            <div class="col"><div class="label">Room Category</div><div class="val">${cat?.name} (${b.rooms} room)</div></div>
            <div class="col"><div class="label">Stay Duration</div><div class="val">${formatDate(b.checkIn)} → ${formatDate(b.checkOut)}</div></div>
            <div class="col"><div class="label">Total Amount (5% GST)</div><div class="val">₹${b.total}</div></div>
            <div class="col"><div class="label">Amount Paid / Balance</div><div class="val">₹${b.amountPaid} / ₹${balance} (${b.payment})</div></div>
          </div>
          <div style="font-size: 11px; color: #666; margin-top: 20px; line-height: 1.5;">
            * I confirm that all guest details are accurate and agree to hotel accommodation policies.
          </div>
          <div class="sign-box">
            <div class="sign-line">Guest Signature</div>
            <div class="sign-line">Reception Officer</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl border border-gold/30 bg-[#FAF7F2] p-5 shadow-sm text-[#061830] space-y-3.5"
    >
      <div className="flex items-start gap-4">
        <img
          src={cat?.image}
          alt=""
          className="size-16 rounded-xl object-cover border border-gold/30 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-lg font-bold text-[#061830]">
              {b.guestName}
            </p>
            <StatusBadge status={b.status} />
            <PaymentBadge payment={b.payment} />
          </div>
          <p className="text-xs text-[#64748b] mt-0.5">
            Booking ID: <strong className="text-gold font-mono font-bold">{b.id}</strong> · Phone: {b.phone}
          </p>
          <p className="mt-1 text-xs text-[#475569]">
            {cat?.name} ({b.rooms} room) · {b.guests} guests · {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
          </p>
          {b.requests && (
            <p className="mt-1 text-xs text-gold font-medium italic">“{b.requests}”</p>
          )}
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-[#64748b]">
              Total: <strong className="text-[#061830]">{formatINR(b.total)}</strong>
            </span>
            <span className={balance > 0 ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
              Balance Due: {formatINR(balance)}
            </span>
          </div>
        </div>
      </div>

      {/* Check-In Controls */}
      <div className="pt-3 border-t border-gold/20 space-y-3 text-xs">
        {/* Room Assignment */}
        <div>
          <label className="block text-[11px] uppercase font-bold text-gold mb-1.5">
            Assign Ready Room:
          </label>
          {isAlreadyCheckedIn ? (
            <span className="inline-block rounded-lg bg-[#061830] px-3 py-1 font-display text-base font-bold text-gold border border-gold/40">
              Room {b.roomNumber} (Occupied)
            </span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {free.length === 0 ? (
                <span className="text-xs text-rose-600 italic font-semibold">
                  No clean ready {cat?.name} rooms! Please reassign in Room Inventory.
                </span>
              ) : (
                free.map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRoom(r)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                      room === r
                        ? "bg-gold text-gold-foreground font-bold shadow-sm"
                        : "border border-gold/30 bg-white text-[#061830] hover:bg-gold/15"
                    }`}
                  >
                    Room {r}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Identity Capture & Accompanying Guests */}
        {!isAlreadyCheckedIn && (
          <div className="grid sm:grid-cols-2 gap-2.5 bg-white p-3 rounded-xl border border-gold/25">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gold mb-1">
                Gov ID Type &amp; Number
              </label>
              <div className="flex gap-1">
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="rounded-lg border border-gold/30 bg-[#FAF7F2] px-1.5 py-1 text-[11px] text-[#061830]"
                >
                  <option value="Aadhaar Card">Aadhaar</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">DL</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
                <input
                  type="text"
                  placeholder="ID Document #"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full rounded-lg border border-gold/30 bg-[#FAF7F2] px-2 py-1 text-[11px] text-[#061830]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gold mb-1">
                Accompanying Occupant Names
              </label>
              <input
                type="text"
                placeholder="Names of other staying guests..."
                value={extraOccupants}
                onChange={(e) => setExtraOccupants(e.target.value)}
                className="w-full rounded-lg border border-gold/30 bg-[#FAF7F2] px-2 py-1 text-[11px] text-[#061830]"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer text-[#061830]">
                <input
                  type="checkbox"
                  checked={idVerified}
                  onChange={(e) => setIdVerified(e.target.checked)}
                  className="size-4 accent-gold"
                />
                <span className="flex items-center gap-1 font-bold">
                  <ShieldCheck className="size-3.5 text-gold" /> Identity Proof Verified at Desk
                </span>
              </label>

              {balance > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[#64748b]">Collect:</span>
                  <input
                    type="number"
                    placeholder={`₹${balance}`}
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    className="w-24 rounded-lg border border-gold/30 bg-[#FAF7F2] px-2 py-1 text-xs text-[#061830]"
                  />
                  <button
                    type="button"
                    onClick={() => setCollectAmount(String(balance))}
                    className="text-[10px] text-gold font-bold underline"
                  >
                    Full
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${waPhone}?text=${waMsg}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 transition"
              title="Send WhatsApp Welcome"
            >
              <MessageCircle className="size-3 text-emerald-600" /> WhatsApp
            </a>
            <button
              onClick={handlePrintSlip}
              className="inline-flex items-center gap-1 rounded-lg border border-gold/40 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#061830] hover:bg-gold/15 transition cursor-pointer"
              title="Print Registration Slip"
            >
              <Printer className="size-3 text-gold" /> Print Reg Card
            </button>
          </div>

          {!isAlreadyCheckedIn && (
            <button
              disabled={!room}
              onClick={handleCheckInNow}
              className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-5 py-2 text-xs font-bold uppercase text-gold-foreground disabled:opacity-40 hover:brightness-110 transition shadow-gold cursor-pointer"
            >
              <LogIn className="size-3.5" /> Check In to Room {room || "..."}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
