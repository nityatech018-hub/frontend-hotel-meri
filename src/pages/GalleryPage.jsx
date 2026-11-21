import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Expand } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout.jsx";
import { PageHero } from "@/components/site/PageHero.jsx";
import { useTilt } from "@/components/site/Motion.jsx";
import { Lightbox3D } from "@/components/site/ThreeD.jsx";
import { IMG } from "@/lib/hotel/images.js";
import { cn } from "@/lib/utils.js";

const CATEGORIES = [
  "All",
  "Hotel Exterior",
  "Reception",
  "Deluxe Rooms",
  "Premium Rooms",
  "Interiors",
  "Dining",
  "Amenities",
];

const PHOTOS = [
  { src: IMG.exterior, cat: "Hotel Exterior", title: "The Palace Façade at Dusk" },
  { src: IMG.lobby, cat: "Reception", title: "Golden Reception Lobby" },
  { src: IMG.deluxe, cat: "Deluxe Rooms", title: "Deluxe King Room" },
  { src: IMG.lounge, cat: "Interiors", title: "The Library Lounge", tall: true },
  { src: IMG.premium, cat: "Premium Rooms", title: "Premium Twin Queens" },
  { src: IMG.dining, cat: "Dining", title: "The Royal Table Restaurant" },
  { src: IMG.spa, cat: "Amenities", title: "Spa Treatment Suite", tall: true },
  { src: IMG.suite, cat: "Premium Rooms", title: "Luxury Suite Salon" },
  { src: IMG.pool, cat: "Amenities", title: "Rooftop Heated Pool" },
  { src: IMG.bath, cat: "Interiors", title: "Marble Suite Bathroom", tall: true },
  { src: IMG.executive, cat: "Deluxe Rooms", title: "Executive King Room" },
  { src: IMG.family, cat: "Premium Rooms", title: "Family Room" },
];

function GalleryTile({ photo, index, onOpen }) {
  const tilt = useTilt(10);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, rotateY: -35 }}
      whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
      viewport={{ once: false, margin: "-40px" }}
      exit={{ opacity: 0, scale: 0.8, rotateY: 35 }}
      transition={{ duration: 0.6, delay: (index % 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6 break-inside-avoid perspective-[1200px]"
    >
      <motion.button
        type="button"
        onClick={onOpen}
        aria-label={`Open photo: ${photo.title}`}
        {...tilt}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="group relative block w-full overflow-hidden rounded-2xl border border-gold/25 bg-navy shadow-card transition-shadow duration-500 hover:shadow-lift text-left cursor-pointer"
      >
        <div className="sheen size-full">
          <img
            src={photo.src}
            alt={photo.title}
            loading="lazy"
            className={cn(
              "w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110",
              photo.tall ? "aspect-[3/4]" : "aspect-[4/3]"
            )}
          />
        </div>

        <div className="absolute inset-0 bg-hero-overlay opacity-50 transition-opacity duration-300 group-hover:opacity-80" />

        <div className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-navy/80 border border-gold/40 text-champagne opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105">
          <Expand className="size-4" />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-6 text-navy-foreground">
          <span className="eyebrow !text-[0.6rem] text-gold">{photo.cat}</span>
          <h3 className="mt-1 font-display text-2xl font-semibold text-navy-foreground">
            {photo.title}
          </h3>
        </div>
      </motion.button>
    </motion.div>
  );
}

export default function GalleryPage() {
  const [filter, setFilter] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const filtered =
    filter === "All" ? PHOTOS : PHOTOS.filter((p) => p.cat === filter);

  return (
    <SiteLayout>
      <PageHero
        image={IMG.dining}
        eyebrow="Visual Tour"
        title="Royal Gallery"
        subtitle="Explore the grandeur, craftsmanship, and intimate sanctuary spaces of Hotel Meri & Residency."
      />

      <section className="py-20 px-6 max-w-7xl mx-auto">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-16">
          {CATEGORIES.map((cat) => {
            const active = filter === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  "rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer",
                  active
                    ? "bg-gold-gradient text-gold-foreground shadow-gold scale-105"
                    : "border border-gold/30 text-champagne/80 hover:bg-gold/15 hover:text-champagne"
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Masonry Columns */}
        <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 gap-6">
          <AnimatePresence>
            {filtered.map((photo, i) => (
              <GalleryTile
                key={photo.title + i}
                photo={photo}
                index={i}
                onOpen={() => setLightboxIndex(PHOTOS.findIndex((p) => p.title === photo.title))}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* 3D Lightbox Modal */}
      <Lightbox3D
        photos={PHOTOS}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(-1)}
        onIndexChange={(i) => setLightboxIndex(i)}
      />
    </SiteLayout>
  );
}
