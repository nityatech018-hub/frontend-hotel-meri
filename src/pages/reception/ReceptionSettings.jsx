import React, { useState } from "react";
import { User, Lock, Bell, Sliders, ShieldCheck, Save, Eye, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Panel } from "@/components/dashboard/ui.jsx";
import { updateProfile, useHotelState } from "@/lib/hotel/store.jsx";

export default function ReceptionSettings() {
  const state = useHotelState();
  const sessionUser = state.users.find((u) => u.email === state.session?.email) || {
    name: state.session?.name || "Front Desk Receptionist",
    email: state.session?.email || "reception@merihotel.demo",
    phone: "+91 90000 00000",
  };

  // Personal Profile state
  const [name, setName] = useState(sessionUser.name);
  const [phone, setPhone] = useState(sessionUser.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Operational preferences (stored in localStorage for front desk workstation)
  const [defaultGuests, setDefaultGuests] = useState(() => localStorage.getItem("rec_default_guests") || "2");
  const [defaultPayMethod, setDefaultPayMethod] = useState(() => localStorage.getItem("rec_default_pay_method") || "Cash");
  const [defaultNights, setDefaultNights] = useState(() => localStorage.getItem("rec_default_nights") || "1");
  const [autoPrintRegCard, setAutoPrintRegCard] = useState(() => localStorage.getItem("rec_autoprint_reg") !== "false");
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(() => localStorage.getItem("rec_autoprint_receipt") !== "false");

  // Notification Preferences
  const [notifyArrivals, setNotifyArrivals] = useState(true);
  const [notifyOverdue, setNotifyOverdue] = useState(true);
  const [notifyMaintenance, setNotifyMaintenance] = useState(true);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a valid staff name.");
      return;
    }

    const patch = { name: name.trim(), phone: phone.trim() };

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        toast.error("New password and confirm password do not match.");
        return;
      }
      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return;
      }
      patch.password = newPassword;
    }

    updateProfile(sessionUser.email, patch);
    setNewPassword("");
    setConfirmPassword("");
    setCurrentPassword("");
    toast.success("Receptionist profile successfully updated!");
  };

  const handleSaveOperationalPrefs = (e) => {
    e.preventDefault();
    localStorage.setItem("rec_default_guests", defaultGuests);
    localStorage.setItem("rec_default_pay_method", defaultPayMethod);
    localStorage.setItem("rec_default_nights", defaultNights);
    localStorage.setItem("rec_autoprint_reg", String(autoPrintRegCard));
    localStorage.setItem("rec_autoprint_receipt", String(autoPrintReceipt));
    toast.success("Front desk operational preferences saved!");
  };

  const hotelSettings = state.settings || {
    hotelName: "Hotel Meri & Residency",
    address: "Near Railway Station, Civil Lines, Bareilly, Uttar Pradesh 243001",
    phone: "+91 94122 56789",
    email: "reservations@hotelmeri.com",
    whatsapp: "+91 94122 56789",
    checkInTime: "14:00",
    checkOutTime: "11:00",
    taxRate: 0.05,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Panel 1: Personal Staff Profile & Security */}
        <Panel
          title="Receptionist Profile &amp; Credentials"
          subtitle="Manage your front desk account profile and sign-in password"
        >
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs text-[#061830]">
            <div>
              <label className="block font-bold text-gold uppercase mb-1">Staff Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gold uppercase mb-1">Account Email</label>
                <input
                  type="email"
                  disabled
                  value={sessionUser.email}
                  className="w-full rounded-xl border border-gold/20 bg-slate-100 px-3.5 py-2 text-xs text-[#64748b] cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block font-bold text-gold uppercase mb-1">Direct Contact Phone</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-gold/15 pt-3 space-y-3">
              <span className="text-[11px] font-bold text-gold uppercase tracking-wider block">
                Change Password (Leave blank to keep existing):
              </span>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#64748b] font-semibold mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-1.5 text-xs text-[#061830]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#64748b] font-semibold mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-1.5 text-xs text-[#061830]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gold-foreground shadow-gold hover:brightness-110 transition cursor-pointer"
              >
                <Save className="size-3.5" /> Save Profile Details
              </button>
            </div>
          </form>
        </Panel>

        {/* Panel 2: Front Desk Operational Preferences */}
        <Panel
          title="Workstation Operational Preferences"
          subtitle="Configure default behaviors for reservation creation and desk workflows"
        >
          <form onSubmit={handleSaveOperationalPrefs} className="space-y-4 text-xs text-[#061830]">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gold uppercase mb-1">Default Guest Count</label>
                <select
                  value={defaultGuests}
                  onChange={(e) => setDefaultGuests(e.target.value)}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]"
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests (Standard)</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gold uppercase mb-1">Default Payment Method</label>
                <select
                  value={defaultPayMethod}
                  onChange={(e) => setDefaultPayMethod(e.target.value)}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]"
                >
                  <option value="Cash">Cash at Desk</option>
                  <option value="UPI">UPI / Dynamic QR</option>
                  <option value="Card">Debit / Credit Card</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gold/15 pt-3 space-y-2.5">
              <span className="text-[11px] font-bold text-gold uppercase tracking-wider block">
                Printing &amp; Document Automation:
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPrintRegCard}
                  onChange={(e) => setAutoPrintRegCard(e.target.checked)}
                  className="size-4 accent-gold"
                />
                <span>Auto-open print dialog for Guest Registration Slip on Check-In</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPrintReceipt}
                  onChange={(e) => setAutoPrintReceipt(e.target.checked)}
                  className="size-4 accent-gold"
                />
                <span>Auto-prompt Folio Receipt on payment settlement</span>
              </label>
            </div>

            <div className="border-t border-gold/15 pt-3 space-y-2.5">
              <span className="text-[11px] font-bold text-gold uppercase tracking-wider block">
                Front Desk Notifications:
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyArrivals}
                  onChange={(e) => setNotifyArrivals(e.target.checked)}
                  className="size-4 accent-gold"
                />
                <span>Alert on new online arrivals scheduled for today</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOverdue}
                  onChange={(e) => setNotifyOverdue(e.target.checked)}
                  className="size-4 accent-gold"
                />
                <span>Alert on overdue departures past 11:00 AM</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gold-foreground shadow-gold hover:brightness-110 transition cursor-pointer"
              >
                <Sliders className="size-3.5" /> Save Desk Preferences
              </button>
            </div>
          </form>
        </Panel>
      </div>

      {/* Panel 3: Master Property Configuration (Read-Only for Reception) */}
      <Panel
        title="Hotel Master Property Configuration"
        subtitle="Global hotel settings · Managed exclusively by Executive Administration"
      >
        <div className="rounded-xl border border-gold/25 bg-[#FAF7F2] p-3 mb-4 text-xs text-[#64748b] flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <ShieldCheck className="size-4 text-emerald-600" />
            Global tariffs, tax configuration, staff roles and master policies are read-only for Front Desk Reception.
          </span>
          <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold uppercase border border-emerald-300">
            System Protected
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs bg-white p-4 rounded-xl border border-gold/20">
          <div>
            <span className="text-[#64748b] block text-[10px] uppercase font-bold">Property Name</span>
            <span className="font-bold text-[#061830] text-sm">{hotelSettings.hotelName}</span>
          </div>
          <div>
            <span className="text-[#64748b] block text-[10px] uppercase font-bold">GST Accommodation Rate</span>
            <span className="font-bold text-emerald-700 text-sm">5% GST on Rooms</span>
          </div>
          <div>
            <span className="text-[#64748b] block text-[10px] uppercase font-bold">Standard Check-In Time</span>
            <span className="font-bold text-[#061830]">{hotelSettings.checkInTime || "14:00 (2:00 PM)"}</span>
          </div>
          <div>
            <span className="text-[#64748b] block text-[10px] uppercase font-bold">Standard Check-Out Time</span>
            <span className="font-bold text-[#061830]">{hotelSettings.checkOutTime || "11:00 (11:00 AM)"}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-[#64748b] block text-[10px] uppercase font-bold">Property Address</span>
            <span className="font-medium text-[#061830]">{hotelSettings.address}</span>
          </div>
          <div>
            <span className="text-[#64748b] block text-[10px] uppercase font-bold">Official Phone</span>
            <span className="font-medium text-[#061830]">{hotelSettings.phone}</span>
          </div>
          <div>
            <span className="text-[#64748b] block text-[10px] uppercase font-bold">Official Email</span>
            <span className="font-medium text-[#061830]">{hotelSettings.email}</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
