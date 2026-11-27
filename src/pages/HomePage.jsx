import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Headphones,
  ShieldCheck,
  Wifi,
  UtensilsCrossed,
  Car,
  BellRing,
  Snowflake,
  Clock,
  Check,
  Star,
  ChevronLeft,
  ChevronRight,
  Expand,
  BedDouble,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout.jsx";
import { BookingWidget } from "@/components/site/BookingWidget.jsx";
import { RoomCard } from "@/components/site/RoomCard.jsx";
import { Lightbox3D } from "@/components/site/ThreeD.jsx";
import { useHotelState } from "@/lib/hotel/store.jsx";
import { IMG } from "@/lib/hotel/images.js";

const EASE = [0.22, 1, 0.36, 1];

const HERO_HIGHLIGHTS = [
  { icon: BedDouble, label: "Comfortable AC Stay" },
  { icon: Wifi, label: "Complimentary Wi-Fi" },
  { icon: Clock, label: "24-Hour Check-In" },
  { icon: Car, label: "Free Car Parking" },
];

const BOOKING_BENEFITS = [
  {
    icon: BadgeCheck,
    title: "Best Price Guarantee",
    description: "Direct booking rates with transparent pricing and no hidden fees.",
  },
  {
    icon: CalendarCheck,
    title: "Flexible Booking",
    description: "Simple reservation adjustments for stress-free travel planning.",
  },
  {
    icon: Headphones,
    title: "24/7 Customer Support",
    description: "Round-the-clock front desk assistance whenever you need us.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Secure Stay",
    description: "Secure corridors, CCTV monitoring, and verified hospitality.",
  },
];

const AMENITIES = [
  { icon: Snowflake, label: "Comfortable AC Accommodation" },
  { icon: BedDouble, label: "Classic Non-AC Stay" },
  { icon: BellRing, label: "Family-Friendly Accommodation" },
  { icon: Wifi, label: "Complimentary Wi-Fi" },
  { icon: Car, label: "Free Car Parking" },
  { icon: Clock, label: "24-Hour Hotel Services" },
];

const WHY_CHOOSE_POINTS = [
  {
    title: "Comfortable Accommodation",
    description: "Well-appointed AC and Non-AC rooms with fresh linens and private baths.",
  },
  {
    title: "Excellent Hospitality",
    description: "Attentive staff dedicated to making every business or family stay effortless.",
  },
  {
    title: "Convenient Location",
    description: "Easy access to Hoshangabad Road, transit hubs, and Bhopal city landmarks.",
  },
  {
    title: "Easy Booking Experience",
    description: "Instant online room selection with clear tariffs and zero hidden charges.",
  },
];

const GALLERY_ITEMS = [
  { src: IMG.exterior, title: "Hotel Exterior", tag: "Hotel Exterior" },
  { src: IMG.room101, title: "Guest Rooms", tag: "Guest Rooms" },
  { src: IMG.lobby, title: "Reception", tag: "Reception" },
  { src: IMG.dining, title: "Restaurant", tag: "Restaurant" },
  { src: IMG.lounge, title: "Hotel Interiors", tag: "Hotel Interiors" },
];

