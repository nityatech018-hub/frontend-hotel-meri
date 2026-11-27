import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LogIn,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  ShieldCheck,
  CreditCard,
  Printer,
  X,
  AlertTriangle,
  BedDouble,
  FileCheck,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/site/StatusBadge.jsx";
import { formatDate, formatINR, todayISO } from "@/lib/hotel/pricing.js";
import {
  checkInBooking,
  freeRoomsFor,
  useHotelState,
} from "@/lib/hotel/store.jsx";

export default function AdminCheckInPage() {
  const state = useHotelState();
  const today = todayISO();

  const [search, setSearch] = useState("");
  const [selectedArrival, setSelectedArrival] = useState(null);
  const [confirmedVoucher, setConfirmedVoucher] = useState(null);

  // Form State for Active Check-in Modal
  const [assignedRoom, setAssignedRoom] = useState("");
  const [idType, setIdType] = useState("Aadhaar Card");
  const [idNumber, setIdNumber] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("2000");
  const [depositMethod, setDepositMethod] = useState("UPI / QR");
  const [additionalOccupants, setAdditionalOccupants] = useState("");
  const [checkInNotes, setCheckInNotes] = useState("");
  const [collectBalance, setCollectBalance] = useState(true);
  const [balanceMethod, setBalanceMethod] = useState("Cash");

  const allArrivals = (state.bookings || []).filter(
    (b) => (b.status === "Confirmed" || b.status === "Pending") && b.checkIn <= today
  );

  const todayArrivals = allArrivals.filter((b) => b.checkIn === today);
  const overdueArrivals = allArrivals.filter((b) => b.checkIn < today);

  const filteredArrivals = allArrivals.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      b.id.toLowerCase().includes(q) ||
      b.guestName.toLowerCase().includes(q) ||
      (b.phone && b.phone.includes(q)) ||
      (b.roomNumber && String(b.roomNumber).includes(q))
    );
  });

  const handleOpenCheckInModal = (booking) => {
    setSelectedArrival(booking);
    setAssignedRoom(booking.roomNumber ? String(booking.roomNumber) : "");
    setIdType(booking.idType || "Aadhaar Card");
    setIdNumber(booking.idNumber || "");
    setAdditionalOccupants(booking.extraGuestNames || "");
    setCheckInNotes(booking.checkInNotes || "");
  };

  const handleExecuteCheckIn = (e) => {
    e.preventDefault();
    if (!selectedArrival) return;

    if (!assignedRoom) {
      toast.error("Please assign a specific room to complete check-in.");
      return;
    }

    // Check if room is available / ready
    const targetRoom = state.rooms.find((r) => r.number === parseInt(assignedRoom, 10));
    if (targetRoom && (targetRoom.status === "maintenance" || targetRoom.status === "blocked")) {
      toast.error(`Room ${assignedRoom} is currently ${targetRoom.status}. Please assign another clean room.`);
      return;
    }

    try {
      const roomNum = parseInt(assignedRoom, 10);
      const res = checkInBooking(selectedArrival.id, roomNum, {
        idType,
        idNumber: idNumber.trim(),
        securityDeposit: Number(securityDeposit) || 0,
        depositMethod,
        additionalOccupants: additionalOccupants.trim(),
        checkInNotes: checkInNotes.trim(),
        settleBalanceNow: collectBalance,
        balanceMethod,
      });

      toast.success(`Guest ${selectedArrival.guestName} successfully checked in to Suite ${roomNum}!`);
      setConfirmedVoucher(res || { ...selectedArrival, roomNumber: roomNum, status: "Checked-In" });
      setSelectedArrival(null);
    } catch (err) {
      toast.error(err.message || "Failed to complete check-in.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Front Desk Operations
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-[#061830] mt-1">
            Express Guest Check-In &amp; Registration
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Verify government credentials, assign ready suites, record security deposit, and transition guests to active in-house folios.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/new"
            className="rounded-full bg-gold-gradient px-4 py-2 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110 transition"
          >
            + Walk-In Booking
          </Link>
          <Link
            to="/admin/rooms"
            className="rounded-full border border-gold/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#061830] hover:bg-gold/10 transition shadow-sm"
          >
            Room Status
          </Link>
        </div>
      </div>

      {/* Overdue Alert Bar if any */}
      {overdueArrivals.length > 0 && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50/80 p-4 flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-5 text-rose-600 shrink-0" />
            <div>
              <strong className="font-bold">Overdue Arrivals Detected:</strong> {overdueArrivals.length} guest
              {overdueArrivals.length > 1 ? "s" : ""} were scheduled to arrive before today and are pending check-in.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSearch(overdueArrivals[0].id)}
            className="rounded-full bg-rose-600 px-3 py-1 text-white text-[11px] font-bold hover:bg-rose-500 transition"
          >
            View Overdue
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Today's Scheduled</span>
          <div className="text-2xl font-bold text-[#061830] mt-1">{todayArrivals.length}</div>
          <span className="text-[10px] text-emerald-600">Arriving {formatDate(today)}</span>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Overdue Arrivals</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">{overdueArrivals.length}</div>
          <span className="text-[10px] text-rose-500">Prior date check-ins</span>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Total In-House</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {(state.bookings || []).filter((b) => b.status === "Checked-In").length}
          </div>
          <span className="text-[10px] text-blue-500">Currently residing</span>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Ready Suites</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {state.rooms.filter((r) => r.status === "available" || r.status === "ready").length}
          </div>
          <span className="text-[10px] text-emerald-600">Clean &amp; inspected</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-2.5 size-4 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search arrivals by Booking ID, Guest Name, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-gold/30 bg-[#FAF7F2] pl-10 pr-4 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none"
          />
        </div>
        <div className="text-xs text-[#64748b] hidden sm:block">
          {filteredArrivals.length} arrival{filteredArrivals.length === 1 ? "" : "s"} awaiting check-in
        </div>
      </div>

      {/* Arrivals Table */}
      <div className="rounded-2xl border border-gold/30 bg-white shadow-card overflow-hidden">
        {filteredArrivals.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="mx-auto size-10 text-emerald-600 stroke-1" />
            <h3 className="mt-2 text-sm font-bold text-[#061830]">All Arrivals Completed</h3>
            <p className="text-xs text-[#64748b]">There are no pending check-ins matching the criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#061830]">
              <thead>
                <tr className="border-b border-gold/20 bg-[#FAF7F2] text-[11px] uppercase tracking-wider text-gold font-semibold">
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Guest Profile</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Check-In / Check-Out</th>
                  <th className="py-3 px-4">Pre-Assigned Room</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/15">
                {filteredArrivals.map((b) => {
                  const isOverdue = b.checkIn < today;
                  const balance = (b.total || 0) - (b.amountPaid || 0);

                  return (
                    <tr key={b.id} className="hover:bg-gold/5 transition">
                      <td className="py-3.5 px-4 font-bold text-[#061830]">
                        #{b.id}
                        {isOverdue && (
                          <span className="block text-[10px] text-rose-600 font-bold uppercase">
                            Overdue
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#061830]">{b.guestName}</div>
                        <div className="text-[11px] text-[#64748b]">{b.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 capitalize font-medium">{b.categoryId} Room</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-emerald-700">{formatDate(b.checkIn)}</div>
                        <div className="text-[10px] text-[#64748b]">to {formatDate(b.checkOut)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {b.roomNumber ? (
                          <span className="rounded-lg bg-emerald-50 border border-emerald-300 px-2.5 py-1 text-xs font-bold text-emerald-800">
                            Room {b.roomNumber}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium italic">Assign on Arrival</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.payment} />
                        {balance > 0 && (
                          <div className="text-[10px] text-rose-600 mt-0.5">Bal: {formatINR(balance)}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenCheckInModal(b)}
                          className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-sm cursor-pointer"
                        >
                          Check In Now →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Express Check-In Modal Dialog */}
      {selectedArrival && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl rounded-3xl border border-gold/30 bg-white p-6 sm:p-8 shadow-lift text-[#061830] space-y-5 my-8"
          >
            <div className="flex items-center justify-between border-b border-gold/15 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold block">
                  Express Registration
                </span>
                <h2 className="font-display text-xl font-bold">
                  Check In: {selectedArrival.guestName} (#{selectedArrival.id})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArrival(null)}
                className="rounded-full p-1.5 hover:bg-slate-100 text-[#64748b]"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteCheckIn} className="space-y-4">
              {/* Room Assignment & Category verification */}
              <div className="rounded-2xl bg-[#FAF7F2] p-4 border border-gold/20 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748b]">Reserved Category:</span>
                  <strong className="text-[#061830] capitalize">{selectedArrival.categoryId} Room</strong>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Assign Room / Suite <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {freeRoomsFor(state, selectedArrival.categoryId).map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setAssignedRoom(String(num))}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition border cursor-pointer ${
                          assignedRoom === String(num)
                            ? "bg-gold text-gold-foreground border-gold shadow-sm"
                            : "bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                        }`}
                      >
                        Room {num} (Ready)
                      </button>
                    ))}
                    {freeRoomsFor(state, selectedArrival.categoryId).length === 0 && (
                      <span className="text-xs text-rose-600 font-semibold italic">
                        No pre-cleaned suites in {selectedArrival.categoryId} tier. Select from other clean rooms.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Govt Identity Verification */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Govt ID Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830] focus:border-gold focus:outline-none"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Govt ID Document # <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Verified ID Number"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Security Deposit & Payment Settlement */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Security Deposit (Refundable)
                  </label>
                  <input
                    type="number"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Deposit Mode
                  </label>
                  <select
                    value={depositMethod}
                    onChange={(e) => setDepositMethod(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830] focus:border-gold focus:outline-none"
                  >
                    <option value="UPI / QR">UPI / QR Code</option>
                    <option value="Cash">Cash Deposit</option>
                    <option value="Credit Card">Card Pre-Auth</option>
                  </select>
                </div>
              </div>

              {/* Balance settlement check */}
              {(selectedArrival.total || 0) - (selectedArrival.amountPaid || 0) > 0 && (
                <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                    <span>Outstanding Folio Balance:</span>
                    <span className="text-rose-600 font-display text-sm">
                      {formatINR((selectedArrival.total || 0) - (selectedArrival.amountPaid || 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <label className="text-xs text-amber-900 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={collectBalance}
                        onChange={(e) => setCollectBalance(e.target.checked)}
                        className="size-4 rounded border-amber-400 text-amber-600"
                      />
                      <span>Collect outstanding balance now during registration</span>
                    </label>
                    {collectBalance && (
                      <select
                        value={balanceMethod}
                        onChange={(e) => setBalanceMethod(e.target.value)}
                        className="rounded-lg border border-amber-300 bg-white px-2 py-1 text-xs font-bold text-[#061830]"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI / QR">UPI</option>
                        <option value="Card">Card</option>
                      </select>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Occupants & Notes */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Accompanying Occupants
                </label>
                <input
                  type="text"
                  placeholder="Names of additional persons in this suite"
                  value={additionalOccupants}
                  onChange={(e) => setAdditionalOccupants(e.target.value)}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830] focus:border-gold focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gold/15">
                <button
                  type="button"
                  onClick={() => setSelectedArrival(null)}
                  className="rounded-full border border-slate-300 px-5 py-2 text-xs font-semibold text-[#64748b] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-500 transition shadow-sm cursor-pointer"
                >
                  Confirm &amp; Complete Check-In
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Confirmation Voucher Modal */}
      {confirmedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-3xl border border-emerald-500/50 bg-white p-6 sm:p-8 shadow-lift text-[#061830] space-y-5"
          >
            <div className="flex items-center gap-3 border-b border-emerald-200 pb-4">
              <div className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold">Check-In Registration Voucher</h3>
                <p className="text-xs text-[#64748b]">Hotel Meri &amp; Residency, Bareilly</p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#FAF7F2] p-4 border border-gold/20 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Guest Name:</span>
                <strong className="font-bold">{confirmedVoucher.guestName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Booking ID:</span>
                <strong>#{confirmedVoucher.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Assigned Suite:</span>
                <strong className="text-emerald-700 font-bold text-sm">Room {confirmedVoucher.roomNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Departure Date:</span>
                <strong>{formatDate(confirmedVoucher.checkOut)}</strong>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-full border border-gold/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#061830] hover:bg-gold/10"
              >
                <Printer className="size-4 text-gold" /> Print Key Card Voucher
              </button>
              <button
                type="button"
                onClick={() => setConfirmedVoucher(null)}
                className="rounded-full bg-[#061830] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
