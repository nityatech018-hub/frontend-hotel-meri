import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter, Youtube } from "lucide-react";
import { useHotel } from "@/lib/hotel/store.jsx";
import { Logo } from "./Logo.jsx";
import { restartIntro } from "./introState.js";

export function SiteFooter() {
  const settings = useHotel((s) => s.settings);

  return (
    <footer className="relative overflow-hidden bg-navy-deep border-t border-gold/25 text-navy-foreground">
      <div className="h-0.5 w-full bg-gold-gradient" />
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Brand */}
        <div>
          <Link
            to="/"
            onClick={restartIntro}
            aria-label="Hotel Meri & Residency Home"
            className="inline-block hover:opacity-90 transition"
          >
            <Logo />
          </Link>
          <p className="mt-6 text-sm leading-relaxed text-navy-foreground/70">
            Royal comfort, heartfelt hospitality and unforgettable stays — welcome home to Hotel
            Meri &amp; Residency.
          </p>
          <div className="mt-6 flex gap-3">
            {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
                className="grid size-9 place-items-center rounded-full border border-gold/30 text-champagne hover:bg-gold hover:text-gold-foreground transition"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="eyebrow text-gold">Quick Links</h4>
          <ul className="mt-5 space-y-3 text-sm text-navy-foreground/75">
            <li>
              <Link to="/about" className="hover:text-champagne transition">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/rooms" className="hover:text-champagne transition">
                Rooms &amp; Suites
              </Link>
            </li>
            <li>
              <Link to="/gallery" className="hover:text-champagne transition">
                Gallery
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-champagne transition">
                Contact &amp; Location
              </Link>
            </li>
            <li>
              <Link to="/book" className="hover:text-champagne transition">
                Book a Stay
              </Link>
            </li>
            <li className="pt-2 border-t border-gold/15">
              <Link to="/reception" className="hover:text-champagne transition text-xs font-semibold text-gold flex items-center gap-1.5">
                • Reception Front Desk
              </Link>
            </li>
            <li>
              <Link to="/admin" className="hover:text-champagne transition text-xs font-semibold text-gold flex items-center gap-1.5">
                • Executive Admin Portal
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="eyebrow text-gold">Contact &amp; Location</h4>
          <ul className="mt-5 space-y-3.5 text-sm text-navy-foreground/75">
            <li className="flex items-start gap-3">
              <MapPin className="size-5 shrink-0 text-gold" />
              <span>{settings.address}</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="size-4 shrink-0 text-gold" />
              <a href={`tel:${settings.phone}`} className="hover:text-champagne transition">
                {settings.phone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="size-4 shrink-0 text-gold" />
              <a href={`mailto:${settings.email}`} className="hover:text-champagne transition">
                {settings.email}
              </a>
            </li>
          </ul>
        </div>

        {/* Timings & Policies */}
        <div>
          <h4 className="eyebrow text-gold">Hotel Timings</h4>
          <div className="mt-5 space-y-3 text-sm text-navy-foreground/75">
            <p>
              <strong className="text-navy-foreground">Check-in:</strong> {settings.checkInTime} onwards
            </p>
            <p>
              <strong className="text-navy-foreground">Check-out:</strong> Until {settings.checkOutTime}
            </p>
            <p className="pt-2 text-xs text-navy-foreground/50">
              *Early check-in and late check-out subject to availability.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gold/15 py-6 text-center text-xs text-navy-foreground/50">
        &copy; {new Date().getFullYear()} Hotel Meri &amp; Residency. All rights reserved.
      </div>
    </footer>
  );
}
