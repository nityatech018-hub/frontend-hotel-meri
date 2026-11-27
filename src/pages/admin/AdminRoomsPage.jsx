import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BedDouble,
  Check,
  Sparkles,
  Wrench,
  Ban,
  UserRound,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  SlidersHorizontal,
  X,
  ShieldAlert,
  Clock,
  Globe,
  Lock,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { formatINR, formatDate, todayISO } from "@/lib/hotel/pricing.js";
import {
  addRoom,
  updateRoom,
  deleteRoom,
  togglePublishRoom,
  setRoomStatus,
  toggleBlockRoom,
  occupiedRoomNumbers,
  heldRoomNumbers,
  getEffectiveRoomStatus,
  activeBookingForRoom,
  useHotelState,
} from "@/lib/hotel/store.jsx";

const STATUS_CONFIG = {
  available: {
    label: "Available",
    badge: "border-emerald-300 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  reserved: {
    label: "Reserved",
    badge: "border-indigo-300 bg-indigo-50 text-indigo-800",
    dot: "bg-indigo-500",
  },
  occupied: {
    label: "Occupied",
    badge: "border-blue-300 bg-blue-50 text-blue-800",
    dot: "bg-blue-500",
  },
  dirty: {
    label: "Dirty",
    badge: "border-amber-400 bg-amber-50 text-amber-900",
    dot: "bg-amber-600",
  },
  cleaning: {
    label: "Cleaning",
    badge: "border-amber-300 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
  },
  inspection_pending: {
    label: "Inspection Pending",
    badge: "border-cyan-300 bg-cyan-50 text-cyan-800",
    dot: "bg-cyan-500",
  },
  ready: {
    label: "Ready",
    badge: "border-emerald-400 bg-emerald-50 text-emerald-900 font-bold",
    dot: "bg-emerald-600",
  },
  maintenance: {
    label: "Maintenance",
    badge: "border-rose-300 bg-rose-50 text-rose-800",
    dot: "bg-rose-500",
  },
  blocked: {
    label: "Blocked",
    badge: "border-slate-400 bg-slate-100 text-slate-800",
    dot: "bg-slate-600",
  },
};

