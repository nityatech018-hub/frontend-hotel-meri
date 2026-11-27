import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BedDouble,
  LogOut,
  FileText,
  AlertTriangle,
  Sparkles,
  Search,
  CheckCircle2,
  Printer,
  Plus,
  CreditCard,
  IndianRupee,
  Clock,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState, FilterChips, Panel } from "@/components/dashboard/ui.jsx";
import { BookingDialog } from "@/components/dashboard/BookingDialog.jsx";
import { PaymentBadge, StatusBadge } from "@/components/site/StatusBadge.jsx";
import { formatDate, formatINR, todayISO } from "@/lib/hotel/pricing.js";
import {
  checkOutBooking,
  getCategory,
  addGuestCharge,
  recordPayment,
  useHotelState,
} from "@/lib/hotel/store.jsx";

const VIEWS = ["Due today", "Overdue Only", "With Outstanding Due", "All In-House"];

export default function ReceptionCheckOut() {
  const state = useHotelState();
  const today = todayISO();
  const [view, setView] = useState("Due today");
  const [search, setSearch] = useState("");
  const [inspectBooking, setInspectBooking] = useState(null);
  const [checkoutModalBooking, setCheckoutModalBooking] = useState(null);

  const term = search.trim().toLowerCase();

  const list = state.bookings
    .filter((b) => b.status === "Checked-In")
    .filter((b) => {
      if (view === "Due today") return b.checkOut <= today;
      if (view === "Overdue Only") return b.checkOut < today;
      if (view === "With Outstanding Due") return Math.max(0, b.total - b.amountPaid) > 0;
      return true;
    })
    .filter(
      (b) =>
        !term ||
        b.guestName.toLowerCase().includes(term) ||
        b.id.toLowerCase().includes(term) ||
        (b.roomNumber && b.roomNumber.toLowerCase().includes(term))
    )
    .sort((a, b) => a.checkOut.localeCompare(b.checkOut));

  const overdueCount = state.bookings.filter(
    (b) => b.status === "Checked-In" && b.checkOut < today
  ).length;

  return (
    <>
      <Panel
        title="Departures &amp; Express Check-Out Desk"
        subtitle="Review room charges, post non-food accommodation items, settle balances, and process guest check-outs"
        action={
          <div className="flex flex-wrap items-center gap-3">
            {overdueCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-rose-100 border border-rose-300 px-3 py-1 text-xs font-bold text-rose-800">
                <AlertTriangle className="size-3.5 text-rose-600" /> {overdueCount} Overdue
              </span>
            )}
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gold" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search room or guest..."
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] pl-8 pr-3 py-1.5 text-xs text-[#061830] placeholder:text-[#64748b] focus:border-gold focus:outline-none"
              />
            </div>
            <FilterChips options={VIEWS} value={view} onChange={setView} />
          </div>
        }
      >
        {list.length === 0 ? (
          <EmptyState
            icon={BedDouble}
            title="No departures in this queue"
            text={
              view === "Overdue Only"
                ? "Great! There are no overdue departures currently in-house."
                : view === "Due today"
                ? "All guests scheduled to depart today have already checked out."
                : "No matching checked-in guests found."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gold/20">
            <table className="w-full min-w-[850px] text-left text-xs bg-white">
              <thead className="border-b border-gold/20 bg-[#FAF7F2] text-[#061830] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Room</th>
                  <th className="py-3 px-3">Guest Name &amp; Contact</th>
                  <th className="py-3 px-3">Scheduled Departure</th>
                  <th className="py-3 px-3">Total Folio</th>
                  <th className="py-3 px-3">Balance Due</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3 text-right">Desk Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10 text-[#061830]">
                <AnimatePresence initial={false}>
                  {list.map((b) => {
                    const bal = Math.max(0, b.total - b.amountPaid);
                    const late = b.checkOut < today;

                    return (
                      <motion.tr
                        key={b.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: 30 }}
                        className={`hover:bg-gold/5 transition ${
                          late ? "bg-rose-50/70" : ""
                        }`}
                      >
                        <td className="py-3 px-3">
                          <span className="rounded-lg bg-[#061830] px-3 py-1.5 font-display text-base font-bold text-gold border border-gold/40 shadow-sm">
                            #{b.roomNumber ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => setInspectBooking(b)}
                            className="font-bold text-[#061830] hover:text-gold transition text-left cursor-pointer"
                          >
                            {b.guestName}
                          </button>
                          <p className="text-[11px] text-[#64748b]">
                            {getCategory(state, b.categoryId)?.name} · ID #{b.id}
                          </p>
                        </td>
                        <td
                          className={`py-3 px-3 ${
                            late ? "text-rose-700 font-bold" : "text-[#475569]"
                          }`}
                        >
                          {formatDate(b.checkOut)}
                          {late && (
                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-rose-700 mt-0.5">
                              <AlertTriangle className="size-3" /> Overdue
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#061830]">
                          {formatINR(b.total)}
                        </td>
                        <td
                          className={`py-3 px-3 font-bold ${
                            bal > 0 ? "text-amber-600 font-mono text-sm" : "text-emerald-600"
                          }`}
                        >
                          {formatINR(bal)}
                        </td>
                        <td className="py-3 px-3">
                          <PaymentBadge payment={b.payment} />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/invoice/${b.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-gold/30 bg-[#FAF7F2] px-2.5 py-1.5 text-[11px] font-semibold text-[#061830] hover:bg-gold/15 transition shadow-sm"
                              title="Tax Invoice"
                            >
                              <FileText className="size-3 text-gold" /> Invoice
                            </Link>

                            <button
                              type="button"
                              onClick={() => setCheckoutModalBooking(b)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 py-1.5 text-xs font-bold uppercase text-gold-foreground hover:brightness-110 transition shadow-gold cursor-pointer"
                            >
                              <LogOut className="size-3.5" /> Settle &amp; Check Out
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Booking Dialog Modal */}
      {inspectBooking && (
        <BookingDialog
          booking={inspectBooking}
          open={Boolean(inspectBooking)}
          onClose={() => setInspectBooking(null)}
        />
      )}

      {/* Comprehensive Folio Settlement & Check-Out Modal */}
      {checkoutModalBooking && (
        <FolioCheckoutModal
          booking={checkoutModalBooking}
          onClose={() => setCheckoutModalBooking(null)}
        />
      )}
    </>
  );
}

function FolioCheckoutModal({ booking, onClose }) {
  const state = useHotelState();
  const liveBooking = state.bookings.find((b) => b.id === booking.id) || booking;
  const cat = getCategory(state, liveBooking.categoryId);

  // Folio state
  const [extraCategory, setExtraCategory] = useState("Extra Bed / Occupant");
  const [extraDesc, setExtraDesc] = useState("");
  const [extraAmount, setExtraAmount] = useState("");

  const [discount, setDiscount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [remarks, setRemarks] = useState("");

  const guestCharges = (state.guestCharges || []).filter((c) => c.bookingId === liveBooking.id);
  const balance = Math.max(0, liveBooking.total - liveBooking.amountPaid);

  const handleAddFolioCharge = (e) => {
    e.preventDefault();
    const amt = parseFloat(extraAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid positive charge amount.");
      return;
    }

    addGuestCharge({
      bookingId: liveBooking.id,
      serviceName: extraCategory,
      description: extraDesc.trim() || extraCategory,
      unitPrice: amt,
      amount: amt,
    });

    toast.success(`Added ${extraCategory} (${formatINR(amt)}) to room folio.`);
    setExtraAmount("");
    setExtraDesc("");
  };

  const handleCompleteCheckOut = (e) => {
    e.preventDefault();
    const discountVal = parseFloat(discount) || 0;
    const finalBal = Math.max(0, balance - discountVal);

    checkOutBooking(liveBooking.id, {
      paymentMethod: payMethod.toLowerCase(),
      settlementAmount: finalBal,
      remarks: remarks || "Checked out via front desk",
    });

    toast.success(`${liveBooking.guestName} checked out successfully. Room ${liveBooking.roomNumber} sent to Cleaning.`);
    onClose();
  };

  const handlePrintReceipt = () => {
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(`
      <html>
        <head>
          <title>Settlement Receipt - ${liveBooking.id}</title>
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
          <div class="title">Official Check-Out Folio &amp; Settlement Receipt</div>
          <div class="grid">
            <div class="col"><div class="label">Booking ID</div><div class="val">${liveBooking.id}</div></div>
            <div class="col"><div class="label">Room Number</div><div class="val">${liveBooking.roomNumber || "—"}</div></div>
            <div class="col"><div class="label">Guest Name</div><div class="val">${liveBooking.guestName}</div></div>
            <div class="col"><div class="label">Payment Method</div><div class="val">${payMethod}</div></div>
            <div class="col"><div class="label">Category</div><div class="val">${cat.name}</div></div>
            <div class="col"><div class="label">Stay Dates</div><div class="val">${formatDate(liveBooking.checkIn)} → ${formatDate(liveBooking.checkOut)}</div></div>
            <div class="col"><div class="label">Total Folio (5% GST)</div><div class="val">₹${liveBooking.total}</div></div>
            <div class="col"><div class="label">Settled Balance</div><div class="val">₹${balance} (Paid in Full)</div></div>
          </div>
          <div class="sign-box">
            <div class="sign-line">Guest Signature</div>
            <div class="sign-line">Reception Cashier</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-gold/40 bg-white p-6 shadow-2xl text-[#061830] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gold/20 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-2xl font-bold">
                Folio Settlement — #{liveBooking.id}
              </h3>
              <span className="rounded bg-[#061830] px-2 py-0.5 font-display text-sm font-bold text-gold">
                Room {liveBooking.roomNumber}
              </span>
            </div>
            <p className="text-xs text-[#64748b] mt-0.5">
              Guest: <strong>{liveBooking.guestName}</strong> · Category: {cat.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#64748b] hover:text-[#061830]"
          >
            ✕
          </button>
        </div>

        {/* Existing Guest Additional Charges Table */}
        {guestCharges.length > 0 && (
          <div className="rounded-xl border border-gold/20 bg-[#FAF7F2] p-3 text-xs space-y-2">
            <span className="font-bold text-gold uppercase tracking-wider block text-[10px]">
              Posted Non-Food Folio Items:
            </span>
            <div className="divide-y divide-gold/10">
              {guestCharges.map((chg) => (
                <div key={chg.id} className="flex justify-between py-1">
                  <span>{chg.description || chg.serviceName}</span>
                  <span className="font-bold">{formatINR(chg.amount || chg.totalAmount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Add Extra Non-Food Accommodation Charge */}
        <form onSubmit={handleAddFolioCharge} className="rounded-xl border border-gold/30 bg-white p-3.5 space-y-2 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold block">
            + Post Additional Accommodation Charge (Strictly Non-Food)
          </span>
          <div className="grid sm:grid-cols-3 gap-2">
            <select
              value={extraCategory}
              onChange={(e) => setExtraCategory(e.target.value)}
              className="rounded-lg border border-gold/30 bg-[#FAF7F2] px-2 py-1.5 text-xs text-[#061830]"
            >
              <option value="Extra Bed / Occupant">Extra Bed / Rollaway</option>
              <option value="Late Check-Out Fee">Late Check-Out Fee</option>
              <option value="Laundry Services">Laundry &amp; Steam Press</option>
              <option value="Damage Compensation">Room Damage Compensation</option>
              <option value="Airport Transfer">Airport Chauffeured Transfer</option>
              <option value="Keycard Replacement">RFID Keycard Replacement</option>
            </select>
            <input
              type="text"
              placeholder="Item details / remarks (optional)"
              value={extraDesc}
              onChange={(e) => setExtraDesc(e.target.value)}
              className="rounded-lg border border-gold/30 bg-[#FAF7F2] px-2 py-1.5 text-xs text-[#061830]"
            />
            <div className="flex gap-1.5">
              <input
                type="number"
                placeholder="Amount ₹"
                value={extraAmount}
                onChange={(e) => setExtraAmount(e.target.value)}
                className="w-full rounded-lg border border-gold/30 bg-[#FAF7F2] px-2 py-1.5 text-xs font-bold text-[#061830]"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#061830] px-3 py-1.5 text-xs font-bold text-white shrink-0 hover:bg-navy-deep cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </form>

        {/* Final Settlement Form */}
        <form onSubmit={handleCompleteCheckOut} className="space-y-4 text-xs">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                Concession / Discount (₹)
              </label>
              <input
                type="number"
                min={0}
                max={balance}
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                Settlement Payment Method
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-semibold text-[#061830]"
              >
                <option value="Cash">Cash at Desk</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Card">Credit / Debit Card (POS)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
              Check-Out Remarks &amp; Guest Feedback
            </label>
            <input
              type="text"
              placeholder="e.g. Guest expressed satisfaction, keycard returned, mini safe verified clear"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]"
            />
          </div>

          {/* Folio Total Summary Box */}
          <div className="rounded-2xl border border-gold/40 bg-[#FAF7F2] p-4 text-[#061830] space-y-2">
            <div className="flex justify-between">
              <span className="text-[#64748b]">Total Folio Billed (with 5% GST):</span>
              <span className="font-bold">{formatINR(liveBooking.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748b]">Previously Paid:</span>
              <span className="font-bold text-emerald-700">{formatINR(liveBooking.amountPaid)}</span>
            </div>
            {Number(discount) > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Authorized Concession:</span>
                <span className="font-bold">- {formatINR(Number(discount))}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gold/25 pt-2 text-sm font-bold">
              <span>Final Settlement Due:</span>
              <span className="text-navy-deep font-display text-base">
                {formatINR(Math.max(0, balance - (Number(discount) || 0)))}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <a
                href={`/invoice/${liveBooking.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition cursor-pointer shadow-sm"
              >
                <Printer className="size-4 text-red-600" /> Print Tax Invoice
              </a>
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gold/30 bg-white px-3 py-2.5 text-xs font-semibold text-[#061830] hover:bg-gold/15 transition cursor-pointer shadow-sm"
              >
                Folio Slip
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gold/30 px-4 py-2.5 text-xs font-semibold text-[#061830] hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-6 py-2.5 text-xs font-bold uppercase text-gold-foreground hover:brightness-110 shadow-gold transition cursor-pointer"
              >
                <LogOut className="size-4" /> Settle &amp; Complete Check-Out
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
