import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Bed, FileText, ArrowRight } from "lucide-react";
import { formatINR, formatDate } from "@/lib/hotel/pricing.js";
import { useHotelState, getCategory } from "@/lib/hotel/store.jsx";
import { StatusBadge, PaymentBadge } from "@/components/site/StatusBadge.jsx";

export function GuestBookingCard({ booking, onInspect }) {
  const state = useHotelState();
  // Get live booking reference so state changes (room assignment, checkin, payments) update instantly
  const live = state.bookings.find((b) => b.id === booking.id) || booking;
  const cat = getCategory(state, live.categoryId);
  const balance = Math.max(0, live.total - live.amountPaid);

  return (
    <div className="overflow-hidden rounded-2xl border border-gold/25 bg-navy shadow-lift transition hover:border-gold/50 flex flex-col md:flex-row">
      <div className="md:w-56 aspect-[16/10] md:aspect-auto overflow-hidden shrink-0">
        <img src={cat.image} alt={cat.name} className="size-full object-cover" />
      </div>

      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-xl font-semibold text-navy-foreground">{cat.name}</h3>
              <p className="mt-0.5 text-xs text-gold flex items-center gap-2">
                <span>Booking ID: <strong className="font-mono">{live.id}</strong></span>
                {live.roomNumber && (
                  <span className="rounded-full bg-emerald-950/40 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    Room {live.roomNumber}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={live.status} />
              <PaymentBadge payment={live.payment} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-navy-foreground/75">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-navy-foreground/50">Check-In</p>
              <p className="font-semibold text-navy-foreground mt-0.5">{formatDate(live.checkIn)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-navy-foreground/50">Check-Out</p>
              <p className="font-semibold text-navy-foreground mt-0.5">{formatDate(live.checkOut)}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[11px] uppercase tracking-wider text-navy-foreground/50">Assigned Room</p>
              <p className="font-semibold text-champagne mt-0.5">
                {live.roomNumber ? `Room ${live.roomNumber}` : "Assigned at check-in"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gold/15">
          <div>
            <p className="text-[10px] uppercase text-navy-foreground/50">Total Folio</p>
            <p className="font-display text-lg font-semibold text-navy-foreground">
              {formatINR(live.total)}
              {balance > 0 && (
                <span className="ml-2 text-xs font-sans text-amber-400 font-normal">
                  (Due: {formatINR(balance)})
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/invoice/${live.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 px-3 py-1.5 text-xs text-champagne hover:bg-white/5 transition"
            >
              <FileText className="size-3.5" /> Invoice
            </Link>
            <button
              onClick={() => onInspect?.(live)}
              className="inline-flex items-center gap-1 rounded-lg bg-gold-gradient px-3.5 py-1.5 text-xs font-semibold text-gold-foreground uppercase hover:brightness-110 transition cursor-pointer"
            >
              Manage Stay <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
