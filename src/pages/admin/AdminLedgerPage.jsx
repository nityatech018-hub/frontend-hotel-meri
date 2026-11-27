import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CreditCard,
  Search,
  Download,
  PlusCircle,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Calendar,
  CheckCircle2,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { formatINR, formatDate, todayISO } from "@/lib/hotel/pricing.js";
import {
  recordFinancialTransaction,
  useHotelState,
} from "@/lib/hotel/store.jsx";

export default function AdminLedgerPage() {
  const state = useHotelState();
  const today = todayISO();

  const [typeFilter, setTypeFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modals
  const [recordModalOpen, setRecordModalOpen] = useState(false);

  // Form State for Manual Transaction
  const [formType, setFormType] = useState("Balance Settlement");
  const [formAmount, setFormAmount] = useState("");
  const [formMethod, setFormMethod] = useState("Cash");
  const [formBookingId, setFormBookingId] = useState("");
  const [formGuestName, setFormGuestName] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const transactions = state.financialTransactions || [];

  // Summary Counters
  const totalInflow = transactions
    .filter((t) => t.type !== "Refund" && t.type !== "Maintenance Expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalOutflow = transactions
    .filter((t) => t.type === "Refund" || t.type === "Maintenance Expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const netCollection = totalInflow - totalOutflow;

  const pendingBalances = (state.bookings || [])
    .filter((b) => b.status !== "Cancelled")
    .reduce((sum, b) => {
      const bal = (b.total || 0) - (b.amountPaid || 0);
      return sum + (bal > 0 ? bal : 0);
    }, 0);

  const filteredTransactions = transactions.filter((t) => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (methodFilter !== "all" && t.method !== methodFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        (t.id && t.id.toLowerCase().includes(q)) ||
        (t.bookingId && t.bookingId.toLowerCase().includes(q)) ||
        (t.guestName && t.guestName.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleRecordTransaction = (e) => {
    e.preventDefault();
    const amt = Number(formAmount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid transaction amount.");
      return;
    }

    recordFinancialTransaction({
      type: formType,
      amount: amt,
      method: formMethod,
      bookingId: formBookingId.trim() || undefined,
      guestName: formGuestName.trim() || "Administrative Folio",
      description: formNotes.trim() || `${formType} processed via ${formMethod}`,
    });

    toast.success(`Transaction of ${formatINR(amt)} recorded in financial ledger!`);
    setRecordModalOpen(false);
    setFormAmount("");
    setFormNotes("");
    setFormBookingId("");
    setFormGuestName("");
  };

  const handleExportCSV = () => {
    const headers = ["Transaction ID,Date,Type,Booking ID,Guest Name,Method,Amount,Description\n"];
    const rows = filteredTransactions.map((t) =>
      `"${t.id}","${t.date}","${t.type}","${t.bookingId || ""}","${t.guestName || ""}","${t.method}","${t.amount}","${t.description || ""}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `hotel_meri_financial_ledger_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Financial ledger exported to CSV successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold/20 border border-gold/40 px-3 py-0.5 text-[11px] font-bold text-[#061830] uppercase tracking-wider">
              Treasury &amp; Fiscal Ledger
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-[#061830] mt-1">
            Financial Ledger &amp; Cash Flow Records
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Traceable double-entry transaction record: booking advance receipts, folio settlements, guest refunds, and maintenance expenditures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-full border border-gold/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#061830] hover:bg-gold/10 transition shadow-sm cursor-pointer"
          >
            <Download className="size-4 text-gold" /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => setRecordModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110 transition cursor-pointer"
          >
            <PlusCircle className="size-4" /> Record Entry
          </button>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gold/30 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Gross Inflow</span>
            <div className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{formatINR(totalInflow)}</div>
          <span className="text-[10px] text-emerald-600">All revenue collections</span>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Outflow</span>
            <div className="grid size-7 place-items-center rounded-lg bg-rose-50 text-rose-600">
              <ArrowUpRight className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{formatINR(totalOutflow)}</div>
          <span className="text-[10px] text-rose-500">Refunds &amp; repairs</span>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Net Cash Retained</span>
            <div className="grid size-7 place-items-center rounded-lg bg-gold/15 text-gold">
              <IndianRupee className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#061830] mt-2">{formatINR(netCollection)}</div>
          <span className="text-[10px] text-[#64748b]">Balance in property vault</span>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Balances</span>
            <div className="grid size-7 place-items-center rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{formatINR(pendingBalances)}</div>
          <span className="text-[10px] text-amber-600">Due upon guest checkout</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 size-3.5 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search ID, guest, booking..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-gold/30 bg-[#FAF7F2] pl-8 pr-3 py-1.5 text-xs text-[#061830] focus:border-gold focus:outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-full border border-gold/30 bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none"
          >
            <option value="all">All Transaction Types</option>
            <option value="Booking Advance">Booking Advance</option>
            <option value="Balance Settlement">Balance Settlement</option>
            <option value="Service Charge">Service Charge</option>
            <option value="Refund">Refund</option>
            <option value="Maintenance Expense">Maintenance Expense</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-full border border-gold/30 bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none"
          >
            <option value="all">All Payment Modes</option>
            <option value="Cash">Cash</option>
            <option value="UPI / QR">UPI / QR</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>

        <div className="text-xs text-[#64748b]">
          Showing <strong>{filteredTransactions.length}</strong> transactions
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-gold/30 bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#061830]">
            <thead>
              <tr className="border-b border-gold/20 bg-[#FAF7F2] text-[11px] uppercase tracking-wider text-gold font-semibold">
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Folio / Guest</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/15">
              {filteredTransactions.map((t) => {
                const isDebit = t.type === "Refund" || t.type === "Maintenance Expense";

                return (
                  <tr key={t.id} className="hover:bg-gold/5 transition">
                    <td className="py-3.5 px-4 font-bold text-[#061830]">{t.id}</td>
                    <td className="py-3.5 px-4 text-[#64748b]">{t.date}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          isDebit
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#061830]">{t.guestName || "General Ledger"}</div>
                      {t.bookingId && <div className="text-[10px] text-gold font-semibold">#{t.bookingId}</div>}
                    </td>
                    <td className="py-3.5 px-4 font-medium">{t.method}</td>
                    <td className="py-3.5 px-4 text-[#64748b] max-w-xs truncate">{t.description}</td>
                    <td className="py-3.5 px-4 text-right font-display text-sm font-bold">
                      <span className={isDebit ? "text-rose-600" : "text-emerald-700"}>
                        {isDebit ? "-" : "+"}{formatINR(t.amount)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Transaction Modal */}
      {recordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-gold/30 bg-white p-6 shadow-lift text-[#061830] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gold/15 pb-3">
              <h2 className="font-display text-lg font-bold">Record Ledger Transaction</h2>
              <button
                type="button"
                onClick={() => setRecordModalOpen(false)}
                className="rounded-full p-1 hover:bg-slate-100 text-[#64748b]"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleRecordTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830]"
                  >
                    <option value="Balance Settlement">Balance Settlement</option>
                    <option value="Booking Advance">Booking Advance</option>
                    <option value="Service Charge">Service Charge</option>
                    <option value="Refund">Guest Refund</option>
                    <option value="Maintenance Expense">Maintenance Expense</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830]"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI / QR">UPI / QR</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Booking Ref (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BK-2026-901"
                    value={formBookingId}
                    onChange={(e) => setFormBookingId(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Guest Name / Payee
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. A. K. Verma"
                  value={formGuestName}
                  onChange={(e) => setFormGuestName(e.target.value)}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Description / Audit Memo
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes regarding transaction..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setRecordModalOpen(false)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-[#64748b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gold-gradient px-5 py-2 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110"
                >
                  Post Transaction
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
