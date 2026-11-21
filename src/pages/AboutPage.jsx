import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, Gem, HeartHandshake, ShieldCheck, Compass, Expand, Eye } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout.jsx";
import { PageHero } from "@/components/site/PageHero.jsx";
import { Counter, Reveal, SectionTitle } from "@/components/site/Reveal.jsx";
import { FlipCard, FlipHint, Lightbox3D } from "@/components/site/ThreeD.jsx";
import { useTilt } from "@/components/site/Motion.jsx";
import { IMG } from "@/lib/hotel/images.js";

const WHY = [
  {
    icon: Gem,
    title: "Refined Rooms",
    text: "Plush bedding, marble baths, and handcrafted details in every category.",
    more: "Hand-picked Egyptian cotton linen, blackout drapes and custom pillow menus for deep rest.",
  },
  {
    icon: HeartHandshake,
    title: "Heartfelt Service",
    text: "A hospitality team that remembers your name, your tea and your preferences.",
    more: "Personalized guest profiles ensure every return trip to Bareilly feels like a homecoming.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Secure",
    text: "24/7 security, CCTV monitoring and contactless check-in convenience.",
    more: "Key-card elevator access, verified staff and in-room digital safes for complete tranquility.",
  },
  {
    icon: Award,
    title: "Unmatched Value",
    text: "Royal comfort with crystal-clear pricing and no hidden costs.",
    more: "Transparent rates with sample taxes shown upfront and flexible stay options for families.",
  },
];

const PHOTOS = [
  { src: IMG.exterior, title: "The Palace Façade at Dusk", tag: "Exterior" },
  { src: IMG.lounge, title: "The Royal Library Lounge", tag: "Interiors" },
  { src: IMG.spa, title: "Ayurvedic Treatment Suite", tag: "Wellness" },
  { src: IMG.dining, title: "The Royal Table Restaurant", tag: "Dining" },
];

function TiltPhoto({ photo, index, onOpen }) {
  const tilt = useTilt(10);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false }}
      transition={{ duration: 0.7, delay: index * 0.1 }}
      className="perspective-[1200px]"
    >
      <button
        type="button"
        onClick={onOpen}
        {...tilt}
        aria-label={`Enlarge photo: ${photo.title}`}
        className="group relative block w-full aspect-[4/3] overflow-hidden rounded-2xl border border-gold/30 bg-navy shadow-card transition-shadow hover:shadow-lift cursor-pointer text-left"
      >
        <div className="sheen size-full">
          <img
            src={photo.src}
            alt={photo.title}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
        <div className="absolute inset-0 bg-hero-overlay opacity-60 transition-opacity group-hover:opacity-40" />

        <div className="absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-navy/80 border border-gold/40 text-champagne opacity-0 transition-all group-hover:opacity-100 group-hover:scale-105">
          <Eye className="size-4" />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5 text-navy-foreground">
          <p className="eyebrow !text-[0.6rem] text-gold">{photo.tag}</p>
          <h4 className="mt-1 font-display text-xl font-medium text-navy-foreground">
            {photo.title}
          </h4>
        </div>
      </button>
    </motion.div>
  );
}

