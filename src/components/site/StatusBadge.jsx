import React from "react";
import { cn } from "@/lib/utils.js";

const STATUS_STYLES = {
  Pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Confirmed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "Checked-In": "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "Checked-Out": "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  Cancelled: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

const PAYMENT_STYLES = {
  Paid: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Partial: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Unpaid: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  Refunded: "bg-purple-500/15 text-purple-300 border-purple-500/30",
};

export function StatusBadge({ status, className }) {
  const style = STATUS_STYLES[status] || "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        style,
        className
      )}
    >
      {status}
    </span>
  );
}

export function PaymentBadge({ payment, className }) {
  const style = PAYMENT_STYLES[payment] || "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        style,
        className
      )}
    >
      {payment}
    </span>
  );
}
