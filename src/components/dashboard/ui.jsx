import React from "react";
import { cn } from "@/lib/utils.js";

export function StatCard({ label, value, hint, icon: Icon, tone = "default" }) {
  const toneClasses = {
    default: "border-gold/25 bg-navy",
    gold: "border-gold/50 bg-navy shadow-gold",
    emerald: "border-emerald-500/30 bg-emerald-950/20",
    blue: "border-blue-500/30 bg-blue-950/20",
  }[tone];

  return (
    <div className={cn("rounded-2xl border p-5 shadow-lift", toneClasses)}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-navy-foreground/70">{label}</p>
        {Icon && <Icon className="size-5 text-gold" />}
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-navy-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-navy-foreground/60">{hint}</p>}
    </div>
  );
}

export function Panel({ title, subtitle, action, className, children }) {
  return (
    <div className={cn("rounded-2xl border border-gold/20 bg-navy p-6 shadow-lift", className)}>
      {(title || action) && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gold/15 pb-4">
          <div>
            {title && <h2 className="text-lg font-semibold text-navy-foreground tracking-wide">{title}</h2>}
            {subtitle && <p className="text-xs text-navy-foreground/60 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function FilterChips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-full px-3.5 py-1 text-xs font-medium tracking-wide uppercase transition",
            value === opt
              ? "bg-gold text-gold-foreground font-semibold shadow-gold"
              : "border border-gold/25 text-navy-foreground/70 hover:bg-white/5"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="py-12 text-center">
      {Icon && <Icon className="mx-auto size-10 text-gold/60 stroke-1" />}
      <h3 className="mt-3 text-base font-semibold text-navy-foreground">{title}</h3>
      {text && <p className="mt-1 text-xs text-navy-foreground/60 max-w-sm mx-auto">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
