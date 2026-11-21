import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useScroll } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useIntroDone } from "./introState.js";

const EASE = [0.22, 1, 0.36, 1];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 36, rotateX: -25 },
  show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.7, ease: EASE } },
};

/** Children wrapped in <StaggerItem> appear one after another. */
export function Stagger({ children, className, inView = false }) {
  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      {...(inView
        ? { whileInView: "show", viewport: { once: false, margin: "-40px" } }
        : { animate: "show" })}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }) {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}

/** Endless gold ribbon of short phrases — used between sections. */
export function Marquee({ items = [] }) {
  const row = [...items, ...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-gold/25 bg-navy-deep py-5 select-none">
      <div className="animate-marquee flex w-max gap-12 whitespace-nowrap">
        {row.map((t, i) => (
          <span
            key={i}
            className="flex items-center gap-12 font-display text-2xl text-navy-foreground/85 italic md:text-3xl"
          >
            {t}
            <span className="text-gold not-italic">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Words rise one by one out of a mask in 3D. Pass plain text. */
export function SplitText({ text, className, delay = 0, stagger = 0.07, inView = false }) {
  if (!text) return null;
  const words = text.split(" ");
  const trigger = inView
    ? { whileInView: "show", viewport: { once: false, margin: "-40px" } }
    : { animate: "show" };

  return (
    <motion.span
      className={className}
      initial="hidden"
      {...trigger}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom" aria-hidden>
          <motion.span
            className="inline-block origin-bottom"
            style={{ transformPerspective: 600 }}
            variants={{
              hidden: { y: "110%", rotate: 6, rotateX: -80, opacity: 0 },
              show: {
                y: "0%",
                rotate: 0,
                rotateX: 0,
                opacity: 1,
                transition: { duration: 0.85, ease: EASE },
              },
            }}
          >
            {w}
            {i < words.length - 1 ? "\u00a0" : ""}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/** Rising gold sparks for dark backgrounds. */
export function GoldSparks({ count = 16 }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (i * 41) % 100,
        delay: (i % 7) * 0.6,
        dur: 6 + (i % 4),
        size: 2 + (i % 3),
      })),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {sparks.map((p, i) => (
        <span
          key={i}
          className="animate-rise absolute bottom-0 rounded-full bg-champagne/80 shadow-gold"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Slowly drifting gold/blue light behind a dark section. */
export function Aurora() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="aurora-a absolute -top-1/4 -left-1/4 size-[70%] rounded-full" />
      <div className="aurora-b absolute -right-1/4 -bottom-1/4 size-[70%] rounded-full" />
    </div>
  );
}

/** Card that tilts in 3D toward the mouse and lifts on hover. */
export function useTilt(strength = 8) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 200, damping: 18 });
  const rotateY = useSpring(ry, { stiffness: 200, damping: 18 });

  function onMouseMove(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rx.set(-py * strength);
    ry.set(px * strength);
  }

  function onMouseLeave() {
    rx.set(0);
    ry.set(0);
  }

  return {
    style: { rotateX, rotateY, transformPerspective: 1000 },
    onMouseMove,
    onMouseLeave,
  };
}

/** Gold ring that trails the mouse on desktop and grows over links/buttons. */
export function CursorGlow() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 350, damping: 30, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 350, damping: 30, mass: 0.5 });
  const [enabled, setEnabled] = useState(false);
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setEnabled(true);

    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target;
      setHover(!!t?.closest("a,button,[role=button],input,select,textarea,label"));
    };

    const press = () => setDown(true);
    const release = () => setDown(false);

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
    };
  }, [x, y]);

  if (!enabled) return null;
  return (
    <>
      <motion.div
        className="cursor-ring pointer-events-none fixed top-0 left-0 z-[300] rounded-full"
        style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
        animate={{ width: hover ? 56 : 32, height: hover ? 56 : 32, scale: down ? 0.8 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      />
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[300] size-1.5 rounded-full bg-gold"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
      />
    </>
  );
}

/** Reading progress bar along top of screen. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 25, mass: 0.3 });
  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-gold-gradient shadow-gold"
      style={{ scaleX }}
    />
  );
}

/** Floating back to top button. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <motion.button
      onClick={scrollToTop}
      aria-label="Back to top"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-24 right-5 z-40 grid size-11 place-items-center rounded-full border border-gold/40 bg-navy/90 text-champagne backdrop-blur-md shadow-lift transition hover:bg-gold hover:text-gold-foreground cursor-pointer"
    >
      <ArrowUp className="size-5" />
    </motion.button>
  );
}

/**
 * Navy curtain with the hotel crest that wipes away whenever you move to a new
 * page section. Skipped on the first load because the logo intro handles that.
 */
export function RouteCurtain({ section, logo = "/favicon.png" }) {
  const introDone = useIntroDone();
  const [wipe, setWipe] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!introDone) return;
    setWipe((n) => n + 1);
  }, [section, introDone]);

  if (!introDone || wipe === 0) return null;

  return (
    <motion.div
      key={wipe}
      className="pointer-events-none fixed inset-0 z-[150] grid place-items-center bg-navy-deep"
      initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
      animate={{ clipPath: "inset(0% 0% 100% 0%)" }}
      transition={{ duration: 0.9, ease: EASE, delay: 0.45 }}
    >
      <motion.img
        src={logo}
        alt="Hotel Meri Crest"
        className="size-20 rounded-full object-contain p-2"
        initial={{ scale: 0.6, opacity: 0, rotate: -30 }}
        animate={{ scale: [0.6, 1, 0.9], opacity: [0, 1, 0], rotate: 0 }}
        transition={{ duration: 0.9, ease: EASE }}
      />
      <motion.span
        className="absolute inset-x-0 bottom-0 h-[3px] bg-gold-gradient"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
      />
    </motion.div>
  );
}

/** Gold bar that sweeps across the top of the screen on every navigation. */
export function RouteProgress() {
  const { pathname } = useLocation();
  const introDone = useIntroDone();

  if (!introDone) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-0.5 origin-left bg-gold-gradient shadow-gold"
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: [1, 1, 0] }}
        transition={{ duration: 0.9, ease: EASE, opacity: { times: [0, 0.7, 1], duration: 0.9 } }}
      />
    </AnimatePresence>
  );
}

/**
 * Fades each page in when you arrive on it. Opacity only: a transform here would
 * break the fixed navbar and intro overlay while the animation runs.
 */
export function PageTransition({ children, id }) {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="min-h-screen flex flex-col"
    >
      {children}
    </motion.div>
  );
}

/**
 * Resets scroll position to the very top immediately on every route navigation.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    } catch {
      window.scrollTo(0, 0);
    }
    window.scrollTo(0, 0);
    if (typeof document !== "undefined") {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}
