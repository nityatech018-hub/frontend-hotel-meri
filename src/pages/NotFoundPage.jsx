import React from "react";
import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout.jsx";

export default function NotFoundPage() {
  return (
    <SiteLayout>
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="rounded-full bg-gold/10 p-5 border border-gold/30">
          <Compass className="size-16 text-gold animate-pulse" />
        </div>
        <p className="mt-6 text-xs uppercase tracking-widest text-gold font-semibold">404 Error</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold text-[#061830]">
          Page Not Found
        </h1>
        <p className="mt-3 max-w-md text-sm text-[#475569] leading-relaxed font-medium">
          The sanctuary you are looking for does not exist or may have been relocated.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold-gradient px-8 py-3 text-xs font-semibold uppercase tracking-wider text-gold-foreground shadow-gold hover:brightness-110 transition"
        >
          <Home className="size-4" /> Return to Sanctuary
        </Link>
      </div>
    </SiteLayout>
  );
}
