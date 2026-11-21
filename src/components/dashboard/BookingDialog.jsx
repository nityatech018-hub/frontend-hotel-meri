import React, { useState } from "react";
import {
  X,
  Calendar,
  User,
  Phone,
  Mail,
  Bed,
  CreditCard,
  Clock,
  FileText,
  MessageCircle,
  Printer,
  CheckCircle,
  Save,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { formatINR, formatDate } from "@/lib/hotel/pricing.js";
import {
  useHotelState,
  getCategory,
  setBookingStatus,
  recordPayment,
  checkInBooking,
  checkOutBooking,
  freeRoomsFor,
  updateBooking,
} from "@/lib/hotel/store.jsx";
import { StatusBadge, PaymentBadge } from "@/components/site/StatusBadge.jsx";

export function BookingDialog({ booking, onClose }) {
  const state = useHotelState();
  const isReception = state.session?.role === "reception";
  const [payAmount, setPayAmount] = useState("");
  const [assignRoom, setAssignRoom] = useState(booking?.roomNumber || "");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(booking?.guestName || "");
  const [editPhone, setEditPhone] = useState(booking?.phone || "");
  const [editEmail, setEditEmail] = useState(booking?.email || "");
  const [editRequests, setEditRequests] = useState(booking?.requests || "");

  if (!booking) return null;

  // Fresh booking reference from state
  const liveBooking = state.bookings.find((b) => b.id === booking.id) || booking;
  const cat = getCategory(state, liveBooking.categoryId);
  const freeRooms = freeRoomsFor(state, liveBooking.categoryId);
  const balance = Math.max(0, liveBooking.total - liveBooking.amountPaid);

  const handlePayment = (e) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (!isNaN(amt) && amt > 0) {
      recordPayment(liveBooking.id, amt);
      setPayAmount("");
      toast.success(`Recorded payment of ${formatINR(amt)} for ${liveBooking.id}`);
    }
  };

  const handleSettleFull = () => {
    if (balance > 0) {
      recordPayment(liveBooking.id, balance);
      toast.success(`Full balance of ${formatINR(balance)} settled!`);
    }
  };

  const handleCheckIn = () => {
    const room = assignRoom || liveBooking.roomNumber || freeRooms[0];
    if (room) {
      checkInBooking(liveBooking.id, room);
      toast.success(`${liveBooking.guestName} checked into Room ${room}!`);
    } else {
      toast.error("No free room available in this category.");
    }
  };

  const handleCheckOut = () => {
    checkOutBooking(liveBooking.id);
    toast.success(`${liveBooking.guestName} checked out successfully.`);
  };

  const handleCancel = () => {
    if (window.confirm(`Are you sure you want to cancel reservation ${liveBooking.id}?`)) {
      setBookingStatus(liveBooking.id, "Cancelled");
      toast.success(`Reservation ${liveBooking.id} cancelled.`);
    }
  };

  const handleSaveDetails = () => {
    updateBooking(liveBooking.id, {
      guestName: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim().toLowerCase(),
      requests: editRequests.trim() || undefined,
      roomNumber: assignRoom || undefined,
    });
    setIsEditing(false);
    toast.success("Guest details updated successfully");
  };

  // WhatsApp confirmation url
  const cleanPhone = liveBooking.phone.replace(/\D/g, "");
  const waPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  const waMsg = encodeURIComponent(
    `*Hotel Meri & Residency — Reservation Confirmation*\n\nDear ${liveBooking.guestName},\nWe look forward to welcoming you! Here are your booking details:\n• Booking ID: *${liveBooking.id}*\n• Category: *${cat.name}*\n• Check-in: *${formatDate(liveBooking.checkIn)}*\n• Check-out: *${formatDate(liveBooking.checkOut)}*\n• Assigned Room: *${liveBooking.roomNumber || "To be assigned on arrival"}*\n• Total Folio: *${formatINR(liveBooking.total)}* (Balance: ${formatINR(balance)})\n\nAddress: ${state.settings?.address || "Civil Lines, Bareilly"}\nHelpline: ${state.settings?.phone || "+91 94122 56789"}`
  );
  const waUrl = `https://wa.me/${waPhone}?text=${waMsg}`;

  // Print Registration Slip
  const handlePrintSlip = () => {
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(`
      <html>
        <head>
          <title>Guest Registration Slip - ${liveBooking.id}</title>
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
            <div class="col"><div class="label">Booking ID</div><div class="val">${liveBooking.id}</div></div>
            <div class="col"><div class="label">Room Number</div><div class="val">${liveBooking.roomNumber || "Assigned at desk"}</div></div>
            <div class="col"><div class="label">Guest Name</div><div class="val">${liveBooking.guestName}</div></div>
            <div class="col"><div class="label">Phone / Mobile</div><div class="val">${liveBooking.phone}</div></div>
            <div class="col"><div class="label">Email Address</div><div class="val">${liveBooking.email}</div></div>
            <div class="col"><div class="label">Room Category</div><div class="val">${cat.name} (${liveBooking.rooms} room)</div></div>
            <div class="col"><div class="label">Check-In Date</div><div class="val">${formatDate(liveBooking.checkIn)}</div></div>
            <div class="col"><div class="label">Check-Out Date</div><div class="val">${formatDate(liveBooking.checkOut)}</div></div>
            <div class="col"><div class="label">Total Amount</div><div class="val">₹${liveBooking.total}</div></div>
            <div class="col"><div class="label">Amount Paid / Balance</div><div class="val">₹${liveBooking.amountPaid} / ₹${balance} (${liveBooking.payment})</div></div>
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-gold/30 bg-[#061830] shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gold/15 p-5 bg-navy-deep">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="font-display text-2xl font-semibold text-navy-foreground">
                Reservation {liveBooking.id}
              </h3>
              <StatusBadge status={liveBooking.status} />
              <PaymentBadge payment={liveBooking.payment} />
            </div>
            <p className="mt-1 text-xs text-navy-foreground/60">
              Source: <strong className="text-gold">{liveBooking.source}</strong> • Created:{" "}
              {formatDate(liveBooking.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-navy-foreground/70 hover:bg-white/10 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Quick Communication & Print Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/20 bg-navy-deep/80 p-3">
            <div className="flex items-center gap-2 text-xs text-navy-foreground/80">
              <span className="font-medium text-gold">{isReception ? "Desk Tools:" : "Guest Services:"}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isReception ? (
                <>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40 transition"
                  >
                    <MessageCircle className="size-3.5 text-emerald-400" /> WhatsApp Slip
                  </a>
                  <button
                    onClick={handlePrintSlip}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-navy px-3 py-1.5 text-xs font-semibold text-champagne hover:bg-white/5 transition"
                  >
                    <Printer className="size-3.5 text-gold" /> Print Reg Card
                  </button>
                </>
              ) : (
                <a
                  href={`tel:${state.settings?.phone || "+91 94122 88334"}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-navy px-3 py-1.5 text-xs font-semibold text-champagne hover:bg-white/5 transition"
                >
                  <Phone className="size-3.5 text-gold" /> Front Desk Support
                </a>
              )}
              <a
                href={`/invoice/${liveBooking.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-navy px-3 py-1.5 text-xs font-semibold text-champagne hover:bg-white/5 transition"
              >
                <FileText className="size-3.5 text-gold" /> Tax Invoice
              </a>
            </div>
          </div>

          {/* Guest & Room Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Guest Info Box */}
            <div className="rounded-xl border border-gold/15 bg-navy-deep/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs uppercase tracking-wider text-gold font-semibold">
                  Guest Information
                </h4>
                {isReception && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-1 text-[11px] text-champagne hover:text-gold"
                  >
                    <Pencil className="size-3" /> {isEditing ? "Cancel" : "Edit"}
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Guest name"
                    className="w-full rounded-lg border border-gold/30 bg-navy px-2.5 py-1.5 text-xs text-navy-foreground"
                  />
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full rounded-lg border border-gold/30 bg-navy px-2.5 py-1.5 text-xs text-navy-foreground"
                  />
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full rounded-lg border border-gold/30 bg-navy px-2.5 py-1.5 text-xs text-navy-foreground"
                  />
                  <input
                    type="text"
                    value={editRequests}
                    onChange={(e) => setEditRequests(e.target.value)}
                    placeholder="Special requests"
                    className="w-full rounded-lg border border-gold/30 bg-navy px-2.5 py-1.5 text-xs text-navy-foreground"
                  />
                  <button
                    onClick={handleSaveDetails}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gold-gradient py-1.5 text-xs font-semibold text-gold-foreground uppercase"
                  >
                    <Save className="size-3.5" /> Save Changes
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-navy-foreground">
                    <User className="size-4 text-gold shrink-0" />
                    <span className="font-semibold">{liveBooking.guestName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-navy-foreground/75 text-xs">
                    <Mail className="size-3.5 text-gold shrink-0" />
                    <span className="truncate">{liveBooking.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-navy-foreground/75 text-xs">
                    <Phone className="size-3.5 text-gold shrink-0" />
                    <span>{liveBooking.phone}</span>
                  </div>
                  {liveBooking.requests && (
                    <div className="mt-2 rounded-lg bg-gold/10 p-2 text-xs text-champagne border border-gold/20">
                      <strong>Note:</strong> {liveBooking.requests}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stay Details Box */}
            <div className="rounded-xl border border-gold/15 bg-navy-deep/60 p-4">
              <h4 className="text-xs uppercase tracking-wider text-gold font-semibold mb-3">
                Stay Details
              </h4>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-navy-foreground">
                  <Bed className="size-4 text-gold shrink-0" />
                  <span>
                    {cat.name} ({liveBooking.rooms} room{liveBooking.rooms > 1 ? "s" : ""})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-navy-foreground/75 text-xs">
                  <Calendar className="size-3.5 text-gold shrink-0" />
                  <span>
                    {formatDate(liveBooking.checkIn)} → {formatDate(liveBooking.checkOut)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-navy-foreground/75 text-xs">
                  <Clock className="size-3.5 text-gold shrink-0" />
                  <span>
                    Guests: <strong>{liveBooking.guests} person{liveBooking.guests > 1 ? "s" : ""}</strong>
                  </span>
                </div>

                {/* Assigned Room Selector / Display */}
                <div className="mt-3 pt-3 border-t border-gold/15">
                  <label className="block text-[11px] uppercase font-semibold text-gold mb-1.5">
                    Assigned Room:
                  </label>
                  {!isReception || liveBooking.status === "Checked-Out" || liveBooking.status === "Cancelled" ? (
                    <span className="font-display text-base font-bold text-champagne">
                      {liveBooking.roomNumber ? `Room ${liveBooking.roomNumber}` : "To be assigned upon arrival"}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        value={assignRoom}
                        onChange={(e) => {
                          setAssignRoom(e.target.value);
                          updateBooking(liveBooking.id, { roomNumber: e.target.value });
                          toast.success(`Assigned Room ${e.target.value}`);
                        }}
                        className="flex-1 rounded-lg border border-gold/30 bg-navy px-3 py-1.5 text-xs text-navy-foreground focus:border-gold focus:outline-none"
                      >
                        <option value="">-- Choose Room --</option>
                        {liveBooking.roomNumber && !freeRooms.includes(liveBooking.roomNumber) && (
                          <option value={liveBooking.roomNumber}>
                            Room {liveBooking.roomNumber} (Current)
                          </option>
                        )}
                        {freeRooms.map((num) => (
                          <option key={num} value={num}>
                            Room {num} (Available)
                          </option>
                        ))}
                      </select>
                      {assignRoom && (
                        <span className="rounded bg-emerald-950/40 px-2 py-1 text-[10px] text-emerald-300 border border-emerald-500/30">
                          Ready
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Financial summary & Payment */}
          <div className="rounded-xl border border-gold/20 bg-navy-deep/60 p-4">
            <h4 className="text-xs uppercase tracking-wider text-gold font-semibold mb-3">
              Folio &amp; Payment Settlement
            </h4>
            <div className="grid grid-cols-3 gap-3 border-b border-gold/15 pb-4 text-center sm:text-left">
              <div>
                <p className="text-[11px] text-navy-foreground/60">Total Charge</p>
                <p className="font-display text-xl font-semibold text-navy-foreground sm:text-2xl">
                  {formatINR(liveBooking.total)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-navy-foreground/60">Amount Paid</p>
                <p className="font-display text-xl font-semibold text-emerald-400 sm:text-2xl">
                  {formatINR(liveBooking.amountPaid)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-navy-foreground/60">Balance Due</p>
                <p
                  className={`font-display text-xl font-semibold sm:text-2xl ${
                    balance > 0 ? "text-amber-400" : "text-navy-foreground/50"
                  }`}
                >
                  {formatINR(balance)}
                </p>
              </div>
            </div>

            {/* Quick Balance Settlement or Custom Amount */}
            {balance > 0 && liveBooking.status !== "Cancelled" && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSettleFull}
                  className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold uppercase text-white hover:bg-emerald-500 transition shadow-md"
                >
                  {isReception ? "Settle Full Balance" : "Pay Full Balance Online"} ({formatINR(balance)})
                </button>

                <form onSubmit={handlePayment} className="flex-1 flex items-center gap-2 min-w-[240px]">
                  <input
                    type="number"
                    placeholder={`Partial amount up to ${balance}`}
                    value={payAmount}
                    max={balance}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="flex-1 rounded-lg border border-gold/30 bg-navy px-3 py-2 text-xs text-navy-foreground focus:border-gold focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-gold-gradient px-3.5 py-2 text-xs font-semibold uppercase text-gold-foreground hover:brightness-110"
                  >
                    {isReception ? "Collect" : "Pay"}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gold/15">
            <div>
              {liveBooking.status !== "Cancelled" && liveBooking.status !== "Checked-Out" && (
                <button
                  onClick={handleCancel}
                  className="rounded-lg border border-rose-500/30 px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10 uppercase transition"
                >
                  Cancel Booking
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isReception && (liveBooking.status === "Confirmed" || liveBooking.status === "Pending") && (
                <button
                  onClick={handleCheckIn}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 uppercase tracking-wide transition shadow-md"
                >
                  Check In Guest
                </button>
              )}
              {isReception && liveBooking.status === "Checked-In" && (
                <button
                  onClick={handleCheckOut}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 uppercase tracking-wide transition shadow-md"
                >
                  Check Out Guest
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-lg border border-gold/30 px-4 py-2 text-xs text-champagne hover:bg-white/5 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
