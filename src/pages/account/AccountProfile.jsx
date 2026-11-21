import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Panel } from "@/components/dashboard/ui.jsx";
import { updateProfile, useHotelState } from "@/lib/hotel/store.jsx";
import { validatePhoneNumber } from "@/lib/hotel/pricing.js";

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
  const [phone, setPhone] = useState(user.phone || "");
  const [city, setCity] = useState(user.city || "");
  const [saving, setSaving] = useState(false);

  const stays = state.bookings.filter(
    (b) => b.email?.toLowerCase().trim() === user.email?.toLowerCase().trim() && b.status === "Checked-Out"
  ).length;

  const dirty = name !== user.name || phone !== user.phone || city !== (user.city || "");

  function save(e) {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Please enter your full name (at least 2 characters).");
      return;
    }

    let formattedPhone = phone.trim();
    if (phone.trim()) {
      const phoneRes = validatePhoneNumber(phone);
      if (!phoneRes.valid) {
        toast.error(phoneRes.error);
        return;
      }
      formattedPhone = phoneRes.formatted;
    }

    setSaving(true);
    setTimeout(() => {
      updateProfile(user.email, { name: name.trim(), phone: formattedPhone, city: city.trim() });
      setSaving(false);
      toast.success("Profile updated successfully");
    }, 400);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-gold/20 bg-navy text-center shadow-lift"
      >
        <div className="h-24 bg-gradient-to-r from-navy via-navy-deep to-navy" />
        <div className="mx-auto -mt-12 grid size-24 place-items-center rounded-full border-4 border-navy bg-gold-gradient font-display text-4xl text-gold-foreground shadow-gold">
          {user.name.slice(0, 1)}
        </div>
        <div className="p-6">
          <p className="font-display text-2xl font-semibold text-navy-foreground">{user.name}</p>
          <p className="text-xs text-gold mt-1">
            Royal Guest · {stays} completed stay{stays === 1 ? "" : "s"}
          </p>
          <ul className="mt-5 space-y-2.5 text-left text-xs border-t border-gold/15 pt-4">
            <li className="flex items-center gap-2 text-navy-foreground/80">
              <Mail className="size-4 text-gold shrink-0" /> {user.email}
            </li>
            <li className="flex items-center gap-2 text-navy-foreground/80">
              <Phone className="size-4 text-gold shrink-0" /> {user.phone || "No phone added"}
            </li>
            <li className="flex items-center gap-2 text-navy-foreground/80">
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
        <form onSubmit={save} className="grid gap-5 sm:grid-cols-2 text-xs">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-gold font-medium uppercase tracking-wide">
              <UserRound className="mr-1 inline size-3.5" /> Full Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-navy-deep px-4 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-gold font-medium uppercase tracking-wide">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-gold/30 bg-navy-deep px-4 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-gold font-medium uppercase tracking-wide">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Mumbai, New Delhi"
              className="w-full rounded-xl border border-gold/30 bg-navy-deep px-4 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-gold font-medium uppercase tracking-wide">Email Address</label>
            <input
              value={user.email}
              disabled
              className="w-full rounded-xl border border-gold/15 bg-navy-deep/50 px-4 py-2.5 text-sm text-navy-foreground/50 cursor-not-allowed"
            />
            <p className="text-[11px] text-navy-foreground/40">
              Email is your unique sign-in identifier and cannot be modified.
            </p>
          </div>

          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              disabled={!dirty || saving}
              className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-7 py-3 text-xs font-semibold uppercase tracking-wider text-gold-foreground shadow-gold disabled:opacity-50 hover:brightness-110 transition"
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
