import React, { useState } from "react";
import { RotateCcw, Save, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Panel } from "@/components/dashboard/ui.jsx";
import { resetDemoData, updateSettings, useHotelState } from "@/lib/hotel/store.jsx";

export default function ReceptionSettings() {
  const state = useHotelState();
  const [form, setForm] = useState(state.settings || {});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const fields = [
    ["hotelName", "Hotel Property Name"],
    ["address", "Full Physical Address"],
    ["phone", "Primary Front Desk Phone"],
    ["email", "Official Hotel Email"],
    ["whatsapp", "WhatsApp Number", "Digits with country code, e.g. 919429488388"],
    ["checkInTime", "Standard Check-In Time"],
    ["checkOutTime", "Standard Check-Out Time"],
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Panel
        title="Hotel Property Settings"
        subtitle="These details are prominently featured on the website, receipts, invoices, and confirmation emails"
        className="xl:col-span-2"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateSettings(form);
            toast.success("Hotel settings successfully updated!");
          }}
          className="grid gap-4 sm:grid-cols-2 text-xs"
        >
          {fields.map(([k, label, hint]) => (
            <div
              key={k}
              className={
                k === "address" || k === "hotelName" ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"
              }
            >
              <label className="text-gold font-medium uppercase tracking-wide">{label}</label>
              <input
                value={String(form[k] ?? "")}
                onChange={(e) => set(k, e.target.value)}
                className="w-full rounded-xl border border-gold/30 bg-navy-deep px-4 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
              />
              {hint && <p className="text-[11px] text-navy-foreground/40">{hint}</p>}
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-gold font-medium uppercase tracking-wide">GST / Tax Rate (%)</label>
            <input
              type="number"
              min={0}
              max={40}
              value={Math.round((form.taxRate ?? 0.12) * 100)}
              onChange={(e) => set("taxRate", Math.max(0, Number(e.target.value)) / 100)}
              className="w-full rounded-xl border border-gold/30 bg-navy-deep px-4 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 pt-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-8 py-3 text-xs font-semibold uppercase tracking-wider text-gold-foreground shadow-gold hover:brightness-110 transition"
            >
              <Save className="size-4" /> Save Hotel Settings
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="System &amp; Demo Data" subtitle="Browser local storage control" className="h-fit">
        <p className="text-xs text-navy-foreground/70 leading-relaxed">
          All changes, reservations, room statuses, and settings are currently stored securely in your
          browser's localStorage cache. Resetting will restore the default initial configuration.
        </p>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 py-2.5 text-xs font-semibold uppercase tracking-wider text-rose-300 hover:bg-rose-500/10 transition"
        >
          <RotateCcw className="size-4" /> Reset Initial Demo Data
        </button>

        {/* Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/80 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-sm rounded-2xl border border-rose-500/30 bg-navy p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle className="size-6 shrink-0" />
                <h3 className="font-display text-lg font-bold">Reset Demo Data?</h3>
              </div>
              <p className="text-xs text-navy-foreground/75 leading-relaxed">
                This action will wipe all custom bookings, payments, and modified room rates,
                restoring the hotel system back to its original sample state.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="rounded-lg border border-gold/25 px-4 py-1.5 text-xs font-semibold text-champagne hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    resetDemoData();
                    setShowResetConfirm(false);
                    toast.success("Hotel database reset to defaults!");
                  }}
                  className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold uppercase text-white hover:bg-rose-500"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
