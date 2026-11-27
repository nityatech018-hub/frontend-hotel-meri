import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";

const FROM = {
  up: { opacity: 0, y: 50, rotateX: -32, transformPerspective: 1200 },
  left: { opacity: 0, x: -60, rotateY: 38, transformPerspective: 1200 },
  right: { opacity: 0, x: 60, rotateY: -38, transformPerspective: 1200 },
  zoom: { opacity: 0, scale: 0.82, rotateX: 24, transformPerspective: 1200 },
  wipe: { opacity: 1, clipPath: "inset(0% 0% 100% 0%)", scale: 1.08 },
  flip: { opacity: 0, rotateY: -90, transformPerspective: 1200 },
};

const TO = {
  up: { opacity: 1, y: 0, rotateX: 0 },
  left: { opacity: 1, x: 0, rotateY: 0 },
  right: { opacity: 1, x: 0, rotateY: 0 },
  zoom: { opacity: 1, scale: 1, rotateX: 0 },
  wipe: { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", scale: 1 },
  flip: { opacity: 1, rotateY: 0 },
};

/** Animates its children into view on scroll: 3D rise, door-swing, zoom, flip or curtain wipe. */
export function Reveal({
  children,
  delay = 0,
  y,
  variant = "up",
  className,
}) {
  const from = y !== undefined && variant === "up" ? { ...FROM.up, y } : FROM[variant] || FROM.up;
  const to = TO[variant] || TO.up;

  return (
    <motion.div
      className={className}
      initial={from}
      whileInView={{ ...to, transitionEnd: { filter: "none", clipPath: "none" } }}
      viewport={{ once: false, margin: "-60px" }}
      transition={{ duration: variant === "wipe" ? 1.2 : 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Animated number counter on scroll. */
export function Counter({ to = 0, suffix = "", duration = 1.8 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) {
      setVal(0);
      return;
    }
    const c = animate(0, to, { duration, ease: "easeOut", onUpdate: (v) => setVal(v) });
    return () => c.stop();
  }, [inView, to, duration]);

  return (
    <span ref={ref}>
      {Math.round(val).toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

/** Luxury Section Title with expanding golden lines and 3D title animation. */
export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = "center",
  tone = "dark",
}) {
  const center = align === "center";

  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <motion.p
        className={`eyebrow flex items-center gap-3 text-gold ${center ? "justify-center" : ""}`}
        initial={{ opacity: 0, letterSpacing: "0.1em" }}
        whileInView={{ opacity: 1, letterSpacing: "0.32em" }}
        viewport={{ once: false, margin: "-60px" }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.span
          className="h-px w-10 origin-right bg-gold-gradient"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 0.9, delay: 0.2 }}
        />
        {eyebrow}
        <motion.span
          className="h-px w-10 origin-left bg-gold-gradient"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 0.9, delay: 0.2 }}
        />
      </motion.p>

      <motion.h2
        className={`mt-4 text-4xl leading-tight font-display md:text-5xl ${
          tone === "dark" ? "text-navy-foreground" : "text-navy"
        }`}
        initial={{
          opacity: 0,
          y: 30,
          rotateX: -55,
          transformPerspective: 900,
          clipPath: "inset(0% 0% 100% 0%)",
        }}
        whileInView={{
          opacity: 1,
          y: 0,
          rotateX: 0,
          clipPath: "inset(0% 0% -20% 0%)",
          transitionEnd: { clipPath: "none" },
        }}
        viewport={{ once: false, margin: "-60px" }}
        transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        {title}
      </motion.h2>

      {subtitle && (
        <motion.p
          className={`mt-4 text-base leading-relaxed ${
            tone === "dark" ? "text-navy-foreground/75" : "text-[#475569]"
          }`}
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
          viewport={{ once: false, margin: "-60px" }}
          transition={{ duration: 0.9, delay: 0.3 }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
