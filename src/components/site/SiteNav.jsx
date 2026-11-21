import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, UserRound } from "lucide-react";
import { useHotel } from "@/lib/hotel/store.jsx";
import { cn } from "@/lib/utils.js";
import { Logo } from "./Logo.jsx";
import { restartIntro } from "./introState.js";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/rooms", label: "Rooms & Suites" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const session = useHotel((state) => state.session);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const accountLink = session?.role === "reception" ? (
    <Link
      to="/reception"
      className="flex items-center justify-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-xs tracking-wider text-champagne uppercase hover:bg-gold hover:text-gold-foreground transition"
    >
      <UserRound className="size-4" />
      Reception Desk
    </Link>
  ) : session ? (
    <Link
      to="/account"
      className="flex items-center justify-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-xs tracking-wider text-champagne uppercase hover:bg-gold hover:text-gold-foreground transition"
    >
      <UserRound className="size-4" />
      {session.name.split(" ")[0]}
    </Link>
  ) : (
    <Link
      to="/login"
      className="flex items-center justify-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-xs tracking-wider text-champagne uppercase hover:bg-gold hover:text-gold-foreground transition"
    >
      <UserRound className="size-4" />
      Sign In
    </Link>
  );

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || open
          ? "bg-[#061830] border-b border-gold/25 shadow-lift py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link
          to="/"
          onClick={() => {
            setOpen(false);
            restartIntro();
          }}
          aria-label="Hotel Meri & Residency Home"
        >
          <Logo />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "text-xs tracking-[0.16em] uppercase transition hover:text-champagne",
                  isActive ? "text-champagne font-semibold border-b border-gold pb-1" : "text-navy-foreground/80"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-4 md:flex">
          {accountLink}
          <Link
            to="/book"
            className="rounded-full bg-gold-gradient px-5 py-2.5 text-xs font-semibold tracking-wider text-gold-foreground uppercase shadow-gold hover:brightness-110 transition"
          >
            Book Now
          </Link>
        </div>

        {/* Mobile menu toggle button */}
        <button
          onClick={() => setOpen(!open)}
          className="grid size-10 place-items-center rounded-full border border-gold/40 text-champagne hover:bg-gold hover:text-gold-foreground transition cursor-pointer md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Dim Backdrop behind drawer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 -z-10 bg-black/60 backdrop-blur-sm md:hidden"
            />

            {/* Solid Drawer Content */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-gold/25 bg-[#061830] shadow-2xl md:hidden"
            >
              <div className="flex flex-col gap-1 px-6 pt-3 pb-8 bg-[#061830]">
                {LINKS.map((link, index) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + index * 0.04 }}
                  >
                    <NavLink
                      to={link.to}
                      end={link.to === "/"}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "block py-3 font-display text-2xl tracking-wide transition-colors border-b border-gold/10",
                          isActive
                            ? "text-gold font-semibold"
                            : "text-navy-foreground/80 hover:text-champagne"
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}

                <div className="mt-5 flex flex-col gap-3 pt-3">
                  <div onClick={() => setOpen(false)}>
                    {accountLink}
                  </div>
                  <Link
                    to="/book"
                    onClick={() => setOpen(false)}
                    className="w-full text-center rounded-full bg-gold-gradient py-3 text-xs font-semibold tracking-wider text-gold-foreground uppercase shadow-gold hover:brightness-110 transition"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
