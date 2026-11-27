import React from "react";
import { cn } from "@/lib/utils.js";

export function StatCard({ label, value, hint, icon: Icon, tone = "default" }) {
  const toneClasses = {
    default: "border-gold/30 bg-white shadow-card",
    gold: "border-gold bg-white shadow-gold",
    emerald: "border-emerald-300 bg-emerald-50/50 shadow-sm",
    blue: "border-blue-300 bg-blue-50/50 shadow-sm",
  }[tone];

  return (
    <div className={cn("rounded-2xl border p-5 transition hover:shadow-lift", toneClasses)}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-[#64748b] font-semibold">{label}</p>
        {Icon && <Icon className="size-5 text-gold shrink-0" />}
      </div>
      <p className="mt-3 font-display text-3xl font-bold text-[#061830]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[#64748b]">{hint}</p>}
    </div>
  );
}

export function Panel({ title, subtitle, action, className, children }) {
  return (
    <div className={cn("rounded-2xl border border-gold/30 bg-white p-6 shadow-card text-[#061830]", className)}>
      {(title || action) && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gold/15 pb-4">
          <div>
            {title && <h2 className="text-lg font-bold text-[#061830] tracking-wide font-display">{title}</h2>}
            {subtitle && <p className="text-xs text-[#64748b] mt-0.5">{subtitle}</p>}
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
            "rounded-full px-3.5 py-1 text-xs font-semibold tracking-wider uppercase transition cursor-pointer",
            value === opt
              ? "bg-gold text-gold-foreground font-bold shadow-gold"
              : "border border-gold/30 bg-[#FAF7F2] text-[#061830] hover:bg-gold/15"
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
      {Icon && <Icon className="mx-auto size-10 text-gold stroke-1" />}
      <h3 className="mt-3 text-base font-bold text-[#061830]">{title}</h3>
      {text && <p className="mt-1 text-xs text-[#64748b] max-w-sm mx-auto">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
