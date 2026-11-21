import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BedDouble, LogOut, FileText, AlertTriangle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, FilterChips, Panel } from "@/components/dashboard/ui.jsx";
import { BookingDialog } from "@/components/dashboard/BookingDialog.jsx";
import { PaymentBadge } from "@/components/site/StatusBadge.jsx";
import { formatDate, formatINR, todayISO } from "@/lib/hotel/pricing.js";
import { checkOutBooking, getCategory, useHotelState } from "@/lib/hotel/store.jsx";

const VIEWS = ["Due today", "Overdue Only", "All in-house"];

export default function ReceptionCheckOut() {
  const state = useHotelState();
  const today = todayISO();
  const [view, setView] = useState("Due today");
  const [inspectBooking, setInspectBooking] = useState(null);

  const list = state.bookings
    .filter((b) => b.status === "Checked-In")
    .filter((b) => {
      if (view === "Due today") return b.checkOut <= today;
      if (view === "Overdue Only") return b.checkOut < today;
      return true;
    })
    .sort((a, b) => a.checkOut.localeCompare(b.checkOut));

  const overdueCount = state.bookings.filter(
    (b) => b.status === "Checked-In" && b.checkOut < today
  ).length;

  return (
    <>
      <Panel
      title="Departures &amp; Express Check-Out Desk"
      subtitle="Settle outstanding folios and check out guests (automatically transitions room to cleaning)"
      action={
        <div className="flex flex-wrap items-center gap-3">
          {overdueCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-rose-950/40 border border-rose-500/40 px-3 py-1 text-xs font-semibold text-rose-300">
              <AlertTriangle className="size-3.5 text-rose-400" /> {overdueCount} Overdue
            </span>
          )}
          <FilterChips options={VIEWS} value={view} onChange={setView} />
        </div>
      }
    >
      {list.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="No pending departures"
          text={
            view === "Overdue Only"
              ? "Great! There are no overdue departures currently in-house."
              : view === "Due today"
              ? "All guests due today have already been checked out."
              : "No checked-in guests currently in the hotel."
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-xs">
            <thead className="border-b border-gold/15 text-gold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Room</th>
                <th className="py-3 px-3">Guest Name</th>
                <th className="py-3 px-3">Scheduled Departure</th>
                <th className="py-3 px-3">Total Folio</th>
                <th className="py-3 px-3">Balance Due</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3 text-right">Desk Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10 text-navy-foreground/80">
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
                      className={`hover:bg-white/5 transition ${
                        late ? "bg-rose-950/10" : ""
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span className="rounded-lg bg-navy px-3 py-1.5 font-display text-base font-semibold text-gold border border-gold/30">
                          {b.roomNumber ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => setInspectBooking(b)}
                          className="font-semibold text-navy-foreground hover:text-gold transition text-left cursor-pointer"
                        >
                          {b.guestName}
                        </button>
                        <p className="text-[11px] text-navy-foreground/50">
                          {getCategory(state, b.categoryId)?.name} · ID {b.id}
                        </p>
                      </td>
                      <td
                        className={`py-3 px-3 ${
                          late ? "text-rose-400 font-semibold" : "text-navy-foreground/70"
                        }`}
                      >
                        {formatDate(b.checkOut)}
                        {late && (
                          <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-rose-400 mt-0.5">
                            <AlertTriangle className="size-3" /> Overdue
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-navy-foreground">
                        {formatINR(b.total)}
                      </td>
                      <td
                        className={`py-3 px-3 font-bold ${
                          bal > 0 ? "text-amber-400 font-mono text-sm" : "text-emerald-400"
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
                            className="inline-flex items-center gap-1 rounded-lg border border-gold/30 px-2.5 py-1.5 text-[11px] text-champagne hover:bg-white/5 transition"
                            title="Tax Invoice"
                          >
                            <FileText className="size-3 text-gold" /> Invoice
                          </Link>

                          <button
                            onClick={() => {
                              checkOutBooking(b.id);
                              toast.success(
                                `${b.guestName} checked out · Room ${b.roomNumber} sent to Cleaning 🧹`
                              );
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 py-1.5 text-xs font-semibold uppercase text-gold-foreground hover:brightness-110 transition shadow-gold cursor-pointer"
                          >
                            <LogOut className="size-3.5" />{" "}
                            {bal > 0 ? "Settle & Check Out" : "Check Out"}
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

    {inspectBooking && (
      <BookingDialog
        booking={inspectBooking}
        onClose={() => setInspectBooking(null)}
      />
    )}
  </>
  );
}
