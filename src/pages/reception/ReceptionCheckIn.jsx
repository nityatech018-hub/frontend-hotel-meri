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

const VIEWS = ["Due today", "Upcoming Arrivals", "All Active"];

export default function ReceptionCheckIn() {
  const state = useHotelState();
  const today = todayISO();
  const [view, setView] = useState("Due today");
  const [q, setQ] = useState("");

  const term = q.trim().toLowerCase();
  const list = state.bookings
    .filter((b) => b.status === "Pending" || b.status === "Confirmed")
    .filter((b) => {
      if (view === "Due today") return b.checkIn <= today && b.checkOut > today;
      if (view === "Upcoming Arrivals") return b.checkIn > today;
      return true;
    })
    .filter(
      (b) =>
        !term ||
        b.guestName.toLowerCase().includes(term) ||
        b.id.toLowerCase().includes(term) ||
        b.phone.includes(term)
    )
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  return (
    <Panel
      title="Front Desk Arrivals &amp; Express Check-In"
      subtitle="Verify identity proofs, assign room numbers, collect folios, and check guests in"
      action={
        <div className="flex flex-wrap items-center gap-3">
          <FilterChips options={VIEWS} value={view} onChange={setView} />
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gold/60" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search arrivals..."
              className="w-full rounded-xl border border-gold/30 bg-navy-deep pl-8 pr-3 py-1.5 text-xs text-navy-foreground focus:border-gold focus:outline-none"
            />
          </div>
        </div>
      }
    >
      {list.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No arrivals in queue"
          text={
            view === "Due today"
              ? "All guests due today have already been checked in."
              : "No upcoming future arrivals match this query."
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {list.map((b) => (
              <ArrivalCard key={b.id} booking={b} canCheckIn={b.checkIn <= today} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </Panel>
  );
}

function ArrivalCard({ booking: b, canCheckIn }) {
  const state = useHotelState();
  const free = freeRoomsFor(state, b.categoryId);
  const [room, setRoom] = useState(
    b.roomNumber && free.includes(b.roomNumber) ? b.roomNumber : free[0] || ""
  );
  const [idVerified, setIdVerified] = useState(false);
  const [collectAmount, setCollectAmount] = useState("");
  const cat = getCategory(state, b.categoryId);
  const balance = Math.max(0, b.total - b.amountPaid);

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
    checkInBooking(b.id, room);
    toast.success(`${b.guestName} checked in to Room ${room}!`);
  };

  const handlePrintSlip = () => {
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(`
      <html>
        <head><title>Registration Card - ${b.id}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 30px;">
          <h2>HOTEL MERI &amp; RESIDENCY</h2>
          <p>Guest Registration Card · Booking ${b.id}</p>
          <hr/>
          <p><strong>Guest Name:</strong> ${b.guestName}</p>
          <p><strong>Phone:</strong> ${b.phone}</p>
          <p><strong>Room Assigned:</strong> Room ${room || b.roomNumber || "TBD"}</p>
          <p><strong>Category:</strong> ${cat?.name}</p>
          <p><strong>Check-In:</strong> ${formatDate(b.checkIn)} | <strong>Check-Out:</strong> ${formatDate(b.checkOut)}</p>
          <p><strong>Folio:</strong> ₹${b.total} | <strong>Balance Due:</strong> ₹${balance}</p>
          <br/><br/>
          <div style="display: flex; justify-content: space-between;">
            <div>Guest Signature: __________________</div>
            <div>Front Desk: __________________</div>
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
      className="rounded-2xl border border-gold/20 bg-navy-deep/70 p-5 shadow-lift"
    >
      <div className="flex items-start gap-4">
        <img
          src={cat?.image}
          alt=""
          className="size-16 rounded-xl object-cover border border-gold/20 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-lg font-semibold text-navy-foreground">
              {b.guestName}
            </p>
            <StatusBadge status={b.status} />
            <PaymentBadge payment={b.payment} />
          </div>
          <p className="text-xs text-navy-foreground/60 mt-0.5">
            ID: <strong className="text-gold font-mono">{b.id}</strong> · Phone: {b.phone}
          </p>
          <p className="mt-1 text-xs text-navy-foreground/85">
            {cat?.name} ({b.rooms} room{b.rooms > 1 ? "s" : ""}) · {b.guests} guests ·{" "}
            {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
          </p>
          {b.requests && <p className="mt-1 text-xs text-gold italic">“{b.requests}”</p>}
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-navy-foreground/60">
              Total: <strong>{formatINR(b.total)}</strong>
            </span>
            <span className={balance > 0 ? "text-amber-400 font-semibold" : "text-emerald-400"}>
              Balance Due: {formatINR(balance)}
            </span>
          </div>
        </div>
      </div>

      {/* Desk actions bar */}
      <div className="mt-4 pt-3 border-t border-gold/15 space-y-3">
        {/* Room selection badges */}
        <div>
          <label className="block text-[11px] uppercase font-semibold text-gold mb-1.5">
            Select Clean Room to Assign:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {free.length === 0 ? (
              <span className="text-xs text-rose-400 italic">
                No clean {cat?.name} available right now!
              </span>
            ) : (
              free.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRoom(r)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    room === r
                      ? "bg-gold text-gold-foreground font-bold shadow-gold"
                      : "border border-gold/30 bg-navy text-champagne hover:bg-white/5"
                  }`}
                >
                  Room {r}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Verification & Quick Payment */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-navy p-2.5 rounded-xl border border-gold/15">
          <label className="flex items-center gap-2 cursor-pointer text-navy-foreground/85">
            <input
              type="checkbox"
              checked={idVerified}
              onChange={(e) => setIdVerified(e.target.checked)}
              className="size-4 accent-gold"
            />
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="size-3.5 text-gold" /> ID Proof Verified
            </span>
          </label>

          {balance > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder={`Pay ₹${balance}`}
                value={collectAmount}
                onChange={(e) => setCollectAmount(e.target.value)}
                className="w-28 rounded-lg border border-gold/30 bg-navy-deep px-2 py-1 text-xs text-navy-foreground focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCollectAmount(String(balance))}
                className="text-[10px] text-champagne underline hover:text-gold"
              >
                Full
              </button>
            </div>
          )}
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${waPhone}?text=${waMsg}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 px-2.5 py-1.5 text-[11px] text-emerald-300 hover:bg-emerald-950/40 transition"
              title="Send WhatsApp Welcome"
            >
              <MessageCircle className="size-3 text-emerald-400" /> WhatsApp
            </a>
            <button
              onClick={handlePrintSlip}
              className="inline-flex items-center gap-1 rounded-lg border border-gold/30 px-2.5 py-1.5 text-[11px] text-champagne hover:bg-white/5 transition"
              title="Print Reg Slip"
            >
              <Printer className="size-3 text-gold" /> Reg Slip
            </button>
          </div>

          <button
            disabled={!room}
            onClick={handleCheckInNow}
            className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-5 py-2 text-xs font-semibold uppercase text-gold-foreground disabled:opacity-40 hover:brightness-110 transition shadow-gold cursor-pointer"
          >
            <LogIn className="size-3.5" /> Check In to Room {room || "..."}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
