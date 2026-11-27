import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  SearchX,
  Search,
  X,
  FileText,
  UserPlus,
  Crown,
  MapPin,
  ShieldCheck,
  Pencil,
  Clock,
  Sparkles,
  MessageSquare,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState, Panel } from "@/components/dashboard/ui.jsx";
import { StatusBadge } from "@/components/site/StatusBadge.jsx";
import { formatDate, formatINR, todayISO } from "@/lib/hotel/pricing.js";
import {
  getCategory,
  addGuestCRM,
  updateGuestCRM,
  useHotelState,
} from "@/lib/hotel/store.jsx";

export default function ReceptionGuests() {
  const state = useHotelState();
  const today = todayISO();
  const [q, setQ] = useState("");
  const [openGuest, setOpenGuest] = useState(null);
  const [addGuestModal, setAddGuestModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);

  // Combine state.guests with any guests from bookings to ensure comprehensive CRM
  const guestList = useMemo(() => {
    const map = new Map();

    // From state.guests
    (state.guests || []).forEach((g) => {
      map.set(g.phone || g.email || g.id, {
        id: g.id,
        name: g.name,
        email: g.email || "",
        phone: g.phone || "",
        city: g.city || "Bareilly",
        address: g.address || "",
        idType: g.idType || "Aadhaar Card",
        idNumber: g.idNumber || "",
        vip: Boolean(g.vip),
        preferences: g.preferences || "",
        notes: g.notes || "",
        complaints: g.complaints || "",
        totalSpent: Number(g.totalSpent) || 0,
        totalStays: Number(g.totalStays) || 0,
        bookings: [],
        inHouse: false,
        activeRoom: null,
      });
    });

    // Populate from bookings
    (state.bookings || []).forEach((b) => {
      const key = b.phone || b.email || b.id;
      let g = map.get(key);
      if (!g) {
        g = {
          id: b.guestId || `GST-${b.id}`,
          name: b.guestName,
          email: b.email || "",
          phone: b.phone || "",
          city: "Bareilly",
          address: "",
          idType: b.idType || "Aadhaar Card",
          idNumber: b.idNumber || "",
          vip: false,
          preferences: b.requests || "",
          notes: `Created from booking #${b.id}`,
          complaints: "",
          totalSpent: 0,
          totalStays: 0,
          bookings: [],
          inHouse: false,
          activeRoom: null,
        };
        map.set(key, g);
      }
      g.bookings.push(b);
      if (b.status !== "Cancelled") g.totalSpent += Number(b.amountPaid || 0);
      if (b.status === "Checked-In") {
        g.inHouse = true;
        g.activeRoom = b.roomNumber;
      }
      if (b.status === "Checked-Out") {
        g.totalStays = Math.max(g.totalStays, g.bookings.length);
      }
    });

    return [...map.values()].sort((a, b) => b.totalSpent - a.totalSpent);
  }, [state.guests, state.bookings]);

  const term = q.trim().toLowerCase();
  const list = guestList.filter(
    (g) =>
      !term ||
      g.name.toLowerCase().includes(term) ||
      (g.email && g.email.toLowerCase().includes(term)) ||
      (g.phone && g.phone.includes(term)) ||
      (g.id && g.id.toLowerCase().includes(term))
  );

  return (
    <>
      <Panel
        title="Guest Directory &amp; Front Desk CRM"
        subtitle={`${guestList.length} verified guest records · ${
          guestList.filter((g) => g.inHouse).length
        } currently staying in-house`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setAddGuestModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gold-gradient px-3.5 py-2 text-xs font-bold text-gold-foreground hover:brightness-110 transition shadow-sm cursor-pointer"
            >
              <UserPlus className="size-3.5" /> Register New Guest
            </button>
            <div className="relative w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gold" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, phone, ID, email..."
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] pl-9 pr-3 py-2 text-xs text-[#061830] placeholder:text-[#64748b] focus:border-gold focus:outline-none"
              />
            </div>
          </div>
        }
      >
        {list.length === 0 ? (
          <EmptyState icon={SearchX} title="No guest profiles match this query" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {list.map((g) => (
              <button
                key={g.id || g.phone}
                type="button"
                onClick={() => setOpenGuest(g)}
                className="flex items-center gap-4 rounded-xl border border-gold/30 bg-[#FAF7F2] p-4 text-left transition hover:border-gold hover:bg-gold/10 cursor-pointer shadow-sm relative group"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#061830] font-display text-lg font-bold text-gold border border-gold/40 shadow-sm relative">
                  {g.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                  {g.vip && (
                    <Crown className="absolute -top-1 -right-1 size-4 text-gold fill-gold drop-shadow" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold text-[#061830] text-sm">{g.name}</p>
                    {g.vip && (
                      <span className="rounded-full bg-gold/20 border border-gold px-1.5 py-0.2 text-[9px] font-bold text-navy-deep uppercase">
                        VIP
                      </span>
                    )}
                    {g.inHouse && (
                      <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        In Room {g.activeRoom}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-[#64748b] mt-0.5">
                    {g.phone} {g.email ? `· ${g.email}` : ""}
                  </p>
                  <p className="text-xs text-[#061830] font-semibold mt-1">
                    {g.bookings.length} stay{g.bookings.length !== 1 ? "s" : ""} · Total Spend: {formatINR(g.totalSpent)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Panel>

      {/* Guest Profile Modal */}
      <AnimatePresence>
        {openGuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/80 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl rounded-2xl border border-gold/40 bg-white p-6 shadow-2xl space-y-4 text-[#061830] max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between border-b border-gold/15 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-2xl font-bold text-[#061830]">
                      {openGuest.name}
                    </h3>
                    {openGuest.vip && (
                      <span className="rounded-full bg-gold/25 border border-gold px-2 py-0.5 text-[10px] font-bold text-navy-deep uppercase flex items-center gap-1">
                        <Crown className="size-3" /> VIP Guest
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-[#64748b] mt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <Phone className="size-3.5 text-gold" /> {openGuest.phone}
                    </span>
                    {openGuest.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="size-3.5 text-gold" /> {openGuest.email}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setOpenGuest(null)}
                  className="rounded-lg p-1 text-[#64748b] hover:text-[#061830] cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Guest Profile KPI grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-gold/25 bg-[#FAF7F2] p-3 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gold">Total Stays</p>
                  <p className="mt-1 font-display text-xl font-bold text-[#061830]">
                    {openGuest.bookings.length}
                  </p>
                </div>
                <div className="rounded-xl border border-gold/25 bg-[#FAF7F2] p-3 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gold">Total Paid</p>
                  <p className="mt-1 font-display text-xl font-bold text-emerald-600">
                    {formatINR(openGuest.totalSpent)}
                  </p>
                </div>
                <div className="rounded-xl border border-gold/25 bg-[#FAF7F2] p-3 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gold">Current State</p>
                  <p className="mt-1 font-display text-xs font-bold text-navy-deep">
                    {openGuest.inHouse ? `In Room ${openGuest.activeRoom}` : "Checked-Out"}
                  </p>
                </div>
              </div>

              {/* Details & Preferences */}
              <div className="rounded-xl border border-gold/20 bg-[#FAF7F2] p-3.5 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gold uppercase text-[10px]">
                    Guest Preferences &amp; Gov ID
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGuest(openGuest);
                      setOpenGuest(null);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-gold font-bold hover:underline"
                  >
                    <Pencil className="size-3" /> Edit Profile
                  </button>
                </div>
                <p>
                  <strong>ID Proof:</strong> {openGuest.idType}: {openGuest.idNumber || "Not recorded yet"}
                </p>
                <p>
                  <strong>Address:</strong> {openGuest.address || openGuest.city || "Bareilly, Uttar Pradesh"}
                </p>
                {openGuest.preferences && (
                  <p className="text-gold font-medium">
                    <strong>Preferences:</strong> “{openGuest.preferences}”
                  </p>
                )}
                {openGuest.notes && (
                  <p className="text-[#64748b]">
                    <strong>Staff Notes:</strong> {openGuest.notes}
                  </p>
                )}
              </div>

              {/* Reservation History */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gold mb-2">
                  Stay &amp; Reservation History ({openGuest.bookings.length})
                </p>
                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {openGuest.bookings.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gold/25 bg-[#FAF7F2] p-2.5 text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#061830]">
                          {getCategory(state, b.categoryId)?.name} {b.roomNumber ? `· Room ${b.roomNumber}` : ""}
                        </p>
                        <p className="text-[10px] text-[#64748b]">
                          #{b.id} · {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={b.status} />
                        <span className="font-bold text-navy-deep">{formatINR(b.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gold/15">
                <button
                  type="button"
                  onClick={() => setOpenGuest(null)}
                  className="rounded-full border border-gold/40 bg-[#FAF7F2] px-5 py-2 text-xs font-bold uppercase text-[#061830] hover:bg-gold/15 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Register New Guest Modal */}
      {addGuestModal && (
        <GuestFormModal
          title="Register New Guest"
          onClose={() => setAddGuestModal(false)}
          onSave={(data) => {
            addGuestCRM(data);
            toast.success(`Registered new guest: ${data.name}`);
            setAddGuestModal(false);
          }}
        />
      )}

      {/* Edit Guest Modal */}
      {editingGuest && (
        <GuestFormModal
          title={`Edit Profile — ${editingGuest.name}`}
          initialData={editingGuest}
          onClose={() => setEditingGuest(null)}
          onSave={(data) => {
            updateGuestCRM(editingGuest.id, data);
            toast.success(`Updated guest profile for ${data.name}`);
            setEditingGuest(null);
          }}
        />
      )}
    </>
  );
}

function GuestFormModal({ title, initialData = {}, onClose, onSave }) {
  const [name, setName] = useState(initialData.name || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [email, setEmail] = useState(initialData.email || "");
  const [city, setCity] = useState(initialData.city || "Bareilly");
  const [address, setAddress] = useState(initialData.address || "");
  const [idType, setIdType] = useState(initialData.idType || "Aadhaar Card");
  const [idNumber, setIdNumber] = useState(initialData.idNumber || "");
  const [preferences, setPreferences] = useState(initialData.preferences || "");
  const [notes, setNotes] = useState(initialData.notes || "");
  const [vip, setVip] = useState(Boolean(initialData.vip));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter guest name.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter guest phone number.");
      return;
    }

    onSave({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      city: city.trim(),
      address: address.trim(),
      idType,
      idNumber: idNumber.trim(),
      preferences: preferences.trim(),
      notes: notes.trim(),
      vip,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-gold/40 bg-white p-6 shadow-2xl text-[#061830] space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gold/20 pb-3">
          <h3 className="font-display text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-[#64748b] hover:text-[#061830]">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-gold uppercase mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-gold uppercase mb-1">Mobile Phone *</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]"
              />
            </div>
            <div>
              <label className="block font-bold text-gold uppercase mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-gold uppercase mb-1">Gov ID Type</label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-2 py-2 text-xs text-[#061830]"
              >
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="Voter ID">Voter ID</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-gold uppercase mb-1">Gov ID Document #</label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Document number"
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gold uppercase mb-1">Address / City</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Civil Lines, Bareilly"
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]"
            />
          </div>

          <div>
            <label className="block font-bold text-gold uppercase mb-1">Guest Preferences</label>
            <input
              type="text"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="e.g. High floor, quiet room, green tea"
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]"
            />
          </div>

          <div>
            <label className="block font-bold text-gold uppercase mb-1">Internal Staff Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Frequent business traveller, corporate rate approved"
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={vip}
              onChange={(e) => setVip(e.target.checked)}
              className="size-4 accent-gold"
            />
            <span className="font-bold flex items-center gap-1 text-gold">
              <Crown className="size-3.5" /> Mark as VIP Guest
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-gold/15">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gold/30 px-4 py-2 text-xs font-semibold text-[#061830] hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gold-gradient px-5 py-2 text-xs font-bold text-gold-foreground shadow-gold hover:brightness-110"
            >
              Save Guest Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
