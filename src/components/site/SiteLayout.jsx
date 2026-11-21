import React from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { SiteNav } from "./SiteNav.jsx";
import { SiteFooter } from "./SiteFooter.jsx";
import { ScrollProgress, BackToTop } from "./Motion.jsx";
import { useHotelState } from "@/lib/hotel/store.jsx";

export function SiteLayout({ children }) {
  const state = useHotelState();
  const whatsapp = state?.settings?.whatsapp || "919412288334";

  return (
    <div className="flex min-h-screen flex-col bg-navy-deep text-navy-foreground relative selection:bg-gold selection:text-gold-foreground">
      {/* Golden reading scroll progress */}
      <ScrollProgress />

      {/* Main navigation */}
      <SiteNav />

      {/* Page content */}
      <main className="flex-1 overflow-x-clip">{children}</main>

      {/* Footer */}
      <SiteFooter />

      {/* Back to top button */}
      <BackToTop />

      {/* Pulsing floating WhatsApp button */}
      <motion.a
        href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 1.2 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="animate-pulse-ring fixed right-5 bottom-5 z-40 grid size-14 place-items-center rounded-full bg-emerald-600 text-white shadow-lift hover:bg-emerald-500 transition cursor-pointer"
      >
        <MessageCircle className="size-7" />
      </motion.a>
    </div>
  );
}