export default function AdminRoomsPage() {
  const state = useHotelState();
  const occ = occupiedRoomNumbers(state);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [acFilter, setAcFilter] = useState("all"); // "all" | "ac" | "non-ac"
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [bedFilter, setBedFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalRoom, setEditModalRoom] = useState(null);
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState(null);
  const [blockModalRoom, setBlockModalRoom] = useState(null);
  const [blockReason, setBlockReason] = useState("Management Hold");
  const [detailModalRoom, setDetailModalRoom] = useState(null);

  // Form State for Add Room
  const [formNumber, setFormNumber] = useState("");
  const [formCategory, setFormCategory] = useState("ac-family-double");
  const [formFloor, setFormFloor] = useState(1);
  const [formWing, setFormWing] = useState("Main Wing");
  const [formBed, setFormBed] = useState("Double Bed");
  const [formMaxGuests, setFormMaxGuests] = useState(2);
  const [formPrice, setFormPrice] = useState(1200);
  const [formIsAc, setFormIsAc] = useState(true);
  const [formImage, setFormImage] = useState("/images/rooms/ac-family-room.jpg");
  const [formAmenities, setFormAmenities] = useState("High-speed Wi-Fi, Smart TV, Attached Bath, Air conditioning");
  const [formIsPublished, setFormIsPublished] = useState(true);

  // Form State for Edit Room
  const [editNumber, setEditNumber] = useState("");
  const [editCategory, setEditCategory] = useState("ac-family-double");
  const [editFloor, setEditFloor] = useState(1);
  const [editWing, setEditWing] = useState("Main Wing");
  const [editBed, setEditBed] = useState("Double Bed");
  const [editCapacity, setEditCapacity] = useState(2);
  const [editPrice, setEditPrice] = useState(1200);
  const [editIsAc, setEditIsAc] = useState(true);
  const [editImage, setEditImage] = useState("");
  const [editAmenities, setEditAmenities] = useState("");
  const [editIsPublished, setEditIsPublished] = useState(true);
  const [editNotes, setEditNotes] = useState("");

  const today = todayISO();
  const guestIn = (n) => activeBookingForRoom(state, n, today);

  const getEffectiveStatus = (r) => getEffectiveRoomStatus(state, r, today);

  const floors = [...new Set(state.rooms.map((r) => r.floor))].sort((a, b) => a - b);
  const wings = [...new Set(state.rooms.map((r) => r.wing || "Main Wing"))].sort();
  const bedTypes = [...new Set(state.rooms.map((r) => r.bedType || r.bed || "Double Bed"))];

  // Actual Inventory Counts
  const totalCount = state.rooms.length;
  const acCount = state.rooms.filter((r) => r.isAc !== false && r.categoryId !== "non-ac" && r.categoryId !== "non-ac-double").length;
  const nonAcCount = state.rooms.filter((r) => r.isAc === false || r.categoryId === "non-ac" || r.categoryId === "non-ac-double").length;
  const acFamilyDoubleCount = state.rooms.filter((r) => r.categoryId === "ac-family-double").length;
  const acFamilyTripleCount = state.rooms.filter((r) => r.categoryId === "ac-family-triple").length;
  const acPremiumCount = state.rooms.filter((r) => r.categoryId === "ac-premium-round" || r.categoryId === "ac-premium").length;
  const nonAcCatCount = state.rooms.filter((r) => r.categoryId === "non-ac-double" || r.categoryId === "non-ac").length;

  // Operational Counts
  const publishedCount = state.rooms.filter((r) => r.isPublished !== false).length;
  const availableCount = state.rooms.filter((r) => getEffectiveStatus(r) === "available" || getEffectiveStatus(r) === "ready").length;
  const reservedCount = state.rooms.filter((r) => getEffectiveStatus(r) === "reserved").length;
  const occupiedCount = state.rooms.filter((r) => getEffectiveStatus(r) === "occupied").length;
  const dirtyCount = state.rooms.filter((r) => getEffectiveStatus(r) === "dirty" || getEffectiveStatus(r) === "cleaning").length;
  const maintenanceCount = state.rooms.filter((r) => getEffectiveStatus(r) === "maintenance").length;
  const blockedCount = state.rooms.filter((r) => getEffectiveStatus(r) === "blocked").length;

  const filteredRooms = state.rooms.filter((r) => {
    const effStatus = getEffectiveStatus(r);
    const isAcRoom = r.isAc !== false && r.categoryId !== "non-ac" && r.categoryId !== "non-ac-double";
    if (statusFilter !== "all" && effStatus !== statusFilter) return false;
    if (acFilter === "ac" && !isAcRoom) return false;
    if (acFilter === "non-ac" && isAcRoom) return false;
    if (categoryFilter !== "all" && r.categoryId !== categoryFilter) return false;
    if (bedFilter !== "all" && (r.bedType || r.bed) !== bedFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const numMatch = String(r.number).includes(q);
      const catMatch = (r.categoryId || "").toLowerCase().includes(q);
      const bedMatch = (r.bedType || r.bed || "").toLowerCase().includes(q);
      const wingMatch = (r.wing || "").toLowerCase().includes(q);
      return numMatch || catMatch || bedMatch || wingMatch;
    }
    return true;
  });

  const handleAddRoom = (e) => {
    e.preventDefault();
    const num = parseInt(formNumber, 10);
    if (!num || num <= 0) {
      toast.error("Please provide a valid numeric room number.");
      return;
    }
    if (state.rooms.some((r) => String(r.number) === String(num))) {
      toast.error(`Room ${num} already exists in inventory!`);
      return;
    }

    const amenitiesArr = formAmenities.split(",").map((s) => s.trim()).filter(Boolean);

    const res = addRoom({
      number: String(num),
      categoryId: formCategory,
      floor: parseInt(formFloor, 10) || 1,
      wing: formWing,
      bed: formBed,
      bedType: formBed,
      maxGuests: parseInt(formMaxGuests, 10) || 2,
      capacity: parseInt(formMaxGuests, 10) || 2,
      price: parseInt(formPrice, 10) || 1200,
      isAc: formIsAc,
      image: formImage,
      amenities: amenitiesArr,
      status: "available",
      isPublished: formIsPublished,
    });

    if (res && res.error) {
      toast.error(res.error);
      return;
    }

    toast.success(`Room ${num} created successfully! Available across all dashboards.`);
    setAddModalOpen(false);
    setFormNumber("");
    setFormAmenities("High-speed Wi-Fi, Smart TV, Attached Bath, Air conditioning");
  };

  const handleOpenEdit = (room) => {
    const cat = state.categories.find((c) => c.id === room.categoryId);
    setEditModalRoom(room);
    setEditNumber(String(room.number));
    setEditCategory(room.categoryId);
    setEditFloor(room.floor || 1);
    setEditWing(room.wing || "Main Wing");
    setEditBed(room.bedType || room.bed || "Double Bed");
    setEditCapacity(room.capacity || room.maxGuests || 2);
    setEditPrice(room.price || cat?.price || 1200);
    setEditIsAc(room.isAc !== false && room.categoryId !== "non-ac" && room.categoryId !== "non-ac-double");
    setEditImage(room.image || cat?.image || "/images/rooms/ac-family-room.jpg");
    setEditAmenities(Array.isArray(room.amenities) ? room.amenities.join(", ") : "");
    setEditIsPublished(room.isPublished !== false);
    setEditNotes(room.notes || "");
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editModalRoom) return;

    const num = String(editNumber).trim();
    if (!num) {
      toast.error("Room number cannot be empty.");
      return;
    }

    const amenitiesArr = editAmenities.split(",").map((s) => s.trim()).filter(Boolean);

    const res = updateRoom(editModalRoom.number, {
      number: num,
      categoryId: editCategory,
      floor: parseInt(editFloor, 10) || 1,
      wing: editWing,
      bedType: editBed,
      bed: editBed,
      capacity: parseInt(editCapacity, 10) || 2,
      maxGuests: parseInt(editCapacity, 10) || 2,
      price: parseInt(editPrice, 10) || 1200,
      isAc: editIsAc,
      image: editImage,
      amenities: amenitiesArr,
      isPublished: editIsPublished,
      notes: editNotes,
    });

    if (res && !res.success) {
      toast.error(res.error || "Could not update room.");
      return;
    }

    toast.success(`Room ${num} updated successfully! Synchronized across Reception & Customer views.`);
    setEditModalRoom(null);
  };

  const handleTogglePublish = (roomNumber) => {
    const isNowPublished = togglePublishRoom(roomNumber);
    if (isNowPublished) {
      toast.success(`Suite ${roomNumber} is now Published and visible for online customer reservations.`);
    } else {
      toast.info(`Suite ${roomNumber} is now Unpublished (internal hold, hidden from customer site).`);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmRoom) return;
    const res = deleteRoom(deleteConfirmRoom.number);
    if (!res.success) {
      toast.error(res.error);
    } else if (res.archived) {
      toast.info(res.message);
    } else {
      toast.success(res.message);
    }
    setDeleteConfirmRoom(null);
  };

  const handleQuickStatus = (roomNumber, nextStatus) => {
    setRoomStatus(roomNumber, nextStatus);
    toast.success(`Room ${roomNumber} updated to ${STATUS_CONFIG[nextStatus]?.label || nextStatus}.`);
  };

  const handleToggleBlock = (e) => {
    e.preventDefault();
    if (!blockModalRoom) return;
    const isCurrentlyBlocked = blockModalRoom.status === "blocked";
    toggleBlockRoom(blockModalRoom.number, !isCurrentlyBlocked, blockReason);
    toast.success(`Room ${blockModalRoom.number} is now ${isCurrentlyBlocked ? "Unblocked & Available" : "Blocked"}.`);
    setBlockModalRoom(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold/20 border border-gold/40 px-3 py-0.5 text-[11px] font-bold text-[#061830] uppercase tracking-wider">
              Inventory &amp; Asset Management
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-[#061830] mt-1">
            Room Inventory &amp; Housekeeping Matrix
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Manage suites across all wings and floors. Control 9-stage room lifecycles, maintenance holds, and block reservations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110 transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="size-4" /> Add New Suite
        </button>
      </div>

      {/* Actual Room Inventory Statistics (Section 6 Requirements) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#061830] uppercase tracking-wider">Hotel Meri Inventory Matrix</span>
          <span className="text-[#64748b]">10 Total Physical Rooms</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            type="button"
            onClick={() => { setStatusFilter("all"); setAcFilter("all"); setCategoryFilter("all"); }}
            className="rounded-xl p-3 border border-gold/30 bg-white text-left transition hover:border-gold cursor-pointer"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Total Rooms</span>
            <div className="text-2xl font-bold text-[#061830] mt-0.5">{totalCount}</div>
            <span className="text-[10px] text-[#64748b]">100% capacity</span>
          </button>

          <button
            type="button"
            onClick={() => { setAcFilter("ac"); setCategoryFilter("all"); }}
            className={`rounded-xl p-3 border text-left transition cursor-pointer ${
              acFilter === "ac" ? "border-cyan-500 bg-cyan-100" : "border-cyan-300 bg-cyan-50/50"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800">AC Rooms</span>
            <div className="text-2xl font-bold text-cyan-700 mt-0.5">{acCount}</div>
            <span className="text-[10px] text-cyan-700">Rooms 101–105</span>
          </button>

          <button
            type="button"
            onClick={() => { setAcFilter("non-ac"); setCategoryFilter("all"); }}
            className={`rounded-xl p-3 border text-left transition cursor-pointer ${
              acFilter === "non-ac" ? "border-amber-500 bg-amber-100" : "border-amber-300 bg-amber-50/50"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Non-AC Rooms</span>
            <div className="text-2xl font-bold text-amber-700 mt-0.5">{nonAcCount}</div>
            <span className="text-[10px] text-amber-700">Rooms 106–110</span>
          </button>

          <button
            type="button"
            onClick={() => { setCategoryFilter("ac-family-double"); setAcFilter("all"); }}
            className={`rounded-xl p-3 border text-left transition cursor-pointer ${
              categoryFilter === "ac-family-double" ? "border-indigo-500 bg-indigo-100" : "border-indigo-300 bg-indigo-50/50"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">AC Double</span>
            <div className="text-2xl font-bold text-indigo-700 mt-0.5">{acFamilyDoubleCount}</div>
            <span className="text-[10px] text-indigo-700">Rooms 101, 102, 104</span>
          </button>

          <button
            type="button"
            onClick={() => { setCategoryFilter("ac-family-triple"); setAcFilter("all"); }}
            className={`rounded-xl p-3 border text-left transition cursor-pointer ${
              categoryFilter === "ac-family-triple" ? "border-teal-500 bg-teal-100" : "border-teal-300 bg-teal-50/50"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">AC Triple</span>
            <div className="text-2xl font-bold text-teal-700 mt-0.5">{acFamilyTripleCount}</div>
            <span className="text-[10px] text-teal-700">Room 103 (3 Guests)</span>
          </button>

          <button
            type="button"
            onClick={() => { setCategoryFilter("ac-premium-round"); setAcFilter("all"); }}
            className={`rounded-xl p-3 border text-left transition cursor-pointer ${
              categoryFilter === "ac-premium-round" ? "border-purple-500 bg-purple-100" : "border-purple-300 bg-purple-50/50"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">AC Premium</span>
            <div className="text-2xl font-bold text-purple-700 mt-0.5">{acPremiumCount}</div>
            <span className="text-[10px] text-purple-700">Room 105 (Round Bed)</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("available")}
            className={`rounded-xl p-3 border text-left transition cursor-pointer ${
              statusFilter === "available" ? "border-emerald-500 bg-emerald-100" : "border-emerald-300 bg-emerald-50/50"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Live Available</span>
            <div className="text-2xl font-bold text-emerald-700 mt-0.5">{availableCount}</div>
            <span className="text-[10px] text-emerald-700">{occupiedCount} occupied</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-56">
            <Search className="absolute left-3 top-2.5 size-3.5 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search room #, bed, type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-gold/30 bg-[#FAF7F2] pl-8 pr-3 py-1.5 text-xs text-[#061830] focus:border-gold focus:outline-none"
            />
          </div>

          {/* AC / Non-AC filter */}
          <select
            value={acFilter}
            onChange={(e) => setAcFilter(e.target.value)}
            className="rounded-full border border-gold/30 bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none"
          >
            <option value="all">All Climate (AC / Non-AC)</option>
            <option value="ac">AC Rooms (5)</option>
            <option value="non-ac">Non-AC Rooms (5)</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-full border border-gold/30 bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none capitalize"
          >
            <option value="all">All Categories</option>
            {state.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Bed Type filter */}
          <select
            value={bedFilter}
            onChange={(e) => setBedFilter(e.target.value)}
            className="rounded-full border border-gold/30 bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none"
          >
            <option value="all">All Bed Types</option>
            {bedTypes.map((bt) => (
              <option key={bt} value={bt}>
                {bt}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-gold/30 bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available / Ready</option>
            <option value="occupied">Occupied</option>
            <option value="cleaning">Cleaning / Dirty</option>
            <option value="maintenance">Maintenance</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        <div className="text-xs text-[#64748b]">
          Showing <strong>{filteredRooms.length}</strong> of {totalCount} rooms
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredRooms.map((r) => {
          const effStatus = getEffectiveStatus(r);
          const conf = STATUS_CONFIG[effStatus] || STATUS_CONFIG.available;
          const occupant = guestIn(r.number);
          const cat = state.categories.find((c) => c.id === r.categoryId) || {};
          const isAcRoom = r.isAc !== false && r.categoryId !== "non-ac" && r.categoryId !== "non-ac-double";
          const baseRate = r.price || cat.price || 1200;
          const gstAmount = Math.round(baseRate * 0.05);
          const totalRate = baseRate + gstAmount;
          const roomImg = r.image || cat.image || "/images/rooms/ac-family-room.jpg";

          return (
            <div
              key={r.number}
              className={`rounded-2xl border bg-white overflow-hidden shadow-card hover:shadow-lift transition flex flex-col justify-between ${
                effStatus === "occupied"
                  ? "border-blue-300"
                  : effStatus === "maintenance"
                  ? "border-rose-300"
                  : effStatus === "blocked"
                  ? "border-slate-400"
                  : effStatus === "dirty" || effStatus === "cleaning"
                  ? "border-amber-300"
                  : "border-gold/30"
              }`}
            >
              <div>
                {/* Room Image Banner with Badges */}
                <div className="relative h-32 w-full overflow-hidden bg-slate-100 border-b border-gold/15">
                  <img
                    src={roomImg}
                    alt={`Room ${r.number}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/images/rooms/ac-family-room.jpg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="rounded-md bg-navy-deep/85 backdrop-blur-sm px-2 py-0.5 text-xs font-bold text-white border border-gold/40">
                      Room {r.number}
                    </span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border backdrop-blur-sm ${
                      isAcRoom ? "bg-cyan-900/85 border-cyan-400 text-cyan-200" : "bg-amber-900/85 border-amber-400 text-amber-200"
                    }`}>
                      {isAcRoom ? "AC" : "Non-AC"}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(r.number)}
                      title={r.isPublished !== false ? "Click to Unpublish from Website" : "Click to Publish on Website"}
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold border flex items-center gap-1 transition cursor-pointer backdrop-blur-sm ${
                        r.isPublished !== false
                          ? "border-emerald-400 bg-emerald-950/85 text-emerald-300 hover:bg-emerald-900"
                          : "border-amber-400 bg-amber-950/85 text-amber-300 hover:bg-amber-900"
                      }`}
                    >
                      {r.isPublished !== false ? (
                        <>
                          <Globe className="size-2.5" /> Published
                        </>
                      ) : (
                        <>
                          <Lock className="size-2.5" /> Draft
                        </>
                      )}
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px]">
                    <span className="font-semibold truncate drop-shadow">{cat.name || r.categoryId}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border flex items-center gap-1 ${conf.badge}`}>
                      <span className={`size-1.5 rounded-full ${conf.dot}`} />
                      {conf.label}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2 text-xs text-[#475569]">
                  {/* Pricing Breakdown */}
                  <div className="rounded-xl bg-[#FAF7F2] p-2.5 border border-gold/20 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#64748b]">Base Rate:</span>
                      <strong className="text-[#061830]">{formatINR(baseRate)}/day</strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#64748b]">GST (5%):</span>
                      <span className="text-emerald-700 font-semibold">+{formatINR(gstAmount)}</span>
                    </div>
                    <div className="border-t border-gold/20 pt-1 flex items-center justify-between font-bold text-xs">
                      <span className="text-[#061830]">Total (incl. GST):</span>
                      <strong className="text-gold font-bold">{formatINR(totalRate)}/day</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#64748b]">Bed Type:</span>
                    <span className="font-semibold text-[#061830]">{r.bedType || r.bed || "Double Bed"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748b]">Max Capacity:</span>
                    <span className="font-semibold text-[#061830]">Up to {r.capacity || r.maxGuests || 2} Guests</span>
                  </div>

                  {occupant ? (
                    <div className={`mt-2 rounded-xl p-2 border text-[11px] ${
                      occupant.status === "Checked-In" ? "bg-blue-50/80 border-blue-200" : "bg-amber-50/80 border-amber-300"
                    }`}>
                      <span className={`text-[10px] font-bold block uppercase tracking-wider ${
                        occupant.status === "Checked-In" ? "text-blue-700" : "text-amber-800"
                      }`}>
                        {occupant.status === "Checked-In" ? "Current Occupant (In-House)" : "Held for Confirmed Booking"}
                      </span>
                      <strong className={`font-bold block truncate ${
                        occupant.status === "Checked-In" ? "text-blue-950" : "text-amber-950"
                      }`}>{occupant.guestName}</strong>
                      <span className={`text-[10px] ${
                        occupant.status === "Checked-In" ? "text-blue-800" : "text-amber-800"
                      }`}>
                        {formatDate(occupant.checkIn)} → {formatDate(occupant.checkOut)}
                      </span>
                    </div>
                  ) : r.status === "blocked" ? (
                    <div className="mt-2 rounded-xl bg-slate-100 p-2 border border-slate-300 text-[11px]">
                      <span className="text-[10px] text-slate-700 font-bold block uppercase tracking-wider">
                        Block Reason
                      </span>
                      <span className="text-slate-900 italic font-medium">{r.blockReason || "Management Hold"}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-gold/15 flex flex-wrap items-center justify-between gap-1 text-xs">
                {/* Status Switcher Dropdown */}
                <select
                  value={effStatus}
                  disabled={effStatus === "occupied"}
                  onChange={(e) => handleQuickStatus(r.number, e.target.value)}
                  className="rounded-lg border border-gold/30 bg-[#FAF7F2] px-2 py-1 text-[11px] font-bold text-[#061830] focus:border-gold focus:outline-none"
                >
                  <option value="available">Available</option>
                  <option value="dirty">Dirty</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="inspection_pending">Inspection</option>
                  <option value="ready">Ready</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="blocked">Blocked</option>
                </select>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Edit Suite"
                    onClick={() => handleOpenEdit(r)}
                    className="rounded-lg p-1.5 border border-gold/30 hover:bg-gold/15 text-[#061830] transition cursor-pointer"
                  >
                    <Edit2 className="size-3.5 text-gold" />
                  </button>
                  <button
                    type="button"
                    title={r.isPublished !== false ? "Unpublish from Website" : "Publish to Website"}
                    onClick={() => handleTogglePublish(r.number)}
                    className={`rounded-lg p-1.5 border transition cursor-pointer ${
                      r.isPublished !== false
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {r.isPublished !== false ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                  </button>
                  <button
                    type="button"
                    title="Block / Unblock Suite"
                    onClick={() => {
                      setBlockModalRoom(r);
                      setBlockReason(r.blockReason || "Management Hold");
                    }}
                    className={`rounded-lg p-1.5 transition cursor-pointer border ${
                      r.status === "blocked"
                        ? "bg-slate-200 border-slate-400 text-slate-800"
                        : "border-gold/30 hover:bg-gold/10 text-[#64748b]"
                    }`}
                  >
                    <Ban className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Delete or Archive Suite"
                    onClick={() => setDeleteConfirmRoom(r)}
                    className="rounded-lg p-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Room Details"
                    onClick={() => setDetailModalRoom(r)}
                    className="rounded-lg p-1.5 border border-gold/30 hover:bg-gold/10 text-[#64748b] transition cursor-pointer"
                  >
                    <SlidersHorizontal className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Room Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-3xl border border-gold/30 bg-white p-6 shadow-lift text-[#061830] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gold/15 pb-3">
              <h2 className="font-display text-lg font-bold">Add Suite to Inventory</h2>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="rounded-full p-1 hover:bg-slate-100 text-[#64748b]"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Room Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 401"
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm font-bold text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm font-bold text-[#061830] focus:border-gold focus:outline-none capitalize"
                  >
                    {state.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Floor Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formFloor}
                    onChange={(e) => setFormFloor(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Wing / Building
                  </label>
                  <select
                    value={formWing}
                    onChange={(e) => setFormWing(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
                  >
                    <option value="East Wing">East Wing</option>
                    <option value="West Wing">West Wing</option>
                    <option value="Royal Heritage Wing">Royal Heritage Wing</option>
                    <option value="Presidential Wing">Presidential Wing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Bed Configuration
                  </label>
                  <input
                    type="text"
                    value={formBed}
                    onChange={(e) => setFormBed(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Max Occupants
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formMaxGuests}
                    onChange={(e) => setFormMaxGuests(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Pricing & Climate for Add */}
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-gold/30 bg-[#FAF7F2] p-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Base Rate (₹/day)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-gold/40 bg-white px-3 py-2 text-sm font-bold text-[#061830] focus:border-gold focus:outline-none"
                  />
                  <span className="text-[10px] text-[#64748b] block mt-1">+5% GST: {formatINR(Math.round(formPrice * 0.05))}</span>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Climate
                  </label>
                  <select
                    value={formIsAc ? "ac" : "non-ac"}
                    onChange={(e) => setFormIsAc(e.target.value === "ac")}
                    className="w-full rounded-xl border border-gold/40 bg-white px-3 py-2 text-sm font-semibold text-[#061830] focus:border-gold focus:outline-none"
                  >
                    <option value="ac">AC Room</option>
                    <option value="non-ac">Non-AC Room</option>
                  </select>
                  <span className="text-[10px] font-bold text-gold block mt-1">Total: {formatINR(formPrice + Math.round(formPrice * 0.05))}/day</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Amenities (comma separated)
                </label>
                <textarea
                  rows={2}
                  value={formAmenities}
                  onChange={(e) => setFormAmenities(e.target.value)}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-gold/10 border border-gold/25">
                <input
                  type="checkbox"
                  id="formIsPublished"
                  checked={formIsPublished}
                  onChange={(e) => setFormIsPublished(e.target.checked)}
                  className="size-4 rounded text-gold accent-[#c5a880] cursor-pointer"
                />
                <label htmlFor="formIsPublished" className="text-xs font-semibold text-[#061830] cursor-pointer">
                  Publish to Customer Website &amp; Booking Engine immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-[#64748b] hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gold-gradient px-5 py-2 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110 cursor-pointer"
                >
                  Create Room
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Room Modal */}
      {editModalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-3xl border border-gold/30 bg-white p-6 shadow-lift text-[#061830] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gold/15 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gold font-bold">Suite Configuration</span>
                <h2 className="font-display text-lg font-bold">Edit Suite #{editModalRoom.number}</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditModalRoom(null)}
                className="rounded-full p-1 hover:bg-slate-100 text-[#64748b]"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Room Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editNumber}
                    onChange={(e) => setEditNumber(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm font-bold text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Category Tier <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => {
                      setEditCategory(e.target.value);
                      if (e.target.value === "non-ac" || e.target.value === "non-ac-double") {
                        setEditIsAc(false);
                      } else {
                        setEditIsAc(true);
                      }
                    }}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm font-bold text-[#061830] focus:border-gold focus:outline-none capitalize"
                  >
                    {state.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing & GST Section */}
              <div className="rounded-2xl border border-gold/30 bg-[#FAF7F2] p-3 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1 text-[#061830]">
                      Base Room Rate (₹/day) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="50"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full rounded-xl border border-gold/40 bg-white px-3 py-2 text-sm font-bold text-[#061830] focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1 text-[#061830]">
                      Climate System
                    </label>
                    <select
                      value={editIsAc ? "ac" : "non-ac"}
                      onChange={(e) => setEditIsAc(e.target.value === "ac")}
                      className="w-full rounded-xl border border-gold/40 bg-white px-3 py-2 text-sm font-semibold text-[#061830] focus:border-gold focus:outline-none"
                    >
                      <option value="ac">Air Conditioned (AC)</option>
                      <option value="non-ac">Non-AC</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-2.5 border border-gold/25 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[#64748b] block font-medium">GST Rate (5% dynamic):</span>
                    <strong className="text-emerald-700 font-bold">+{formatINR(Math.round(editPrice * 0.05))}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#64748b] block font-medium">Final Rate (incl. GST):</span>
                    <strong className="text-gold text-sm font-bold">{formatINR(editPrice + Math.round(editPrice * 0.05))}/day</strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Bed Configuration
                  </label>
                  <input
                    type="text"
                    value={editBed}
                    onChange={(e) => setEditBed(e.target.value)}
                    placeholder="e.g. Double Bed, Triple Bed, Queen Round Bed"
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {["Double Bed", "Triple Bed", "Queen Round Bed"].map((bOption) => (
                      <button
                        key={bOption}
                        type="button"
                        onClick={() => setEditBed(bOption)}
                        className="text-[9px] px-1.5 py-0.5 rounded border border-gold/25 bg-gold/10 hover:bg-gold/20 text-[#061830]"
                      >
                        {bOption}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Max Occupancy (Capacity)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(Number(e.target.value))}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm font-bold text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Room Photo / Image URL */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Room Photo / Image URL
                </label>
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl overflow-hidden bg-slate-100 border border-gold/30 shrink-0">
                    <img
                      src={editImage || "/images/rooms/ac-family-room.jpg"}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/images/rooms/ac-family-room.jpg";
                      }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="/images/rooms/... or https://..."
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Assigned Amenities (comma separated)
                </label>
                <textarea
                  rows={2}
                  value={editAmenities}
                  onChange={(e) => setEditAmenities(e.target.value)}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Administrative Notes / Maintenance Log
                </label>
                <input
                  type="text"
                  placeholder="e.g. Skyline view, acoustic glazed windows"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-gold/10 border border-gold/25">
                <input
                  type="checkbox"
                  id="editIsPublished"
                  checked={editIsPublished}
                  onChange={(e) => setEditIsPublished(e.target.checked)}
                  className="size-4 rounded text-gold accent-[#c5a880] cursor-pointer"
                />
                <label htmlFor="editIsPublished" className="text-xs font-semibold text-[#061830] cursor-pointer">
                  Publish on Customer Website &amp; Online Booking Engine
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditModalRoom(null)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-[#64748b] hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-full bg-gold-gradient px-5 py-2 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110 cursor-pointer"
                >
                  <Save className="size-3.5" /> Save Suite Configuration
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete / Archive Confirmation Dialog */}
      {deleteConfirmRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-rose-300 bg-white p-6 shadow-lift text-[#061830] space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-rose-200 pb-3 text-rose-700">
              <ShieldAlert className="size-6 text-rose-600 shrink-0" />
              <h2 className="font-display text-lg font-bold">Delete Suite #{deleteConfirmRoom.number}?</h2>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">
              Are you sure you want to delete <strong>Suite #{deleteConfirmRoom.number}</strong> ({deleteConfirmRoom.categoryId?.toUpperCase()})?
            </p>

            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-[11px] text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="size-3.5 text-amber-700" /> Data Integrity Guarantee:
              </p>
              <p>
                • If an <strong>active or upcoming booking</strong> is assigned, deletion will be blocked to protect guests.
              </p>
              <p>
                • If <strong>past stay records</strong> exist, the room will be safely archived and unpublished instead of permanently removed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmRoom(null)}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-[#64748b] hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-full bg-rose-600 hover:bg-rose-700 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Block/Unblock Room Modal */}
      {blockModalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-gold/30 bg-white p-6 shadow-lift text-[#061830] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gold/15 pb-3">
              <h2 className="font-display text-lg font-bold">
                {blockModalRoom.status === "blocked" ? "Unblock Suite" : "Block Suite"} #{blockModalRoom.number}
              </h2>
              <button
                type="button"
                onClick={() => setBlockModalRoom(null)}
                className="rounded-full p-1 hover:bg-slate-100 text-[#64748b]"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleToggleBlock} className="space-y-4">
              <p className="text-xs text-[#64748b]">
                {blockModalRoom.status === "blocked"
                  ? "Unblocking this suite will release it back into the active available inventory for guest bookings."
                  : "Blocking this suite will prevent it from being booked online or at the reception desk."}
              </p>

              {blockModalRoom.status !== "blocked" && (
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Reason for Hold / Block
                  </label>
                  <select
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830]"
                  >
                    <option value="Executive Hold">Executive Hold (VIP Delegation)</option>
                    <option value="Deep Sanitization & Ozone Treatment">Deep Sanitization &amp; Ozone</option>
                    <option value="Interior Refurbishment">Interior Refurbishment</option>
                    <option value="Management Hold">General Management Hold</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setBlockModalRoom(null)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-[#64748b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider text-white ${
                    blockModalRoom.status === "blocked" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-slate-800 hover:bg-slate-900"
                  }`}
                >
                  {blockModalRoom.status === "blocked" ? "Confirm Unblock" : "Apply Room Hold"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Room Detail Dialog */}
      {detailModalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-3xl border border-gold/30 bg-white p-6 shadow-lift text-[#061830] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gold/15 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gold font-bold">Suite Details</span>
                <h2 className="font-display text-xl font-bold">Room #{detailModalRoom.number}</h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalRoom(null)}
                className="rounded-full p-1 hover:bg-slate-100 text-[#64748b]"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-[#FAF7F2] p-4 border border-gold/20 text-xs">
              <div>
                <span className="text-[#64748b] block">Category:</span>
                <strong className="text-sm font-bold capitalize">{detailModalRoom.categoryId}</strong>
              </div>
              <div>
                <span className="text-[#64748b] block">Location:</span>
                <strong className="text-sm font-bold">Floor {detailModalRoom.floor}, {detailModalRoom.wing || "East Wing"}</strong>
              </div>
              <div>
                <span className="text-[#64748b] block">Capacity:</span>
                <strong className="text-sm font-bold">{detailModalRoom.maxGuests || 2} Persons</strong>
              </div>
              <div>
                <span className="text-[#64748b] block">Bed Type:</span>
                <strong className="text-sm font-bold">{detailModalRoom.bed || "King Bed"}</strong>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-1">
                Room Amenities
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(detailModalRoom.amenities || []).map((am) => (
                  <span
                    key={am}
                    className="rounded-full bg-gold/10 border border-gold/30 px-2.5 py-0.5 text-[10px] text-[#061830] font-semibold"
                  >
                    {am}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-gold/15 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModalRoom(null)}
                className="rounded-full bg-[#061830] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
