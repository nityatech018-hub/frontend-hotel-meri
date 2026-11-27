import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  BedDouble,
  CalendarCheck,
  CalendarClock,
  DoorClosed,
  DoorOpen,
  Plus,
  UserPlus,
  SlidersHorizontal,
  RotateCcw,
  Calendar,
  Users,
  MoreHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  LogIn,
  LogOut,
  XCircle,
  CreditCard,
  FileText,
  Download,
  SearchX,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { BookingDialog } from "@/components/dashboard/BookingDialog.jsx";
import { formatDate, formatINR, nightsBetween, todayISO } from "@/lib/hotel/pricing.js";
import {
  getCategory,
  setBookingStatus,
  checkInBooking,
  checkOutBooking,
  freeRoomsFor,
  occupiedRoomNumbers,
  useHotelState,
} from "@/lib/hotel/store.jsx";
import { cn } from "@/lib/utils.js";

const STATUS_TABS = ["All Bookings", "Confirmed", "Checked-In", "Checked-Out", "Cancelled"];

const AVATAR_TONES = [
  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-sky-50 text-sky-700 border-sky-200",
  "bg-rose-50 text-rose-700 border-rose-200",
];

function getInitials(name = "G") {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StatusPill({ status }) {
  const map = {
    "Checked-In": {
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
    },
    Confirmed: {
      cls: "bg-sky-50 text-sky-700 border-sky-200",
      icon: CalendarCheck,
    },
    "Checked-Out": {
      cls: "bg-slate-100 text-slate-600 border-slate-200",
      icon: LogOut,
    },
    Cancelled: {
      cls: "bg-rose-50 text-rose-700 border-rose-200",
      icon: Ban,
    },
    Pending: {
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Clock,
    },
    "No-Show": {
      cls: "bg-orange-50 text-orange-700 border-orange-200",
      icon: AlertTriangle,
    },
  };
  const cfg = map[status] || map.Pending;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        cfg.cls
      )}
    >
      <Icon className="size-3 shrink-0" />
      {status}
    </span>
  );
}

const DEFAULT_ADVANCED = {
  checkInDate: "",
  checkOutDate: "",
  advStatus: "All",
  paymentStatus: "All",
  paymentMethod: "All",
  guestCount: "All",
  roomNumber: "",
  bookingId: "",
  guestName: "",
  mobile: "",
  minAmount: "",
  maxAmount: "",
};

