import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, SearchX, Search, X, FileText } from "lucide-react";
import { EmptyState, Panel } from "@/components/dashboard/ui.jsx";
import { StatusBadge } from "@/components/site/StatusBadge.jsx";
import { formatDate, formatINR } from "@/lib/hotel/pricing.js";
import { getCategory, useHotelState } from "@/lib/hotel/store.jsx";

export default function ReceptionGuests() {
  const state = useHotelState();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);

  const guests = useMemo(() => {
    const map = new Map();
    for (const b of state.bookings) {
      const key = b.email;
      const g = map.get(key) || {
        key,
        name: b.guestName,
        email: b.email,
        phone: b.phone,
        bookings: [],
        spent: 0,
        last: b.checkIn,
        inHouse: false,
      };
      g.bookings.push(b);
      if (b.status !== "Cancelled") g.spent += b.amountPaid;
      if (b.checkIn > g.last) g.last = b.checkIn;
      if (b.status === "Checked-In") g.inHouse = true;
      map.set(key, g);
    }
    return [...map.values()].sort((a, b) => b.last.localeCompare(a.last));
  }, [state.bookings]);

  const term = q.trim().toLowerCase();
  const list = guests.filter(
    (g) =>
      !term ||
      g.name.toLowerCase().includes(term) ||
      g.email.toLowerCase().includes(term) ||
      g.phone.includes(term)
  );

  return (
    <>
      <Panel
        title="Guest Directory"
        subtitle={`${guests.length} guest records · ${guests.filter((g) => g.inHouse).length} currently in house`}
        action={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gold/60" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, phone or email..."
              className="w-full rounded-xl border border-gold/30 bg-navy-deep pl-9 pr-3 py-2 text-xs text-navy-foreground placeholder:text-navy-foreground/40 focus:border-gold focus:outline-none"
            />
          </div>
        }
      >
        {list.length === 0 ? (
          <EmptyState icon={SearchX} title="No guest records found" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {list.map((g) => (
              <button
                key={g.key}
                onClick={() => setOpen(g)}
                className="flex items-center gap-4 rounded-xl border border-gold/20 bg-navy-deep/60 p-4 text-left transition hover:border-gold hover:bg-white/5"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-navy font-display text-lg font-semibold text-gold border border-gold/30">
                  {g.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-navy-foreground text-sm">{g.name}</p>
                    {g.inHouse && (
                      <span className="rounded-full bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        In House
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-navy-foreground/60 mt-0.5">{g.phone}</p>
                  <p className="text-xs text-champagne mt-1">
                    {g.bookings.length} booking{g.bookings.length > 1 ? "s" : ""} · {formatINR(g.spent)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Panel>

      {/* Guest Details Modal */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/80 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl rounded-2xl border border-gold/30 bg-navy p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-start justify-between border-b border-gold/15 pb-4">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-navy-foreground">
                    {open.name}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-xs text-navy-foreground/70 mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="size-3.5 text-gold" /> {open.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="size-3.5 text-gold" /> {open.email}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(null)}
                  className="rounded-lg p-1 text-navy-foreground/60 hover:text-navy-foreground"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-gold/15 bg-navy-deep/60 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                    Total Stays
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-navy-foreground">
                    {open.bookings.length}
                  </p>
                </div>
                <div className="rounded-xl border border-gold/15 bg-navy-deep/60 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                    Total Paid
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-emerald-400">
                    {formatINR(open.spent)}
                  </p>
                </div>
                <div className="rounded-xl border border-gold/15 bg-navy-deep/60 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                    Latest Visit
                  </p>
                  <p className="mt-1 font-display text-sm font-semibold text-navy-foreground">
                    {formatDate(open.last)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gold mb-3">
                  Reservation History
                </p>
                <ul className="max-h-60 space-y-2 overflow-y-auto pr-1">
                  {open.bookings
                    .sort((a, b) => b.checkIn.localeCompare(a.checkIn))
                    .map((b) => (
                      <li
                        key={b.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-gold/15 bg-navy-deep/40 p-3 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-navy-foreground">
                            {getCategory(state, b.categoryId)?.name}
                          </p>
                          <p className="text-[11px] text-navy-foreground/60">
                            {b.id} · {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={b.status} />
                          <Link
                            to={`/invoice/${b.id}`}
                            className="inline-flex items-center gap-1 text-[11px] text-gold hover:underline"
                          >
                            <FileText className="size-3" /> Invoice
                          </Link>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>

              <div className="text-right pt-2 border-t border-gold/15">
                <button
                  onClick={() => setOpen(null)}
                  className="rounded-full border border-gold/30 px-5 py-2 text-xs font-semibold uppercase text-champagne hover:bg-white/5"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
