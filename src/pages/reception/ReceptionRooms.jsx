import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Sparkles,
  Wrench,
  BedDouble,
  UserRound,
  X,
  LogOut,
  FileText,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { BookingDialog } from "@/components/dashboard/BookingDialog.jsx";
import { FilterChips, Panel } from "@/components/dashboard/ui.jsx";
import { formatINR, formatDate } from "@/lib/hotel/pricing.js";
import {
  getCategory,
  occupiedRoomNumbers,
  setRoomStatus,
  markAllRoomsClean,
  checkOutBooking,
  updateCategoryPrice,
  useHotelState,
} from "@/lib/hotel/store.jsx";

const VIEW = ["All", "Available", "Occupied", "Cleaning", "Maintenance"];

const STYLE = {
  available: {
    badge: "border-emerald-500/40 bg-emerald-950/30 text-emerald-300",
    icon: Check,
    label: "Available",
  },
  occupied: {
    badge: "border-blue-500/40 bg-blue-950/30 text-blue-300",
    icon: UserRound,
    label: "Occupied",
  },
  cleaning: {
    badge: "border-amber-500/40 bg-amber-950/30 text-amber-300",
    icon: Sparkles,
    label: "Cleaning",
  },
  maintenance: {
    badge: "border-rose-500/40 bg-rose-950/30 text-rose-300",
    icon: Wrench,
    label: "Maintenance",
  },
};

