import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, FileText, IndianRupee, Receipt, SearchX, Search, Wallet } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, FilterChips, Panel, StatCard } from "@/components/dashboard/ui.jsx";
import { BookingDialog } from "@/components/dashboard/BookingDialog.jsx";
import { PaymentBadge, StatusBadge } from "@/components/site/StatusBadge.jsx";
import { formatDate, formatINR } from "@/lib/hotel/pricing.js";
import { recordPayment, useHotelState } from "@/lib/hotel/store.jsx";

const FILTERS = ["All", "Paid", "Partial", "Unpaid", "Refunded"];

export default function ReceptionPayments() {
  const state = useHotelState();
  const [f, setF] = useState("All");
  const [q, setQ] = useState("");
  const [inspectBooking, setInspectBooking] = useState(null);

  const live = state.bookings.filter((b) => b.status !== "Cancelled");
  const collected = live.reduce((n, b) => n + b.amountPaid, 0);
  const due = live.reduce((n, b) => n + Math.max(0, b.total - b.amountPaid), 0);
  const refunded = state.bookings.filter((b) => b.payment === "Refunded").length;

  const term = q.trim().toLowerCase();
  const digits = term.replace(/\D/g, "");
  const list = [...state.bookings]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .filter((b) => f === "All" || b.payment === f)
    .filter(
      (b) =>
        !term ||
        b.guestName.toLowerCase().includes(term) ||
        b.id.toLowerCase().includes(term) ||
        (b.roomNumber && b.roomNumber.toLowerCase().includes(term)) ||
        (digits.length >= 3 && b.phone.replace(/\D/g, "").includes(digits))
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Total Collected"
          value={`₹${collected.toLocaleString("en-IN")}`}
          tone="emerald"
        />
        <StatCard
          icon={AlertCircle}
          label="Outstanding Due"
          value={`₹${due.toLocaleString("en-IN")}`}
          tone="gold"
        />
        <StatCard
          icon={IndianRupee}
          label="Unpaid Folios"
          value={live.filter((b) => b.payment === "Unpaid").length}
          tone="default"
        />
        <StatCard
          icon={Receipt}
          label="Refunds Handled"
          value={refunded}
          tone="default"
        />
      </div>

      <Panel
        title="Payment &amp; Folio Records"
        subtitle="Complete hotel revenue transactions and payment records"
        action={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gold/60" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search guest or booking ID..."
              className="w-full rounded-xl border border-gold/30 bg-navy-deep pl-9 pr-3 py-2 text-xs text-navy-foreground placeholder:text-navy-foreground/40 focus:border-gold focus:outline-none"
            />
          </div>
        }
      >
        <div className="mb-4">
          <FilterChips options={FILTERS} value={f} onChange={setF} />
        </div>

        {list.length === 0 ? (
          <EmptyState icon={SearchX} title="No payment records match" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead className="border-b border-gold/15 text-gold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Booking ID</th>
                  <th className="py-3 px-3">Guest Name</th>
                  <th className="py-3 px-3">Booking Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Total Folio</th>
                  <th className="py-3 px-3">Amount Paid</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10 text-navy-foreground/80">
                {list.slice(0, 40).map((b) => {
                  const bal = Math.max(0, b.total - b.amountPaid);
                  const pct = Math.min(100, Math.round((b.amountPaid / (b.total || 1)) * 100));

                  return (
                    <tr key={b.id} className="hover:bg-white/5 transition">
                      <td className="py-3 px-3 font-semibold text-navy-foreground">{b.id}</td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => setInspectBooking(b)}
                          className="font-medium text-navy-foreground hover:text-gold text-left transition-colors"
                          title="Click to view & edit booking details"
                        >
                          {b.guestName}
                        </button>
                        <p className="text-[11px] text-navy-foreground/50">
                          {b.roomNumber ? `Room ${b.roomNumber}` : "Unassigned"}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-navy-foreground/60">{formatDate(b.createdAt)}</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="py-3 px-3 font-semibold text-navy-foreground">{formatINR(b.total)}</td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-emerald-400">{formatINR(b.amountPaid)}</p>
                        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-navy-deep border border-gold/20">
                          <div
                            className="h-full bg-gold-gradient rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <PaymentBadge payment={b.payment} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {bal > 0 && b.status !== "Cancelled" && (
                            <button
                              onClick={() => {
                                recordPayment(b.id, bal);
                                toast.success(`Payment of ${formatINR(bal)} settled for ${b.id}`);
                              }}
                              className="rounded-full bg-gold-gradient px-3 py-1 text-[11px] font-semibold uppercase text-gold-foreground hover:brightness-110"
                            >
                              Settle {formatINR(bal)}
                            </button>
                          )}
                          <Link
                            to={`/invoice/${b.id}`}
                            className="rounded-lg border border-gold/30 p-1.5 text-champagne hover:bg-white/5"
                            title="Invoice"
                          >
                            <FileText className="size-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {inspectBooking && (
        <BookingDialog
          booking={inspectBooking}
          onClose={() => setInspectBooking(null)}
        />
      )}
    </div>
  );
}
