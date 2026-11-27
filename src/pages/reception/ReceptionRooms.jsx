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
  LogIn,
  PlusCircle,
  FileText,
  Calendar,
  Search,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Send,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { BookingDialog } from "@/components/dashboard/BookingDialog.jsx";
import { FilterChips, Panel } from "@/components/dashboard/ui.jsx";
import { formatINR, formatDate, todayISO } from "@/lib/hotel/pricing.js";
import {
  getCategory,
  occupiedRoomNumbers,
  heldRoomNumbers,
  getEffectiveRoomStatus,
  activeBookingForRoom,
  setRoomStatus,
  markAllRoomsClean,
  checkInBooking,
  checkOutBooking,
  addHousekeepingTask,
  addMaintenanceRequest,
  useHotelState,
} from "@/lib/hotel/store.jsx";

const STATUS_VIEWS = ["All", "Available", "Reserved", "Occupied", "Cleaning", "Maintenance", "Blocked"];

const STATUS_STYLE = {
  available: {
    badge: "border-emerald-300 bg-emerald-50 text-emerald-800",
    icon: Check,
    label: "Available",
  },
  reserved: {
    badge: "border-amber-400 bg-amber-50 text-amber-900",
    icon: Calendar,
    label: "Reserved",
  },
  occupied: {
    badge: "border-blue-300 bg-blue-50 text-blue-800",
    icon: UserRound,
    label: "Occupied",
  },
  dirty: {
    badge: "border-purple-300 bg-purple-50 text-purple-800",
    icon: Sparkles,
    label: "Dirty",
  },
  cleaning: {
    badge: "border-purple-300 bg-purple-50 text-purple-800",
    icon: Sparkles,
    label: "Cleaning",
  },
  inspection_pending: {
    badge: "border-indigo-300 bg-indigo-50 text-indigo-800",
    icon: Sparkles,
    label: "Inspection",
  },
  ready: {
    badge: "border-teal-300 bg-teal-50 text-teal-800",
    icon: CheckCircle2,
    label: "Ready",
  },
  maintenance: {
    badge: "border-rose-300 bg-rose-50 text-rose-800",
    icon: Wrench,
    label: "Maintenance",
  },
  blocked: {
    badge: "border-zinc-300 bg-zinc-100 text-zinc-800",
    icon: ShieldAlert,
    label: "Blocked",
  },
};

