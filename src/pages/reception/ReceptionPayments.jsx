import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  FileText,
  IndianRupee,
  Receipt,
  SearchX,
  Search,
  Wallet,
  PlusCircle,
  Printer,
  CreditCard,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState, FilterChips, Panel, StatCard } from "@/components/dashboard/ui.jsx";
import { BookingDialog } from "@/components/dashboard/BookingDialog.jsx";
import { PaymentBadge, StatusBadge } from "@/components/site/StatusBadge.jsx";
import { formatDate, formatINR, todayISO } from "@/lib/hotel/pricing.js";
import {
  recordPayment,
  getCategory,
  useHotelState,
} from "@/lib/hotel/store.jsx";

const STATUS_FILTERS = ["All", "Paid", "Partial", "Unpaid"];
const METHOD_FILTERS = ["All Methods", "Cash", "UPI", "Card", "Bank Transfer"];

export default function ReceptionPayments() {
  const state = useHotelState();
  const today = todayISO();
  const [activeTab, setActiveTab] = useState("folios"); // 'folios' | 'transactions'
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All Methods");
  const [q, setQ] = useState("");
  const [inspectBooking, setInspectBooking] = useState(null);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [printReceiptData, setPrintReceiptData] = useState(null);

  const liveBookings = state.bookings.filter((b) => b.status !== "Cancelled");
  const totalCollected = liveBookings.reduce((n, b) => n + (Number(b.amountPaid) || 0), 0);
  const totalDue = liveBookings.reduce(
    (n, b) => n + Math.max(0, (Number(b.total) || 0) - (Number(b.amountPaid) || 0)),
    0
  );

  // Today's collection
  const todaysTxns = (state.financialTransactions || []).filter(
    (t) => t.createdAt === today && (t.type === "payment" || t.type === "advance")
  );
  const todayTotal = todaysTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const term = q.trim().toLowerCase();

  // Filtered bookings for Folios view
  const filteredBookings = liveBookings
    .filter((b) => statusFilter === "All" || b.payment === statusFilter)
    .filter(
      (b) =>
        !term ||
        b.guestName.toLowerCase().includes(term) ||
        b.id.toLowerCase().includes(term) ||
        (b.roomNumber && b.roomNumber.toLowerCase().includes(term))
    );

  // Filtered transactions for Transactions view
  const filteredTransactions = (state.financialTransactions || [])
    .filter((t) => {
      if (methodFilter === "All Methods") return true;
      return t.paymentMethod?.toLowerCase().includes(methodFilter.toLowerCase());
    })
    .filter(
      (t) =>
        !term ||
        (t.id && t.id.toLowerCase().includes(term)) ||
        (t.bookingId && t.bookingId.toLowerCase().includes(term)) ||
        (t.description && t.description.toLowerCase().includes(term)) ||
        (t.referenceNo && t.referenceNo.toLowerCase().includes(term))
    );

  const handlePrintSlip = (txn) => {
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(`
      <html>
        <head>
          <title>Payment Receipt - ${txn.id || txn.referenceNo}</title>
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
          <div class="title">Official Front Desk Payment Receipt</div>
          <div class="grid">
            <div class="col"><div class="label">Transaction ID</div><div class="val">${txn.id}</div></div>
            <div class="col"><div class="label">Booking ID</div><div class="val">${txn.bookingId || "General Settlement"}</div></div>
            <div class="col"><div class="label">Payment Amount</div><div class="val">₹${txn.amount}</div></div>
            <div class="col"><div class="label">Payment Method</div><div class="val">${txn.paymentMethod?.toUpperCase() || "CASH"}</div></div>
            <div class="col"><div class="label">Reference / Slip #</div><div class="val">${txn.referenceNo || "—"}</div></div>
            <div class="col"><div class="label">Payment Date</div><div class="val">${formatDate(txn.createdAt || today)}</div></div>
            <div class="col" style="width: 100%;"><div class="label">Description / Remarks</div><div class="val">${txn.description || "Folio Settlement"}</div></div>
            <div class="col" style="width: 100%;"><div class="label">Received By</div><div class="val">${txn.createdBy || "Front Desk Cashier"}</div></div>
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
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Total Collected"
          value={formatINR(totalCollected)}
          tone="emerald"
        />
        <StatCard
          icon={IndianRupee}
          label="Today's Collection"
          value={formatINR(todayTotal)}
          tone="emerald"
        />
        <StatCard
          icon={AlertCircle}
          label="Outstanding Balance Due"
          value={formatINR(totalDue)}
          tone="gold"
        />
        <StatCard
          icon={Receipt}
          label="Unpaid Folios"
          value={liveBookings.filter((b) => b.payment === "Unpaid").length}
          tone="default"
        />
      </div>

      <Panel
        title="Payment Records &amp; Front Desk Ledger"
        subtitle="Manage guest folios, record partial or full settlements, and print verified transaction receipts"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setRecordModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gold-gradient px-3.5 py-2 text-xs font-bold text-gold-foreground hover:brightness-110 shadow-sm cursor-pointer"
            >
              <PlusCircle className="size-3.5" /> Record Payment
            </button>
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gold/60" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search guest, ID, or ref..."
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] pl-9 pr-3 py-2 text-xs text-[#061830] placeholder:text-[#64748b] focus:border-gold focus:outline-none"
              />
            </div>
          </div>
        }
      >
        {/* View Switcher Tabs & Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/20 pb-4 mb-4">
          <div className="flex rounded-xl bg-[#FAF7F2] p-1 border border-gold/30">
            <button
              type="button"
              onClick={() => setActiveTab("folios")}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === "folios"
                  ? "bg-gold text-gold-foreground shadow-sm"
                  : "text-[#64748b] hover:text-[#061830]"
              }`}
            >
              Booking Folios ({filteredBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("transactions")}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === "transactions"
                  ? "bg-gold text-gold-foreground shadow-sm"
                  : "text-[#64748b] hover:text-[#061830]"
              }`}
            >
              Transaction Ledger ({filteredTransactions.length})
            </button>
          </div>

          {activeTab === "folios" ? (
            <FilterChips
              options={STATUS_FILTERS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          ) : (
            <FilterChips
              options={METHOD_FILTERS}
              value={methodFilter}
              onChange={setMethodFilter}
            />
          )}
        </div>

        {/* Tab 1: Booking Folios */}
        {activeTab === "folios" && (
          filteredBookings.length === 0 ? (
            <EmptyState icon={SearchX} title="No booking folios match this filter" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gold/20">
              <table className="w-full min-w-[850px] text-left text-xs bg-white">
                <thead className="border-b border-gold/20 bg-[#FAF7F2] text-[#061830] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Booking ID</th>
                    <th className="py-3 px-3">Guest &amp; Room</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Total Folio</th>
                    <th className="py-3 px-3">Amount Paid</th>
                    <th className="py-3 px-3">Balance Due</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3 text-right">Desk Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10 text-[#061830]">
                  {filteredBookings.map((b) => {
                    const bal = Math.max(0, b.total - b.amountPaid);
                    const pct = Math.min(100, Math.round((b.amountPaid / (b.total || 1)) * 100));

                    return (
                      <tr key={b.id} className="hover:bg-gold/5 transition">
                        <td className="py-3 px-3 font-semibold text-[#061830] font-mono">{b.id}</td>
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => setInspectBooking(b)}
                            className="font-bold text-[#061830] hover:text-gold text-left transition-colors cursor-pointer"
                          >
                            {b.guestName}
                          </button>
                          <p className="text-[11px] text-[#64748b]">
                            {b.roomNumber ? `Room ${b.roomNumber}` : "Unassigned"} · {getCategory(state, b.categoryId)?.name}
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="py-3 px-3 font-bold text-[#061830]">{formatINR(b.total)}</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-emerald-600">{formatINR(b.amountPaid)}</p>
                          <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 border border-gold/20">
                            <div
                              className="h-full bg-gold-gradient rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {bal > 0 ? (
                            <span className="font-bold text-amber-600 font-mono">{formatINR(bal)}</span>
                          ) : (
                            <span className="font-bold text-emerald-600 font-mono">₹0 (Settled)</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <PaymentBadge payment={b.payment} />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {bal > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  recordPayment(b.id, bal);
                                  toast.success(`Full balance of ${formatINR(bal)} settled for #${b.id}!`);
                                }}
                                className="rounded-full bg-gold-gradient px-3 py-1 text-[11px] font-bold uppercase text-gold-foreground hover:brightness-110 shadow-sm cursor-pointer"
                              >
                                Settle
                              </button>
                            )}
                            <Link
                              to={`/invoice/${b.id}`}
                              className="rounded-lg border border-gold/30 bg-[#FAF7F2] p-1.5 text-[#061830] hover:bg-gold/15 shadow-sm"
                              title="View Tax Invoice"
                            >
                              <FileText className="size-3.5 text-gold" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Tab 2: Individual Transaction Ledger */}
        {activeTab === "transactions" && (
          filteredTransactions.length === 0 ? (
            <EmptyState icon={Receipt} title="No transaction entries recorded yet" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gold/20">
              <table className="w-full min-w-[850px] text-left text-xs bg-white">
                <thead className="border-b border-gold/20 bg-[#FAF7F2] text-[#061830] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Txn ID</th>
                    <th className="py-3 px-3">Booking ID</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3">Method</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Cashier</th>
                    <th className="py-3 px-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10 text-[#061830]">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gold/5 transition">
                      <td className="py-3 px-3 font-mono font-bold text-navy-deep">{t.id}</td>
                      <td className="py-3 px-3 font-mono text-[#64748b]">
                        {t.bookingId || "—"}
                      </td>
                      <td className="py-3 px-3 font-medium text-[#061830]">{t.description}</td>
                      <td className="py-3 px-3">
                        <span className="rounded bg-navy-deep/10 px-2 py-0.5 text-[10px] font-bold text-[#061830] uppercase">
                          {t.paymentMethod || "CASH"}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-600 font-mono">
                        {formatINR(t.amount)}
                      </td>
                      <td className="py-3 px-3 text-[#475569]">
                        {formatDate(t.createdAt || today)}
                      </td>
                      <td className="py-3 px-3 text-[#64748b]">{t.createdBy || "Front Desk"}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handlePrintSlip(t)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gold/30 bg-[#FAF7F2] px-2.5 py-1 text-[11px] font-semibold text-[#061830] hover:bg-gold/15 transition cursor-pointer"
                        >
                          <Printer className="size-3 text-gold" /> Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </Panel>

      {/* Record Payment Modal */}
      {recordModalOpen && (
        <RecordPaymentModal
          onClose={() => setRecordModalOpen(false)}
          onSuccess={() => setRecordModalOpen(false)}
        />
      )}

      {/* Inspect Booking Dialog */}
      {inspectBooking && (
        <BookingDialog
          booking={inspectBooking}
          open={Boolean(inspectBooking)}
          onClose={() => setInspectBooking(null)}
        />
      )}
    </div>
  );
}

function RecordPaymentModal({ onClose, onSuccess }) {
  const state = useHotelState();
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [referenceNo, setReferenceNo] = useState("");
  const [remarks, setRemarks] = useState("");

  const unpaidBookings = state.bookings.filter(
    (b) => b.status !== "Cancelled" && (b.total - b.amountPaid) > 0
  );

  const selectedBooking = state.bookings.find((b) => b.id === selectedBookingId);
  const balance = selectedBooking ? Math.max(0, selectedBooking.total - selectedBooking.amountPaid) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedBookingId) {
      toast.error("Please select a reservation.");
      return;
    }
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      toast.error("Please enter a valid positive payment amount.");
      return;
    }
    if (numAmt > balance) {
      toast.error(`Payment amount cannot exceed balance due of ${formatINR(balance)}.`);
      return;
    }

    recordPayment(selectedBookingId, numAmt, paymentMethod);
    toast.success(`Recorded payment of ${formatINR(numAmt)} for Booking #${selectedBookingId}!`);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-gold/40 bg-white p-6 shadow-2xl text-[#061830] space-y-4">
        <div className="flex items-center justify-between border-b border-gold/20 pb-3">
          <h3 className="font-display text-xl font-bold">Record Guest Payment</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-[#64748b] hover:text-[#061830]">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-gold uppercase mb-1">Select Active Reservation *</label>
            <select
              required
              value={selectedBookingId}
              onChange={(e) => {
                setSelectedBookingId(e.target.value);
                const b = state.bookings.find((x) => x.id === e.target.value);
                if (b) setAmount(String(Math.max(0, b.total - b.amountPaid)));
              }}
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830] font-semibold"
            >
              <option value="">Select guest reservation...</option>
              {unpaidBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  #{b.id} — {b.guestName} ({b.roomNumber ? `Room ${b.roomNumber}` : "Unassigned"}) · Due: ₹{b.total - b.amountPaid}
                </option>
              ))}
            </select>
          </div>

          {selectedBooking && (
            <div className="rounded-xl border border-gold/25 bg-[#FAF7F2] p-3 space-y-1">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Total Folio:</span>
                <span className="font-bold">{formatINR(selectedBooking.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Previously Paid:</span>
                <span className="font-bold text-emerald-700">{formatINR(selectedBooking.amountPaid)}</span>
              </div>
              <div className="flex justify-between border-t border-gold/20 pt-1 font-bold">
                <span>Remaining Balance Due:</span>
                <span className="text-amber-600 font-display text-sm">{formatINR(balance)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-gold uppercase mb-1">Payment Amount (₹) *</label>
            <input
              type="number"
              required
              min={1}
              max={balance || undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830] font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-gold uppercase mb-1">Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830] font-semibold"
            >
              <option value="cash">Cash at Front Desk</option>
              <option value="upi">UPI / Dynamic QR</option>
              <option value="card">Debit / Credit Card (POS Terminal)</option>
              <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gold uppercase mb-1">Reference / Transaction #</label>
            <input
              type="text"
              placeholder="e.g. UPI-912847 or POS-Slip-8821"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gold/30 px-4 py-2 text-xs font-semibold text-[#061830] hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gold-gradient px-5 py-2 text-xs font-bold text-gold-foreground shadow-gold hover:brightness-110"
            >
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
