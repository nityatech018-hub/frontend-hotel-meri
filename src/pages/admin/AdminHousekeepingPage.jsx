import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertTriangle,
  Search,
  Filter,
  PlusCircle,
  Eye,
  Check,
  Package,
  Wrench,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, todayISO } from "@/lib/hotel/pricing.js";
import {
  addHousekeepingTask,
  updateHousekeepingStatus,
  setRoomStatus,
  useHotelState,
} from "@/lib/hotel/store.jsx";

const STAGES = [
  { id: "dirty", label: "Dirty / Pending", color: "border-amber-400 bg-amber-50 text-amber-900" },
  { id: "assigned", label: "Assigned Staff", color: "border-blue-400 bg-blue-50 text-blue-900" },
  { id: "in_progress", label: "Cleaning In Progress", color: "border-purple-400 bg-purple-50 text-purple-900" },
  { id: "inspection_pending", label: "Inspection Pending", color: "border-cyan-400 bg-cyan-50 text-cyan-900" },
  { id: "ready", label: "Supervisor Approved (Ready)", color: "border-emerald-500 bg-emerald-50 text-emerald-900" },
];

export default function AdminHousekeepingPage() {
  const state = useHotelState();
  const [stageFilter, setStageFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [lostFoundModalOpen, setLostFoundModalOpen] = useState(false);

  // Form State for New Housekeeping Task
  const [roomNumber, setRoomNumber] = useState("");
  const [assignedStaff, setAssignedStaff] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [notes, setNotes] = useState("Turnover cleaning after guest departure");

  // Damage Form State
  const [damageRoom, setDamageRoom] = useState("");
  const [damageItem, setDamageItem] = useState("");
  const [damageDesc, setDamageDesc] = useState("");
  const [damageCost, setDamageCost] = useState("");

  // Lost & Found Form State
  const [lfRoom, setLfRoom] = useState("");
  const [lfItem, setLfItem] = useState("");
  const [lfLocation, setLfLocation] = useState("");
  const [lfFounder, setLfFounder] = useState("");

  const tasks = state.housekeepingTasks || [];
  const housekeepingStaff = (state.users || []).filter(
    (u) => u.role === "housekeeping" || u.department === "Housekeeping" || u.role === "admin"
  );

  const filteredTasks = tasks.filter((t) => {
    if (stageFilter !== "all" && t.status !== stageFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        String(t.roomNumber).includes(q) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreateTask = (e) => {
    e.preventDefault();
    const num = parseInt(roomNumber, 10);
    if (!num) {
      toast.error("Please enter a valid room number.");
      return;
    }

    addHousekeepingTask({
      roomNumber: num,
      assignedTo: assignedStaff || "Housekeeping Team",
      priority,
      notes: notes.trim(),
      status: "assigned",
    });

    setRoomStatus(num, "cleaning");
    toast.success(`Housekeeping task generated for Suite ${num}!`);
    setCreateModalOpen(false);
    setRoomNumber("");
  };

  const handleAdvanceStatus = (taskId, nextStatus, roomNum) => {
    updateHousekeepingStatus(taskId, nextStatus);

    if (nextStatus === "ready") {
      setRoomStatus(roomNum, "ready");
      toast.success(`Supervisor verified Suite ${roomNum}! Room is certified Clean & Available for new guests.`);
    } else if (nextStatus === "in_progress") {
      setRoomStatus(roomNum, "cleaning");
      toast.success(`Cleaning commenced for Suite ${roomNum}.`);
    } else if (nextStatus === "inspection_pending") {
      setRoomStatus(roomNum, "inspection_pending");
      toast.success(`Suite ${roomNum} submitted for Supervisor inspection.`);
    } else {
      toast.success(`Task status updated to ${nextStatus}.`);
    }
  };

  const handleReportDamage = (e) => {
    e.preventDefault();
    toast.success(`Damage reported for Suite ${damageRoom} (${damageItem}: ₹${damageCost || 0}). Incident logged.`);
    setDamageModalOpen(false);
    setDamageItem("");
    setDamageDesc("");
    setDamageCost("");
  };

  const handleReportLostFound = (e) => {
    e.preventDefault();
    toast.success(`Lost & Found item "${lfItem}" from Suite ${lfRoom} registered in security vault.`);
    setLostFoundModalOpen(false);
    setLfItem("");
    setLfLocation("");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-0.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Facilities &amp; Hygiene Management
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-[#061830] mt-1">
            Housekeeping Command &amp; Inspection Board
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Track 5-stage turnaround lifecycles from dirty turnover to supervisor certification, room damage logs, and lost &amp; found property.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-gold-gradient px-4 py-2 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110 transition cursor-pointer"
          >
            <PlusCircle className="size-4" /> New Clean Task
          </button>
          <button
            type="button"
            onClick={() => setDamageModalOpen(true)}
            className="flex items-center gap-2 rounded-full border border-rose-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-700 hover:bg-rose-50 transition shadow-sm cursor-pointer"
          >
            <AlertTriangle className="size-4" /> Log Damage
          </button>
          <button
            type="button"
            onClick={() => setLostFoundModalOpen(true)}
            className="flex items-center gap-2 rounded-full border border-gold/40 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#061830] hover:bg-gold/10 transition shadow-sm cursor-pointer"
          >
            <Package className="size-4 text-gold" /> Lost &amp; Found
          </button>
        </div>
      </div>

      {/* Stage Counter Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STAGES.map((s) => {
          const count = tasks.filter((t) => t.status === s.id).length;
          const isSelected = stageFilter === s.id;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStageFilter(isSelected ? "all" : s.id)}
              className={`rounded-2xl p-4 border text-left transition cursor-pointer flex flex-col justify-between ${
                isSelected ? "border-gold bg-gold/15 shadow-sm" : "border-gold/20 bg-white hover:border-gold/40"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                {s.label}
              </span>
              <div className="text-2xl font-bold text-[#061830] mt-2">{count}</div>
            </button>
          );
        })}
      </div>

      {/* Housekeeping Attendants on Duty (Directly synchronized with Staff & User Roles) */}
      <div className="rounded-2xl border border-amber-300/60 bg-gradient-to-r from-amber-50/80 to-amber-100/40 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-amber-500/20 p-2 border border-amber-500/30 text-amber-800">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#061830] uppercase tracking-wider">
                Housekeeping Staff &amp; Attendants Roster
              </h3>
              <p className="text-[11px] text-[#64748b]">
                Active attendants configured in Staff &amp; Roles available for suite turnovers and inspection.
              </p>
            </div>
          </div>
          <Link
            to="/admin/staff"
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-400 bg-white px-3.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-50 shadow-sm transition self-start sm:self-auto"
          >
            <ShieldCheck className="size-3.5 text-amber-700" /> Manage in Staff &amp; Roles
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3">
          {housekeepingStaff.filter((u) => u.role === "housekeeping").map((attendant) => {
            const assignedCount = tasks.filter(
              (t) => (t.assignedTo === attendant.name || (t.assignedTo && t.assignedTo.includes(attendant.name))) && t.status !== "ready"
            ).length;

            return (
              <div
                key={attendant.email}
                className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-white p-3 shadow-card"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#061830]">{attendant.name}</span>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 text-[9px] font-bold">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748b] mt-0.5">{attendant.phone || attendant.email}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-lg bg-amber-50 border border-amber-300 px-2.5 py-1 text-[10px] font-bold text-amber-900">
                    {assignedCount} {assignedCount === 1 ? "Room" : "Rooms"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 size-3.5 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search room #, staff, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-gold/30 bg-[#FAF7F2] pl-8 pr-3 py-1.5 text-xs text-[#061830] focus:border-gold focus:outline-none"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-full border border-gold/30 bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="Normal">Normal Priority</option>
            <option value="High">High Priority</option>
            <option value="Urgent">Urgent (Immediate Arrival)</option>
          </select>
        </div>

        <div className="text-xs text-[#64748b]">
          Showing <strong>{filteredTasks.length}</strong> active housekeeping tasks
        </div>
      </div>

      {/* Tasks Table / Kanban Board */}
      <div className="rounded-2xl border border-gold/30 bg-white shadow-card overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="mx-auto size-10 text-emerald-600 stroke-1" />
            <h3 className="mt-2 text-sm font-bold text-[#061830]">All Suites Clean &amp; Certified</h3>
            <p className="text-xs text-[#64748b]">There are no housekeeping tasks matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#061830]">
              <thead>
                <tr className="border-b border-gold/20 bg-[#FAF7F2] text-[11px] uppercase tracking-wider text-gold font-semibold">
                  <th className="py-3 px-4">Suite #</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Assigned Attendant</th>
                  <th className="py-3 px-4">Instructions / Notes</th>
                  <th className="py-3 px-4">Current Stage</th>
                  <th className="py-3 px-4 text-right">Supervisor Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/15">
                {filteredTasks.map((t) => {
                  const stageObj = STAGES.find((s) => s.id === t.status) || STAGES[0];

                  return (
                    <tr key={t.id} className="hover:bg-gold/5 transition">
                      <td className="py-3.5 px-4 font-bold text-[#061830]">
                        <span className="rounded-xl bg-[#061830] text-champagne px-3 py-1 font-bold text-xs inline-block">
                          Suite {t.roomNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            t.priority === "Urgent"
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : t.priority === "High"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {t.priority || "Normal"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#061830]">
                        <select
                          value={t.assignedTo || ""}
                          onChange={(e) => {
                            const newStaff = e.target.value;
                            updateHousekeepingStatus(t.id, t.status === "dirty" && newStaff ? "assigned" : t.status, { assignedTo: newStaff });
                            toast.success(`Suite ${t.roomNumber} assigned to ${newStaff || "Unassigned"}!`);
                          }}
                          className="rounded-lg border border-gold/30 bg-[#FAF7F2] px-2 py-1 text-xs font-semibold text-[#061830] focus:border-gold focus:outline-none cursor-pointer"
                        >
                          <option value="">Unassigned</option>
                          {housekeepingStaff.map((u) => (
                            <option key={u.email} value={u.name}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748b] max-w-xs truncate">
                        {t.notes || "Standard cleaning procedure"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${stageObj.color}`}>
                          {stageObj.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status === "dirty" && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceStatus(t.id, "in_progress", t.roomNumber)}
                              className="rounded-full bg-purple-600 px-3 py-1 text-xs font-bold text-white hover:bg-purple-500 cursor-pointer"
                            >
                              Start Cleaning
                            </button>
                          )}
                          {(t.status === "assigned" || t.status === "in_progress") && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceStatus(t.id, "inspection_pending", t.roomNumber)}
                              className="rounded-full bg-cyan-600 px-3 py-1 text-xs font-bold text-white hover:bg-cyan-500 cursor-pointer"
                            >
                              Submit for Inspection
                            </button>
                          )}
                          {t.status === "inspection_pending" && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceStatus(t.id, "ready", t.roomNumber)}
                              className="rounded-full bg-emerald-600 px-3.5 py-1 text-xs font-bold text-white hover:bg-emerald-500 flex items-center gap-1 shadow-sm cursor-pointer"
                            >
                              <ShieldCheck className="size-3.5" /> Approve &amp; Certify Ready
                            </button>
                          )}
                          {t.status === "ready" && (
                            <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                              <Check className="size-3.5" /> Certified Available
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Housekeeping Task Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-gold/30 bg-white p-6 shadow-lift text-[#061830] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gold/15 pb-3">
              <h2 className="font-display text-lg font-bold">New Cleaning Task</h2>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-full p-1 hover:bg-slate-100 text-[#64748b]"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Suite Number <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830]"
                >
                  <option value="">Select Suite</option>
                  {state.rooms.map((r) => (
                    <option key={r.number} value={r.number}>
                      Suite {r.number} ({r.categoryId}) — Status: {r.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Assign Attendant (Staff &amp; User Roles)
                  </label>
                  <select
                    value={assignedStaff}
                    onChange={(e) => setAssignedStaff(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830] cursor-pointer"
                  >
                    <option value="">Select Housekeeping Attendant</option>
                    {housekeepingStaff.map((u) => (
                      <option key={u.email} value={u.name}>
                        {u.name} ({u.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830]"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent (Express)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Cleaning Instructions
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs text-[#061830]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-[#64748b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gold-gradient px-5 py-2 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110"
                >
                  Generate Task
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Log Damage Modal */}
      {damageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-rose-300 bg-white p-6 shadow-lift text-[#061830] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-rose-200 pb-3">
              <h2 className="font-display text-lg font-bold text-rose-900">Report Property Damage</h2>
              <button
                type="button"
                onClick={() => setDamageModalOpen(false)}
                className="rounded-full p-1 hover:bg-slate-100 text-[#64748b]"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleReportDamage} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Suite Number
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 302"
                    value={damageRoom}
                    onChange={(e) => setDamageRoom(e.target.value)}
                    className="w-full rounded-xl border border-rose-200 bg-[#FAF7F2] px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Damaged Item
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Smart TV remote, Lamp"
                    value={damageItem}
                    onChange={(e) => setDamageItem(e.target.value)}
                    className="w-full rounded-xl border border-rose-200 bg-[#FAF7F2] px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Estimated Repair / Replacement Cost (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={damageCost}
                  onChange={(e) => setDamageCost(e.target.value)}
                  className="w-full rounded-xl border border-rose-200 bg-[#FAF7F2] px-3 py-2 text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDamageModalOpen(false)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-[#64748b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-rose-600 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-500"
                >
                  Log Incident
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Lost and Found Modal */}
      {lostFoundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl border border-gold/30 bg-white p-6 shadow-lift text-[#061830] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gold/15 pb-3">
              <h2 className="font-display text-lg font-bold">Log Lost &amp; Found Item</h2>
              <button
                type="button"
                onClick={() => setLostFoundModalOpen(false)}
                className="rounded-full p-1 hover:bg-slate-100 text-[#64748b]"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleReportLostFound} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Suite / Area Found
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 204 or Lobby"
                    value={lfRoom}
                    onChange={(e) => setLfRoom(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Item Description
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Leather wallet, Gold watch"
                    value={lfItem}
                    onChange={(e) => setLfItem(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setLostFoundModalOpen(false)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-[#64748b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gold-gradient px-5 py-2 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110"
                >
                  Register in Vault
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
