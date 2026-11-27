import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Search,
  Filter,
  PlusCircle,
  Eye,
  Pencil,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Phone,
  Mail,
  CreditCard,
  Printer,
  Download,
  AlertCircle,
  Clock,
  BedDouble,
  Sparkles,
  X,
  FileText,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import {
  useHotelState,
  getCategory,
  updateBooking,
  setBookingStatus,
  confirmBooking,
  recordPayment,
  freeRoomsFor,
} from "@/lib/hotel/store.jsx";
import { formatINR, formatDate, datesOverlap, quoteStay, todayISO } from "@/lib/hotel/pricing.js";
import { StatusBadge, PaymentBadge } from "@/components/site/StatusBadge.jsx";

const STATUS_FILTERS = ["All", "Pending", "Confirmed", "Checked-In", "Checked-Out", "Cancelled", "No-Show"];

export default function AdminReservationsPage() {
  const state = useHotelState();
  const today = todayISO();

  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all"); // 'all', 'today', 'week', 'month'
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  // Date-based counters for Booked Today, This Week, This Month
  const thisMonthPrefix = today.substring(0, 7);
  const todayBookingsCount = (state.bookings || []).filter(
    (b) => b.bookingDate === today || (b.createdAt && b.createdAt.startsWith(today))
  ).length;

  const weekBookingsCount = (state.bookings || []).filter((b) => {
    const bDate = b.bookingDate || (b.createdAt && b.createdAt.substring(0, 10)) || "";
    if (!bDate) return false;
    const diffDays = (new Date(today) - new Date(bDate)) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  const monthBookingsCount = (state.bookings || []).filter((b) => {
    const bDate = b.bookingDate || (b.createdAt && b.createdAt.substring(0, 10)) || "";
    return bDate.startsWith(thisMonthPrefix);
  }).length;

  // Modals state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [extendModalBooking, setExtendModalBooking] = useState(null);
  const [extendCheckOut, setExtendCheckOut] = useState("");

  // Create Reservation Form State
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createCategory, setCreateCategory] = useState(state.categories[0]?.id || "ac-family-double");
  const [createCheckIn, setCreateCheckIn] = useState(today);
  const [createCheckOut, setCreateCheckOut] = useState("");
  const [createGuests, setCreateGuests] = useState(2);
  const [createRoomNum, setCreateRoomNum] = useState("");
  const [createAdvance, setCreateAdvance] = useState("");
  const [createRequests, setCreateRequests] = useState("");
  const [createNotes, setCreateNotes] = useState("");

  // Filtering list
  const filteredBookings = (state.bookings || [])
    .filter((b) => {
      // Period filter
      if (periodFilter === "today") {
        const bDate = b.bookingDate || (b.createdAt && b.createdAt.substring(0, 10)) || "";
        if (bDate !== today) return false;
      } else if (periodFilter === "week") {
        const bDate = b.bookingDate || (b.createdAt && b.createdAt.substring(0, 10)) || "";
        const diffDays = (new Date(today) - new Date(bDate)) / (1000 * 60 * 60 * 24);
        if (diffDays < 0 || diffDays > 7) return false;
      } else if (periodFilter === "month") {
        const bDate = b.bookingDate || (b.createdAt && b.createdAt.substring(0, 10)) || "";
        if (!bDate.startsWith(thisMonthPrefix)) return false;
      }

      if (statusFilter !== "All" && b.status !== statusFilter) return false;
      if (categoryFilter !== "All" && b.categoryId !== categoryFilter) return false;
      if (dateFilter && b.checkIn !== dateFilter && b.checkOut !== dateFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          b.id.toLowerCase().includes(q) ||
          b.guestName.toLowerCase().includes(q) ||
          b.email.toLowerCase().includes(q) ||
          b.phone.includes(q) ||
          (b.roomNumber && b.roomNumber.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "newest") {
        const aTime = a.bookedAt || a.createdAt || a.bookingDate || "";
        const bTime = b.bookedAt || b.createdAt || b.bookingDate || "";
        return bTime.localeCompare(aTime);
      }
      if (sortOrder === "checkInAsc") return a.checkIn.localeCompare(b.checkIn);
      if (sortOrder === "checkInDesc") return b.checkIn.localeCompare(a.checkIn);
      if (sortOrder === "guestName") return a.guestName.localeCompare(b.guestName);
      if (sortOrder === "totalDesc") return (b.total || 0) - (a.total || 0);
      return 0;
    });

  // Double Booking Prevention Check
  const checkRoomDoubleBooking = (roomNum, checkIn, checkOut, ignoreBookingId) => {
    if (!roomNum) return null;
    return state.bookings.find(
      (b) =>
        b.id !== ignoreBookingId &&
        b.roomNumber === roomNum &&
        ["Confirmed", "Checked-In", "Pending"].includes(b.status) &&
        datesOverlap(b.checkIn, b.checkOut, checkIn, checkOut)
    );
  };

  // Actions
  const handleConfirm = (b) => {
    const free = freeRoomsFor(state, b.categoryId);
    const room = b.roomNumber || free[0];
    confirmBooking(b.id, room);
    toast.success(`Booking #${b.id} confirmed! ${room ? `Allocated to Room ${room}.` : "Please allocate room."}`);
  };

  const handleCancel = (b) => {
    if (window.confirm(`Are you sure you want to cancel reservation #${b.id}?`)) {
      setBookingStatus(b.id, "Cancelled");
      toast.success(`Reservation #${b.id} cancelled. Room released.`);
    }
  };

  const handleNoShow = (b) => {
    if (window.confirm(`Mark booking #${b.id} as No-Show?`)) {
      updateBooking(b.id, {
        status: "No-Show",
        roomNumber: undefined,
        internalNotes: `${b.internalNotes ? b.internalNotes + " | " : ""}Marked as No-Show on ${today}.`,
      });
      toast.info(`Booking #${b.id} marked as No-Show.`);
    }
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const b = editingBooking;

    // Check double booking if room assigned
    if (b.roomNumber) {
      const conflict = checkRoomDoubleBooking(b.roomNumber, b.checkIn, b.checkOut, b.id);
      if (conflict) {
        toast.error(`Room ${b.roomNumber} is already occupied by booking #${conflict.id} for these dates!`);
        return;
      }
    }

    updateBooking(b.id, {
      guestName: b.guestName.trim(),
      phone: b.phone.trim(),
      email: b.email.trim().toLowerCase(),
      roomNumber: b.roomNumber || undefined,
      categoryId: b.categoryId,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      guests: Number(b.guests || 1),
      extraGuests: Number(b.extraGuests || 0),
      requests: b.requests,
      internalNotes: b.internalNotes,
    });

    toast.success(`Reservation #${b.id} updated successfully!`);
    setEditingBooking(null);
  };

  const handleExtendStaySubmit = (e) => {
    e.preventDefault();
    const b = extendModalBooking;
    if (!extendCheckOut || extendCheckOut <= b.checkIn) {
      toast.error("New check-out date must be after check-in date.");
      return;
    }

    if (b.roomNumber) {
      const conflict = checkRoomDoubleBooking(b.roomNumber, b.checkIn, extendCheckOut, b.id);
      if (conflict) {
        toast.error(`Cannot extend in Room ${b.roomNumber}: Already booked by #${conflict.id} starting ${conflict.checkIn}.`);
        return;
      }
    }

    const cat = getCategory(state, b.categoryId);
    const q = quoteStay(cat.price, b.checkIn, extendCheckOut, b.rooms || 1, state.settings.taxRate);

    updateBooking(b.id, {
      checkOut: extendCheckOut,
      total: q.total,
      internalNotes: `${b.internalNotes ? b.internalNotes + " | " : ""}Stay extended to ${extendCheckOut} (New Total: ${formatINR(q.total)}).`,
    });

    toast.success(`Stay for booking #${b.id} extended to ${extendCheckOut}! Total updated.`);
    setExtendModalBooking(null);
    setExtendCheckOut("");
  };

  const handleCreateReservationSubmit = (e) => {
    e.preventDefault();
    if (!createCheckOut || createCheckOut <= createCheckIn) {
      toast.error("Check-out date must be after check-in date.");
      return;
    }

    if (createRoomNum) {
      const conflict = checkRoomDoubleBooking(createRoomNum, createCheckIn, createCheckOut, null);
      if (conflict) {
        toast.error(`Room ${createRoomNum} is already booked by #${conflict.id} for these dates!`);
        return;
      }
    }

    const cat = getCategory(state, createCategory);
    const q = quoteStay(cat.price, createCheckIn, createCheckOut, 1, state.settings.taxRate);
    const adv = parseFloat(createAdvance) || 0;

    const newBooking = {
      id: `HMR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      guestName: createName.trim(),
      email: createEmail.trim().toLowerCase(),
      phone: createPhone.trim(),
      categoryId: createCategory,
      roomNumber: createRoomNum || undefined,
      checkIn: createCheckIn,
      checkOut: createCheckOut,
      guests: Number(createGuests || 2),
      extraGuests: 0,
      rooms: 1,
      status: "Confirmed",
      payment: adv >= q.total ? "Paid" : adv > 0 ? "Partial" : "Unpaid",
      amountPaid: adv,
      total: q.total,
      source: "Front Desk",
      requests: createRequests.trim() || undefined,
      internalNotes: createNotes.trim() || "Created by Executive Administrator",
      createdAt: todayISO(),
    };

    updateBooking(newBooking.id, newBooking);
    toast.success(`Reservation #${newBooking.id} created successfully!`);
    setCreateModalOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Booking ID", "Guest Name", "Phone", "Category", "Room", "Check-In", "Check-Out", "Status", "Payment", "Total"];
    const rows = filteredBookings.map((b) => [
      b.id,
      b.guestName,
      b.phone,
      b.categoryId,
      b.roomNumber || "Unassigned",
      b.checkIn,
      b.checkOut,
      b.status,
      b.payment,
      b.total,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `hotel_meri_reservations_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Reservations exported to CSV.");
  };

  return (
    <div className="space-y-6 text-[#061830]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-[#061830]">
            Reservations Management System
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Monitor guest bookings, prevent double-bookings, modify reservation dates, and assign rooms.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-white px-4 py-2 text-xs font-semibold text-[#061830] hover:bg-gold/15 transition cursor-pointer"
          >
            <Download className="size-3.5 text-gold" /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2 text-xs font-bold uppercase tracking-wider text-gold-foreground shadow-gold hover:brightness-110 transition cursor-pointer shrink-0"
          >
            <PlusCircle className="size-4" /> New Reservation
          </button>
        </div>
      </div>

      {/* Top Real-time Booking Period KPI Cards & Filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => {
            setPeriodFilter("all");
            setStatusFilter("All");
          }}
          className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
            periodFilter === "all" && statusFilter === "All"
              ? "border-gold bg-gold/15 shadow-gold"
              : "border-gold/25 bg-white hover:border-gold/50 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              All Reservations
            </span>
            <Calendar className="size-4 text-gold" />
          </div>
          <div className="mt-2 text-2xl font-bold font-display text-[#061830]">
            {state.bookings.length}
          </div>
          <p className="text-[11px] text-[#64748b] mt-0.5">Total recorded folios</p>
        </button>

        <button
          type="button"
          onClick={() => setPeriodFilter(periodFilter === "today" ? "all" : "today")}
          className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
            periodFilter === "today"
              ? "border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-400/40"
              : "border-gold/25 bg-white hover:border-emerald-400 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Booked Today
            </span>
            <Clock className="size-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-display text-emerald-950">
            {todayBookingsCount}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
            {todayBookingsCount > 0 ? "New reservations today" : "No bookings today yet"}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setPeriodFilter(periodFilter === "week" ? "all" : "week")}
          className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
            periodFilter === "week"
              ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-400/40"
              : "border-gold/25 bg-white hover:border-blue-400 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              Booked This Week
            </span>
            <Calendar className="size-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-display text-blue-950">
            {weekBookingsCount}
          </div>
          <p className="text-[11px] text-blue-700 font-medium mt-0.5">Past 7 days turnover</p>
        </button>

        <button
          type="button"
          onClick={() => setPeriodFilter(periodFilter === "month" ? "all" : "month")}
          className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
            periodFilter === "month"
              ? "border-purple-500 bg-purple-50 shadow-md ring-2 ring-purple-400/40"
              : "border-gold/25 bg-white hover:border-purple-400 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
              Booked This Month
            </span>
            <Sparkles className="size-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-display text-purple-950">
            {monthBookingsCount}
          </div>
          <p className="text-[11px] text-purple-700 font-medium mt-0.5">Current month volume</p>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-gold/25 shadow-sm">
        {/* Period Chips */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-gold/15">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] mr-1">
            Filter Period:
          </span>
          <button
            type="button"
            onClick={() => setPeriodFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
              periodFilter === "all"
                ? "bg-gold text-navy-deep shadow-sm"
                : "bg-white border border-gold/30 text-[#475569] hover:bg-gold/10"
            }`}
          >
            All Time
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter("today")}
            className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              periodFilter === "today"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50"
            }`}
          >
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Booked Today ({todayBookingsCount})
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter("week")}
            className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
              periodFilter === "week"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-blue-300 text-blue-800 hover:bg-blue-50"
            }`}
          >
            This Week ({weekBookingsCount})
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter("month")}
            className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
              periodFilter === "month"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white border border-purple-300 text-purple-800 hover:bg-purple-50"
            }`}
          >
            This Month ({monthBookingsCount})
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 size-4 text-gold" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, guest, phone..."
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] pl-10 pr-4 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none"
            />
          </div>

          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none font-semibold cursor-pointer"
            >
              <option value="newest">Sort: Booked Date &amp; Time (Newest First)</option>
              <option value="checkInAsc">Sort: Check-In Date (Earliest First)</option>
              <option value="checkInDesc">Sort: Check-In Date (Latest First)</option>
              <option value="guestName">Sort: Guest Name (A-Z)</option>
              <option value="totalDesc">Sort: Folio Amount (High to Low)</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none cursor-pointer"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>Status: {s}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {state.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="overflow-hidden rounded-2xl border border-gold/30 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#061830]">
            <thead>
              <tr className="border-b border-gold/20 bg-[#FAF7F2] text-[11px] uppercase tracking-wider text-gold font-semibold">
                <th className="py-3.5 px-4">Booking ID &amp; Time</th>
                <th className="py-3.5 px-4">Guest Info</th>
                <th className="py-3.5 px-4">Category / Room</th>
                <th className="py-3.5 px-4">Stay Dates</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/15">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-[#64748b]">
                    No reservations matching current filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const cat = getCategory(state, b.categoryId);
                  const isBookedToday = b.bookingDate === today || (b.createdAt && b.createdAt.startsWith(today));

                  return (
                    <tr key={b.id} className={`hover:bg-gold/5 transition ${isBookedToday ? "bg-emerald-50/20" : ""}`}>
                      <td className="py-3.5 px-4 font-mono font-bold text-gold">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">#{b.id}</span>
                          {isBookedToday && (
                            <span className="rounded-full bg-emerald-500/20 text-emerald-800 border border-emerald-500/40 px-1.5 py-0.2 text-[9px] font-extrabold uppercase animate-pulse">
                              New Today
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                          <span className="text-[#64748b] font-normal uppercase">{b.source}</span>
                          <span className="text-[#cbd5e1]">•</span>
                          <span className="flex items-center gap-1 text-[#475569] font-sans font-semibold" title="Date and time of booking">
                            <Clock className="size-2.5 text-gold" />
                            Booked: {formatDate(b.bookingDate || b.createdAt)} ({b.bookingTime || "12:00 PM"})
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#061830]">{b.guestName}</div>
                        <div className="text-[11px] text-[#64748b]">{b.phone}</div>
                        <div className="text-[10px] text-[#94a3b8]">{b.email}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#061830]">{cat.name}</div>
                        <div className="text-[11px]">
                          {b.roomNumber ? (
                            <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md">
                              Room {b.roomNumber}
                            </span>
                          ) : (
                            <span className="text-amber-600 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md text-[10px]">
                              Not Assigned
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-[#475569]">
                        <div>{formatDate(b.checkIn)} → {formatDate(b.checkOut)}</div>
                        <div className="text-[10px] text-[#64748b]">{b.guests} Guests</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.status} />
                      </td>

                      <td className="py-3.5 px-4">
                        <PaymentBadge payment={b.payment} />
                        <div className="text-[10px] text-[#64748b] mt-0.5 font-semibold">
                          {formatINR(b.amountPaid)} / {formatINR(b.total)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(b)}
                            className="p-1.5 rounded-full border border-gold/30 bg-[#FAF7F2] text-[#061830] hover:bg-gold/20 transition cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="size-3.5 text-gold" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingBooking({ ...b })}
                            className="p-1.5 rounded-full border border-gold/30 bg-[#FAF7F2] text-[#061830] hover:bg-gold/20 transition cursor-pointer"
                            title="Edit Reservation"
                          >
                            <Pencil className="size-3.5 text-blue-600" />
                          </button>

                          {b.status === "Pending" && (
                            <button
                              type="button"
                              onClick={() => handleConfirm(b)}
                              className="p-1.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition cursor-pointer"
                              title="Confirm Reservation"
                            >
                              <CheckCircle className="size-3.5" />
                            </button>
                          )}

                          {b.status !== "Cancelled" && b.status !== "Checked-Out" && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setExtendModalBooking(b);
                                  setExtendCheckOut(b.checkOut);
                                }}
                                className="p-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition cursor-pointer text-[10px] font-bold"
                                title="Modify Dates / Extend Stay"
                              >
                                <Calendar className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleNoShow(b)}
                                className="p-1.5 rounded-full border border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                                title="Mark as No-Show"
                              >
                                <UserX className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancel(b)}
                                className="p-1.5 rounded-full border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                                title="Cancel Reservation"
                              >
                                <XCircle className="size-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extend Stay / Modify Dates Modal */}
      {extendModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-gold/40 bg-white p-6 shadow-2xl text-[#061830]">
            <div className="flex items-center justify-between border-b border-gold/20 pb-3 mb-4">
              <h3 className="font-display text-lg font-bold">Modify / Extend Stay</h3>
              <button type="button" onClick={() => setExtendModalBooking(null)} className="p-1 text-[#64748b]">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleExtendStaySubmit} className="space-y-4 text-xs">
              <div>
                <span className="text-[#64748b]">Guest:</span>
                <div className="font-bold text-sm text-[#061830]">{extendModalBooking.guestName}</div>
                <div className="text-[11px] text-gold">Current: {extendModalBooking.checkIn} to {extendModalBooking.checkOut}</div>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-[#061830] uppercase tracking-wider">
                  New Check-Out Date
                </label>
                <input
                  type="date"
                  required
                  min={extendModalBooking.checkIn}
                  value={extendCheckOut}
                  onChange={(e) => setExtendCheckOut(e.target.value)}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendModalBooking(null)}
                  className="flex-1 rounded-full border border-gold/30 py-2.5 text-[#061830] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-gold-gradient py-2.5 text-gold-foreground font-bold uppercase tracking-wider shadow-gold hover:brightness-110"
                >
                  Update Stay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Booking Details Modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-gold/40 bg-white p-6 shadow-2xl text-[#061830] max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-gold/20 pb-3 mb-4">
              <h3 className="font-display text-lg font-bold">Edit Reservation #{editingBooking.id}</h3>
              <button type="button" onClick={() => setEditingBooking(null)} className="p-1 text-[#64748b]">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-[#061830] uppercase tracking-wider">Guest Name</label>
                  <input
                    type="text"
                    required
                    value={editingBooking.guestName}
                    onChange={(e) => setEditingBooking({ ...editingBooking, guestName: e.target.value })}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-[#061830] uppercase tracking-wider">Phone</label>
                  <input
                    type="tel"
                    required
                    value={editingBooking.phone}
                    onChange={(e) => setEditingBooking({ ...editingBooking, phone: e.target.value })}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-[#061830] uppercase tracking-wider">Room Category</label>
                  <select
                    value={editingBooking.categoryId}
                    onChange={(e) => setEditingBooking({ ...editingBooking, categoryId: e.target.value })}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm"
                  >
                    {state.categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-[#061830] uppercase tracking-wider">Assign Room</label>
                  <select
                    value={editingBooking.roomNumber || ""}
                    onChange={(e) => setEditingBooking({ ...editingBooking, roomNumber: e.target.value })}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {state.rooms
                      .filter((r) => r.categoryId === editingBooking.categoryId && r.status !== "maintenance")
                      .map((r) => (
                        <option key={r.number} value={r.number}>Room {r.number} ({r.status})</option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-[#061830] uppercase tracking-wider">Special Requests</label>
                <textarea
                  rows={2}
                  value={editingBooking.requests || ""}
                  onChange={(e) => setEditingBooking({ ...editingBooking, requests: e.target.value })}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-[#061830] uppercase tracking-wider">Internal Notes</label>
                <textarea
                  rows={2}
                  value={editingBooking.internalNotes || ""}
                  onChange={(e) => setEditingBooking({ ...editingBooking, internalNotes: e.target.value })}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="flex-1 rounded-full border border-gold/30 py-2.5 text-[#061830] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-gold-gradient py-2.5 text-gold-foreground font-bold uppercase tracking-wider shadow-gold hover:brightness-110"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Booking Details / Print Confirmation Dialog */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-3xl border border-gold/40 bg-white p-6 md:p-8 shadow-2xl text-[#061830] max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-gold/20 pb-4 mb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-[#061830]">
                  Booking Voucher #{selectedBooking.id}
                </h3>
                <p className="text-xs text-[#64748b]">Hotel Meri &amp; Residency, Civil Lines, Bareilly</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold hover:bg-gold/15"
                >
                  <Printer className="size-3.5 text-gold" /> Print
                </button>
                <button type="button" onClick={() => setSelectedBooking(null)} className="p-1 text-[#64748b]">
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-[#FAF7F2] p-4 rounded-2xl border border-gold/20">
                <div>
                  <span className="text-[#64748b] uppercase tracking-wider font-semibold text-[10px]">Guest Name</span>
                  <div className="font-bold text-sm text-[#061830]">{selectedBooking.guestName}</div>
                  <div className="text-[#475569]">{selectedBooking.phone}</div>
                  <div className="text-[#475569]">{selectedBooking.email}</div>
                </div>
                <div>
                  <span className="text-[#64748b] uppercase tracking-wider font-semibold text-[10px]">Room Allocation</span>
                  <div className="font-bold text-sm text-[#061830]">
                    {getCategory(state, selectedBooking.categoryId).name}
                  </div>
                  <div className="font-bold text-emerald-700">
                    {selectedBooking.roomNumber ? `Room ${selectedBooking.roomNumber}` : "Unassigned Room"}
                  </div>
                  <div className="text-[#64748b]">{selectedBooking.guests} Guests (1 Room)</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl border border-gold/20 bg-white">
                  <span className="text-[10px] uppercase font-bold text-[#64748b]">Check-In</span>
                  <div className="font-bold text-sm text-[#061830]">{formatDate(selectedBooking.checkIn)}</div>
                  <div className="text-[11px] text-[#64748b]">From 14:00 hrs</div>
                </div>
                <div className="p-3 rounded-xl border border-gold/20 bg-white">
                  <span className="text-[10px] uppercase font-bold text-[#64748b]">Check-Out</span>
                  <div className="font-bold text-sm text-[#061830]">{formatDate(selectedBooking.checkOut)}</div>
                  <div className="text-[11px] text-[#64748b]">Until 11:00 hrs</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-gold/20 bg-[#FAF7F2]">
                <div className="flex justify-between font-bold text-sm text-[#061830]">
                  <span>Total Amount:</span>
                  <span>{formatINR(selectedBooking.total)}</span>
                </div>
                <div className="flex justify-between text-[#64748b] text-[11px] mt-1">
                  <span>Amount Paid:</span>
                  <span className="text-emerald-700 font-semibold">{formatINR(selectedBooking.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-[#64748b] text-[11px] mt-0.5">
                  <span>Outstanding Balance:</span>
                  <span className="text-rose-600 font-bold">{formatINR(Math.max(0, selectedBooking.total - selectedBooking.amountPaid))}</span>
                </div>
              </div>

              {selectedBooking.requests && (
                <div>
                  <span className="font-semibold text-[#061830]">Guest Special Requests:</span>
                  <p className="text-[#475569] mt-0.5 bg-slate-50 p-2 rounded-lg">{selectedBooking.requests}</p>
                </div>
              )}

              {selectedBooking.internalNotes && (
                <div>
                  <span className="font-semibold text-[#061830]">Staff Internal Notes:</span>
                  <p className="text-[#475569] mt-0.5 bg-amber-50 p-2 rounded-lg text-amber-900">{selectedBooking.internalNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create New Reservation Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-gold/40 bg-white p-6 shadow-2xl text-[#061830] max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-gold/20 pb-3 mb-4">
              <h3 className="font-display text-lg font-bold">Create New Reservation</h3>
              <button type="button" onClick={() => setCreateModalOpen(false)} className="p-1 text-[#64748b]">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReservationSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold uppercase">Guest Full Name</label>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Vikramaditya"
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold uppercase">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="guest@example.com"
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold uppercase">Check-In Date</label>
                  <input
                    type="date"
                    required
                    value={createCheckIn}
                    onChange={(e) => setCreateCheckIn(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold uppercase">Check-Out Date</label>
                  <input
                    type="date"
                    required
                    min={createCheckIn}
                    value={createCheckOut}
                    onChange={(e) => setCreateCheckOut(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold uppercase">Room Category</label>
                  <select
                    value={createCategory}
                    onChange={(e) => {
                      setCreateCategory(e.target.value);
                      setCreateRoomNum("");
                    }}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm"
                  >
                    {state.categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({formatINR(c.price)}/n)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold uppercase">Assign Room</label>
                  <select
                    value={createRoomNum}
                    onChange={(e) => setCreateRoomNum(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm"
                  >
                    <option value="">Auto-Assign Later</option>
                    {state.rooms
                      .filter((r) => r.categoryId === createCategory && r.status !== "maintenance")
                      .map((r) => (
                        <option key={r.number} value={r.number}>Room {r.number} ({r.status})</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold uppercase">Guests Count</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={createGuests}
                    onChange={(e) => setCreateGuests(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold uppercase">Advance Payment (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={createAdvance}
                    onChange={(e) => setCreateAdvance(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold uppercase">Special Requests</label>
                <input
                  type="text"
                  value={createRequests}
                  onChange={(e) => setCreateRequests(e.target.value)}
                  placeholder="e.g. Airport transfer, high floor"
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 rounded-full border border-gold/30 py-2.5 text-[#061830] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-gold-gradient py-2.5 text-gold-foreground font-bold uppercase tracking-wider shadow-gold hover:brightness-110"
                >
                  Create Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
