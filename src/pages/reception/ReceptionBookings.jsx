import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  Pencil,
  SearchX,
  XCircle,
  Search,
  Download,
  LogIn,
  LogOut,
  MessageCircle,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { BookingDialog } from "@/components/dashboard/BookingDialog.jsx";
import { EmptyState, FilterChips, Panel } from "@/components/dashboard/ui.jsx";
import { StatusBadge, PaymentBadge } from "@/components/site/StatusBadge.jsx";
import { formatDate, formatINR, todayISO } from "@/lib/hotel/pricing.js";
import {
  getCategory,
  setBookingStatus,
  checkInBooking,
  checkOutBooking,
  freeRoomsFor,
  useHotelState,
} from "@/lib/hotel/store.jsx";

const FILTERS = [
  "All",
  "Due Today",
  "In-House",
  "Confirmed",
  "Pending",
  "Unpaid Balance",
  "Checked-Out",
  "Cancelled",
];
const PAGE = 15;

export default function ReceptionBookings() {
  const state = useHotelState();
  const today = todayISO();
  const [q, setQ] = useState("");
  const [f, setF] = useState("All");
  const [edit, setEdit] = useState(null);
  const [limit, setLimit] = useState(PAGE);

  const term = q.trim().toLowerCase();
  const digits = term.replace(/\D/g, "");

  const list = [...state.bookings]
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn))
    .filter((b) => {
      if (f === "All") return true;
      if (f === "Due Today")
        return (
          (b.checkIn === today && (b.status === "Confirmed" || b.status === "Pending")) ||
          (b.checkOut === today && b.status === "Checked-In")
        );
      if (f === "In-House") return b.status === "Checked-In";
      if (f === "Unpaid Balance")
        return b.status !== "Cancelled" && b.total - b.amountPaid > 0;
      return b.status === f;
    })
    .filter(
      (b) =>
        !term ||
        b.guestName.toLowerCase().includes(term) ||
        b.id.toLowerCase().includes(term) ||
        (b.roomNumber && b.roomNumber.toLowerCase().includes(term)) ||
        (digits.length >= 3 && b.phone.replace(/\D/g, "").includes(digits))
    );

  // Quick Check-in action from row
  const handleQuickCheckIn = (b) => {
    const free = freeRoomsFor(state, b.categoryId);
    const room = b.roomNumber || free[0];
    if (room) {
      checkInBooking(b.id, room);
      toast.success(`${b.guestName} checked into Room ${room}!`);
    } else {
      toast.error("No free room available in this category.");
      setEdit(b);
    }
  };

  // Quick Check-out action from row
  const handleQuickCheckOut = (b) => {
    const bal = Math.max(0, b.total - b.amountPaid);
    checkOutBooking(b.id);
    toast.success(
      `${b.guestName} checked out successfully${bal > 0 ? ` · ${formatINR(bal)} settled` : ""}`
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Booking ID",
      "Guest Name",
      "Phone",
      "Email",
      "Category",
      "Room",
      "Check-In",
      "Check-Out",
      "Status",
      "Payment",
      "Total",
      "Paid",
      "Source",
    ];
    const rows = list.map((b) => [
      b.id,
      `"${b.guestName}"`,
      `"${b.phone}"`,
      `"${b.email}"`,
      getCategory(state, b.categoryId)?.name || b.categoryId,
      b.roomNumber || "Unassigned",
      b.checkIn,
      b.checkOut,
      b.status,
      b.payment,
      b.total,
      b.amountPaid,
      b.source,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hotel_meri_bookings_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${list.length} bookings to CSV`);
  };

  return (
    <>
      <Panel
        title="Reservations & Bookings Hub"
        subtitle={`${list.length} of ${state.bookings.length} reservations matching filters`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gold/40 bg-navy px-3.5 py-2 text-xs font-semibold text-champagne hover:bg-gold hover:text-gold-foreground transition shadow-md cursor-pointer"
              title="Download CSV"
            >
              <Download className="size-3.5" /> Export CSV
            </button>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gold/60" />
              <input
                type="text"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setLimit(PAGE);
                }}
                placeholder="Search guest, phone or ID..."
                className="w-full rounded-xl border border-gold/30 bg-navy-deep pl-9 pr-3 py-2 text-xs text-navy-foreground placeholder:text-navy-foreground/40 focus:border-gold focus:outline-none"
              />
            </div>
          </div>
        }
      >
        <div className="mb-4">
          <FilterChips
            options={FILTERS}
            value={f}
            onChange={(v) => {
              setF(v);
              setLimit(PAGE);
            }}
          />
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No reservations found"
            text="Try adjusting your search criteria or filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-xs">
              <thead className="border-b border-gold/15 text-gold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Booking ID</th>
                  <th className="py-3 px-3">Guest</th>
                  <th className="py-3 px-3">Room Category</th>
                  <th className="py-3 px-3">Stay Dates</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Folio Total</th>
                  <th className="py-3 px-3 text-right">Desk Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10 text-navy-foreground/80">
                <AnimatePresence initial={false}>
                  {list.slice(0, limit).map((b) => {
                    const bal = Math.max(0, b.total - b.amountPaid);
                    const cleanPhone = b.phone.replace(/\D/g, "");
                    const waPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
                    const waMsg = encodeURIComponent(
                      `Hello ${b.guestName}, this is Hotel Meri & Residency regarding your reservation ${b.id}.`
                    );

                    return (
                      <tr key={b.id} className="hover:bg-white/5 transition">
                        <td className="py-3 px-3">
                          <span className="font-semibold text-navy-foreground">{b.id}</span>
                          <span className="block text-[10px] text-gold uppercase font-mono">
                            {b.source}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-medium text-navy-foreground">{b.guestName}</p>
                          <div className="flex items-center gap-2 text-[11px] text-navy-foreground/60">
                            <span>{b.phone}</span>
                            <a
                              href={`https://wa.me/${waPhone}?text=${waMsg}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:text-emerald-300"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="size-3" />
                            </a>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-medium text-navy-foreground">
                            {getCategory(state, b.categoryId)?.name || "Room"}
                          </p>
                          <p className="text-[11px] text-gold">
                            {b.roomNumber ? `Room ${b.roomNumber}` : "Unassigned"}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-navy-foreground/70">
                          <div>
                            {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                          </div>
                          {b.checkIn === today && b.status !== "Checked-In" && (
                            <span className="inline-block mt-0.5 rounded bg-emerald-950/40 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300 border border-emerald-500/30 uppercase">
                              Arriving Today
                            </span>
                          )}
                          {b.checkOut === today && b.status === "Checked-In" && (
                            <span className="inline-block mt-0.5 rounded bg-amber-950/40 px-1.5 py-0.2 text-[9px] font-bold text-amber-300 border border-amber-500/30 uppercase">
                              Departing Today
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="py-3 px-3">
                          <PaymentBadge payment={b.payment} />
                          {bal > 0 && b.status !== "Cancelled" && (
                            <span className="block text-[10px] text-amber-400 font-mono mt-0.5">
                              Due: {formatINR(bal)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-navy-foreground">
                          {formatINR(b.total)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Fast row actions */}
                            {(b.status === "Confirmed" || b.status === "Pending") && (
                              <button
                                onClick={() => handleQuickCheckIn(b)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white transition shadow-sm"
                                title="Express Check In"
                              >
                                <LogIn className="size-3" /> Check In
                              </button>
                            )}

                            {b.status === "Checked-In" && (
                              <button
                                onClick={() => handleQuickCheckOut(b)}
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-700/80 hover:bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white transition shadow-sm"
                                title="Express Check Out"
                              >
                                <LogOut className="size-3" /> Check Out
                              </button>
                            )}

                            <button
                              onClick={() => setEdit(b)}
                              className="rounded-lg border border-gold/30 p-1.5 text-champagne hover:bg-white/10 transition"
                              title="View & Edit Booking Details"
                            >
                              <Pencil className="size-3.5" />
                            </button>

                            <Link
                              to={`/invoice/${b.id}`}
                              className="rounded-lg border border-gold/30 p-1.5 text-champagne hover:bg-white/10 transition"
                              title="Tax Invoice"
                            >
                              <FileText className="size-3.5" />
                            </Link>

                            {(b.status === "Pending" || b.status === "Confirmed") && (
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Cancel reservation ${b.id} for ${b.guestName}?`
                                    )
                                  ) {
                                    setBookingStatus(b.id, "Cancelled");
                                    toast.success(`Booking ${b.id} cancelled`);
                                  }
                                }}
                                className="rounded-lg border border-rose-500/30 p-1.5 text-rose-400 hover:bg-rose-500/10 transition"
                                title="Cancel Booking"
                              >
                                <XCircle className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {list.length > limit && (
          <div className="mt-5 text-center">
            <button
              onClick={() => setLimit((l) => l + PAGE)}
              className="rounded-full border border-gold/30 px-6 py-2 text-xs font-semibold uppercase tracking-wider text-champagne hover:bg-white/5 transition cursor-pointer"
            >
              Show More ({list.length - limit} remaining)
            </button>
          </div>
        )}
      </Panel>

      {edit && <BookingDialog booking={edit} onClose={() => setEdit(null)} />}
    </>
  );
}