export default function ReceptionBookings() {
  const state = useHotelState();
  const navigate = useNavigate();
  const today = todayISO();
  const [searchParams, setSearchParams] = useSearchParams();
  const globalQuery = searchParams.get("search") || searchParams.get("q") || "";

  // Loading skeleton state
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 180);
    return () => clearTimeout(t);
  }, []);

  // Primary filters
  const [statusTab, setStatusTab] = useState("All Bookings");
  const [bookingStartDate, setBookingStartDate] = useState("");
  const [bookingEndDate, setBookingEndDate] = useState("");
  const [roomType, setRoomType] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");

  // Advanced filters (draft + applied)
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [draftAdv, setDraftAdv] = useState(DEFAULT_ADVANCED);
  const [appliedAdv, setAppliedAdv] = useState(DEFAULT_ADVANCED);

  // Sorting, pagination, selection, dialog, action menu
  const [sortBy, setSortBy] = useState("bookingDate"); // bookingDate | stayDate | amount
  const [sortDir, setSortDir] = useState("desc"); // asc | desc
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeDialogBooking, setActiveDialogBooking] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onEsc);
    };
  }, []);

  const bookings = state?.bookings || [];
  const rooms = state?.rooms || [];
  const categories = state?.categories || [];

  // Summary metrics from live data
  const totalBookingsCount = bookings.length;
  const checkInsTodayCount = useMemo(
    () =>
      bookings.filter(
        (b) => b.checkIn === today && ["Confirmed", "Pending", "Checked-In"].includes(b.status)
      ).length,
    [bookings, today]
  );
  const checkOutsTodayCount = useMemo(
    () =>
      bookings.filter(
        (b) => b.checkOut === today && ["Checked-In", "Checked-Out"].includes(b.status)
      ).length,
    [bookings, today]
  );
  const occupiedCount = useMemo(() => occupiedRoomNumbers(state, today).size, [state, today]);
  const totalRoomsCount = rooms.length;
  const availableRoomsCount = Math.max(0, totalRoomsCount - occupiedCount);

  // Status tab counts
  const tabCounts = useMemo(() => {
    const counts = {
      "All Bookings": bookings.length,
      Confirmed: 0,
      "Checked-In": 0,
      "Checked-Out": 0,
      Cancelled: 0,
    };
    for (const b of bookings) {
      if (counts[b.status] !== undefined) counts[b.status] += 1;
    }
    return counts;
  }, [bookings]);

  // Unique booking sources from existing data
  const sources = useMemo(() => {
    const set = new Set(["Website", "Walk-in", "Reception"]);
    bookings.forEach((b) => {
      if (b.source) set.add(b.source);
    });
    return Array.from(set);
  }, [bookings]);

  // Combined filtering + sorting
  const filteredBookings = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");

    return [...bookings]
      .filter((b) => {
        if (statusTab !== "All Bookings" && b.status !== statusTab) return false;

        // Global search (Booking ID, Guest Name, Mobile, Room No)
        if (q) {
          const matchId = (b.id || "").toLowerCase().includes(q);
          const matchName = (b.guestName || "").toLowerCase().includes(q);
          const matchRoom = (b.roomNumber ? String(b.roomNumber) : "").toLowerCase().includes(q);
          const matchPhone = qDigits.length >= 2 && (b.phone || "").replace(/\D/g, "").includes(qDigits);
          if (!matchId && !matchName && !matchRoom && !matchPhone) return false;
        }

        // Booking date range
        const bDate = b.bookingDate || (b.createdAt ? b.createdAt.slice(0, 10) : b.checkIn) || "";
        if (bookingStartDate && bDate < bookingStartDate) return false;
        if (bookingEndDate && bDate > bookingEndDate) return false;

        // Room Type
        if (roomType !== "All" && b.categoryId !== roomType) return false;

        // Booking Source
        if (sourceFilter !== "All") {
          if (sourceFilter === "Reception / Walk-In") {
            if (!["Walk-in", "Reception"].includes(b.source)) return false;
          } else if ((b.source || "Website").toLowerCase() !== sourceFilter.toLowerCase()) {
            return false;
          }
        }

        // Advanced Filters
        if (appliedAdv.checkInDate && (b.checkIn || "") < appliedAdv.checkInDate) return false;
        if (appliedAdv.checkOutDate && (b.checkOut || "") > appliedAdv.checkOutDate) return false;
        if (appliedAdv.advStatus !== "All" && b.status !== appliedAdv.advStatus) return false;
        if (appliedAdv.paymentStatus !== "All" && (b.payment || "Unpaid") !== appliedAdv.paymentStatus) return false;
        if (appliedAdv.paymentMethod !== "All") {
          if ((b.paymentMethod || "").toLowerCase() !== appliedAdv.paymentMethod.toLowerCase()) return false;
        }
        if (appliedAdv.guestCount !== "All") {
          const gCount = Number(b.guests || 1);
          if (appliedAdv.guestCount === "3+") {
            if (gCount < 3) return false;
          } else if (gCount !== Number(appliedAdv.guestCount)) {
            return false;
          }
        }
        if (appliedAdv.roomNumber.trim()) {
          if (!String(b.roomNumber || "").toLowerCase().includes(appliedAdv.roomNumber.trim().toLowerCase())) {
            return false;
          }
        }
        if (appliedAdv.bookingId.trim()) {
          if (!(b.id || "").toLowerCase().includes(appliedAdv.bookingId.trim().toLowerCase())) return false;
        }
        if (appliedAdv.guestName.trim()) {
          if (!(b.guestName || "").toLowerCase().includes(appliedAdv.guestName.trim().toLowerCase())) return false;
        }
        if (appliedAdv.mobile.trim()) {
          const mDigits = appliedAdv.mobile.replace(/\D/g, "");
          if (mDigits && !(b.phone || "").replace(/\D/g, "").includes(mDigits)) return false;
        }
        if (appliedAdv.minAmount !== "" && Number(b.total || 0) < Number(appliedAdv.minAmount)) return false;
        if (appliedAdv.maxAmount !== "" && Number(b.total || 0) > Number(appliedAdv.maxAmount)) return false;

        return true;
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortBy === "amount") {
          return ((a.total || 0) - (b.total || 0)) * dir;
        }
        if (sortBy === "stayDate") {
          return (a.checkIn || "").localeCompare(b.checkIn || "") * dir;
        }
        const aTime = a.bookedAt || a.createdAt || a.bookingDate || a.checkIn || "";
        const bTime = b.bookedAt || b.createdAt || b.bookingDate || b.checkIn || "";
        return aTime.localeCompare(bTime) * dir;
      });
  }, [bookings, statusTab, globalQuery, bookingStartDate, bookingEndDate, roomType, sourceFilter, appliedAdv, sortBy, sortDir]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusTab, globalQuery, bookingStartDate, bookingEndDate, roomType, sourceFilter, appliedAdv, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filteredBookings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeAdvCount = Object.entries(appliedAdv).filter(
    ([k, v]) => v !== DEFAULT_ADVANCED[k]
  ).length;

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  const handleResetAll = () => {
    setStatusTab("All Bookings");
    setBookingStartDate("");
    setBookingEndDate("");
    setRoomType("All");
    setSourceFilter("All");
    setDraftAdv(DEFAULT_ADVANCED);
    setAppliedAdv(DEFAULT_ADVANCED);
    setSelectedIds([]);
    if (globalQuery) {
      const next = new URLSearchParams(searchParams);
      next.delete("search");
      setSearchParams(next, { replace: true });
    }
    toast.success("All filters reset.");
  };

  const handleApplyMoreFilters = (e) => {
    e.preventDefault();
    setAppliedAdv(draftAdv);
    setShowMoreFilters(false);
  };

  const handleClearMoreFilters = () => {
    setDraftAdv(DEFAULT_ADVANCED);
    setAppliedAdv(DEFAULT_ADVANCED);
  };

  // Selection handlers
  const pageIds = paginated.map((b) => b.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllPage = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Row Actions
  const handleCheckIn = (b) => {
    setOpenMenuId(null);
    const free = freeRoomsFor(state, b.categoryId);
    const room = b.roomNumber && free.includes(b.roomNumber) ? b.roomNumber : free[0];
    if (room) {
      checkInBooking(b.id, room);
      toast.success(`${b.guestName} checked into Room ${room}.`);
    } else {
      toast.error("No free clean room available. Open details to assign manually.");
      setActiveDialogBooking(b);
    }
  };

  const handleCheckOut = (b) => {
    setOpenMenuId(null);
    const bal = Math.max(0, (b.total || 0) - (b.amountPaid || 0));
    if (bal > 0) {
      toast.error(`Cannot check out ${b.guestName} before settling the pending balance of ${formatINR(bal)}.`);
      setActiveDialogBooking(b);
      return;
    }
    checkOutBooking(b.id);
    toast.success(`${b.guestName} checked out successfully.`);
  };

  const handleCancelBooking = (b) => {
    setOpenMenuId(null);
    setBookingStatus(b.id, "Cancelled");
    toast.success(`Booking ${b.id} cancelled.`);
  };

  const handleExportSelected = () => {
    const rows = bookings.filter((b) => selectedIds.includes(b.id));
    if (rows.length === 0) return;
    const headers = ["Booking ID", "Guest Name", "Phone", "Room", "Check-In", "Check-Out", "Guests", "Amount", "Status"];
    const csv = [
      headers.join(","),
      ...rows.map((b) =>
        [
          b.id,
          `"${(b.guestName || "").replace(/"/g, '""')}"`,
          b.phone || "",
          b.roomNumber || "Unassigned",
          b.checkIn || "",
          b.checkOut || "",
          b.guests || 1,
          b.total || 0,
          b.status || "",
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hotel-meri-bookings-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} booking(s) to CSV.`);
  };

  if (!state) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
        <AlertTriangle className="mx-auto size-8 text-rose-600" />
        <h2 className="mt-3 text-base font-bold text-[#071A32]">Unable to load bookings</h2>
        <p className="mt-1 text-xs text-slate-600">Please refresh the page or check your session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 bg-[#FFFFFF] text-[#071A32]">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#071A32]">Bookings</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage reservations, check-ins and check-outs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/reception/new?walkin=true"
            className="inline-flex items-center gap-2 rounded-lg bg-[#071A32] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0D2545] transition-colors"
          >
            <UserPlus className="size-4 text-[#D5A43D]" />
            <span>Walk-In Booking</span>
          </Link>
        </div>
      </div>

      {/* 5 Compact Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          {
            label: "Total Bookings",
            value: totalBookingsCount,
            icon: BedDouble,
            iconCls: "bg-slate-100 text-[#071A32]",
          },
          {
            label: "Check-Ins Today",
            value: checkInsTodayCount,
            icon: CalendarCheck,
            iconCls: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Check-Outs Today",
            value: checkOutsTodayCount,
            icon: CalendarClock,
            iconCls: "bg-amber-50 text-amber-700",
          },
          {
            label: "Occupied Rooms",
            value: (
              <>
                {occupiedCount}{" "}
                <span className="text-sm font-medium text-slate-400">/ {totalRoomsCount}</span>
              </>
            ),
            icon: DoorClosed,
            iconCls: "bg-indigo-50 text-indigo-700",
          },
          {
            label: "Available Rooms",
            value: availableRoomsCount,
            icon: DoorOpen,
            iconCls: "bg-emerald-50 text-emerald-700",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="flex items-center gap-3.5 rounded-xl border border-[#E5E7EB] bg-white p-4"
            >
              <div className={cn("grid size-10 shrink-0 place-items-center rounded-lg", card.iconCls)}>
                <Icon className="size-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-tight text-[#071A32]">{card.value}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Horizontal Status Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => {
          const active = statusTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusTab(tab)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                active
                  ? "bg-[#071A32] text-white"
                  : "border border-[#E5E7EB] bg-white text-slate-600 hover:bg-slate-50 hover:text-[#071A32]"
              )}
            >
              <span>{tab}</span>
              <span className={active ? "text-white/80" : "text-slate-400"}>({tabCounts[tab] ?? 0})</span>
            </button>
          );
        })}
      </div>

      {/* Compact Filter Bar */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 items-end">
          {/* Booking Date Range */}
          <div className="lg:col-span-4">
            <label className="mb-1 block text-[11px] font-semibold text-slate-600">
              Booking Date
            </label>
            <div className="flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5">
              <Calendar className="size-4 text-slate-400 shrink-0" />
              <input
                type="date"
                value={bookingStartDate}
                onChange={(e) => setBookingStartDate(e.target.value)}
                aria-label="Booking start date"
                className="w-full bg-transparent text-xs text-[#071A32] focus:outline-none"
              />
              <span className="text-xs text-slate-400">–</span>
              <input
                type="date"
                value={bookingEndDate}
                min={bookingStartDate || undefined}
                onChange={(e) => setBookingEndDate(e.target.value)}
                aria-label="Booking end date"
                className="w-full bg-transparent text-xs text-[#071A32] focus:outline-none"
              />
            </div>
          </div>

          {/* Room Type */}
          <div className="lg:col-span-3">
            <label className="mb-1 block text-[11px] font-semibold text-slate-600">
              Room Type
            </label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#071A32] focus:border-[#071A32] focus:outline-none"
            >
              <option value="All">All Rooms</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Booking Source */}
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold text-slate-600">
              Source
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#071A32] focus:border-[#071A32] focus:outline-none"
            >
              <option value="All">All Sources</option>
              <option value="Website">Website</option>
              <option value="Reception / Walk-In">Reception / Walk-In</option>
              {sources
                .filter((s) => !["Website", "Walk-in", "Reception"].includes(s))
                .map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
            </select>
          </div>

          {/* More Filters & Reset */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMoreFilters((s) => !s)}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer",
                showMoreFilters || activeAdvCount > 0
                  ? "border-[#071A32] bg-[#071A32]/5 text-[#071A32]"
                  : "border-[#E5E7EB] bg-white text-[#071A32] hover:bg-slate-50"
              )}
            >
              <SlidersHorizontal className="size-3.5" />
              <span>More Filters</span>
              {activeAdvCount > 0 && (
                <span className="rounded-full bg-[#D5A43D] px-1.5 py-0.2 text-[10px] font-bold text-[#071A32]">
                  {activeAdvCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#071A32] transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Expandable More Filters Panel */}
        {showMoreFilters && (
          <form
            onSubmit={handleApplyMoreFilters}
            className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 space-y-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Check-In From</label>
                <input
                  type="date"
                  value={draftAdv.checkInDate}
                  onChange={(e) => setDraftAdv({ ...draftAdv, checkInDate: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs text-[#071A32]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Check-Out To</label>
                <input
                  type="date"
                  value={draftAdv.checkOutDate}
                  onChange={(e) => setDraftAdv({ ...draftAdv, checkOutDate: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs text-[#071A32]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Booking Status</label>
                <select
                  value={draftAdv.advStatus}
                  onChange={(e) => setDraftAdv({ ...draftAdv, advStatus: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs text-[#071A32]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Checked-In">Checked-In</option>
                  <option value="Checked-Out">Checked-Out</option>
                  <option value="Pending">Pending</option>
                  <option value="No-Show">No-Show</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Payment Status</label>
                <select
                  value={draftAdv.paymentStatus}
                  onChange={(e) => setDraftAdv({ ...draftAdv, paymentStatus: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs text-[#071A32]"
                >
                  <option value="All">All Payment Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Payment Method</label>
                <select
                  value={draftAdv.paymentMethod}
                  onChange={(e) => setDraftAdv({ ...draftAdv, paymentMethod: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs text-[#071A32]"
                >
                  <option value="All">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Pay at Hotel">Pay at Hotel</option>
                  <option value="Online UPI/Card">Online UPI/Card</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Guest Count</label>
                <select
                  value={draftAdv.guestCount}
                  onChange={(e) => setDraftAdv({ ...draftAdv, guestCount: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs text-[#071A32]"
                >
                  <option value="All">Any Guests</option>
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3+">3+ Guests</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Room Number</label>
                <input
                  type="text"
                  placeholder="e.g. 101"
                  value={draftAdv.roomNumber}
                  onChange={(e) => setDraftAdv({ ...draftAdv, roomNumber: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs text-[#071A32]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Booking ID</label>
                <input
                  type="text"
                  placeholder="e.g. HMR-DEMO01"
                  value={draftAdv.bookingId}
                  onChange={(e) => setDraftAdv({ ...draftAdv, bookingId: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs text-[#071A32]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Guest Name</label>
                <input
                  type="text"
                  placeholder="Guest name"
                  value={draftAdv.guestName}
                  onChange={(e) => setDraftAdv({ ...draftAdv, guestName: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs text-[#071A32]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Mobile Number</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={draftAdv.mobile}
                  onChange={(e) => setDraftAdv({ ...draftAdv, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs text-[#071A32]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Min Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={draftAdv.minAmount}
                  onChange={(e) => setDraftAdv({ ...draftAdv, minAmount: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs text-[#071A32]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">Max Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="50000"
                  value={draftAdv.maxAmount}
                  onChange={(e) => setDraftAdv({ ...draftAdv, maxAmount: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs text-[#071A32]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#E5E7EB] pt-3">
              <button
                type="button"
                onClick={handleClearMoreFilters}
                className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Clear Filters
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#D5A43D] px-4 py-2 text-xs font-bold text-[#071A32] hover:bg-[#e2b656] cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Bulk Selection Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D5A43D]/50 bg-[#D5A43D]/10 px-4 py-2.5 text-xs">
          <span className="font-semibold text-[#071A32]">
            {selectedIds.length} booking{selectedIds.length === 1 ? "" : "s"} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportSelected}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 font-semibold text-[#071A32] hover:bg-slate-50 cursor-pointer"
            >
              <Download className="size-3.5" /> Export CSV
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="rounded-lg px-2.5 py-1.5 font-medium text-slate-600 hover:text-[#071A32] cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Booking Management Table / Loading / Empty */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <SearchX className="mx-auto size-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-[#071A32]">No bookings found</h3>
            <p className="mt-1 text-xs text-slate-500">
              No reservations match your active search or filter criteria.
            </p>
            <button
              type="button"
              onClick={handleResetAll}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-semibold text-[#071A32] hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className="size-3.5" /> Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop & Tablet Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[11px] font-semibold text-slate-500">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAllPage}
                        aria-label="Select all bookings on current page"
                        className="size-4 rounded border-slate-300 accent-[#071A32] cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("bookingDate")}
                        className="inline-flex items-center gap-1 hover:text-[#071A32] cursor-pointer"
                      >
                        Booking ID <ArrowUpDown className="size-3" />
                      </button>
                    </th>
                    <th className="px-3 py-3">Guest Name</th>
                    <th className="px-3 py-3">Room</th>
                    <th className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("stayDate")}
                        className="inline-flex items-center gap-1 hover:text-[#071A32] cursor-pointer"
                      >
                        Stay Period <ArrowUpDown className="size-3" />
                      </button>
                    </th>
                    <th className="px-3 py-3">Guests</th>
                    <th className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("amount")}
                        className="inline-flex items-center gap-1 hover:text-[#071A32] cursor-pointer"
                      >
                        Amount <ArrowUpDown className="size-3" />
                      </button>
                    </th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-xs">
                  {paginated.map((b, idx) => {
                    const cat = getCategory(state, b.categoryId);
                    const nights = nightsBetween(b.checkIn, b.checkOut);
                    const avatarTone = AVATAR_TONES[idx % AVATAR_TONES.length];
                    const canCheckIn = b.status === "Confirmed" || b.status === "Pending";
                    const canCheckOut = b.status === "Checked-In";
                    const canCancel = b.status === "Confirmed" || b.status === "Pending";

                    return (
                      <tr
                        key={b.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(b.id)}
                            onChange={() => toggleSelectRow(b.id)}
                            aria-label={`Select booking ${b.id}`}
                            className="size-4 rounded border-slate-300 accent-[#071A32] cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-3.5 font-semibold text-[#071A32] whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setActiveDialogBooking(b)}
                            className="hover:underline cursor-pointer"
                          >
                            {b.id}
                          </button>
                        </td>
                        <td className="px-3 py-3.5">
                          <button
                            type="button"
                            onClick={() => setActiveDialogBooking(b)}
                            className="flex items-center gap-2.5 text-left cursor-pointer"
                          >
                            <span
                              className={cn(
                                "grid size-8 shrink-0 place-items-center rounded-full border text-[11px] font-bold",
                                avatarTone
                              )}
                            >
                              {getInitials(b.guestName)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#071A32] truncate">{b.guestName}</p>
                              <p className="text-[11px] text-slate-500">{b.phone || "—"}</p>
                            </div>
                          </button>
                        </td>
                        <td className="px-3 py-3.5">
                          {b.roomNumber ? (
                            <p className="font-semibold text-[#071A32]">Room {b.roomNumber}</p>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveDialogBooking(b)}
                              className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800 hover:bg-amber-100 cursor-pointer"
                            >
                              Assign Room
                            </button>
                          )}
                          <p className="text-[11px] text-slate-500 truncate max-w-[150px] mt-0.5">
                            {cat?.shortName || cat?.name}
                          </p>
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <div className="flex items-start gap-1.5">
                            <Calendar className="mt-0.5 size-3.5 text-slate-400 shrink-0" />
                            <div>
                              <p className="font-medium text-[#071A32]">
                                {formatDate(b.checkIn)} – {formatDate(b.checkOut)}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                ({nights} {nights === 1 ? "Night" : "Nights"})
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[#071A32] font-medium">
                            <Users className="size-3.5 text-slate-400" />
                            {b.guests || 1}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 font-semibold text-[#071A32] whitespace-nowrap">
                          {formatINR(b.total)}
                        </td>
                        <td className="px-3 py-3.5">
                          <StatusPill status={b.status} />
                        </td>
                        <td className="px-4 py-3.5 text-right relative">
                          <button
                            type="button"
                            onClick={() => setOpenMenuId(openMenuId === b.id ? null : b.id)}
                            aria-label={`Actions for booking ${b.id}`}
                            className="inline-grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#071A32] transition cursor-pointer"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>

                          {openMenuId === b.id && (
                            <div
                              ref={menuRef}
                              className="absolute right-4 top-11 z-40 w-48 rounded-xl border border-[#E5E7EB] bg-white py-1.5 text-left shadow-lg"
                            >
                              {!b.roomNumber && canCheckIn && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setActiveDialogBooking(b);
                                  }}
                                  className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 cursor-pointer"
                                >
                                  <BedDouble className="size-3.5" /> Assign Room
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setActiveDialogBooking(b);
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#071A32] hover:bg-slate-50 cursor-pointer"
                              >
                                <Eye className="size-3.5 text-slate-500" /> View Details
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setActiveDialogBooking(b);
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#071A32] hover:bg-slate-50 cursor-pointer"
                              >
                                <Pencil className="size-3.5 text-slate-500" /> Edit Booking
                              </button>
                              {canCheckIn && (
                                <button
                                  type="button"
                                  onClick={() => handleCheckIn(b)}
                                  className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                                >
                                  <LogIn className="size-3.5" /> Check-In
                                </button>
                              )}
                              {canCheckOut && (
                                <button
                                  type="button"
                                  onClick={() => handleCheckOut(b)}
                                  className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#071A32] hover:bg-slate-50 cursor-pointer"
                                >
                                  <LogOut className="size-3.5 text-slate-500" /> Check-Out
                                </button>
                              )}
                              {canCancel && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelBooking(b)}
                                  className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
                                >
                                  <XCircle className="size-3.5" /> Cancel Booking
                                </button>
                              )}
                              <div className="my-1 border-t border-[#E5E7EB]" />
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setActiveDialogBooking(b);
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#071A32] hover:bg-slate-50 cursor-pointer"
                              >
                                <CreditCard className="size-3.5 text-slate-500" /> View Payment Details
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  navigate(`/invoice/${b.id}`);
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#071A32] hover:bg-slate-50 cursor-pointer"
                              >
                                <FileText className="size-3.5 text-slate-500" /> Download Invoice
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="divide-y divide-[#E5E7EB] md:hidden">
              {paginated.map((b, idx) => {
                const cat = getCategory(state, b.categoryId);
                const nights = nightsBetween(b.checkIn, b.checkOut);
                const avatarTone = AVATAR_TONES[idx % AVATAR_TONES.length];
                return (
                  <div key={b.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(b.id)}
                          onChange={() => toggleSelectRow(b.id)}
                          className="size-4 rounded border-slate-300 accent-[#071A32]"
                        />
                        <span
                          className={cn(
                            "grid size-8 shrink-0 place-items-center rounded-full border text-[11px] font-bold",
                            avatarTone
                          )}
                        >
                          {getInitials(b.guestName)}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-[#071A32]">{b.guestName}</p>
                          <p className="text-[11px] text-slate-500">{b.id} · {b.phone}</p>
                        </div>
                      </div>
                      <StatusPill status={b.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#F9FAFB] p-2.5 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Room</span>
                        <span className="font-semibold text-[#071A32]">
                          {b.roomNumber || "Unassigned"} · {cat?.shortName || cat?.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Amount</span>
                        <span className="font-semibold text-[#071A32]">{formatINR(b.total)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 block">Stay Period</span>
                        <span className="font-medium text-[#071A32]">
                          {formatDate(b.checkIn)} – {formatDate(b.checkOut)} ({nights}N · {b.guests || 1} Guests)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveDialogBooking(b)}
                        className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-semibold text-[#071A32]"
                      >
                        View Details
                      </button>
                      {(b.status === "Confirmed" || b.status === "Pending") && (
                        <button
                          type="button"
                          onClick={() => handleCheckIn(b)}
                          className="rounded-lg bg-[#D5A43D] px-3 py-1.5 text-xs font-bold text-[#071A32]"
                        >
                          Check-In
                        </button>
                      )}
                      {b.status === "Checked-In" && (
                        <button
                          type="button"
                          onClick={() => handleCheckOut(b)}
                          className="rounded-lg bg-[#071A32] px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Check-Out
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination Footer */}
      {filteredBookings.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs text-slate-500">
          <p>
            Showing {(currentPage - 1) * pageSize + 1} –{" "}
            {Math.min(currentPage * pageSize, filteredBookings.length)} of{" "}
            {filteredBookings.length} bookings
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              aria-label="Rows per page"
              className="rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-xs font-medium text-[#071A32] focus:outline-none"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
                className="grid size-8 place-items-center rounded-lg border border-[#E5E7EB] bg-white text-[#071A32] disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  return (
                    <React.Fragment key={p}>
                      {prev && p - prev > 1 && (
                        <span className="px-1.5 text-slate-400">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setPage(p)}
                        className={cn(
                          "grid size-8 place-items-center rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                          p === currentPage
                            ? "bg-[#071A32] text-white"
                            : "border border-[#E5E7EB] bg-white text-[#071A32] hover:bg-slate-50"
                        )}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
                className="grid size-8 place-items-center rounded-lg border border-[#E5E7EB] bg-white text-[#071A32] disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Booking Details / Edit / Payment Drawer */}
      <BookingDialog
        booking={activeDialogBooking}
        onClose={() => setActiveDialogBooking(null)}
      />
    </div>
  );
}