export default function HomePage() {
  const state = useHotelState();
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  return (
    <MotionConfig reducedMotion="user">
      <SiteLayout>
        {/* Section 2: Hero */}
        <section className="relative overflow-hidden bg-[#F8F6F1] pt-28 pb-24 sm:pt-32 sm:pb-28 lg:pt-36 lg:pb-32">
          {/* Full-Bleed Hero Background Image (2nd uploaded image) */}
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="absolute inset-0 z-0"
          >
            <img
              src={IMG.heroSuite}
              alt="Hotel Meri & Residency Luxury Suite"
              className="h-full w-full object-cover object-center lg:object-[75%_center]"
            />
            {/* Smooth Warm-White (#F8F6F1) sweep on left for crisp text contrast, clear on right */}
            <div className="absolute inset-0 bg-[#F8F6F1]/88 sm:bg-gradient-to-r sm:from-[#F8F6F1] sm:from-30% sm:via-[#F8F6F1]/92 sm:via-50% sm:to-transparent sm:to-75% lg:from-[#F8F6F1] lg:from-35% lg:via-[#F8F6F1]/90 lg:via-50% lg:to-transparent lg:to-70%" />
          </motion.div>

          {/* Hero Foreground Content */}
          <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-xl lg:max-w-2xl text-left">
              {/* Welcome Pill Badge */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-[#D5A43D]/45 bg-white/95 px-4 py-1.5 text-xs font-semibold tracking-wide text-[#071A32] shadow-sm">
                  <BedDouble className="size-3.5 text-[#D5A43D]" strokeWidth={2} />
                  <span>Welcome to Hotel Meri &amp; Residency</span>
                </span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08, ease: EASE }}
                className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight text-[#071A32] sm:text-5xl lg:text-[3.5rem]"
              >
                Experience Comfort, Elegance &amp; Exceptional Hospitality
              </motion.h1>

              {/* Short 2-line Description */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.16, ease: EASE }}
                className="mt-4 max-w-lg text-base leading-relaxed text-slate-700 sm:text-lg line-clamp-2"
              >
                Thoughtfully appointed rooms, warm personal service, and modern amenities on Hoshangabad Road, Bhopal.
              </motion.p>

              {/* Primary & Secondary CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.24, ease: EASE }}
                className="mt-7 flex flex-wrap items-center gap-3.5"
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/rooms"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#D5A43D] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#071A32] shadow-sm hover:bg-[#e2b656] transition-colors"
                  >
                    <span>Book a Room</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/rooms"
                    className="inline-flex items-center justify-center rounded-lg border border-[#071A32]/25 bg-white/85 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#071A32] hover:border-[#071A32] hover:bg-white transition-colors"
                  >
                    Review Rooms
                  </Link>
                </motion.div>
              </motion.div>

              {/* Four Compact Highlights */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.32, ease: EASE }}
                className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 pt-2 sm:flex sm:flex-wrap sm:items-center sm:gap-6"
              >
                {HERO_HIGHLIGHTS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-2 text-xs font-semibold text-[#071A32]">
                      <Icon className="size-4 text-[#D5A43D] shrink-0" strokeWidth={2} />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section 3: Floating Booking Widget */}
        <section className="relative z-20 -mt-12 sm:-mt-14 px-4 sm:px-6">
          <BookingWidget />
        </section>

        {/* Section 4: Booking Benefits */}
        <section className="bg-[#F8F6F1] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {BOOKING_BENEFITS.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.45, delay: idx * 0.08, ease: EASE }}
                    className="rounded-xl border border-[#071A32]/10 bg-white p-6 shadow-sm"
                  >
                    <Icon className="size-6 text-[#D5A43D]" strokeWidth={1.75} />
                    <h3 className="mt-4 font-display text-xl font-semibold text-[#071A32]">
                      {benefit.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                      {benefit.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 5: Explore Rooms & Suites */}
        <section className="border-t border-[#071A32]/10 bg-[#F8F6F1] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-10 sm:mb-12">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D5A43D]">
                  Accommodations
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-[#071A32] sm:text-4xl">
                  Explore Rooms &amp; Suites
                </h2>
                <p className="mt-2 max-w-xl text-sm text-slate-600">
                  Four distinct room categories tailored for families, business travellers, and couples.
                </p>
              </div>
              <Link
                to="/rooms"
                className="inline-flex items-center gap-2 rounded-lg border border-[#071A32]/20 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#071A32] hover:border-[#D5A43D] hover:bg-[#071A32] hover:text-white transition-colors"
              >
                <span>View All Rooms</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {state.categories.slice(0, 4).map((cat, i) => (
                <RoomCard key={cat.id} category={cat} index={i} demoMode />
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: Amenities */}
        <section className="bg-[#071A32] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="text-center max-w-xl mx-auto">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D5A43D]">
                Facilities
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[#F8F6F1] sm:text-4xl">
                Essential Hotel Amenities
              </h2>
              <p className="mt-2 text-sm text-[#F8F6F1]/75">
                Every convenience designed for a comfortable, uninterrupted stay.
              </p>
            </div>

            <div className="mt-10 flex gap-4 overflow-x-auto pb-2 snap-x no-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible sm:pb-0">
              {AMENITIES.map((amenity, idx) => {
                const Icon = amenity.icon;
                return (
                  <motion.div
                    key={amenity.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.45, delay: idx * 0.06, ease: EASE }}
                    className="group min-w-[140px] snap-start flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[#0B2242]/70 p-5 text-center transition-colors hover:border-[#D5A43D]/60"
                  >
                    <div className="grid size-11 place-items-center rounded-lg border border-[#D5A43D]/30 bg-[#071A32] text-[#D5A43D] transition-transform duration-300 group-hover:scale-110">
                      <Icon className="size-5" strokeWidth={1.75} />
                    </div>
                    <span className="mt-3 text-xs font-semibold tracking-wide text-[#F8F6F1]">
                      {amenity.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 7: Why Choose Hotel Meri? */}
        <section className="bg-[#F8F6F1] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
              {/* Left Column */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D5A43D]">
                  Our Promise
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-[#071A32] sm:text-4xl">
                  Why Choose Hotel Meri?
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Located at No-30, Narmadapuram Rd (Hoshangabad Road), Misrod, Bhopal, Hotel Meri &amp; Residency operates 24 hours and pairs warm Indian hospitality with dependable modern comfort.
                </p>

                <div className="mt-8 space-y-5">
                  {WHY_CHOOSE_POINTS.map((point) => (
                    <div key={point.title} className="flex items-start gap-3.5">
                      <div className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#D5A43D]/15 text-[#b58726]">
                        <Check className="size-3.5" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-semibold text-[#071A32]">
                          {point.title}
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-600">
                          {point.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Right Column: Large Sharp Exterior Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, ease: EASE }}
              >
                <div className="overflow-hidden rounded-xl border border-[#071A32]/10 bg-white shadow-sm aspect-[4/3]">
                  <img
                    src={IMG.exterior}
                    alt="Hotel Meri & Residency Exterior"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section 8: Hotel Gallery */}
        <section className="border-t border-[#071A32]/10 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D5A43D]">
                  Visual Tour
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-[#071A32] sm:text-4xl">
                  Hotel Gallery
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Explore our exterior, guest rooms, reception, and dining spaces.
                </p>
              </div>
              <Link
                to="/gallery"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#071A32] hover:text-[#D5A43D] transition-colors"
              >
                <span>Full Gallery</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {GALLERY_ITEMS.map((item, idx) => (
                <motion.button
                  key={item.title}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.45, delay: idx * 0.06, ease: EASE }}
                  className="group relative overflow-hidden rounded-xl border border-[#071A32]/10 bg-[#071A32]/5 text-left cursor-pointer"
                  aria-label={`View ${item.title} in lightbox`}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={item.src}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071A32]/85 via-[#071A32]/40 to-transparent p-3.5">
                    <p className="text-xs font-semibold tracking-wide text-[#F8F6F1]">
                      {item.title}
                    </p>
                  </div>
                  <div className="absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-full bg-[#071A32]/75 text-[#F8F6F1] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <Expand className="size-3.5" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <Lightbox3D
            photos={GALLERY_ITEMS}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(-1)}
            onIndexChange={setLightboxIndex}
          />
        </section>

        {/* Section 9: Guest Reviews */}
        <section className="border-t border-[#071A32]/10 bg-[#F8F6F1] py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D5A43D]">
                4.8 ★ Rating · 83 Google Reviews
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[#071A32] sm:text-4xl">
                Guest Reviews
              </h2>
            </div>

            <div className="mt-10 rounded-xl border border-[#071A32]/10 bg-white p-8 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1" aria-label="4.8 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-[#D5A43D] text-[#D5A43D]" />
                ))}
              </div>
              <p className="mt-4 font-display text-xl text-[#071A32]">
                Verified guest reviews will appear here as completed stays are recorded.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Hotel Meri &amp; Residency · No-30, Narmadapuram Rd (Hoshangabad Road), Misrod, Bhopal
              </p>
            </div>
          </div>
        </section>
      </SiteLayout>
    </MotionConfig>
  );
}
