import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { CalendarX } from "lucide-react";
import { GuestBookingCard } from "@/components/dashboard/GuestBookingCard.jsx";
import { BookingDialog } from "@/components/dashboard/BookingDialog.jsx";
import { EmptyState, FilterChips, Panel } from "@/components/dashboard/ui.jsx";
import { FREE_CANCEL_DAYS, todayISO } from "@/lib/hotel/pricing.js";
import { useHotelState } from "@/lib/hotel/store.jsx";

const FILTERS = ["All", "Pending", "Confirmed", "Checked-In"];

export default function AccountBookings() {
  const state = useHotelState();
  const [filter, setFilter] = useState("All");
  const [inspectBooking, setInspectBooking] = useState(null);
  const today = todayISO();

  const sessionEmail = state.session?.email?.toLowerCase().trim() || "";
  const list = state.bookings
    .filter(
      (b) =>
        b.email?.toLowerCase().trim() === sessionEmail &&
        ["Pending", "Confirmed", "Checked-In"].includes(b.status) &&
        b.checkOut >= today
    )
    .filter((b) => filter === "All" || b.status === filter)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  return (
    <>
      <Panel
        title="Upcoming & Current Stays"
        subtitle={`Free cancellation up to ${FREE_CANCEL_DAYS * 24} hours before check-in.`}
        action={<FilterChips options={FILTERS} value={filter} onChange={setFilter} />}
      >
        {list.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            title="No bookings in this view"
            text="You have no active reservations matching this filter."
            action={
              <Link
                to="/account/book"
                className="inline-flex rounded-full bg-gold-gradient px-5 py-2 text-xs font-semibold uppercase text-gold-foreground"
              >
                Book a room
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {list.map((b) => (
                <GuestBookingCard
                  key={b.id}
                  booking={b}
                  onInspect={(booking) => setInspectBooking(booking)}
                />
              ))}
            </AnimatePresence>
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
