import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Panel } from "@/components/dashboard/ui.jsx";
import { updateProfile, useHotelState } from "@/lib/hotel/store.jsx";
import {
  validatePhoneNumber,
  validateName,
  sanitizePhoneInput,
  sanitizeNameInput,
} from "@/lib/hotel/validation.js";

export default function AccountProfile() {
  const state = useHotelState();
  const sessionEmail = state.session?.email?.toLowerCase().trim() || "";
  const user = state.users?.find((u) => u.email?.toLowerCase().trim() === sessionEmail) || {
    name: state.session?.name || "Guest",
    email: state.session?.email || "",
    phone: "",
    city: "",
  };

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(sanitizePhoneInput(user.phone || ""));
  const [city, setCity] = useState(user.city || "");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const stays = state.bookings.filter(
    (b) => b.email?.toLowerCase().trim() === user.email?.toLowerCase().trim() && b.status === "Checked-Out"
  ).length;

  const dirty = name !== user.name || phone !== sanitizePhoneInput(user.phone || "") || city !== (user.city || "");

  function save(e) {
    e.preventDefault();
    if (saving) return;

    const nextErrors = {};
    const nameRes = validateName(name, { label: "Full name" });
    if (!nameRes.valid) nextErrors.name = nameRes.error;

    let formattedPhone = "";
    if (phone.trim()) {
      const phoneRes = validatePhoneNumber(phone);
      if (!phoneRes.valid) nextErrors.phone = phoneRes.error;
      else formattedPhone = phoneRes.formatted;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error(Object.values(nextErrors)[0]);
      return;
    }

    setSaving(true);
    setTimeout(() => {
      updateProfile(user.email, { name: nameRes.value, phone: formattedPhone, city: city.trim() });
      setSaving(false);
      toast.success("Profile updated successfully");
    }, 400);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-gold/30 bg-white text-center shadow-card text-[#061830]"
      >
        <div className="h-24 bg-gradient-to-r from-[#061830] via-[#0B1528] to-[#061830]" />
        <div className="mx-auto -mt-12 grid size-24 place-items-center rounded-full border-4 border-white bg-gold-gradient font-display text-4xl font-bold text-gold-foreground shadow-gold">
          {user.name.slice(0, 1)}
        </div>
        <div className="p-6">
          <p className="font-display text-2xl font-bold text-[#061830]">{user.name}</p>
          <p className="text-xs text-gold mt-1 font-semibold">
            Royal Guest · {stays} completed stay{stays === 1 ? "" : "s"}
          </p>
          <ul className="mt-5 space-y-2.5 text-left text-xs border-t border-gold/15 pt-4">
            <li className="flex items-center gap-2 text-[#475569]">
              <Mail className="size-4 text-gold shrink-0" /> {user.email}
            </li>
            <li className="flex items-center gap-2 text-[#475569]">
              <Phone className="size-4 text-gold shrink-0" /> {user.phone || "No phone added"}
            </li>
            <li className="flex items-center gap-2 text-[#475569]">
              <MapPin className="size-4 text-gold shrink-0" /> {user.city || "No city added"}
            </li>
          </ul>
        </div>
      </motion.div>

      <Panel
        title="Edit Profile Details"
        subtitle="These details will pre-fill your future room bookings"
        className="lg:col-span-2"
      >
        <form onSubmit={save} noValidate className="grid gap-5 sm:grid-cols-2 text-xs">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[#061830] font-semibold uppercase tracking-wide">
              <UserRound className="mr-1 inline size-3.5 text-gold" /> Full Name
            </label>
            <input
              value={name}
              maxLength={80}
              onChange={(e) => {
                setName(sanitizeNameInput(e.target.value));
                setErrors((p) => ({ ...p, name: undefined }));
              }}
              className={`w-full rounded-xl border bg-[#FAF7F2] px-4 py-2.5 text-sm text-[#061830] focus:outline-none ${
                errors.name ? "border-rose-500" : "border-gold/30 focus:border-gold"
              }`}
            />
            {errors.name && <p className="text-[11px] font-medium text-rose-600">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[#061830] font-semibold uppercase tracking-wide">Mobile Number (10 digits)</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => {
                setPhone(sanitizePhoneInput(e.target.value));
                setErrors((p) => ({ ...p, phone: undefined }));
              }}
              placeholder="9876543210"
              className={`w-full rounded-xl border bg-[#FAF7F2] px-4 py-2.5 text-sm text-[#061830] focus:outline-none ${
                errors.phone ? "border-rose-500" : "border-gold/30 focus:border-gold"
              }`}
            />
            {errors.phone && <p className="text-[11px] font-medium text-rose-600">{errors.phone}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[#061830] font-semibold uppercase tracking-wide">City / State</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Mumbai, New Delhi"
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-4 py-2.5 text-sm text-[#061830] focus:border-gold focus:outline-none"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[#061830] font-semibold uppercase tracking-wide">Email Address</label>
            <input
              value={user.email}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-[#64748b] cursor-not-allowed"
            />
            <p className="text-[11px] text-[#64748b]">
              Email is your unique sign-in identifier and cannot be modified.
            </p>
          </div>

          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              disabled={!dirty || saving}
              className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-7 py-3 text-xs font-bold uppercase tracking-wider text-gold-foreground shadow-gold disabled:opacity-50 hover:brightness-110 transition cursor-pointer"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {saving ? "Saving Changes…" : "Save Changes"}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
