import React from "react";
import {
  Wifi,
  Tv,
  Wind,
  Bath,
  Droplets,
  Sparkles,
  Flame,
  ShieldCheck,
  Car,
  Clock,
  GlassWater,
  UtensilsCrossed,
} from "lucide-react";
import {
  FAMILY_ROOM_AMENITIES,
  CLASSIC_ROOM_AMENITIES,
  COMMON_HOTEL_FACILITIES,
  ADDITIONAL_CHARGES_INFO,
} from "@/lib/hotel/data.js";

const ICON_MAP = {
  "Wi-Fi": Wifi,
  Television: Tv,
  "Air Conditioning": Wind,
  "Bathroom Facilities": Bath,
  "Shower Gel": Droplets,
  Soap: Sparkles,
  Towels: Bath,
  "Water Geyser": Flame,
  "RO Drinking Water": GlassWater,
  Housekeeping: Sparkles,
  "24-Hour Check-In": Clock,
  "24/7 CCTV Security": ShieldCheck,
  "Free Car Parking": Car,
  Food: UtensilsCrossed,
  "Water Bottles": GlassWater,
};

function AmenityGrid({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((label) => {
        const Icon = ICON_MAP[label] || Sparkles;
        return (
          <div
            key={label}
            className="flex items-center gap-2.5 rounded-xl border border-[#071A32]/10 bg-white px-3.5 py-2.5 text-xs font-medium text-[#071A32]"
          >
            <Icon className="size-4 text-[#D5A43D] shrink-0" strokeWidth={1.75} />
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Reusable category-wise amenities & hotel facilities section.
 * Pass `categoryGroup` ("Family Room" | "Classic Room" | "all") to show room-specific
 * amenities alongside Common Hotel Facilities and Additional Charges.
 */
export function AmenitiesSection({ categoryGroup = "all" }) {
  const showFamily = categoryGroup === "all" || categoryGroup === "Family Room";
  const showClassic = categoryGroup === "all" || categoryGroup === "Classic Room";

  return (
    <div className="space-y-8">
      {/* Room Category Amenities */}
      {showFamily && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-xl font-semibold text-[#071A32]">
              Family Room Amenities (AC)
            </h3>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D5A43D]">
              Air Conditioned
            </span>
          </div>
          <AmenityGrid items={FAMILY_ROOM_AMENITIES} />
        </div>
      )}

      {showClassic && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-xl font-semibold text-[#071A32]">
              Classic Room Amenities (Non-AC)
            </h3>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Non-AC (Ceiling Fan)
            </span>
          </div>
          <AmenityGrid items={CLASSIC_ROOM_AMENITIES} />
        </div>
      )}

      {/* Common Hotel Facilities */}
      <div className="space-y-3 border-t border-[#071A32]/10 pt-6">
        <h3 className="font-display text-xl font-semibold text-[#071A32]">
          Hotel Facilities
        </h3>
        <AmenityGrid items={COMMON_HOTEL_FACILITIES} />
      </div>

      {/* Additional Charges */}
      <div className="space-y-3 border-t border-[#071A32]/10 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-xl font-semibold text-[#071A32]">
            Additional Charges
          </h3>
          <span className="text-xs text-slate-500">
            Not included in room tariff
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ADDITIONAL_CHARGES_INFO.map((item) => {
            const Icon = ICON_MAP[item.name] || UtensilsCrossed;
            return (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-xl border border-[#071A32]/10 bg-[#F8F6F1] px-4 py-3 text-xs"
              >
                <span className="flex items-center gap-2.5 font-semibold text-[#071A32]">
                  <Icon className="size-4 text-[#D5A43D] shrink-0" strokeWidth={1.75} />
                  <span>{item.name}</span>
                </span>
                <span className="rounded-full border border-[#071A32]/15 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                  {item.note}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
