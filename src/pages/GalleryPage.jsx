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
  "AC Rooms",
  "Queen Round Bed",
  "Non-AC Rooms",
  "Hotel Exterior & Lobby",
  "Dining & Banquets",
];

const PHOTOS = [
  {
    src: IMG.room101,
    cat: "AC Rooms",
    title: "AC Family Room 101 – Double Bed",
    subtitle: "New guest room with split AC, wall frames & plush double bed",
  },
  {
    src: IMG.room102,
    cat: "AC Rooms",
    title: "AC Family Room 102 – Double Bed",
    subtitle: "Classic family room with ambient lighting & comfortable bedding",
    tall: true,
  },
  {
    src: IMG.room103,
    cat: "AC Rooms",
    title: "AC Family Room 103 – Triple Bed",
    subtitle: "Dedicated 3-bed configuration with ceiling fan & split AC",
  },
  {
    src: IMG.room104,
    cat: "AC Rooms",
    title: "AC Family Room 104 – Double Bed",
    subtitle: "Spacious double bedroom with attached bathroom & workstation",
    tall: true,
  },
  {
    src: IMG.room105,
    cat: "Queen Round Bed",
    title: "AC Premium Room 105 – Queen Round Bed",
    subtitle: "Signature luxury suite with centerpiece circular bed",
  },
  {
    src: IMG.room106,
    cat: "Non-AC Rooms",
    title: "Non-AC Room 106 – Double Bed",
    subtitle: "Budget double room with cooling ceiling fan & tiled flooring",
    tall: true,
  },
  {
    src: IMG.room107,
    cat: "Non-AC Rooms",
    title: "Non-AC Room 107 – Double Bed",
    subtitle: "Bright, airy non-air-conditioned room with fresh white linens",
  },
  {
    src: IMG.room108,
    cat: "Non-AC Rooms",
    title: "Non-AC Room 108 – Double Bed",
    subtitle: "Cozy budget double room with natural window ventilation",
  },
  {
    src: IMG.room109,
    cat: "Non-AC Rooms",
    title: "Non-AC Room 109 – Double Bed",
    subtitle: "Fresh budget non-AC room with double bed and attached bath",
    tall: true,
  },
  {
    src: IMG.room110,
    cat: "Non-AC Rooms",
    title: "Non-AC Room 110 – Double Bed",
    subtitle: "Clean non-AC double room with natural daylight and ceiling fan",
  },
  {
    src: IMG.exterior,
    cat: "Hotel Exterior & Lobby",
    title: "Hotel Meri Illuminated Façade at Dusk",
    subtitle: "Modern hotel exterior on Hoshangabad Road, Bhopal",
    tall: true,
  },
  {
    src: IMG.lobby,
    cat: "Hotel Exterior & Lobby",
    title: "24/7 Reception Lobby & Front Desk",
    subtitle: "Warm royal hospitality and express check-in desk",
  },
  {
    src: IMG.bath,
    cat: "AC Rooms",
    title: "Attached Marble Bathroom",
    subtitle: "Sparkling clean bath with hot & cold shower amenities",
    tall: true,
  },
  {
    src: IMG.dining,
    cat: "Dining & Banquets",
    title: "Grand Royal Dining & Banquet Hall",
    subtitle: "Unique grand culinary venue for gatherings, breakfast & banquet events",
  },
];

function GalleryTile({ photo, index, onOpen }) {
  const tilt = useTilt(8);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: false, margin: "-40px" }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6 break-inside-avoid perspective-[1200px]"
    >
      <motion.button
        type="button"
        onClick={onOpen}
        aria-label={`Open photo: ${photo.title}`}
        {...tilt}
        whileHover={{ scale: 1.02, z: 20 }}
        whileTap={{ scale: 0.97 }}
        className="group relative block w-full overflow-hidden rounded-2xl border border-gold/30 bg-[#061830] shadow-card transition-all duration-500 hover:border-gold hover:shadow-lift text-left cursor-pointer"
      >
        <div className="relative w-full overflow-hidden">
          <img
            src={photo.src}
            alt={photo.title}
            loading="lazy"
            className={cn(
              "w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108",
              photo.tall ? "aspect-[3/4]" : "aspect-[4/3]"
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent opacity-75 group-hover:opacity-90 transition-opacity" />

          {/* Expand icon pill */}
          <div className="absolute top-3.5 right-3.5 grid size-9 place-items-center rounded-full bg-slate-950/70 backdrop-blur-md border border-gold/40 text-champagne opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105 shadow-md">
            <Expand className="size-4" />
          </div>

          {/* Category Pill Tag */}
          <div className="absolute top-3.5 left-3.5">
            <span className="rounded-full bg-slate-950/80 backdrop-blur-md border border-gold/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold">
              {photo.cat}
            </span>
          </div>

          {/* Bottom Title & Subtitle */}
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <h3 className="font-display text-lg sm:text-xl font-bold text-white group-hover:text-gold transition-colors leading-snug">
              {photo.title}
            </h3>
            {photo.subtitle && (
              <p className="mt-1 text-xs text-slate-300 line-clamp-1">
                {photo.subtitle}
              </p>
            )}
          </div>
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
        image={IMG.suite}
        eyebrow="Visual Tour"
        title="Royal Gallery"
        subtitle="Explore actual photography of our rooms, suites, architectural grandeur, and welcoming spaces at Hotel Meri."
      />

      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {CATEGORIES.map((cat) => {
              const active = filter === cat;
              const count = cat === "All" ? PHOTOS.length : PHOTOS.filter((p) => p.cat === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={cn(
                    "rounded-full px-4 sm:px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm flex items-center gap-1.5",
                    active
                      ? "bg-gold-gradient text-[#120e03] font-bold shadow-gold scale-105"
                      : "border border-gold/30 bg-white text-[#061830] hover:bg-gold/15 hover:border-gold"
                  )}
                >
                  <span>{cat}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    active ? "bg-black/20 text-[#120e03]" : "bg-slate-100 text-slate-600"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Previous Masonry Columns Layout */}
          <motion.div layout className="columns-1 gap-6 sm:columns-2 lg:columns-3">
            <AnimatePresence mode="popLayout">
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
        </div>
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
