import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Settings,
  Building2,
  Save,
  Clock,
  Percent,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useHotelState } from "@/lib/hotel/store.jsx";

export default function AdminSettingsPage() {
  const state = useHotelState();
  const currentSettings = state.settings || {};

  const [hotelName, setHotelName] = useState(currentSettings.hotelName || "Hotel Meri & Residency");
  const [address, setAddress] = useState(currentSettings.address || "Civil Lines, Bareilly, Uttar Pradesh - 243001");
  const [phone, setPhone] = useState(currentSettings.phone || "+91 94120 00000");
  const [email, setEmail] = useState(currentSettings.email || "reservations@hotelmeri.com");
  const [gstin, setGstin] = useState(currentSettings.gstin || "09AAAAA0000A1Z5");
  const [checkInTime, setCheckInTime] = useState(currentSettings.checkInTime || "14:00");
  const [checkOutTime, setCheckOutTime] = useState(currentSettings.checkOutTime || "11:00");
  const [taxRate, setTaxRate] = useState(String((currentSettings.taxRate ?? 0.05) * 100));
  const [securityDeposit, setSecurityDeposit] = useState(String(currentSettings.defaultSecurityDeposit || 2000));

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (state.setSettings) {
      state.setSettings({
        hotelName,
        address,
        phone,
        email,
        gstin,
        checkInTime,
        checkOutTime,
        taxRate: Number(taxRate) / 100,
        defaultSecurityDeposit: Number(securityDeposit),
      });
    }
    toast.success("Hotel Meri property configuration saved successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold/20 border border-gold/40 px-3 py-0.5 text-[11px] font-bold text-[#061830] uppercase tracking-wider">
              Global Property Configuration
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-[#061830] mt-1">
            Property Policies &amp; System Parameters
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Manage legal entity details, GSTIN tax registration, standard arrival/departure times, and default security deposits.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
        {/* Section 1: Entity & Contact */}
        <div className="rounded-2xl border border-gold/30 bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-gold/15 pb-3">
            <Building2 className="size-5 text-gold" />
            <h2 className="font-display text-base font-bold text-[#061830]">
              Property Identity &amp; Legal Tax Profile
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                Property Brand Name
              </label>
              <input
                type="text"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm font-bold text-[#061830] focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                GSTIN / Tax Registration #
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm font-mono font-bold text-[#061830] focus:border-gold focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                Property Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                Official Reservations Contact
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Operational Policies */}
        <div className="rounded-2xl border border-gold/30 bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-gold/15 pb-3">
            <Clock className="size-5 text-gold" />
            <h2 className="font-display text-base font-bold text-[#061830]">
              Standard Timings &amp; Financial Parameters
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                Standard Check-In Time
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830] focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                Standard Check-Out Time
              </label>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830] focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                Default GST Tax (%)
              </label>
              <input
                type="number"
                min="0"
                max="28"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830] focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#061830] uppercase tracking-wider block mb-1">
                Default Security Deposit (₹)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(e.target.value)}
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830] focus:border-gold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-full bg-gold-gradient px-7 py-3 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110 transition cursor-pointer"
          >
            <Save className="size-4" /> Save System Settings
          </button>
        </div>
      </form>
    </div>
  );
}
