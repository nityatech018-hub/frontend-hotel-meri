import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Bed, Maximize2, ArrowRight, Wind } from "lucide-react";
import { formatINR, todayISO, addDays } from "@/lib/hotel/pricing.js";
import { useHotelState } from "@/lib/hotel/store.jsx";
import { cn } from "@/lib/utils.js";

const EASE = [0.22, 1, 0.36, 1];

export function RoomCard({ category, index = 0, checkIn, checkOut, guests, demoMode = false }) {
  const state = useHotelState();
  const cat = category || state.categories[0];
  if (!cat) return null;

  const today = checkIn || todayISO();
  const tomorrow = checkOut || addDays(today, 1);

  const isAc = cat.isAc !== false && cat.id !== "non-ac" && cat.id !== "non-ac-double";

  const basePrice = cat.price;
  const bedName = cat.bedType || cat.bed;
  const maxGuests = cat.maxGuests || 2;
  const extraGuestPrice = cat.extraGuestPrice ?? 300;
  const roomSize = cat.size;
  const roomImage = cat.image;
  const facilities = (cat.amenities || []).slice(0, 3);

  const queryParams = new URLSearchParams();
  if (checkIn) queryParams.set("checkIn", today);
  if (checkOut) queryParams.set("checkOut", tomorrow);
  if (guests) queryParams.set("guests", String(guests));
  const qs = queryParams.toString();

  // Homepage demo listings redirect to Rooms & Suites page; Rooms page navigates to Category Details
  const targetLink = demoMode
    ? `/rooms?category=${cat.id}`
    : `/rooms/${cat.id}${qs ? `?${qs}` : ""}`;

  return (
    <motion.div
      className="flex h-full"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08, ease: EASE }}
    >
      <article className="group flex w-full flex-col overflow-hidden rounded-xl border border-[#071A32]/12 bg-white shadow-sm transition-all duration-300 hover:border-[#D5A43D]/70 hover:shadow-md">
        {/* Category Image */}
        <Link to={targetLink} className="relative aspect-[4/3] overflow-hidden bg-[#071A32]/5 block">
          <img
            src={roomImage}
            alt={cat.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/images/rooms/ac-family-room.jpg";
            }}
          />
          <span
            className={cn(
              "absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              isAc
                ? "bg-[#071A32]/90 text-[#F8F6F1]"
                : "bg-amber-900/90 text-amber-100"
            )}
          >
            <Wind className="size-3 text-[#D5A43D]" />
            {isAc ? "AC Room" : "Non-AC"}
          </span>
        </Link>

        {/* Card Content */}
        <div className="flex flex-1 flex-col p-5">
          {/* Price & Category Group Row (no public inventory counts) */}
          <div className="flex items-center justify-between gap-2">
            {basePrice ? (
              <p className="text-sm font-semibold text-[#071A32]">
                <span className="font-display text-xl font-bold text-[#071A32]">
                  {formatINR(basePrice)}
                </span>
                <span className="text-xs font-normal text-slate-500"> / night</span>
              </p>
            ) : (
              <span />
            )}
            <span className="text-[11px] font-semibold tracking-wide uppercase text-[#b58726]">
              {cat.groupCategory || (isAc ? "Family Room" : "Classic Room")}
            </span>
          </div>

          <Link to={targetLink} className="mt-2 block">
            <h3 className="font-display text-xl font-semibold text-[#071A32] group-hover:text-[#b58726] transition-colors line-clamp-1">
              {cat.name}
            </h3>
          </Link>

          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed line-clamp-2">
            {cat.tagline || cat.description}
          </p>

          {/* Compact Specs */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3.5 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5 text-[#D5A43D] shrink-0" />
              <span>{maxGuests} Guests</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bed className="size-3.5 text-[#D5A43D] shrink-0" />
              <span>{bedName}</span>
            </span>
            {roomSize && (
              <span className="inline-flex items-center gap-1.5">
                <Maximize2 className="size-3.5 text-[#D5A43D] shrink-0" />
                <span>{roomSize}</span>
              </span>
            )}
          </div>

          {extraGuestPrice > 0 && (
            <p className="mt-2 text-[11px] text-slate-500">
              Extra guest charge: <span className="font-semibold text-[#071A32]">{formatINR(extraGuestPrice)}</span> / night
            </p>
          )}

          {facilities.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {facilities.map((f) => (
                <span
                  key={f}
                  className="rounded-md bg-[#F8F6F1] px-2 py-0.5 text-[10px] font-medium text-slate-600"
                >
                  {f}
                </span>
              ))}
            </div>
          )}

          {/* Single Action Button */}
          <div className="mt-auto pt-5">
            <Link
              to={targetLink}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D5A43D] hover:bg-[#e2b656] px-4 py-2.5 text-xs font-bold text-[#071A32] uppercase tracking-wider transition-colors"
            >
              <span>{demoMode ? "Explore Rooms" : "View Room Details"}</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </article>
    </motion.div>
  );
}
