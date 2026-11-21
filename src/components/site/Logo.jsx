import React from "react";
import { cn } from "@/lib/utils.js";

export const LOGO_URL = "/favicon.png";

export function LogoMark({ className }) {
  return (
    <img
      src="/favicon.png"
      alt="Hotel Meri & Residency"
      width={640}
      height={640}
      className={cn("h-12 w-12 rounded-full object-contain", className)}
    />
  );
}

export function Logo({ tone = "light", className }) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-lg font-semibold tracking-[0.18em]",
            tone === "light" ? "text-navy-foreground" : "text-navy"
          )}
        >
          HOTEL MERI
        </span>
        <span className="mt-1 text-[0.6rem] tracking-[0.42em] text-gold">
          &amp; RESIDENCY
        </span>
      </span>
    </span>
  );
}
