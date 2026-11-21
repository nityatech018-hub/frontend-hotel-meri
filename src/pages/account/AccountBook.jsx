import React from "react";
import { useSearchParams } from "react-router-dom";
import { BookingWidget } from "@/components/site/BookingWidget.jsx";
import { RoomCard } from "@/components/site/RoomCard.jsx";
import { formatDate } from "@/lib/hotel/pricing.js";
import { resolveStay } from "@/lib/hotel/search.js";
import { availableUnits, useHotelState } from "@/lib/hotel/store.jsx";

export default function AccountBook() {
  const [searchParams] = useSearchParams();
  const state = useHotelState();

  const searchObj = {
    checkIn: searchParams.get("checkIn") || undefined,
    checkOut: searchParams.get("checkOut") || undefined,
    guests: searchParams.get("guests") ? parseInt(searchParams.get("guests")) : undefined,
    rooms: searchParams.get("rooms") ? parseInt(searchParams.get("rooms")) : undefined,
    category: searchParams.get("category") || undefined,
  };

  const stay = resolveStay(searchObj);
  const list = stay.category
    ? state.categories.filter((c) => c.id === stay.category)
    : state.categories;

  const params = {
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    guests: stay.guests,
    rooms: stay.rooms,
  };

  return (
    <div className="space-y-8">
      <BookingWidget
        to="/account/book"
        initial={searchObj}
        className="rounded-2xl border border-gold/25 bg-navy p-5"
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-widest text-gold uppercase">Available Rooms</p>
          <h2 className="font-display text-2xl font-semibold text-navy-foreground">
            {formatDate(stay.checkIn)} — {formatDate(stay.checkOut)}
          </h2>
        </div>
        <p className="text-xs text-navy-foreground/60">
          {stay.guests} guests · {stay.rooms} room{stay.rooms > 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {list.map((c) => (
          <RoomCard
            key={c.id}
            room={c}
            stay={params}
            left={availableUnits(state, c.id, stay.checkIn, stay.checkOut)}
          />
        ))}
      </div>

      <p className="text-center text-xs text-navy-foreground/50">
        Prices in INR, excluding {Math.round((state.settings?.taxRate || 0.12) * 100)}% GST. Your
        guest details are pre-filled automatically at checkout.
      </p>
    </div>
  );
}
