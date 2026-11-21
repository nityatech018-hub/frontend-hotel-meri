import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Award,
  Utensils,
  Waves,
  Sparkles,
  Wifi,
  Car,
  Dumbbell,
  Star,
  Quote,
  Check,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout.jsx";
import { BookingWidget } from "@/components/site/BookingWidget.jsx";
import { RoomCard } from "@/components/site/RoomCard.jsx";
import { useHotelState } from "@/lib/hotel/store.jsx";
import { IMG } from "@/lib/hotel/images.js";
import { Aurora, GoldSparks, Marquee, SplitText, useTilt } from "@/components/site/Motion.jsx";
import { Reveal, Counter, SectionTitle } from "@/components/site/Reveal.jsx";
import { FlipCard, FlipHint, StoryBook3D } from "@/components/site/ThreeD.jsx";
import { useIntroDone } from "@/components/site/introState.js";

const AMENITIES = [
  {
    icon: Utensils,
    title: "Fine Dining",
    text: "Royal Indian & global cuisine",
    more: "Chef's tasting menus, live tandoor counter and 24-hour in-room dining.",
    hours: "7:00 AM – 11:00 PM",
  },
  {
    icon: Waves,
    title: "Rooftop Pool",
    text: "Sunset infinity views",
    more: "Heated infinity pool with luxury cabanas, mocktails, and lantern-lit evenings.",
    hours: "6:00 AM – 9:00 PM",
  },
  {
    icon: Sparkles,
    title: "Spa & Wellness",
    text: "Ayurvedic rituals",
    more: "Traditional massages, aromatherapy steam room and couple's treatment suites.",
    hours: "9:00 AM – 9:00 PM",
  },
  {
    icon: Wifi,
    title: "High-speed Wi‑Fi",
    text: "Across the property",
    more: "Seamless fibre Wi‑Fi in every room, terrace lounge and poolside.",
    hours: "24 Hours Complimentary",
  },
  {
    icon: Car,
    title: "Valet & Transfers",
    text: "Airport & railway pickup",
    more: "Chauffeured luxury cars, secure private parking, and round-the-clock valet.",
    hours: "Available on request",
  },
  {
    icon: Dumbbell,
    title: "Fitness Studio",
    text: "Modern cardio & strength",
    more: "Premium equipment, yoga mats, and personal workout guidance.",
    hours: "Open 24 Hours",
  },
];

const STORIES = [
  {
    image: IMG.dining,
    eyebrow: "Dining",
    title: "The Royal Table",
    text: "Candlelit dinners, slow-cooked Awadhi heritage recipes, and artisanal breads served in our chandelier-lit dining hall.",
    points: [
      "Heritage thalis & Chef's tasting menus",
      "Live tandoor and artisanal dessert counter",
      "Private dining suites for celebratory banquets",
    ],
    note: "Special seasonal preparations available on advance reservation.",
  },
  {
    image: IMG.pool,
    eyebrow: "Leisure",
    title: "Sunset Rooftop",
    text: "Unwind beside our heated infinity pool with private cabanas, lanterns, and uninterrupted skyline views at golden hour.",
    points: [
      "Heated infinity pool with luxury cabanas",
      "Poolside beverages and artisan small plates",
      "Starlit evening lounge atmosphere",
    ],
    note: "Towels, robes and poolside service provided.",
  },
];

const MARQUEE_ITEMS = [
  "Royal Indian Tradition",
  "Handcrafted Luxury Suites",
  "The Royal Table Dining",
  "Rooftop Infinity Pool",
  "24/7 Royal Concierge",
  "Near Bareilly Civil Lines",
  "Unforgettable Memories",
];

