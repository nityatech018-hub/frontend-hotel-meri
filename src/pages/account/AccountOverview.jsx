import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BedDouble,
  CalendarCheck,
  Crown,
  IndianRupee,
  LifeBuoy,
  Moon,
  Sparkles,
} from "lucide-react";
import { GuestBookingCard } from "@/components/dashboard/GuestBookingCard.jsx";
import { EmptyState, Panel, StatCard } from "@/components/dashboard/ui.jsx";
import { IMG } from "@/lib/hotel/images.js";
import { formatDate, nightsBetween, todayISO } from "@/lib/hotel/pricing.js";
import { getCategory, useHotelState } from "@/lib/hotel/store.jsx";

export default function AccountOverview() {
  const state = useHotelState();
  const session = state.session || { name: "Guest", email: "" };
  const mine = state.bookings.filter(
    (b) => b.email?.toLowerCase().trim() === (session.email || "").toLowerCase().trim()
  );
  const upcoming = mine
    .filter((b) => ["Pending", "Confirmed", "Checked-In"].includes(b.status) && b.checkOut >= todayISO)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  const stayed = mine.filter((b) => b.status === "Checked-Out");
  const nights = stayed.reduce((n, b) => n + nightsBetween(b.checkIn, b.checkOut), 0);
  const spent = mine.filter((b) => b.status !== "Cancelled").reduce((n, b) => n + b.amountPaid, 0);
  const next = upcoming[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl bg-[#061830] p-7 text-white shadow-lift md:p-10 border border-gold/30"
      >
        <motion.img
          src={IMG.pool}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25"
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 3 }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061830] via-[#061830]/85 to-transparent" />
        <div className="relative max-w-xl">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-gold uppercase">
            <Sparkles className="size-3.5" /> {greet}
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-5xl font-normal text-white">
            Welcome, <em className="italic text-gold">{session.name.split(" ")[0]}</em>
          </h2>
          <p className="mt-3 text-sm text-white/80 leading-relaxed">
            {next
              ? next.status === "Checked-In"
                ? `You're currently staying with us until ${formatDate(next.checkOut)}. Enjoy every moment.`
                : `Your next stay begins ${formatDate(next.checkIn)} — ${getCategory(state, next.categoryId)?.name || "Room"}.`
              : "No upcoming stays yet. Plan your next royal escape with Hotel Meri."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/rooms"
              className="rounded-full bg-gold-gradient px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gold-foreground shadow-gold hover:brightness-110 transition"
            >
              Book a Room
            </Link>
            <Link
              to="/account/bookings"
              className="rounded-full border border-gold/40 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-champagne hover:bg-white/10 transition"
            >
              My Bookings
            </Link>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          icon={CalendarCheck}
          label="Upcoming stays"
          value={upcoming.length}
          tone="gold"
        />
        <StatCard icon={Moon} label="Nights stayed" value={nights} tone="default" />
        <StatCard
          icon={IndianRupee}
          label="Total paid"
          value={`₹${spent.toLocaleString("en-IN")}`}
          tone="emerald"
        />
        <StatCard
          icon={Crown}
          label="Royal points"
          value={Math.floor(spent / 100)}
          hint="1 point per ₹100"
          tone="gold"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="Upcoming reservations"
          subtitle="Check-in dates, room and status"
          className="xl:col-span-2"
          action={
            <Link
              to="/account/bookings"
              className="flex items-center gap-1 text-xs font-medium text-gold hover:underline"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          }
        >
          {upcoming.length === 0 ? (
            <EmptyState
              icon={BedDouble}
              title="No upcoming stays"
              text="Your future reservations will appear here."
              action={
                <Link
                  to="/account/book"
                  className="inline-flex rounded-full bg-gold-gradient px-5 py-2 text-xs font-semibold uppercase text-gold-foreground"
                >
                  Find a room
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {upcoming.slice(0, 3).map((b) => (
                <GuestBookingCard key={b.id} booking={b} />
              ))}
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Quick actions">
            <div className="grid gap-2.5">
              {[
                { to: "/account/book", label: "Search & book rooms", icon: BedDouble },
                { to: "/account/payments", label: "View payment status", icon: IndianRupee },
                { to: "/account/support", label: "Contact reception", icon: LifeBuoy },
              ].map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  className="group flex items-center gap-3 rounded-xl border border-gold/20 bg-[#FAF7F2] p-3.5 transition hover:border-gold hover:bg-gold/10"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-white border border-gold/30 text-gold transition group-hover:rotate-6 shadow-sm">
                    <a.icon className="size-4" />
                  </span>
                  <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-[#061830]">
                    {a.label}
                  </span>
                  <ArrowRight className="size-4 text-[#64748b] transition group-hover:translate-x-1 group-hover:text-gold" />
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="Hotel Timings">
            <dl className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-gold/15 pb-2">
                <dt className="text-[#64748b]">Check-in</dt>
                <dd className="font-semibold text-[#061830]">{state.settings?.checkInTime || "12:00 PM"}</dd>
              </div>
              <div className="flex justify-between border-b border-gold/15 pb-2">
                <dt className="text-[#64748b]">Check-out</dt>
                <dd className="font-semibold text-[#061830]">{state.settings?.checkOutTime || "11:00 AM"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#64748b]">Front Desk</dt>
                <dd className="font-semibold text-[#061830]">24 Hours</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
