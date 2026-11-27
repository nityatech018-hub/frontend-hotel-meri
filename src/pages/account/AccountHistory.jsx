import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, History } from "lucide-react";
import { EmptyState, FilterChips, Panel } from "@/components/dashboard/ui.jsx";
import { StatusBadge, PaymentBadge } from "@/components/site/StatusBadge.jsx";
import { formatDate, formatINR, nightsBetween, todayISO } from "@/lib/hotel/pricing.js";
import { getCategory, useHotelState } from "@/lib/hotel/store.jsx";

const FILTERS = ["All", "Checked-Out", "Cancelled"];

export default function AccountHistory() {
  const state = useHotelState();
  const [filter, setFilter] = useState("All");
  const today = todayISO();

  const sessionEmail = state.session?.email?.toLowerCase().trim() || "";
  const list = state.bookings
    .filter(
      (b) =>
        b.email?.toLowerCase().trim() === sessionEmail &&
        (b.status === "Checked-Out" || b.status === "Cancelled" || b.checkOut < today)
    )
    .filter((b) => filter === "All" || b.status === filter)
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn));

  return (
    <Panel
      title="Past Stays"
      subtitle="Completed and cancelled bookings"
      action={<FilterChips options={FILTERS} value={filter} onChange={setFilter} />}
    >
      {list.length === 0 ? (
        <EmptyState
          icon={History}
          title="No past stays"
          text="Once you have completed stays with us, your reservation history will appear here."
        />
      ) : (
        <div className="relative space-y-4 pl-6 before:absolute before:top-2 before:bottom-2 before:left-2 before:w-px before:bg-gold/30">
          {list.map((b) => {
            const cat = getCategory(state, b.categoryId);
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <span className="absolute top-5 -left-[1.35rem] size-2.5 rounded-full border-2 border-white bg-gold shadow-sm" />
                <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gold/25 bg-[#FAF7F2] p-4 transition hover:border-gold hover:bg-gold/10 text-[#061830]">
                  <img
                    src={cat?.image}
                    alt=""
                    className="size-16 rounded-lg object-cover border border-gold/20 shrink-0"
                  />
                  <div className="min-w-40 flex-1">
                    <p className="font-display text-lg font-bold text-[#061830]">
                      {cat?.name || "Room"}
                    </p>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      ID: <strong className="text-[#061830]">{b.id}</strong> · {formatDate(b.checkIn)} → {formatDate(b.checkOut)} ·{" "}
                      {nightsBetween(b.checkIn, b.checkOut)} nights
                      {b.roomNumber ? ` · Room ${b.roomNumber}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge status={b.status} />
                    <PaymentBadge payment={b.payment} />
                  </div>
                  <p className="w-24 text-right font-display text-lg font-bold text-[#061830]">
                    {formatINR(b.total)}
                  </p>
                  {b.status !== "Cancelled" && (
                    <Link
                      to={`/invoice/${b.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline"
                    >
                      <FileText className="size-3.5" />{" "}
                      {b.status === "Checked-Out"
                        ? "Tax Invoice"
                        : b.status === "Checked-In"
                        ? "Interim Folio"
                        : "Proforma"}
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