function StoryCard({ story, index, onOpen }) {
  const tilt = useTilt(8);
  return (
    <Reveal
      delay={index * 0.15}
      variant={index === 0 ? "left" : "right"}
      className="perspective-[1200px]"
    >
      <motion.button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${story.title}`}
        {...tilt}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97, rotateX: 8 }}
        className="group relative block w-full overflow-hidden rounded-2xl text-left shadow-card transition-shadow duration-500 hover:shadow-lift border border-gold/25 cursor-pointer"
      >
        <div className="sheen aspect-[4/3] w-full overflow-hidden">
          <img
            src={story.image}
            alt={story.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-[1.4s] group-hover:scale-110"
          />
        </div>
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute inset-x-0 bottom-0 p-8 text-navy-foreground">
          <p className="eyebrow text-champagne">{story.eyebrow}</p>
          <h3 className="mt-2 font-display text-3xl font-semibold text-navy-foreground md:text-4xl">
            {story.title}
          </h3>
          <p className="mt-2 text-sm text-navy-foreground/80 line-clamp-2">{story.text}</p>
          <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-gold uppercase group-hover:translate-x-1 transition-transform">
            Discover Story <ArrowRight className="size-3.5" />
          </span>
        </div>
      </motion.button>
    </Reveal>
  );
}

export default function HomePage() {
  const state = useHotelState();
  const ready = useIntroDone();
  const [selectedStory, setSelectedStory] = useState(null);

  return (
    <SiteLayout>
      {/* Hero Section with Parallax Ambiance */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-navy">
        {/* Background photo */}
        <div className="absolute inset-0 z-0">
          <img
            src={IMG.exterior}
            alt="Hotel Meri Exterior"
            className="size-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-hero-overlay" />
        </div>

        {/* Dynamic lights & sparks */}
        <Aurora />
        <GoldSparks count={24} />

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-5xl px-6 pt-36 pb-24 text-center">
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.1em" }}
            animate={ready ? { opacity: 1, letterSpacing: "0.32em" } : {}}
            transition={{ duration: 1 }}
            className="eyebrow ornament mx-auto justify-center text-gold-gradient animate-shine"
          >
            Welcome to Bareilly's Crown Jewel
          </motion.p>

          <h1 className="mt-6 font-display text-5xl font-medium tracking-wide text-navy-foreground md:text-7xl lg:text-8xl">
            {ready ? (
              <SplitText text="Royal Comfort & Hospitality" delay={0.2} />
            ) : (
              "Royal Comfort & Hospitality"
            )}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={ready ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
            transition={{ duration: 0.9, delay: 0.5 }}
            className="mt-6 mx-auto max-w-2xl text-base text-navy-foreground/85 md:text-xl font-light leading-relaxed"
          >
            Where regal Indian heritage meets modern elegance. Experience handcrafted suites,
            candlelit dining, and warm, attentive service.
          </motion.p>

          {/* Quick Booking Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.7 }}
            className="mt-12"
          >
            <BookingWidget />
          </motion.div>
        </div>
      </section>

      {/* Endless Gold Marquee Ribbon */}
      <Marquee items={MARQUEE_ITEMS} />

      {/* Featured Accommodations */}
      <section className="py-28 bg-navy-deep px-6 relative">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-16">
            <SectionTitle
              eyebrow="Accommodations"
              title="Rooms &amp; Suites"
              subtitle="Five bespoke categories tailored for executive retreats, romantic weekenders, and royal family gatherings."
              align="left"
              tone="dark"
            />
            <Link
              to="/rooms"
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-champagne hover:bg-gold hover:text-gold-foreground transition"
            >
              View All Rooms <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {state.categories.slice(0, 3).map((cat, i) => (
              <RoomCard key={cat.id} category={cat} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Interactive 3D Amenities with Flip Cards */}
      <section className="py-28 bg-navy border-y border-gold/20 px-6 relative">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Curated Privileges"
            title="Exceptional Amenities"
            subtitle="Every detail crafted to elevate your comfort, from dawn to the golden twilight."
            align="center"
            tone="dark"
          />

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {AMENITIES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <FlipCard
                  key={item.title}
                  delay={idx * 0.1}
                  label={item.title}
                  front={
                    <div className="flex h-full flex-col justify-between rounded-2xl border border-gold/25 bg-navy-deep/80 p-8 shadow-card transition-shadow hover:shadow-lift">
                      <div>
                        <div className="inline-grid size-14 place-items-center rounded-2xl border border-gold/30 bg-gold/10 text-gold mb-6">
                          <Icon className="size-7" />
                        </div>
                        <h3 className="font-display text-2xl font-semibold text-navy-foreground">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm text-navy-foreground/75 leading-relaxed">
                          {item.text}
                        </p>
                      </div>

                      <div className="mt-8 pt-4 border-t border-gold/15 flex items-center justify-between">
                        <FlipHint text="Tap to view hours &amp; details" />
                        <span className="text-xs text-gold">✦</span>
                      </div>
                    </div>
                  }
                  back={
                    <div className="flex h-full flex-col justify-between rounded-2xl border border-gold/40 bg-navy p-8 shadow-lift">
                      <div>
                        <p className="eyebrow text-gold">{item.title}</p>
                        <h4 className="mt-2 font-display text-2xl text-champagne">
                          Privilege Details
                        </h4>
                        <p className="mt-4 text-sm text-navy-foreground/80 leading-relaxed">
                          {item.more}
                        </p>
                        <div className="mt-5 rounded-lg bg-navy-deep/80 border border-gold/20 p-3">
                          <p className="text-[11px] uppercase tracking-wider text-gold font-semibold">
                            Availability
                          </p>
                          <p className="text-xs text-navy-foreground mt-0.5">{item.hours}</p>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gold/15 flex items-center justify-between">
                        <span className="eyebrow !text-[0.6rem] text-champagne/70">
                          Tap to flip back
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

      {/* Stories Section with Interactive 3D Book Pop-up */}
      <section className="py-28 bg-navy-deep px-6 relative">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Signature Experiences"
            title="Stories of Hospitality"
            subtitle="Take a closer glimpse into what awaits you at our tables and under the open sky."
            align="center"
            tone="dark"
          />

          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {STORIES.map((story, i) => (
              <StoryCard
                key={story.title}
                story={story}
                index={i}
                onOpen={() => setSelectedStory(story)}
              />
            ))}
          </div>
        </div>

        {/* 3D Story Book Pop-up */}
        <StoryBook3D
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
          action={
            <Link
              to="/book"
              onClick={() => setSelectedStory(null)}
              className="inline-block rounded-full bg-gold-gradient px-8 py-3 text-xs font-semibold tracking-wider text-gold-foreground uppercase shadow-gold hover:brightness-110 transition"
            >
              Plan Your Visit
            </Link>
          }
        />
      </section>

      {/* Stats Counter Section */}
      <section className="py-20 bg-navy border-y border-gold/20 px-6">
        <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <Reveal variant="up" delay={0.1}>
            <p className="font-display text-5xl md:text-6xl font-bold text-champagne">
              <Counter to={52} suffix="+" />
            </p>
            <p className="eyebrow mt-3 text-gold">Luxury Rooms &amp; Suites</p>
          </Reveal>

          <Reveal variant="up" delay={0.2}>
            <p className="font-display text-5xl md:text-6xl font-bold text-champagne">
              <Counter to={18500} suffix="+" />
            </p>
            <p className="eyebrow mt-3 text-gold">Happy Guests Served</p>
          </Reveal>

          <Reveal variant="up" delay={0.3}>
            <p className="font-display text-5xl md:text-6xl font-bold text-champagne">
              <Counter to={24} suffix="/7" />
            </p>
            <p className="eyebrow mt-3 text-gold">Dedicated Concierge</p>
          </Reveal>

          <Reveal variant="up" delay={0.4}>
            <p className="font-display text-5xl md:text-6xl font-bold text-champagne">
              <Counter to={99} suffix="%" />
            </p>
            <p className="eyebrow mt-3 text-gold">Satisfaction Rating</p>
          </Reveal>
        </div>
      </section>

      {/* The Meri Legacy & Why Stay */}
      <section className="py-28 bg-navy-deep px-6 relative">
        <div className="mx-auto max-w-7xl grid gap-16 lg:grid-cols-2 items-center">
          <Reveal variant="left">
            <p className="eyebrow text-gold">The Meri Legacy</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-navy-foreground md:text-5xl leading-tight">
              A Tradition of Warmth &amp; Regal Splendor
            </h2>
            <p className="mt-6 text-sm text-navy-foreground/75 leading-relaxed">
              Situated in Bareilly’s prime hub near Civil Lines and the Railway Station, Hotel
              Meri &amp; Residency blends timeless Indian hospitality with contemporary comforts.
              Whether arriving for business, leisure, or grand weddings, our team anticipates every
              desire with heartfelt devotion.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-gold/15 p-2.5 text-gold shrink-0 border border-gold/30">
                  <Shield className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-navy-foreground">
                    24/7 Safety &amp; Care
                  </h4>
                  <p className="mt-1 text-xs text-navy-foreground/65">
                    Key-card secure corridors, CCTV monitoring and round-the-clock attendants.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-gold/15 p-2.5 text-gold shrink-0 border border-gold/30">
                  <Award className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-navy-foreground">
                    Exquisite Gastronomy
                  </h4>
                  <p className="mt-1 text-xs text-navy-foreground/65">
                    Authentic heritage culinary recipes prepared fresh with local organic spices.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-champagne hover:bg-gold hover:text-gold-foreground transition shadow-card"
              >
                Discover Our Heritage <ArrowRight className="size-4" />
              </Link>
            </div>
          </Reveal>

          <Reveal variant="right" className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-gold/25 shadow-card sheen aspect-[4/5]">
                <img
                  src={IMG.lobby}
                  alt="Hotel Meri Lobby"
                  className="size-full object-cover hover:scale-105 transition duration-700"
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-gold/25 shadow-card sheen aspect-square">
                <img
                  src={IMG.lounge}
                  alt="Hotel Lounge"
                  className="size-full object-cover hover:scale-105 transition duration-700"
                />
              </div>
            </div>

            <div className="space-y-4 pt-8">
              <div className="overflow-hidden rounded-2xl border border-gold/25 shadow-card sheen aspect-square">
                <img
                  src={IMG.dining}
                  alt="Fine Dining"
                  className="size-full object-cover hover:scale-105 transition duration-700"
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-gold/25 shadow-card sheen aspect-[4/5]">
                <img
                  src={IMG.pool}
                  alt="Rooftop Pool"
                  className="size-full object-cover hover:scale-105 transition duration-700"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}
