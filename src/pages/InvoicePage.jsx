import React from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { LogoMark } from "@/components/site/Logo.jsx";
import { useHotelState, getCategory } from "@/lib/hotel/store.jsx";
import { formatINR, formatDate, nightsBetween } from "@/lib/hotel/pricing.js";
import { StatusBadge, PaymentBadge } from "@/components/site/StatusBadge.jsx";

export default function InvoicePage() {
  const { bookingId } = useParams();
  const state = useHotelState();
  const b = state.bookings.find((x) => x.id === bookingId);

  const backLink = state.session?.role === "reception"
    ? "/reception/bookings"
    : state.session
    ? "/account/bookings"
    : "/";

  if (!b) {
    return (
      <div className="min-h-screen bg-navy-deep flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="font-display text-4xl text-navy-foreground">Booking Not Found</h1>
          <p className="mt-2 text-sm text-navy-foreground/60">We could not find booking {bookingId}.</p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-gold-gradient px-6 py-2.5 text-xs font-semibold uppercase text-gold-foreground"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const cat = getCategory(state, b.categoryId);
  const nights = nightsBetween(b.checkIn, b.checkOut);
  const subtotal = cat.price * nights * b.rooms;
  const tax = b.total - subtotal;
  const balance = Math.max(0, b.total - b.amountPaid);

  return (
    <div className="min-h-screen bg-navy-deep px-4 py-10 print:bg-white print:p-0">
      {/* Action Bar (hidden when printing) */}
      <div className="mx-auto mb-6 flex max-w-3xl justify-between print:hidden">
        <Link
          to={backLink}
          className="inline-flex items-center gap-2 rounded-lg border border-gold/30 px-4 py-2 text-xs uppercase text-champagne hover:bg-white/5"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-gold-gradient px-4 py-2 text-xs font-semibold uppercase text-gold-foreground shadow-gold"
        >
          <Printer className="size-4" /> Download / Print Invoice
        </button>
      </div>

      {/* Invoice Card */}
      <article className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-gold/25 bg-navy shadow-2xl print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 bg-navy-deep p-8 border-b border-gold/20 print:bg-white print:border-b-2 print:border-black">
          <div className="flex items-center gap-4">
            <LogoMark className="size-16" />
            <div>
              <p className="font-display text-2xl font-semibold tracking-wide text-navy-foreground print:text-black">
                HOTEL MERI &amp; RESIDENCY
              </p>
              <p className="text-xs text-navy-foreground/60 print:text-gray-600">{state.settings.address}</p>
              <p className="text-xs text-navy-foreground/60 print:text-gray-600">Tel: {state.settings.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="eyebrow text-gold print:text-gray-800">TAX INVOICE</p>
            <p className="font-mono text-xl font-bold text-champagne print:text-black">{b.id}</p>
            <p className="text-xs text-navy-foreground/50 print:text-gray-500">Date: {formatDate(b.createdAt)}</p>
          </div>
        </header>

        {/* Guest & Stay Meta */}
        <div className="grid gap-6 p-8 sm:grid-cols-2 border-b border-gold/15 print:border-gray-300">
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gold font-semibold mb-2 print:text-black">
              Billed To
            </h4>
            <p className="font-semibold text-base text-navy-foreground print:text-black">{b.guestName}</p>
            <p className="text-xs text-navy-foreground/70 print:text-gray-600">{b.email}</p>
            <p className="text-xs text-navy-foreground/70 print:text-gray-600">{b.phone}</p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-gold font-semibold mb-2 print:text-black">
              Reservation Details
            </h4>
            <p className="text-xs text-navy-foreground/80 print:text-gray-700">
              <strong>Check-in:</strong> {formatDate(b.checkIn)} (14:00)
            </p>
            <p className="text-xs text-navy-foreground/80 print:text-gray-700">
              <strong>Check-out:</strong> {formatDate(b.checkOut)} (11:00)
            </p>
            <p className="text-xs text-navy-foreground/80 print:text-gray-700">
              <strong>Assigned Room:</strong> {b.roomNumber || "Pending Room Allocation"}
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="p-8">
          <table className="w-full text-left text-sm print:text-black">
            <thead>
              <tr className="border-b border-gold/20 text-xs uppercase text-gold print:text-black">
                <th className="py-3">Description</th>
                <th className="py-3 text-center">Nights</th>
                <th className="py-3 text-center">Rooms</th>
                <th className="py-3 text-right">Rate</th>
                <th className="py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10 print:divide-gray-200">
              <tr>
                <td className="py-4">
                  <p className="font-semibold text-navy-foreground print:text-black">{cat.name}</p>
                  <p className="text-xs text-navy-foreground/60 print:text-gray-500">{cat.bed} • {cat.tagline}</p>
                </td>
                <td className="py-4 text-center">{nights}</td>
                <td className="py-4 text-center">{b.rooms}</td>
                <td className="py-4 text-right">{formatINR(cat.price)}</td>
                <td className="py-4 text-right font-medium">{formatINR(subtotal)}</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm border-t border-gold/20 pt-4 print:border-gray-300">
              <div className="flex justify-between text-navy-foreground/75 print:text-gray-600">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-navy-foreground/75 print:text-gray-600">
                <span>GST / Luxury Tax (12%)</span>
                <span>{formatINR(tax)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base text-navy-foreground border-t border-gold/15 pt-2 print:text-black">
                <span>Total Due</span>
                <span className="font-display text-xl text-gold print:text-black">{formatINR(b.total)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 print:text-gray-700">
                <span>Amount Paid</span>
                <span>{formatINR(b.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-bold text-amber-300 print:text-black border-t border-gold/15 pt-2">
                <span>Balance Due</span>
                <span>{formatINR(balance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gold/15 bg-navy-deep/60 p-6 text-center text-xs text-navy-foreground/50 print:bg-white print:text-gray-500">
          Thank you for choosing Hotel Meri &amp; Residency. We look forward to serving you again!
        </footer>
      </article>
    </div>
  );
}
