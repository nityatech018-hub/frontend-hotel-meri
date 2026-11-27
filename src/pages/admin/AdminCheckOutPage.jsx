import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LogOut,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  X,
  AlertTriangle,
  CreditCard,
  PlusCircle,
  Sparkles,
  BedDouble,
  Receipt,
  FileText,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/site/StatusBadge.jsx";
import { formatDate, formatINR, todayISO } from "@/lib/hotel/pricing.js";
import {
  checkOutBooking,
  postGuestFolioCharge,
  useHotelState,
} from "@/lib/hotel/store.jsx";

export default function AdminCheckOutPage() {
  const state = useHotelState();
  const today = todayISO();

  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [finalInvoice, setFinalInvoice] = useState(null);

  // Form State for Additional Charges inside Check-out Modal
  const [extraCategory, setExtraCategory] = useState("Extra Bed / Occupant");
  const [extraDesc, setExtraDesc] = useState("");
  const [extraAmount, setExtraAmount] = useState("");

  // Settlement & Discount
  const [settlementDiscount, setSettlementDiscount] = useState(0);
  const [settlementMethod, setSettlementMethod] = useState("UPI / QR");
  const [checkoutRemarks, setCheckoutRemarks] = useState("");

  const inHouseGuests = (state.bookings || []).filter((b) => b.status === "Checked-In");

  const todayDepartures = inHouseGuests.filter((b) => b.checkOut === today);
  const overdueDepartures = inHouseGuests.filter((b) => b.checkOut < today);

  const filteredGuests = inHouseGuests.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      b.id.toLowerCase().includes(q) ||
      b.guestName.toLowerCase().includes(q) ||
      (b.phone && b.phone.includes(q)) ||
      (b.roomNumber && String(b.roomNumber).includes(q))
    );
  });

  const handleOpenCheckoutModal = (booking) => {
    setSelectedBooking(booking);
    setSettlementDiscount(0);
    setCheckoutRemarks("");
  };

  // Folio calculations for selected booking
  const chargesForGuest = selectedBooking
    ? (state.guestCharges || []).filter((c) => c.bookingId === selectedBooking.id)
    : [];

  const extraChargesSum = chargesForGuest.reduce((sum, c) => sum + (c.amount || 0), 0);
  const currentTotal = (selectedBooking?.total || 0) + extraChargesSum;
  const netDue = Math.max(0, currentTotal - (selectedBooking?.amountPaid || 0) - Number(settlementDiscount || 0));

  const handleAddFolioCharge = (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    const amt = Number(extraAmount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid charge amount.");
      return;
    }

    postGuestFolioCharge(selectedBooking.id, {
      category: extraCategory,
      description: extraDesc.trim() || extraCategory,
      amount: amt,
      roomNumber: selectedBooking.roomNumber,
    });

    toast.success(`Added charge of ${formatINR(amt)} to Guest Folio!`);
    setExtraAmount("");
    setExtraDesc("");
  };

  const handleExecuteCheckout = (e) => {
    e.preventDefault();
    if (!selectedBooking) return;

    try {
      const settledBooking = checkOutBooking(selectedBooking.id, {
        discount: Number(settlementDiscount) || 0,
        paymentMethod: settlementMethod,
        finalPaid: netDue,
        remarks: checkoutRemarks.trim() || "Regular checkout completed.",
      });

      toast.success(
        `Check-out completed for Suite ${selectedBooking.roomNumber}! Room is marked Dirty and housekeeping notified.`
      );
      setFinalInvoice({
        ...settledBooking,
        charges: chargesForGuest,
        checkoutTime: new Date().toLocaleTimeString(),
      });
      setSelectedBooking(null);
    } catch (err) {
      toast.error(err.message || "Failed to complete check-out.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-3 py-0.5 text-[11px] font-bold text-rose-800 uppercase tracking-wider">
              Departure &amp; Billing Desk
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-[#061830] mt-1">
            Express Guest Check-Out &amp; Folio Settlement
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Settle pending accommodation charges and service folios, generate final 5% GST tax invoices, release suites to dirty housekeeping queue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/housekeeping"
            className="rounded-full bg-gold-gradient px-4 py-2 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110 transition cursor-pointer"
          >
            <Sparkles className="size-4" /> Housekeeping Board
          </Link>
          <Link
            to="/admin/payments"
            className="rounded-full border border-gold/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#061830] hover:bg-gold/10 transition shadow-sm"
          >
            Ledger
          </Link>
        </div>
      </div>

      {/* Overdue Checkouts Alert if any */}
      {overdueDepartures.length > 0 && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50/80 p-4 flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-5 text-rose-600 shrink-0" />
            <div>
              <strong className="font-bold">Overdue Check-Outs:</strong> {overdueDepartures.length} suite
              {overdueDepartures.length > 1 ? "s" : ""} have passed scheduled departure dates without formal folio settlement.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSearch(overdueDepartures[0].id)}
            className="rounded-full bg-rose-600 px-3 py-1 text-white text-[11px] font-bold hover:bg-rose-500 transition"
          >
            Resolve Overdue
          </button>
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Today's Departures</span>
          <div className="text-2xl font-bold text-[#061830] mt-1">{todayDepartures.length}</div>
          <span className="text-[10px] text-rose-600">Scheduled {formatDate(today)}</span>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Overdue Exits</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">{overdueDepartures.length}</div>
          <span className="text-[10px] text-rose-500">Action required</span>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Active In-House</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{inHouseGuests.length}</div>
          <span className="text-[10px] text-blue-500">Currently staying</span>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Dirty Suites</span>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            {state.rooms.filter((r) => r.status === "dirty" || r.status === "cleaning").length}
          </div>
          <span className="text-[10px] text-amber-600">Awaiting turnover</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-2.5 size-4 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search in-house guests by room #, guest name, booking ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-gold/30 bg-[#FAF7F2] pl-10 pr-4 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none"
          />
        </div>
        <div className="text-xs text-[#64748b] hidden sm:block">
          {filteredGuests.length} active in-house stay{filteredGuests.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* In-House Guests Table */}
      <div className="rounded-2xl border border-gold/30 bg-white shadow-card overflow-hidden">
        {filteredGuests.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="mx-auto size-10 text-emerald-600 stroke-1" />
            <h3 className="mt-2 text-sm font-bold text-[#061830]">No In-House Guests Found</h3>
            <p className="text-xs text-[#64748b]">All departures have been processed or no guests currently checked in.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#061830]">
              <thead>
                <tr className="border-b border-gold/20 bg-[#FAF7F2] text-[11px] uppercase tracking-wider text-gold font-semibold">
                  <th className="py-3 px-4">Room #</th>
                  <th className="py-3 px-4">Guest Name</th>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Check-In / Out</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Total / Outstanding</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/15">
                {filteredGuests.map((b) => {
                  const isDueToday = b.checkOut === today;
                  const isOverdue = b.checkOut < today;
                  const balance = (b.total || 0) - (b.amountPaid || 0);

                  return (
                    <tr key={b.id} className="hover:bg-gold/5 transition">
                      <td className="py-3.5 px-4 font-bold text-[#061830]">
                        <span className="rounded-xl bg-blue-50 border border-blue-300 px-3 py-1 text-sm font-bold text-blue-900 inline-block">
                          Room {b.roomNumber || "N/A"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#061830]">{b.guestName}</div>
                        <div className="text-[11px] text-[#64748b]">{b.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold">#{b.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#061830]">{formatDate(b.checkOut)}</div>
                        <div className="text-[10px] text-[#64748b]">
                          {isDueToday ? (
                            <span className="text-rose-600 font-bold uppercase">Due Today</span>
                          ) : isOverdue ? (
                            <span className="text-rose-700 font-bold uppercase">Overdue</span>
                          ) : (
                            <span>Checked in {formatDate(b.checkIn)}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 capitalize">{b.categoryId} Room</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold">{formatINR(b.total)}</div>
                        <div className={`text-[11px] font-semibold ${balance > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                          Bal: {balance > 0 ? formatINR(balance) : "Settled"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenCheckoutModal(b)}
                          className="rounded-full bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition shadow-sm cursor-pointer"
                        >
                          Settle &amp; Check-Out →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Settle & Check-Out Folio Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl rounded-3xl border border-gold/30 bg-white p-6 sm:p-8 shadow-lift text-[#061830] space-y-5 my-8"
          >
            <div className="flex items-center justify-between border-b border-gold/15 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-rose-700 font-bold block">
                  Folio Settlement &amp; Departure
                </span>
                <h2 className="font-display text-xl font-bold">
                  Check-Out: Suite {selectedBooking.roomNumber} — {selectedBooking.guestName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-full p-1.5 hover:bg-slate-100 text-[#64748b]"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Folio Breakdown */}
            <div className="rounded-2xl bg-[#FAF7F2] p-4 border border-gold/20 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-[#061830] text-sm border-b border-gold/15 pb-2">
                <span>Room Charges ({selectedBooking.categoryId}):</span>
                <span>{formatINR(selectedBooking.total)}</span>
              </div>

              {chargesForGuest.map((c) => (
                <div key={c.id} className="flex justify-between text-[#475569] pl-2">
                  <span>+ {c.category}: {c.description}</span>
                  <span className="font-semibold text-[#061830]">{formatINR(c.amount)}</span>
                </div>
              ))}

              <div className="pt-2 border-t border-gold/15 space-y-1">
                <div className="flex justify-between text-[#64748b]">
                  <span>Total Charges Accrued:</span>
                  <strong className="text-[#061830]">{formatINR(currentTotal)}</strong>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Total Amount Already Paid:</span>
                  <span>-{formatINR(selectedBooking.amountPaid || 0)}</span>
                </div>
                {Number(settlementDiscount) > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Executive Concession / Discount:</span>
                    <span>-{formatINR(settlementDiscount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gold/20 flex justify-between text-sm font-bold text-[#061830]">
                  <span>Net Outstanding Balance:</span>
                  <span className="text-rose-600 font-display text-base">{formatINR(netDue)}</span>
                </div>
              </div>
            </div>

            {/* Quick Add Extra Non-Food Accommodation Charge */}
            <form onSubmit={handleAddFolioCharge} className="rounded-xl border border-gold/30 bg-white p-3.5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block">
                Post Additional Accommodation Charge (Extra Bed, Laundry, Late Checkout, Damage)
              </span>
              <div className="grid sm:grid-cols-3 gap-2">
                <select
                  value={extraCategory}
                  onChange={(e) => setExtraCategory(e.target.value)}
                  className="rounded-lg border border-gold/30 bg-[#FAF7F2] px-2 py-1.5 text-xs text-[#061830]"
                >
                  <option value="Extra Bed / Occupant">Extra Bed / Rollaway</option>
                  <option value="Late Check-Out Fee">Late Check-Out Fee</option>
                  <option value="Laundry Services">Laundry &amp; Dry Cleaning</option>
                  <option value="Damage Compensation">Room Damage Compensation</option>
                  <option value="Airport Transfer">Airport Transfer</option>
                  <option value="Keycard Replacement">Keycard Replacement</option>
                </select>
                <input
                  type="text"
                  placeholder="Item details (optional)"
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
            <form onSubmit={handleExecuteCheckout} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Concession / Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={netDue}
                    value={settlementDiscount}
                    onChange={(e) => setSettlementDiscount(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Settlement Payment Method
                  </label>
                  <select
                    value={settlementMethod}
                    onChange={(e) => setSettlementMethod(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830] focus:border-gold focus:outline-none"
                  >
                    <option value="UPI / QR">UPI / QR Code</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Check-Out Remarks &amp; Housekeeping Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Guest praised service; deep sanitization requested"
                  value={checkoutRemarks}
                  onChange={(e) => setCheckoutRemarks(e.target.value)}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gold/15">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="rounded-full border border-slate-300 px-5 py-2 text-xs font-semibold text-[#64748b] hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-rose-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500 transition shadow-sm cursor-pointer"
                >
                  Settle Folio &amp; Complete Departure
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Final GST Tax Invoice & Receipt Modal */}
      {finalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-3xl border border-gold/40 bg-white p-6 sm:p-8 shadow-lift text-[#061830] space-y-5"
          >
            <div className="flex items-center justify-between border-b border-gold/20 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold block">
                  Departure Complete
                </span>
                <h3 className="font-display text-xl font-bold">Tax Invoice &amp; Folio Receipt</h3>
              </div>
              <div className="text-right text-xs text-[#64748b]">
                <div>Date: {formatDate(today)}</div>
                <div>Time: {finalInvoice.checkoutTime}</div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#FAF7F2] p-4 border border-gold/20 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Guest Name:</span>
                <strong className="font-bold text-[#061830]">{finalInvoice.guestName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Booking Ref:</span>
                <strong>#{finalInvoice.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Suite Vacated:</span>
                <strong className="text-rose-600 font-bold">Room {finalInvoice.roomNumber} (Status: Dirty)</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-gold/15">
                <span className="text-[#64748b]">Final Amount Paid:</span>
                <strong className="text-emerald-700 font-bold text-sm">{formatINR(finalInvoice.amountPaid)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Balance Remaining:</span>
                <strong className="text-emerald-700 font-bold">₹0.00 (Fully Settled)</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
              <Sparkles className="size-4 text-amber-600 shrink-0" />
              <span>Housekeeping task generated automatically for Suite {finalInvoice.roomNumber}.</span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <a
                href={`/invoice/${finalInvoice.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-full border border-gold/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#061830] hover:bg-gold/10"
              >
                <Printer className="size-4 text-gold" /> Print Tax Invoice
              </a>
              <button
                type="button"
                onClick={() => setFinalInvoice(null)}
                className="rounded-full bg-[#061830] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
