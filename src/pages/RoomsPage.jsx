import React from "react";
import { SiteLayout } from "@/components/site/SiteLayout.jsx";
import { PageHero } from "@/components/site/PageHero.jsx";
import { RoomCard } from "@/components/site/RoomCard.jsx";
import { BookingWidget } from "@/components/site/BookingWidget.jsx";
import { Marquee } from "@/components/site/Motion.jsx";
import { useHotelState } from "@/lib/hotel/store.jsx";
import { IMG } from "@/lib/hotel/images.js";

const ROOM_PERKS = [
  "Marble Bathrooms",
  "High-Speed Wi-Fi",
  "24-Hour In-Room Dining",
  "Plush Orthopedic Mattresses",
  "Daily Housekeeping",
  "Soundproof Windows",
];

export default function RoomsPage() {
  const state = useHotelState();

  return (
    <SiteLayout>
      <PageHero
        image={IMG.suite}
        eyebrow="Accommodations"
        title={
          <>
            Rest like <em className="text-gold">royalty</em>
          </>
        }
        subtitle="Five distinct categories of rooms and suites, unified by an uncompromising dedication to royal comfort."
      />

      {/* Floating Booking Filter */}
      <section className="relative z-20 -mt-10 mx-auto max-w-5xl px-6">
        <BookingWidget />
      </section>

      {/* Ribbon */}
      <div className="mt-14">
        <Marquee items={ROOM_PERKS} />
      </div>

      {/* Rooms Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {state.categories.map((cat, i) => (
            <RoomCard key={cat.id} category={cat} index={i} />
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
