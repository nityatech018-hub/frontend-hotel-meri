import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCw, X } from "lucide-react";
import { cn } from "@/lib/utils.js";

const EASE = [0.22, 1, 0.36, 1];

function useBodyLock(active) {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}

function Portal({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && typeof document !== "undefined"
    ? createPortal(children, document.body)
    : null;
}

/**
 * Card that flips over in 3D when clicked (or Enter/Space) to show its back.
 */
export function FlipCard({
  front,
  back,
  className,
  delay = 0,
  label = "Card",
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      className={cn("perspective-[1400px]", className)}
      initial={{ opacity: 0, y: 60, rotateX: -40 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: false, margin: "-40px" }}
      transition={{ duration: 1, delay, ease: EASE }}
    >
      <motion.button
        type="button"
        aria-pressed={flipped}
        aria-label={`${label} — ${flipped ? "show front" : "show details"}`}
        onClick={() => setFlipped((f) => !f)}
        className="relative grid h-full w-full cursor-pointer text-left transform-3d focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        animate={{ rotateY: flipped ? 180 : 0 }}
        whileHover={{ scale: 1.03, z: 30 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 110, damping: 15 }}
      >
        <div className="col-start-1 row-start-1 h-full backface-hidden">{front}</div>
        <div className="col-start-1 row-start-1 h-full rotate-y-180 backface-hidden">{back}</div>
      </motion.button>
    </motion.div>
  );
}

/** Small "tap to flip" hint with a spinning icon. */
export function FlipHint({ text = "Tap to discover", className }) {
  return (
    <span className={cn("eyebrow inline-flex items-center gap-2 !text-[0.6rem] text-gold", className)}>
      <RotateCw className="animate-spin-slow size-3.5" />
      {text}
    </span>
  );
}

/**
 * 3D Coverflow Lightbox Photo Viewer
 */
export function Lightbox3D({ photos = [], index = 0, onClose, onIndexChange }) {
  useBodyLock(photos.length > 0 && index >= 0);

  useEffect(() => {
    if (index < 0) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onIndexChange(Math.max(0, index - 1));
      if (e.key === "ArrowRight") onIndexChange(Math.min(photos.length - 1, index + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, onClose, onIndexChange]);

  if (index < 0 || photos.length === 0) return null;
  const current = photos[index];

  return (
    <Portal>
      <AnimatePresence>
        {index >= 0 && (
          <motion.div
            key="lightbox"
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[250] flex flex-col justify-between bg-navy-deep/95 backdrop-blur-xl p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between z-20" onClick={(e) => e.stopPropagation()}>
              <div>
                <p className="eyebrow text-gold">{current.tag || "Gallery"}</p>
                <h3 className="font-display text-2xl text-navy-foreground md:text-3xl">
                  {current.title}
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close lightbox"
                className="grid size-10 place-items-center rounded-full border border-gold/30 text-champagne hover:bg-gold hover:text-gold-foreground transition"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Central Stage */}
            <div
              className="relative my-auto flex items-center justify-center perspective-[1200px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute left-2 z-10 grid size-12 place-items-center rounded-full border border-gold/40 bg-navy/60 text-champagne transition hover:scale-110 hover:bg-gold hover:text-gold-foreground md:left-8 cursor-pointer disabled:opacity-30"
                disabled={index === 0}
                onClick={() => onIndexChange(Math.max(0, index - 1))}
              >
                <ChevronLeft className="size-6" />
              </button>

              <motion.div
                key={index}
                className="relative max-h-[60vh] max-w-4xl overflow-hidden rounded-2xl shadow-lift border border-gold/25"
                initial={{ opacity: 0, scale: 0.9, rotateY: 25 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotateY: -25 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <img
                  src={current.src}
                  alt={current.title}
                  className="max-h-[60vh] w-auto object-contain"
                />
              </motion.div>

              <button
                className="absolute right-2 z-10 grid size-12 place-items-center rounded-full border border-gold/40 bg-navy/60 text-champagne transition hover:scale-110 hover:bg-gold hover:text-gold-foreground md:right-8 cursor-pointer disabled:opacity-30"
                disabled={index === photos.length - 1}
                onClick={() => onIndexChange(Math.min(photos.length - 1, index + 1))}
              >
                <ChevronRight className="size-6" />
              </button>
            </div>

            {/* Cover-flow thumbnails */}
            <motion.div
              className="relative h-24 shrink-0 perspective-[900px] overflow-x-auto py-2 flex items-center justify-center gap-3 z-20"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
            >
              {photos.map((p, i) => {
                const isActive = i === index;
                return (
                  <button
                    key={p.src + i}
                    onClick={() => onIndexChange(i)}
                    className={cn(
                      "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg transition duration-300 ring-1",
                      isActive
                        ? "ring-2 ring-gold scale-105 opacity-100"
                        : "ring-gold/30 opacity-60 hover:opacity-90"
                    )}
                  >
                    <img src={p.src} alt="" className="size-full object-cover" />
                  </button>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

/**
 * StoryBook3D: Opens like a book: the photo page tilts in and the text page
 * swings open on its spine, then its lines rise in one by one.
 */
export function StoryBook3D({ story, onClose, action }) {
  useBodyLock(story !== null);

  useEffect(() => {
    if (!story) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [story, onClose]);

  return (
    <Portal>
      <AnimatePresence>
        {story && (
          <motion.div
            key="story"
            role="dialog"
            aria-modal="true"
            aria-label={story.title}
            className="fixed inset-0 z-[200] grid place-items-center overflow-y-auto bg-navy-deep/90 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { delay: 0.25 } }}
            onClick={onClose}
          >
            <div
              className="relative grid w-full max-w-5xl perspective-[2000px] md:grid-cols-2 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Photo page */}
              <motion.div
                className="relative h-64 origin-right overflow-hidden rounded-t-2xl md:h-auto md:min-h-[520px] md:rounded-l-2xl md:rounded-tr-none border border-gold/30"
                initial={{ rotateY: 35, x: 120, opacity: 0, scale: 0.85 }}
                animate={{ rotateY: 0, x: 0, opacity: 1, scale: 1 }}
                exit={{ rotateY: 35, x: 120, opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.8, ease: EASE }}
              >
                <motion.img
                  src={story.image}
                  alt={story.title}
                  className="absolute inset-0 size-full object-cover"
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 2.4, ease: "easeOut" }}
                />
                <div className="absolute inset-0 bg-hero-overlay" />
                <p className="eyebrow absolute bottom-5 left-6 text-champagne">{story.eyebrow}</p>
              </motion.div>

              {/* Text page swinging open on the spine */}
              <motion.div
                className="relative origin-top rounded-b-2xl bg-navy p-8 shadow-lift transform-3d md:origin-left md:rounded-r-2xl md:rounded-bl-none md:p-12 border border-gold/30"
                initial={{ rotateY: -120, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -120, opacity: 0, transition: { duration: 0.5 } }}
                transition={{ duration: 1.1, delay: 0.35, ease: EASE }}
              >
                <span className="pointer-events-none absolute inset-y-0 left-0 hidden w-8 bg-gradient-to-r from-navy-deep/60 to-transparent md:block" />

                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="absolute top-4 right-4 grid size-9 place-items-center rounded-full border border-gold/30 text-champagne transition hover:rotate-90 hover:border-gold hover:text-gold cursor-pointer"
                >
                  <X className="size-4" />
                </button>

                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.6 } } }}
                >
                  <motion.p
                    variants={{
                      hidden: { opacity: 0, y: 24, rotateX: -50 },
                      show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.6, ease: EASE } },
                    }}
                    className="eyebrow text-gold"
                  >
                    {story.eyebrow}
                  </motion.p>

                  <motion.h3
                    variants={{
                      hidden: { opacity: 0, y: 24, rotateX: -50 },
                      show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.6, ease: EASE } },
                    }}
                    className="mt-3 font-display text-4xl text-navy-foreground md:text-5xl"
                  >
                    {story.title}
                  </motion.h3>

                  <motion.span
                    variants={{
                      hidden: { opacity: 0, scaleX: 0 },
                      show: { opacity: 1, scaleX: 1, transition: { duration: 0.6, ease: EASE } },
                    }}
                    className="mt-5 block h-px w-24 bg-gold-gradient origin-left"
                  />

                  <motion.p
                    variants={{
                      hidden: { opacity: 0, y: 24, rotateX: -50 },
                      show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.6, ease: EASE } },
                    }}
                    className="mt-5 leading-relaxed text-navy-foreground/75"
                  >
                    {story.text}
                  </motion.p>

                  <div className="mt-5 space-y-2">
                    {(story.points || []).map((pt, i) => (
                      <motion.p
                        key={i}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
                        }}
                        className="flex items-center gap-3 text-sm text-navy-foreground"
                      >
                        <span className="text-gold">✦</span>
                        {pt}
                      </motion.p>
                    ))}
                  </div>

                  {story.note && (
                    <motion.p
                      variants={{
                        hidden: { opacity: 0 },
                        show: { opacity: 1, transition: { duration: 0.5 } },
                      }}
                      className="mt-5 text-xs text-navy-foreground/50 italic"
                    >
                      {story.note}
                    </motion.p>
                  )}

                  {action && (
                    <motion.div
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0 },
                      }}
                      className="mt-8"
                    >
                      {action}
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
