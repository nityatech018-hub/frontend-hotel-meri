import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, FileText, IndianRupee, Wallet } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, Panel, StatCard } from "@/components/dashboard/ui.jsx";
import { PaymentBadge } from "@/components/site/StatusBadge.jsx";
import { formatDate, formatINR } from "@/lib/hotel/pricing.js";
import { getCategory, recordPayment, useHotelState } from "@/lib/hotel/store.jsx";

export default function AccountPayments() {
  const state = useHotelState();
  const sessionEmail = state.session?.email?.toLowerCase().trim() || "";
  const mine = state.bookings
    .filter((b) => b.email?.toLowerCase().trim() === sessionEmail)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const live = mine.filter((b) => b.status !== "Cancelled");
  const paid = live.reduce((n, b) => n + b.amountPaid, 0);
  const due = live.reduce((n, b) => n + Math.max(0, b.total - b.amountPaid), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Wallet}
          label="Total paid"
          value={`₹${paid.toLocaleString("en-IN")}`}
          tone="emerald"
        />
        <StatCard
          icon={IndianRupee}
          label="Balance due"
          value={`₹${due.toLocaleString("en-IN")}`}
          tone="gold"
        />
        <StatCard
          icon={CreditCard}
          label="Transactions"
          value={mine.length}
          tone="default"
        />
      </div>

      <Panel
        title="Payment Records"
        subtitle="Guest payment ledger & transaction history"
      >
        {mine.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payment records found" text="Your stay transactions and folio receipts will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="border-b border-gold/20 text-gold uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-3">Booking ID</th>
                  <th className="py-3 px-3">Stay Dates</th>
                  <th className="py-3 px-3">Total</th>
                  <th className="py-3 px-3">Paid</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/15 text-[#061830]">
                {mine.map((b) => {
                  const balance = Math.max(0, b.total - b.amountPaid);
                  const cat = getCategory(state, b.categoryId);
                  return (
                    <tr key={b.id} className="hover:bg-gold/5 transition">
                      <td className="py-3 px-3">
                        <p className="font-bold text-[#061830]">{b.id}</p>
                        <p className="text-[11px] text-[#64748b]">{cat?.name}</p>
                      </td>
                      <td className="py-3 px-3 text-[#475569]">
                        {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#061830]">{formatINR(b.total)}</td>
                      <td className="py-3 px-3 text-emerald-700 font-semibold">{formatINR(b.amountPaid)}</td>
                      <td className="py-3 px-3">
                        <PaymentBadge payment={b.payment} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {balance > 0 && b.status !== "Cancelled" && (
                            <button
                              onClick={() => {
                                recordPayment(b.id, balance);
                                toast.success(`Payment of ${formatINR(balance)} recorded!`);
                              }}
                              className="rounded-full bg-gold-gradient px-3.5 py-1 text-[11px] font-bold text-gold-foreground uppercase hover:brightness-110 shadow-sm transition cursor-pointer"
                            >
                              Pay {formatINR(balance)}
                            </button>
                          )}
                          {b.status !== "Cancelled" && (
                            <Link
                              to={`/invoice/${b.id}`}
                              className="rounded-full border border-gold/30 bg-[#FAF7F2] p-1.5 text-[#061830] hover:bg-gold/15 transition"
                              title={
                                b.status === "Checked-Out"
                                  ? "Download / Print Tax Invoice"
                                  : b.status === "Checked-In"
                                  ? "View Interim Folio"
                                  : "View Proforma Receipt"
                              }
                            >
                              <FileText className="size-3.5 text-gold" />
                            </Link>
                          )}
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
    </div>
  );
}
