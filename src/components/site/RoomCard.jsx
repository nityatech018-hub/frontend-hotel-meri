import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Bed, Maximize2, Check, X, ArrowRight } from "lucide-react";
import { formatINR } from "@/lib/hotel/pricing.js";
import { cn } from "@/lib/utils.js";

const EASE = [0.22, 1, 0.36, 1];

function Availability({ left = 4 }) {
  const label = left === 0 ? "Sold out" : left <= 2 ? `Only ${left} left` : `${left} available`;
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-[0.7rem] font-medium tracking-wide backdrop-blur-md shadow-sm",
        left === 0
          ? "bg-rose-500/80 text-white"
          : left <= 2
          ? "bg-amber-500/80 text-white"
          : "bg-emerald-600/80 text-white"
      )}
    >
      {label}
    </span>
  );
}

export function RoomCard({ category, index = 0 }) {
  const [showModal, setShowModal] = useState(false);

  if (!category) return null;

  return (
    <>
      {/* Refined Smooth Float-Up Scroll Animation */}
      <motion.div
        className="flex h-full"
        initial={{ opacity: 0, y: 45, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.75, delay: (index % 3) * 0.12, ease: EASE }}
      >
        <motion.article
          whileHover={{ y: -8, scale: 1.01 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="group flex w-full flex-col overflow-hidden rounded-2xl border border-gold/25 bg-navy shadow-card transition-all duration-500 hover:border-gold/50 hover:shadow-lift"
        >
          {/* Card Image with Light Sheen Sweep */}
          <div className="sheen relative aspect-[16/10] overflow-hidden bg-navy-deep">
            <img
              src={category.image}
              alt={category.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
            />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 z-10">
              <span className="glass-navy eyebrow rounded-full px-3 py-1 !text-[0.6rem] text-champagne">
                {category.size}
              </span>
              <Availability left={category.availableRoomsCount ?? 4} />
            </div>

            <div className="absolute right-4 bottom-4 rounded-xl bg-navy/90 border border-gold/30 px-3.5 py-1.5 text-right backdrop-blur-md z-10 shadow-lg">
              <p className="font-display text-2xl leading-none text-champagne font-semibold">
                {formatINR(category.price)}
              </p>
              <p className="mt-1 text-[0.65rem] tracking-wider text-navy-foreground/70 uppercase">
                per night
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-1 flex-col p-6">
            <p className="eyebrow text-gold">{category.tagline}</p>
            <h3 className="mt-2 font-display text-3xl text-navy-foreground font-medium group-hover:text-champagne transition-colors">
              {category.name}
            </h3>
            <p className="mt-3 text-sm text-navy-foreground/75 leading-relaxed line-clamp-2">
              {category.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-navy-foreground/80 border-t border-gold/15 pt-3">
              <span className="flex items-center gap-1.5">
                <Users className="size-4 text-gold" /> Up to {category.maxGuests} guests
              </span>
              <span className="flex items-center gap-1.5">
                <Bed className="size-4 text-gold" /> {category.bed}
              </span>
              <span className="flex items-center gap-1.5">
                <Maximize2 className="size-4 text-gold" /> {category.size}
              </span>
            </div>

            <ul className="mt-4 flex flex-wrap gap-2">
              {(category.amenities || []).slice(0, 4).map((a) => (
                <li
                  key={a}
                  className="rounded-full bg-navy-deep border border-gold/20 px-3 py-1 text-xs text-navy-foreground/80"
                >
                  {a}
                </li>
              ))}
            </ul>

            <div className="mt-auto flex gap-3 pt-6">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex-1 rounded-full border border-gold/40 px-4 py-2.5 text-xs font-semibold tracking-wider text-champagne uppercase hover:bg-gold/15 transition cursor-pointer"
              >
                View Details
              </button>

              <Link
                to={`/book?category=${category.id}`}
                className="flex-1 rounded-full bg-gold-gradient py-2.5 text-center text-xs font-semibold tracking-wider text-gold-foreground uppercase shadow-gold hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                Book Now <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </motion.article>
      </motion.div>

      {/* 3D Details Dialog */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 z-[200] grid place-items-center bg-navy-deep/85 p-4 backdrop-blur-md overflow-y-auto"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              style={{ transformPerspective: 1400 }}
              initial={{
                opacity: 0,
                rotateX: -40,
                y: 50,
                scale: 0.85,
              }}
              animate={{
                opacity: 1,
                rotateX: 0,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                rotateX: 20,
                scale: 0.9,
              }}
              transition={{ duration: 0.45, ease: EASE }}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-gold/30 bg-navy shadow-lift"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 z-20 grid size-9 place-items-center rounded-full bg-navy/80 border border-gold/40 text-champagne hover:bg-gold hover:text-gold-foreground transition cursor-pointer"
              >
                <X className="size-4" />
              </button>

              <div className="relative aspect-[16/9] w-full overflow-hidden">
                <img src={category.image} alt={category.name} className="size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent" />
              </div>

              <div className="p-6 md:p-8">
                <p className="eyebrow text-gold">{category.tagline}</p>
                <h3 className="font-display text-4xl text-navy-foreground mt-1">
                  {category.name}
                </h3>
                <p className="mt-3 text-sm text-navy-foreground/75 leading-relaxed">
                  {category.description}
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3 text-center border-y border-gold/20 py-4">
                  <div className="rounded-xl bg-navy-deep p-3 border border-gold/15">
                    <p className="eyebrow !text-[0.6rem] text-gold">Guests</p>
                    <p className="mt-1 text-sm font-medium text-navy-foreground">Up to {category.maxGuests}</p>
                  </div>
                  <div className="rounded-xl bg-navy-deep p-3 border border-gold/15">
                    <p className="eyebrow !text-[0.6rem] text-gold">Bed</p>
                    <p className="mt-1 text-sm font-medium text-navy-foreground">{category.bed}</p>
                  </div>
                  <div className="rounded-xl bg-navy-deep p-3 border border-gold/15">
                    <p className="eyebrow !text-[0.6rem] text-gold">Room Size</p>
                    <p className="mt-1 text-sm font-medium text-navy-foreground">{category.size}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gold mb-3">Room Amenities</h4>
                  <ul className="grid grid-cols-2 gap-2 text-sm text-navy-foreground/80">
                    {(category.amenities || []).map((amenity, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="size-4 text-gold shrink-0" />
                        <span>{amenity}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-gold/20 pt-6">
                  <div>
                    <p className="font-display text-3xl text-champagne font-semibold">
                      {formatINR(category.price)}
                    </p>
                    <p className="text-xs text-navy-foreground/60">per night + taxes</p>
                  </div>

                  <Link
                    to={`/book?category=${category.id}`}
                    onClick={() => setShowModal(false)}
                    className="rounded-full bg-gold-gradient px-8 py-3 text-xs font-semibold tracking-wider text-gold-foreground uppercase shadow-gold hover:brightness-110 transition flex items-center gap-2"
                  >
                    Reserve This Room <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
