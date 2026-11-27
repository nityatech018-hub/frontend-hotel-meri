import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Calendar,
  AlertTriangle,
  LogIn,
  LogOut,
  Sparkles,
  ArrowRight,
  CheckCheck,
  X,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import { useHotelState } from "@/lib/hotel/store.jsx";
import { todayISO, formatDate, formatINR } from "@/lib/hotel/pricing.js";

export function NotificationBell() {
  const state = useHotelState();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("meri_dismissed_alerts") || "[]");
    } catch {
      return [];
    }
  });

  const menuRef = useRef(null);
  const today = todayISO();

  // Close when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  // Compute live notifications
  const alerts = [];

  // 0. New Bookings Received Today (Highest Front Desk Visibility)
  const todayBookings = (state.bookings || []).filter(
    (b) => b.bookingDate === today || (b.createdAt && b.createdAt.startsWith(today))
  );

  todayBookings.forEach((b) => {
    alerts.push({
      id: `new-booking-${b.id}`,
      type: "new_booking",
      icon: Calendar,
      title: `New Reservation: ${b.guestName} (#${b.id})`,
      message: `${b.rooms || 1}x room (${b.categoryId?.toUpperCase() || "SUITE"}) · Stay: ${formatDate(b.checkIn)} to ${formatDate(b.checkOut)} · Booked at ${b.bookingTime || "Today"}`,
      link: `/reception/bookings?search=${b.id}`,
      actionText: "Review Booking",
      badge: "New Booking",
      time: b.bookingTime || "Today",
    });
  });

  // Explicit system notifications
  (state.notifications || []).forEach((n) => {
    if (!alerts.some((a) => a.id === n.id || a.id === `new-booking-${n.bookingId}`)) {
      alerts.push({
        id: n.id,
        type: n.type || "info",
        icon: Calendar,
        title: n.title,
        message: n.message,
        link: n.link || "/reception/bookings",
        actionText: "View",
        badge: "Alert",
        time: n.time || "Recent",
      });
    }
  });

  // 1. Overdue Departures (High Priority)
  const overdue = state.bookings.filter(
    (b) => b.status === "Checked-In" && b.checkOut < today
  );
  overdue.forEach((b) => {
    alerts.push({
      id: `overdue-${b.id}`,
      type: "urgent",
      icon: AlertTriangle,
      title: `Overdue Check-Out: Room ${b.roomNumber || "—"}`,
      message: `${b.guestName} was scheduled to check out on ${formatDate(b.checkOut)}. Folio: ${formatINR(b.total - b.amountPaid)}`,
      link: "/reception/check-out",
      actionText: "Settle & Check Out",
      badge: "Overdue",
    });
  });

  // 2. Today's Arrivals Due
  const dueArrivals = state.bookings.filter(
    (b) => (b.status === "Confirmed" || b.status === "Pending") && b.checkIn === today
  );
  if (dueArrivals.length > 0) {
    alerts.push({
      id: `arrivals-today-${today}`,
      type: "arrival",
      icon: LogIn,
      title: `${dueArrivals.length} Guest Arrival${dueArrivals.length > 1 ? "s" : ""} Due Today`,
      message: `${dueArrivals.map((b) => b.guestName.split(" ")[0]).slice(0, 3).join(", ")}${dueArrivals.length > 3 ? "..." : ""} ready for check-in.`,
      link: "/reception/check-in",
      actionText: "Open Check-In Queue",
      badge: "Arrivals",
    });
  }

  // 3. Today's Departures Due
  const dueDepartures = state.bookings.filter(
    (b) => b.status === "Checked-In" && b.checkOut === today
  );
  if (dueDepartures.length > 0) {
    alerts.push({
      id: `departures-today-${today}`,
      type: "departure",
      icon: LogOut,
      title: `${dueDepartures.length} Departure${dueDepartures.length > 1 ? "s" : ""} Scheduled Today`,
      message: `${dueDepartures.map((b) => `Room ${b.roomNumber || "?"}`).slice(0, 3).join(", ")}${dueDepartures.length > 3 ? "..." : ""}`,
      link: "/reception/check-out",
      actionText: "Process Departures",
      badge: "Departures",
    });
  }

  // 4. Housekeeping Cleaning / Maintenance
  const cleaningRooms = state.rooms.filter((r) => r.status === "cleaning");
  if (cleaningRooms.length > 0) {
    alerts.push({
      id: `cleaning-${cleaningRooms.length}`,
      type: "housekeeping",
      icon: Sparkles,
      title: `${cleaningRooms.length} Room${cleaningRooms.length > 1 ? "s" : ""} Need Housekeeping`,
      message: `Rooms: ${cleaningRooms.map((r) => r.number).slice(0, 4).join(", ")}${cleaningRooms.length > 4 ? "..." : ""}`,
      link: "/reception/rooms",
      actionText: "Room Board",
      badge: "Housekeeping",
    });
  }

  // 5. Unpaid Balance on Active/In-House Guests
  const unpaidInHouse = state.bookings.filter(
    (b) => b.status === "Checked-In" && b.total - b.amountPaid > 0
  );
  if (unpaidInHouse.length > 0) {
    const totalPending = unpaidInHouse.reduce(
      (sum, b) => sum + (b.total - b.amountPaid),
      0
    );
    alerts.push({
      id: `unpaid-inhouse-${today}`,
      type: "payment",
      icon: CreditCard,
      title: `${formatINR(totalPending)} Outstanding Folio Balance`,
      message: `${unpaidInHouse.length} in-house guest${unpaidInHouse.length > 1 ? "s" : ""} with pending dues`,
      link: "/reception/payments",
      actionText: "View Folios",
      badge: "Finance",
    });
  }

  // 6. Guest Messages
  if (state.messages && state.messages.length > 0) {
    alerts.push({
      id: `messages-${state.messages.length}`,
      type: "message",
      icon: MessageSquare,
      title: `${state.messages.length} Guest Inquiry Message${state.messages.length > 1 ? "s" : ""}`,
      message: `Latest: ${state.messages[0]?.subject || "Support inquiry"}`,
      link: "/reception",
      actionText: "View",
      badge: "Inquiries",
    });
  }

  const activeAlerts = alerts.filter((a) => !dismissed.includes(a.id));
  const hasUrgent = activeAlerts.some((a) => a.type === "urgent");
  const hasNewBooking = activeAlerts.some((a) => a.type === "new_booking");

  const handleDismiss = (id, e) => {
    e?.stopPropagation();
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      sessionStorage.setItem("meri_dismissed_alerts", JSON.stringify(next));
    } catch {}
  };

  const handleClearAll = () => {
    const allIds = alerts.map((a) => a.id);
    setDismissed(allIds);
    try {
      sessionStorage.setItem("meri_dismissed_alerts", JSON.stringify(allIds));
    } catch {}
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative grid size-9 place-items-center rounded-full border border-gold/30 bg-navy text-champagne hover:border-gold hover:bg-gold/10 transition cursor-pointer"
        aria-label="Reception Notifications"
        title="Reception Alerts & Notifications"
      >
        <Bell className="size-4" />
        {activeAlerts.length > 0 && (
          <span
            className={`absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md ${
              hasNewBooking
                ? "bg-emerald-500 animate-pulse ring-2 ring-emerald-400/50"
                : hasUrgent
                ? "bg-rose-500 animate-pulse ring-2 ring-rose-400/40"
                : "bg-gold text-gold-foreground font-black"
            }`}
          >
            {activeAlerts.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-gold/30 bg-[#061830] p-4 shadow-2xl backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gold/15 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-gold" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-foreground">
                  Front Desk Alerts
                </h3>
                <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold">
                  {activeAlerts.length}
                </span>
              </div>
              {activeAlerts.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 text-[11px] text-navy-foreground/60 hover:text-champagne transition"
                >
                  <CheckCheck className="size-3" /> Dismiss all
                </button>
              )}
            </div>

            {/* List */}
            <div className="mt-3 max-h-80 space-y-2.5 overflow-y-auto pr-1">
              {activeAlerts.length === 0 ? (
                <div className="py-8 text-center text-xs text-navy-foreground/60">
                  <Sparkles className="mx-auto size-6 text-gold/50 mb-2" />
                  <p className="font-semibold text-navy-foreground">All Clear!</p>
                  <p className="mt-1">No urgent arrivals, departures or room alerts right now.</p>
                </div>
              ) : (
                activeAlerts.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      setOpen(false);
                      if (a.link) navigate(a.link);
                    }}
                    className={`group relative rounded-xl border p-3 transition cursor-pointer ${
                      a.type === "new_booking"
                        ? "border-emerald-500/50 bg-emerald-950/40 hover:border-emerald-400 hover:bg-emerald-950/60"
                        : a.type === "urgent"
                        ? "border-rose-500/40 bg-rose-950/20 hover:bg-rose-950/30"
                        : "border-gold/15 bg-navy-deep/60 hover:border-gold/40 hover:bg-navy-deep"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`grid size-6 place-items-center rounded-lg ${
                            a.type === "new_booking"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : a.type === "urgent"
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-gold/20 text-gold"
                          }`}
                        >
                          <a.icon className="size-3.5" />
                        </span>
                        <p className="text-xs font-semibold text-navy-foreground group-hover:text-champagne transition">
                          {a.title}
                        </p>
                      </div>

                      <button
                        onClick={(e) => handleDismiss(a.id, e)}
                        className="rounded p-1 text-navy-foreground/40 hover:text-navy-foreground hover:bg-white/5"
                        title="Dismiss alert"
                      >
                        <X className="size-3" />
                      </button>
                    </div>

                    <p className="mt-1.5 text-[11px] leading-relaxed text-navy-foreground/70">
                      {a.message}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between text-[10px]">
                      <span className={`rounded px-1.5 py-0.5 border font-mono uppercase ${
                        a.type === "new_booking"
                          ? "bg-emerald-900/60 text-emerald-300 border-emerald-500/40 font-bold"
                          : "bg-navy text-gold border-gold/20"
                      }`}>
                        {a.badge}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-gold group-hover:translate-x-0.5 transition-transform">
                        {a.actionText} <ArrowRight className="size-3" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Links Footer */}
            <div className="mt-3 border-t border-gold/15 pt-3 grid grid-cols-3 gap-1.5 text-center text-[10px]">
              <Link
                to="/reception/check-in"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-navy-deep/80 py-1.5 text-champagne hover:bg-gold hover:text-gold-foreground transition"
              >
                Check-In
              </Link>
              <Link
                to="/reception/check-out"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-navy-deep/80 py-1.5 text-champagne hover:bg-gold hover:text-gold-foreground transition"
              >
                Check-Out
              </Link>
              <Link
                to="/reception/new"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-navy-deep/80 py-1.5 text-champagne hover:bg-gold hover:text-gold-foreground transition"
              >
                + Walk-in
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