export default function ReceptionRooms() {
  const state = useHotelState();
  const occ = occupiedRoomNumbers(state);
  const [view, setView] = useState("All");
  const [prices, setPrices] = useState({});
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);

  const guestIn = (n) =>
    state.bookings.find((b) => b.status === "Checked-In" && b.roomNumber === n);
  const statusOf = (n, s) => (occ.has(n) ? "occupied" : s);
  const floors = [...new Set(state.rooms.map((r) => r.floor))].sort();

  const cleaningCount = state.rooms.filter(
    (r) => statusOf(r.number, r.status) === "cleaning"
  ).length;

  const handleMarkAllClean = () => {
    markAllRoomsClean();
    toast.success(`Marked all ${cleaningCount} cleaning rooms as Available!`);
  };

  return (
    <div className="space-y-6">
      <Panel
        title="Room Management &amp; Housekeeping Board"
        subtitle="Live status of all hotel rooms. Click any room to manage housekeeping, view occupant, or settle folio."
        action={
          <div className="flex flex-wrap items-center gap-3">
            {cleaningCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllClean}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/40 px-3.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/50 transition cursor-pointer"
              >
                <Sparkles className="size-3.5 text-amber-400" /> Mark All {cleaningCount} Clean
              </button>
            )}
            <FilterChips options={VIEW} value={view} onChange={setView} />
          </div>
        }
      >
        <div className="mb-5 flex flex-wrap gap-4 text-xs border-b border-gold/15 pb-4">
          {Object.entries(STYLE).map(([k, v]) => {
            const count = state.rooms.filter((r) => statusOf(r.number, r.status) === k).length;
            return (
              <span key={k} className="flex items-center gap-1.5 text-navy-foreground/75">
                <span className={`size-3 rounded border ${v.badge}`} />
                {v.label} · <strong className="text-navy-foreground">{count}</strong>
              </span>
            );
          })}
        </div>

        <div className="space-y-6">
          {floors.map((f) => {
            const rooms = state.rooms
              .filter((r) => r.floor === f)
              .filter((r) => view === "All" || STYLE[statusOf(r.number, r.status)].label === view);

            if (!rooms.length) return null;

            return (
              <div key={f}>
                <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-3">
                  Floor {f}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8">
                  {rooms.map((r) => {
                    const st = statusOf(r.number, r.status);
                    const S = STYLE[st];
                    const g = guestIn(r.number);

                    return (
                      <button
                        key={r.number}
                        onClick={() => setSelectedRoom(r)}
                        className={`rounded-2xl border p-4 text-left transition hover:scale-[1.02] shadow-lift ${S.badge} cursor-pointer`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-2xl font-bold">{r.number}</span>
                          <S.icon className="size-4" />
                        </div>
                        <p className="mt-1 truncate text-[11px] opacity-75">
                          {getCategory(state, r.categoryId)?.name || "Room"}
                        </p>
                        <p className="truncate text-xs font-semibold mt-1">
                          {g ? g.guestName : S.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Room Status Modal */}
      <AnimatePresence>
        {selectedRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/80 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-2xl border border-gold/30 bg-[#061830] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gold/15">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-navy-foreground">
                    Room {selectedRoom.number}
                  </h3>
                  <p className="text-xs text-gold">
                    {getCategory(state, selectedRoom.categoryId)?.name} · Floor {selectedRoom.floor}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="rounded-lg p-1 text-navy-foreground/60 hover:text-navy-foreground cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="py-4">
                {statusOf(selectedRoom.number, selectedRoom.status) === "occupied" ? (
                  (() => {
                    const g = guestIn(selectedRoom.number);
                    const bal = g ? Math.max(0, g.total - g.amountPaid) : 0;
                    return (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-gold/20 bg-navy p-4">
                          <p className="text-[11px] uppercase tracking-wider text-gold font-semibold">
                            Current Occupant
                          </p>
                          <p className="font-display text-lg font-semibold text-navy-foreground mt-1">
                            {g?.guestName}
                          </p>
                          <p className="text-xs text-navy-foreground/60">Phone: {g?.phone}</p>
                          <p className="text-xs text-navy-foreground/75 mt-2 flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-gold" /> Check-out:{" "}
                            <strong>{g ? formatDate(g.checkOut) : "—"}</strong>
                          </p>
                          <div className="mt-3 pt-3 border-t border-gold/15 flex justify-between items-center text-xs">
                            <span className="text-navy-foreground/60">Balance Due:</span>
                            <span
                              className={`font-bold font-mono ${
                                bal > 0 ? "text-amber-400" : "text-emerald-400"
                              }`}
                            >
                              {formatINR(bal)}
                            </span>
                          </div>
                        </div>

                        {/* Occupied room actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setActiveBooking(g);
                              setSelectedRoom(null);
                            }}
                            className="flex-1 rounded-xl border border-gold/30 bg-navy py-2 text-xs font-semibold text-champagne hover:bg-white/5 transition"
                          >
                            Open Guest Folio
                          </button>
                          <button
                            onClick={() => {
                              if (g) {
                                checkOutBooking(g.id);
                                setSelectedRoom(null);
                                toast.success(
                                  `${g.guestName} checked out · Room ${selectedRoom.number} sent to Cleaning 🧹`
                                );
                              }
                            }}
                            className="flex-1 rounded-xl bg-gold-gradient py-2 text-xs font-semibold uppercase text-gold-foreground hover:brightness-110 transition shadow-gold"
                          >
                            Check Out
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-navy-foreground/60 mb-2">
                      Set Housekeeping / Maintenance Status:
                    </p>
                    {["available", "cleaning", "maintenance"].map((s) => {
                      const S = STYLE[s];
                      const Icon = S.icon;
                      const active = selectedRoom.status === s;
                      return (
                        <button
                          key={s}
                          onClick={() => {
                            setRoomStatus(selectedRoom.number, s);
                            setSelectedRoom((prev) => ({ ...prev, status: s }));
                            toast.success(`Room ${selectedRoom.number} marked as ${S.label}`);
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                            active
                              ? "border-gold bg-gold/20 text-gold shadow-gold"
                              : "border-gold/15 hover:bg-white/5 text-navy-foreground/75"
                          }`}
                        >
                          <Icon className="size-4" />
                          <span>{S.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-2 text-right border-t border-gold/15">
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="rounded-full border border-gold/30 px-5 py-2 text-xs font-semibold uppercase text-champagne hover:bg-white/5 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Booking Dialog Modal if triggered from Room Board */}
      {activeBooking && (
        <BookingDialog booking={activeBooking} onClose={() => setActiveBooking(null)} />
      )}

      {/* Category Rates */}
      <Panel
        title="Room Categories &amp; Nightly Rates"
        subtitle="Manage base room pricing across the hotel"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 text-xs">
          {state.categories.map((c) => {
            const count = state.rooms.filter((r) => r.categoryId === c.id).length;
            const val = prices[c.id] ?? String(c.price);

            return (
              <div
                key={c.id}
                className="overflow-hidden rounded-xl border border-gold/20 bg-navy-deep/60"
              >
                <img src={c.image} alt="" className="aspect-video w-full object-cover" />
                <div className="p-4 space-y-2">
                  <p className="font-display text-base font-semibold text-navy-foreground truncate">
                    {c.name}
                  </p>
                  <p className="flex items-center gap-1 text-[11px] text-navy-foreground/60">
                    <BedDouble className="size-3.5 text-gold" /> {count} rooms · Max {c.maxGuests}{" "}
                    guests
                  </p>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="number"
                      min={500}
                      value={val}
                      onChange={(e) => setPrices((p) => ({ ...p, [c.id]: e.target.value }))}
                      className="w-full rounded-lg border border-gold/30 bg-navy px-3 py-1.5 text-xs text-navy-foreground focus:border-gold focus:outline-none"
                    />
                    <button
                      disabled={Number(val) === c.price || Number(val) < 500}
                      onClick={() => {
                        updateCategoryPrice(c.id, Number(val));
                        toast.success(`${c.name} rate updated to ${formatINR(Number(val))}/night`);
                      }}
                      className="rounded-lg bg-gold-gradient px-3 py-1.5 text-xs font-semibold uppercase text-gold-foreground disabled:opacity-40 hover:brightness-110 cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