export default function ReceptionRooms() {
  const state = useHotelState();
  const today = todayISO();
  const occ = occupiedRoomNumbers(state, today);
  const held = heldRoomNumbers(state, today);
  const [view, setView] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [nextStatus, setNextStatus] = useState("available");
  const [statusReason, setStatusReason] = useState("");

  const openRoomModal = (room) => {
    setSelectedRoom(room);
    setNextStatus(room.status || "available");
    setStatusReason(room.statusReason || "");
  };

  const guestIn = (n) => activeBookingForRoom(state, n, today);

  const getEffectiveStatus = (r) => getEffectiveRoomStatus(state, r, today);

  const floors = [...new Set(state.rooms.map((r) => r.floor))].sort();

  const cleaningCount = state.rooms.filter(
    (r) => getEffectiveStatus(r) === "cleaning" || getEffectiveStatus(r) === "dirty"
  ).length;

  const handleMarkAllClean = () => {
    markAllRoomsClean();
    toast.success(`Marked all ${cleaningCount} cleaning rooms as Available!`);
  };

  // Change room status directly with reason
  const handleStatusChange = (e) => {
    e.preventDefault();
    if (!selectedRoom) return;
    const reasonTrimmed = statusReason.trim();
    if (nextStatus !== "available" && !reasonTrimmed) {
      toast.error("Please enter a reason for changing the room status.");
      return;
    }
    setRoomStatus(selectedRoom.number, nextStatus, nextStatus === "available" ? reasonTrimmed : reasonTrimmed);
    const label = STATUS_STYLE[nextStatus]?.label || nextStatus;
    toast.success(
      `Room ${selectedRoom.number} status updated to ${label}${reasonTrimmed ? ` (${reasonTrimmed})` : ""}.`
    );
    setSelectedRoom(null);
  };

  const term = search.trim().toLowerCase();

  return (
    <div className="space-y-6">
      <Panel
        title="Room Inventory &amp; Status Board"
        subtitle="Operational status of all hotel rooms · Update availability, cleaning, maintenance, or blocked status with reason"
        action={
          <div className="flex flex-wrap items-center gap-3">
            {cleaningCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllClean}
                className="inline-flex items-center gap-1.5 rounded-full border border-purple-300 bg-purple-50 px-3.5 py-1.5 text-xs font-bold text-purple-800 hover:bg-purple-100 transition cursor-pointer shadow-sm"
              >
                <Sparkles className="size-3.5 text-purple-600" /> Mark All ({cleaningCount}) Clean
              </button>
            )}
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gold" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search room # or guest..."
                className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] pl-8 pr-3 py-1.5 text-xs text-[#061830] placeholder:text-[#64748b] focus:border-gold focus:outline-none"
              />
            </div>
            <FilterChips options={STATUS_VIEWS} value={view} onChange={setView} />
          </div>
        }
      >
        {/* Status Legend */}
        <div className="mb-5 flex flex-wrap gap-4 text-xs border-b border-gold/15 pb-4">
          {["available", "reserved", "occupied", "cleaning", "maintenance", "blocked"].map((k) => {
            const v = STATUS_STYLE[k];
            const count = state.rooms.filter((r) => {
              const eff = getEffectiveStatus(r);
              return k === "cleaning" ? eff === "cleaning" || eff === "dirty" : eff === k;
            }).length;
            return (
              <span key={k} className="flex items-center gap-1.5 text-[#061830] font-medium">
                <span className={`size-3 rounded border ${v.badge}`} />
                {v.label} · <strong className="text-[#061830]">{count}</strong>
              </span>
            );
          })}
        </div>

        {/* Category-wise Room Availability Grid */}
        <div className="space-y-6">
          {state.categories.every((cat) =>
            state.rooms
              .filter((r) => r.categoryId === cat.id)
              .filter((r) => {
                const eff = getEffectiveStatus(r);
                if (view === "All") return true;
                if (view === "Cleaning") return eff === "cleaning" || eff === "dirty";
                if (view === "Reserved") return eff === "reserved";
                return STATUS_STYLE[eff]?.label.toLowerCase() === view.toLowerCase();
              })
              .filter((r) => {
                if (!term) return true;
                const g = guestIn(r.number);
                return (
                  r.number.toLowerCase().includes(term) ||
                  cat.name.toLowerCase().includes(term) ||
                  (g && g.guestName.toLowerCase().includes(term))
                );
              }).length === 0
          ) && (
            <div className="rounded-2xl border border-gold/20 bg-[#FAF7F2] py-10 text-center text-sm text-[#64748b]">
              No rooms currently match <strong>{view}</strong>{term ? ` for "${search}"` : ""}.
            </div>
          )}
          {state.categories.map((cat) => {
            const rooms = state.rooms
              .filter((r) => r.categoryId === cat.id)
              .filter((r) => {
                const eff = getEffectiveStatus(r);
                if (view === "All") return true;
                if (view === "Cleaning") return eff === "cleaning" || eff === "dirty";
                if (view === "Reserved") return eff === "reserved";
                return STATUS_STYLE[eff]?.label.toLowerCase() === view.toLowerCase();
              })
              .filter((r) => {
                if (!term) return true;
                const g = guestIn(r.number);
                return (
                  r.number.toLowerCase().includes(term) ||
                  cat.name.toLowerCase().includes(term) ||
                  (g && g.guestName.toLowerCase().includes(term))
                );
              });

            if (!rooms.length) return null;

            const unassignedCount = (state.bookings || []).filter(
              (b) =>
                b.categoryId === cat.id &&
                !b.roomNumber &&
                ["Confirmed", "Pending"].includes(b.status)
            ).length;

            const availableInCat = rooms.filter((r) => getEffectiveStatus(r) === "available").length;

            return (
              <div key={cat.id}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gold flex items-center gap-2 flex-1">
                    <span>{cat.name}</span>
                    <span className="text-[10px] font-medium text-slate-500 normal-case tracking-normal">
                      ({availableInCat}/{rooms.length} Available)
                    </span>
                    <span className="h-px bg-gold/15 flex-1" />
                  </p>
                  {unassignedCount > 0 && (
                    <Link
                      to={`/reception/bookings`}
                      className="rounded-full bg-amber-50 border border-amber-300 px-3 py-0.5 text-[10px] font-bold text-amber-800 hover:bg-amber-100 transition"
                    >
                      {unassignedCount} Unassigned Reservation{unassignedCount > 1 ? "s" : ""} → Assign Room
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
                  {rooms.map((r) => {
                    const st = getEffectiveStatus(r);
                    const S = STATUS_STYLE[st] || STATUS_STYLE.available;
                    const g = guestIn(r.number);
                    const isAc = r.isAc !== false && r.categoryId !== "non-ac" && r.categoryId !== "non-ac-double";
                    const catObj = getCategory(state, r.categoryId);
                    const basePrice = r.price || catObj?.price || 1200;
                    const isBookedOrOccupied = st === "reserved" || st === "occupied";
                    const gstVal = isBookedOrOccupied && basePrice > 1000 ? Math.round(basePrice * 0.05) : 0;
                    const cardPrice = isBookedOrOccupied ? basePrice + gstVal : basePrice;

                    return (
                      <button
                        key={r.number}
                        type="button"
                        onClick={() => openRoomModal(r)}
                        className={`rounded-2xl border p-3.5 text-left transition hover:scale-[1.02] shadow-sm ${S.badge} cursor-pointer flex flex-col justify-between`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-display text-xl font-bold">Room {r.number}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              isAc ? "bg-cyan-100 border-cyan-300 text-cyan-900" : "bg-amber-100 border-amber-300 text-amber-900"
                            }`}>
                              {isAc ? "AC" : "Non-AC"}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-[11px] font-semibold text-[#061830]">
                            {catObj?.name || "Room"}
                          </p>
                          <p className="text-[10px] opacity-80 mt-0.5">
                            {r.bedType || "Double Bed"} • Max {r.capacity || 2}
                          </p>
                          {r.statusReason && ["cleaning", "dirty", "maintenance", "blocked"].includes(st) && (
                            <p className="mt-1 truncate text-[10px] font-medium opacity-85" title={r.statusReason}>
                              Reason: {r.statusReason}
                            </p>
                          )}
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-black/10 flex items-center justify-between text-[11px]">
                          <span className="font-bold text-gold">
                            ₹{cardPrice.toLocaleString("en-IN")}
                            <span className="text-[9px] font-normal text-[#64748b]">
                              /day{isBookedOrOccupied && gstVal > 0 ? " (incl. GST)" : ""}
                            </span>
                          </span>
                          <span className="truncate max-w-[95px] font-semibold text-[10px]" title={g ? `${st === "reserved" ? "Booked: " : "Occupied: "}${g.guestName}` : S.label}>
                            {st === "reserved" && g ? `Booked: ${g.guestName.split(" ")[0]}` : st === "occupied" && g ? `In: ${g.guestName.split(" ")[0]}` : S.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Room Details & Management Modal */}
      <AnimatePresence>
        {selectedRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/80 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-2xl border border-gold/40 bg-white p-6 shadow-2xl text-[#061830] space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gold/15">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-2xl font-bold text-[#061830]">
                      Room {selectedRoom.number}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${
                      STATUS_STYLE[getEffectiveStatus(selectedRoom)]?.badge || "bg-slate-100"
                    }`}>
                      {STATUS_STYLE[getEffectiveStatus(selectedRoom)]?.label || "Status"}
                    </span>
                  </div>
                  <p className="text-xs text-gold font-semibold mt-0.5">
                    {getCategory(state, selectedRoom.categoryId)?.name} · Floor {selectedRoom.floor} · {selectedRoom.wing || "Main Wing"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="rounded-lg p-1 text-[#64748b] hover:text-[#061830] cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Room Metadata */}
              {(() => {
                const catObj = getCategory(state, selectedRoom.categoryId);
                const basePrice = selectedRoom.price || catObj?.price || 1200;
                const modalSt = getEffectiveStatus(selectedRoom);
                const isBookedOrOccupied = modalSt === "reserved" || modalSt === "occupied";
                const gstVal = isBookedOrOccupied && basePrice > 1000 ? Math.round(basePrice * 0.05) : 0;
                const isAc = selectedRoom.isAc !== false && selectedRoom.categoryId !== "non-ac" && selectedRoom.categoryId !== "non-ac-double";
                return (
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF7F2] p-3 rounded-xl border border-gold/20">
                    <div>
                      <span className="text-[#64748b] block text-[10px] uppercase font-bold">Climate &amp; Category</span>
                      <span className="font-semibold text-[#061830]">{isAc ? "AC" : "Non-AC"} • {catObj?.name}</span>
                    </div>
                    <div>
                      <span className="text-[#64748b] block text-[10px] uppercase font-bold">Bed &amp; Max Capacity</span>
                      <span className="font-semibold text-[#061830]">{selectedRoom.bedType || "Double Bed"} ({selectedRoom.capacity || 2} Persons)</span>
                    </div>
                    <div>
                      <span className="text-[#64748b] block text-[10px] uppercase font-bold">Base Tariff</span>
                      <span className="font-semibold text-[#061830]">₹{basePrice.toLocaleString("en-IN")}/day</span>
                    </div>
                    {isBookedOrOccupied && (
                      <div>
                        <span className="text-[#64748b] block text-[10px] uppercase font-bold">
                          {gstVal > 0 ? "Total with 5% GST" : "Nightly Tariff (GST Exempt)"}
                        </span>
                        <span className="font-bold text-gold">
                          ₹{(basePrice + gstVal).toLocaleString("en-IN")}/day{" "}
                          {gstVal > 0 && <span className="text-[10px] text-emerald-700">(+₹{gstVal})</span>}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* If occupied, show occupant info */}
              {getEffectiveStatus(selectedRoom) === "occupied" ? (
                (() => {
                  const g = guestIn(selectedRoom.number);
                  const bal = g ? Math.max(0, g.total - g.amountPaid) : 0;
                  return (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-blue-300 bg-blue-50/70 p-3.5 text-[#061830]">
                        <p className="text-[10px] uppercase tracking-wider text-blue-900 font-bold flex items-center gap-1.5">
                          <UserRound className="size-3.5 text-blue-600" /> Current In-House Guest (Occupied)
                        </p>
                        <p className="font-display text-base font-bold text-[#061830] mt-1">
                          {g?.guestName}
                        </p>
                        <p className="text-xs text-[#64748b]">Phone: {g?.phone} · Booking: #{g?.id}</p>
                        <p className="text-xs text-[#061830] mt-1 flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-gold" /> Stay:{" "}
                          <strong>{g ? `${formatDate(g.checkIn)} → ${formatDate(g.checkOut)}` : "—"}</strong>
                        </p>
                        <div className="mt-2 pt-2 border-t border-blue-200/60 flex justify-between items-center text-xs">
                          <span className="text-[#64748b]">Outstanding Folio:</span>
                          <span
                            className={`font-bold font-mono ${
                              bal > 0 ? "text-amber-600" : "text-emerald-600"
                            }`}
                          >
                            {formatINR(bal)}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBooking(g);
                            setSelectedRoom(null);
                          }}
                          className="flex-1 rounded-xl border border-gold/40 bg-white py-2 text-xs font-semibold text-[#061830] hover:bg-gold/10 transition cursor-pointer"
                        >
                          View Folio
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (g) {
                              const bal = Math.max(0, (g.total || 0) - (g.amountPaid || 0));
                              if (bal > 0) {
                                toast.error(
                                  `Cannot check out before settling the pending balance of ${formatINR(bal)}.`
                                );
                                setActiveBooking(g);
                                setSelectedRoom(null);
                                return;
                              }
                              checkOutBooking(g.id);
                              setSelectedRoom(null);
                              toast.success(
                                `${g.guestName} checked out · Room ${selectedRoom.number} marked for housekeeping turnover.`
                              );
                            }
                          }}
                          className="flex-1 rounded-xl bg-gold-gradient py-2 text-xs font-bold uppercase text-navy-deep hover:brightness-110 transition shadow-gold cursor-pointer"
                        >
                          Express Check Out
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : getEffectiveStatus(selectedRoom) === "reserved" ? (
                (() => {
                  const g = guestIn(selectedRoom.number);
                  return (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-3.5 text-[#061830]">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] uppercase tracking-wider text-amber-900 font-bold flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-amber-700" /> Room Held for Confirmed Booking
                          </p>
                          <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[9px] font-bold text-amber-900 uppercase">
                            Held {g?.checkIn === today ? "Today" : "Reserved"}
                          </span>
                        </div>
                        <p className="font-display text-base font-bold text-[#061830] mt-1">
                          {g?.guestName}
                        </p>
                        <p className="text-xs text-[#64748b]">Phone: {g?.phone} · Booking: #{g?.id}</p>
                        <p className="text-xs text-[#061830] mt-1 flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-gold" /> Stay:{" "}
                          <strong>{g ? `${formatDate(g.checkIn)} → ${formatDate(g.checkOut)}` : "—"}</strong>
                        </p>
                        <div className="mt-2 pt-2 border-t border-amber-200/60 flex justify-between items-center text-xs">
                          <span className="text-[#64748b]">Deposit / Total:</span>
                          <span className="font-semibold text-[#061830]">
                            {formatINR(g?.amountPaid || 0)} / <strong className="font-bold text-gold">{formatINR(g?.total || 0)}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (g) {
                              checkInBooking(g.id, selectedRoom.number);
                              setSelectedRoom(null);
                              toast.success(`${g.guestName} checked in to Room ${selectedRoom.number}!`);
                            }
                          }}
                          className="rounded-xl bg-gold-gradient py-2.5 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <LogIn className="size-3.5" /> Check-In Guest
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBooking(g);
                            setSelectedRoom(null);
                          }}
                          className="rounded-xl border border-gold/40 bg-white py-2 text-xs font-semibold text-[#061830] hover:bg-gold/10 transition cursor-pointer"
                        >
                          View Folio
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* Unoccupied Room Status Controls */
                <form onSubmit={handleStatusChange} className="space-y-3">
                  <p className="text-xs font-bold text-gold uppercase tracking-wider">
                    Change Room Status:
                  </p>

                  {selectedRoom.statusReason && (
                    <div className="rounded-xl border border-gold/25 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]">
                      <span className="font-bold text-[#64748b] uppercase text-[10px] block">Current Reason</span>
                      <span>{selectedRoom.statusReason}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "available", label: "Available", icon: Check, active: "border-emerald-500 bg-emerald-50 text-emerald-800" },
                      { id: "cleaning", label: "Cleaning", icon: Sparkles, active: "border-purple-500 bg-purple-50 text-purple-800" },
                      { id: "maintenance", label: "Maintenance", icon: Wrench, active: "border-rose-500 bg-rose-50 text-rose-800" },
                      { id: "blocked", label: "Blocked", icon: ShieldAlert, active: "border-zinc-500 bg-zinc-100 text-zinc-800" },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = nextStatus === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setNextStatus(opt.id)}
                          className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 px-2 text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? opt.active
                              : "border-slate-200 bg-white text-[#475569] hover:border-gold/50"
                          }`}
                        >
                          <Icon className="size-3.5" /> {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-1">
                      Reason {nextStatus === "available" ? "(Optional)" : "*"}
                    </label>
                    <input
                      type="text"
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder={
                        nextStatus === "available"
                          ? "Optional note (e.g. Ready for check-in)"
                          : nextStatus === "cleaning"
                          ? "e.g. Deep cleaning / Post-checkout turnover"
                          : nextStatus === "maintenance"
                          ? "e.g. AC not cooling / Geyser repair"
                          : "e.g. Reserved for VIP / Painting work"
                      }
                      className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gold-gradient py-2.5 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110 transition cursor-pointer"
                  >
                    Update Room Status
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Guest Folio Modal */}
      {activeBooking && (
        <BookingDialog
          booking={activeBooking}
          open={Boolean(activeBooking)}
          onClose={() => setActiveBooking(null)}
        />
      )}
    </div>
  );
}
