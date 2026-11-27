import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Star,
  PlusCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Crown,
  FileText,
  Eye,
  Edit2,
  CheckCircle2,
  X,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { formatINR, formatDate, todayISO } from "@/lib/hotel/pricing.js";
import {
  addGuestCRM,
  updateGuestCRM,
  toggleVipGuest,
  useHotelState,
} from "@/lib/hotel/store.jsx";

export default function AdminGuestsPage() {
  const state = useHotelState();
  const [filterVip, setFilterVip] = useState("all"); // "all" | "vip" | "repeat"
  const [search, setSearch] = useState("");

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedProfileGuest, setSelectedProfileGuest] = useState(null);

  // Form State for New Guest
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Bareilly");
  const [idType, setIdType] = useState("Aadhaar Card");
  const [idNumber, setIdNumber] = useState("");
  const [preferences, setPreferences] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [isVip, setIsVip] = useState(false);

  const guests = state.guests || [];

  const filteredGuests = guests.filter((g) => {
    if (filterVip === "vip" && !g.vip) return false;
    if (filterVip === "repeat" && (g.totalStays || 0) < 2) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        g.name.toLowerCase().includes(q) ||
        (g.phone && g.phone.includes(q)) ||
        (g.email && g.email.toLowerCase().includes(q)) ||
        (g.city && g.city.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreateGuest = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please provide guest name.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please provide guest phone.");
      return;
    }

    addGuestCRM({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      city: city.trim(),
      idType,
      idNumber: idNumber.trim(),
      preferences: preferences.trim(),
      notes: internalNotes.trim(),
      vip: isVip,
    });

    toast.success(`Guest profile for ${name} created in Hotel Meri CRM!`);
    setAddModalOpen(false);
    setName("");
    setPhone("");
    setEmail("");
    setPreferences("");
    setInternalNotes("");
  };

  const handleToggleVip = (guest) => {
    toggleVipGuest(guest.id || guest.phone);
    toast.success(`VIP status toggled for ${guest.name}.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold/20 border border-gold/40 px-3 py-0.5 text-[11px] font-bold text-[#061830] uppercase tracking-wider">
              Guest Relations &amp; CRM Directory
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-[#061830] mt-1">
            Guest CRM &amp; Stay History
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Comprehensive directory of patrons: loyalty tiers, VIP designations, stay history, room preferences, and identity records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110 transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="size-4" /> Register New Guest
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Total Registered</span>
          <div className="text-2xl font-bold text-[#061830] mt-1">{guests.length}</div>
          <span className="text-[10px] text-emerald-600">Patron profiles in CRM</span>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gold font-bold">VIP Patrons</span>
          <div className="text-2xl font-bold text-gold mt-1">
            {guests.filter((g) => g.vip).length}
          </div>
          <span className="text-[10px] text-[#64748b]">Priority status</span>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Repeat Guests</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {guests.filter((g) => (g.totalStays || 0) >= 2).length}
          </div>
          <span className="text-[10px] text-blue-500">Multi-stay loyalty</span>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Active In-House</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {(state.bookings || []).filter((b) => b.status === "Checked-In").length}
          </div>
          <span className="text-[10px] text-emerald-600">Currently staying</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterVip("all")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
              filterVip === "all" ? "bg-gold text-gold-foreground shadow-sm" : "bg-slate-100 text-[#64748b]"
            }`}
          >
            All Guests ({guests.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterVip("vip")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
              filterVip === "vip" ? "bg-gold text-gold-foreground shadow-sm" : "bg-slate-100 text-[#64748b]"
            }`}
          >
            VIP Patrons ({guests.filter((g) => g.vip).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterVip("repeat")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
              filterVip === "repeat" ? "bg-gold text-gold-foreground shadow-sm" : "bg-slate-100 text-[#64748b]"
            }`}
          >
            Repeat Loyalists ({guests.filter((g) => (g.totalStays || 0) >= 2).length})
          </button>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 size-3.5 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search by name, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-gold/30 bg-[#FAF7F2] pl-8 pr-3 py-1.5 text-xs text-[#061830] focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      {/* Guest Table */}
      <div className="rounded-2xl border border-gold/30 bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#061830]">
            <thead>
              <tr className="border-b border-gold/20 bg-[#FAF7F2] text-[11px] uppercase tracking-wider text-gold font-semibold">
                <th className="py-3 px-4">Guest Name</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Total Stays</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4">VIP Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/15">
              {filteredGuests.map((g) => {
                const guestBookings = (state.bookings || []).filter(
                  (b) =>
                    (b.phone && b.phone === g.phone) ||
                    (b.guestName && b.guestName.toLowerCase() === g.name.toLowerCase())
                );
                const computedStays = Math.max(g.totalStays || 0, guestBookings.length);
                const computedSpent = guestBookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0) || g.totalSpent || 0;

                return (
                  <tr key={g.id || g.phone} className="hover:bg-gold/5 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#061830] text-sm">{g.name}</span>
                        {g.vip && (
                          <span className="rounded-full bg-gold/20 border border-gold/40 text-gold px-2 py-0.5 text-[9px] font-bold flex items-center gap-1">
                            <Crown className="size-2.5" /> VIP
                          </span>
                        )}
                      </div>
                      {g.preferences && (
                        <div className="text-[10px] text-[#64748b] italic truncate max-w-xs mt-0.5">
                          "{g.preferences}"
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#061830]">{g.phone}</div>
                      <div className="text-[11px] text-[#64748b]">{g.email || "No email on file"}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{g.city || "Bareilly"}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#061830]">{computedStays} Stay{computedStays === 1 ? "" : "s"}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gold">
                      {formatINR(computedSpent)}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleVip(g)}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold border transition cursor-pointer ${
                          g.vip
                            ? "bg-gold text-gold-foreground border-gold shadow-sm"
                            : "bg-[#FAF7F2] text-[#64748b] border-gold/20 hover:border-gold/50"
                        }`}
                      >
                        {g.vip ? "VIP Member ★" : "Standard"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedProfileGuest({ ...g, computedStays, computedSpent, bookings: guestBookings })}
                        className="rounded-full border border-gold/40 bg-[#FAF7F2] px-3.5 py-1.5 text-xs font-semibold text-[#061830] hover:bg-gold/15 transition cursor-pointer"
                      >
                        Full Profile →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guest Profile Dialog */}
      {selectedProfileGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl rounded-3xl border border-gold/30 bg-white p-6 sm:p-8 shadow-lift text-[#061830] space-y-5 my-8"
          >
            <div className="flex items-center justify-between border-b border-gold/15 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-gold/15 text-gold font-display font-bold text-lg">
                  {selectedProfileGuest.name.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl font-bold">{selectedProfileGuest.name}</h2>
                    {selectedProfileGuest.vip && (
                      <span className="rounded-full bg-gold text-navy-deep px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                        VIP Patron
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748b]">
                    {selectedProfileGuest.phone} • {selectedProfileGuest.email} • {selectedProfileGuest.city}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProfileGuest(null)}
                className="rounded-full p-1.5 hover:bg-slate-100 text-[#64748b]"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Profile Statistics */}
            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-[#FAF7F2] p-4 border border-gold/20 text-center text-xs">
              <div>
                <span className="text-[#64748b] block">Total Visits</span>
                <strong className="text-base font-bold text-[#061830]">{selectedProfileGuest.computedStays}</strong>
              </div>
              <div>
                <span className="text-[#64748b] block">Lifetime Revenue</span>
                <strong className="text-base font-bold text-gold">{formatINR(selectedProfileGuest.computedSpent)}</strong>
              </div>
              <div>
                <span className="text-[#64748b] block">Govt ID Verified</span>
                <strong className="text-xs font-bold text-[#061830]">{selectedProfileGuest.idType || "Aadhaar"}</strong>
              </div>
            </div>

            {/* Stay History */}
            <div>
              <h3 className="font-display text-sm font-bold text-[#061830] mb-2">
                Stay &amp; Reservation History
              </h3>
              {selectedProfileGuest.bookings && selectedProfileGuest.bookings.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedProfileGuest.bookings.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-xl border border-gold/20 bg-white p-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#061830]">Booking #{b.id}</span>
                        <div className="text-[11px] text-[#64748b]">
                          {formatDate(b.checkIn)} → {formatDate(b.checkOut)} ({b.categoryId} Room {b.roomNumber ? `• Suite ${b.roomNumber}` : ""})
                        </div>
                      </div>
                      <div className="text-right">
                        <strong className="font-bold text-[#061830] block">{formatINR(b.total)}</strong>
                        <span className="text-[10px] text-emerald-700 font-semibold">{b.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#64748b] italic">No prior online bookings recorded.</p>
              )}
            </div>

            <div className="pt-3 border-t border-gold/15 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProfileGuest(null)}
                className="rounded-full bg-[#061830] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white"
              >
                Close Profile
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Register New Guest Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-3xl border border-gold/30 bg-white p-6 shadow-lift text-[#061830] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gold/15 pb-3">
              <h2 className="font-display text-lg font-bold">Register Guest in CRM</h2>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="rounded-full p-1 hover:bg-slate-100 text-[#64748b]"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGuest} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Guest name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="guest@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    City / Native Location
                  </label>
                  <input
                    type="text"
                    placeholder="Bareilly / Delhi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Govt ID Type
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830]"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    ID Document #
                  </label>
                  <input
                    type="text"
                    placeholder="XXXX-XXXX-XXXX"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Hospitality Preferences
                </label>
                <input
                  type="text"
                  placeholder="e.g. Feather pillows, quiet corner, high floor suite"
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]"
                />
              </div>

              <div className="rounded-xl border border-gold/30 bg-gold/10 p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#061830] block">VIP Tier Status</span>
                  <span className="text-[10px] text-[#64748b]">Mark as esteemed luxury guest for complimentary hospitality</span>
                </div>
                <input
                  type="checkbox"
                  checked={isVip}
                  onChange={(e) => setIsVip(e.target.checked)}
                  className="size-5 rounded border-gold text-gold focus:ring-gold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-[#64748b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gold-gradient px-5 py-2 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