export default function AboutPage() {
  const [photoIndex, setPhotoIndex] = useState(-1);

  return (
    <SiteLayout>
      <PageHero
        image={IMG.lobby}
        eyebrow="Our Heritage"
        title="Royal Hospitality in Bareilly"
        subtitle="Our story, philosophy, and the royal tradition that makes Hotel Meri & Residency your true sanctuary in Uttar Pradesh."
      />

      {/* Story Narrative */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <Reveal variant="left">
            <p className="eyebrow text-gold">The Journey</p>
            <h2 className="mt-2 font-display text-4xl font-semibold text-navy-foreground md:text-5xl">
              Rooted in Grace, Built for Comfort
            </h2>
            <p className="mt-6 text-sm text-navy-foreground/75 leading-relaxed">
              Founded on the sacred Indian principle of <em>Atithi Devo Bhava</em>, Hotel Meri &amp;
              Residency was envisioned as Bareilly's preeminent destination for visitors who value
              refined ambiance, culinary distinction, and personalized attention.
            </p>
            <p className="mt-4 text-sm text-navy-foreground/75 leading-relaxed">
              From business travelers seeking quiet productivity to families celebrating milestone
              weddings, our property blends heritage Indian motifs with modern luxuries.
            </p>

            <div className="mt-8 flex items-center gap-6 border-t border-gold/20 pt-6">
              <div>
                <p className="font-display text-3xl text-champagne font-semibold">Bareilly</p>
                <p className="text-xs text-navy-foreground/60 uppercase tracking-wider">
                  Civil Lines Hub
                </p>
              </div>
              <div className="h-8 w-px bg-gold/25" />
              <div>
                <p className="font-display text-3xl text-champagne font-semibold">24 Hours</p>
                <p className="text-xs text-navy-foreground/60 uppercase tracking-wider">
                  Heartfelt Service
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal variant="right" className="overflow-hidden rounded-2xl border border-gold/25 shadow-lift aspect-[4/3] sheen">
            <img src={IMG.lounge} alt="Hotel Lounge" className="size-full object-cover" />
          </Reveal>
        </div>
      </section>

      {/* Pillars with Interactive 3D FlipCards */}
      <section className="py-24 bg-navy border-y border-gold/20 px-6">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Why Hotel Meri"
            title="Four Pillars of Distinction"
            subtitle="The core values that guide our staff every hour of every day."
            align="center"
            tone="dark"
          />

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((item, idx) => {
              const Icon = item.icon;
              return (
                <FlipCard
                  key={item.title}
                  delay={idx * 0.1}
                  label={item.title}
                  front={
                    <div className="flex h-full flex-col justify-between rounded-2xl border border-gold/25 bg-navy-deep/80 p-6 shadow-card transition-shadow hover:shadow-lift text-center">
                      <div>
                        <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-gold/30 bg-gold/10 text-gold mb-4">
                          <Icon className="size-6" />
                        </div>
                        <h3 className="font-display text-2xl font-semibold text-navy-foreground">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-xs text-navy-foreground/70 leading-relaxed">
                          {item.text}
                        </p>
                      </div>

                      <div className="mt-6 pt-3 border-t border-gold/15 flex items-center justify-center">
                        <FlipHint text="Tap to discover" />
                      </div>
                    </div>
                  }
                  back={
                    <div className="flex h-full flex-col justify-between rounded-2xl border border-gold/40 bg-navy p-6 shadow-lift text-left">
                      <div>
                        <p className="eyebrow text-gold">{item.title}</p>
                        <h4 className="mt-2 font-display text-xl text-champagne">
                          Royal Standard
                        </h4>
                        <p className="mt-3 text-xs text-navy-foreground/80 leading-relaxed">
                          {item.more}
                        </p>
                      </div>

                      <div className="mt-6 pt-3 border-t border-gold/15 flex items-center justify-between">
                        <span className="eyebrow !text-[0.55rem] text-champagne/70">
                          Flip back
                        </span>
                        <span className="text-xs text-gold">✦</span>
                      </div>
                    </div>
                  }
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Visual Tour with 3D Tilt Photos & Lightbox */}
      <section className="py-24 bg-navy-deep px-6">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Visual Odyssey"
            title="Moments of Elegance"
            subtitle="Click any photograph to explore our property in full 3D panoramic focus."
            align="center"
            tone="dark"
          />

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PHOTOS.map((photo, i) => (
              <TiltPhoto
                key={photo.title}
                photo={photo}
                index={i}
                onOpen={() => setPhotoIndex(i)}
              />
            ))}
          </div>
        </div>

        {/* 3D Lightbox Modal */}
        <Lightbox3D
          photos={PHOTOS}
          index={photoIndex}
          onClose={() => setPhotoIndex(-1)}
          onIndexChange={(i) => setPhotoIndex(i)}
        />
      </section>
    </SiteLayout>
  );
}
