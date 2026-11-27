import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  PlusCircle,
  Eye,
  Check,
  Building2,
  Lock,
  Unlock,
  DollarSign,
  ShieldAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatINR, formatDate, todayISO } from "@/lib/hotel/pricing.js";
import {
  addMaintenanceRequest,
  updateMaintenanceStatus,
  setRoomStatus,
  useHotelState,
} from "@/lib/hotel/store.jsx";

const STATUSES = [
  { id: "reported", label: "Reported / Open", color: "border-rose-400 bg-rose-50 text-rose-900" },
  { id: "in_progress", label: "In Progress", color: "border-amber-400 bg-amber-50 text-amber-900" },
  { id: "completed", label: "Work Completed", color: "border-cyan-400 bg-cyan-50 text-cyan-900" },
  { id: "verified", label: "Superintendent Verified (Closed)", color: "border-emerald-500 bg-emerald-50 text-emerald-900" },
];

export default function AdminMaintenancePage() {
  const state = useHotelState();
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [expenseModalTicket, setExpenseModalTicket] = useState(null);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("Spare parts & labor");

  // Form State for New Ticket
  const [roomNumber, setRoomNumber] = useState("");
  const [category, setCategory] = useState("Plumbing");
  const [priority, setPriority] = useState("Medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [technician, setTechnician] = useState("");
  const [lockOutOfService, setLockOutOfService] = useState(true);

  const tickets = state.maintenanceRequests || [];
  const maintenanceStaff = (state.users || []).filter(
    (u) => u.role === "maintenance" || u.department === "Engineering & Maintenance" || u.role === "admin"
  );

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        String(t.roomNumber).includes(q) ||
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreateTicket = (e) => {
    e.preventDefault();
    const num = parseInt(roomNumber, 10);
    if (!num) {
      toast.error("Please enter a valid room number.");
      return;
    }
    if (!title.trim()) {
      toast.error("Please provide a title describing the maintenance issue.");
      return;
    }

    addMaintenanceRequest({
      roomNumber: num,
      category,
      priority,
      title: title.trim(),
      description: description.trim(),
      assignedTo: technician.trim() || "Chief Engineer",
      outOfService: lockOutOfService,
      status: "reported",
      cost: 0,
    });

    if (lockOutOfService) {
      setRoomStatus(num, "maintenance");
    }

    toast.success(`Maintenance ticket created for Suite ${num}! ${lockOutOfService ? "Suite locked out of service." : ""}`);
    setCreateModalOpen(false);
    setTitle("");
    setDescription("");
    setRoomNumber("");
  };

  const handleAdvanceTicketStatus = (ticketId, nextStatus, roomNum, outOfService) => {
    updateMaintenanceStatus(ticketId, nextStatus);

    if (nextStatus === "verified" || nextStatus === "completed") {
      if (nextStatus === "verified" && outOfService) {
        setRoomStatus(roomNum, "available");
        toast.success(`Issue verified for Suite ${roomNum}! Room released back into active available inventory.`);
      } else {
        toast.success(`Maintenance status updated to ${nextStatus}.`);
      }
    } else {
      toast.success(`Ticket status updated to ${nextStatus}.`);
    }
  };

  const handleLogExpense = (e) => {
    e.preventDefault();
    if (!expenseModalTicket) return;
    const amt = Number(expenseAmount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid expense amount.");
      return;
    }

    updateMaintenanceStatus(expenseModalTicket.id, expenseModalTicket.status, {
      cost: (expenseModalTicket.cost || 0) + amt,
    });

    toast.success(`Logged maintenance expense of ${formatINR(amt)} for Suite ${expenseModalTicket.roomNumber}!`);
    setExpenseModalTicket(null);
    setExpenseAmount("");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-3 py-0.5 text-[11px] font-bold text-rose-800 uppercase tracking-wider">
              Engineering &amp; Facility Operations
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-[#061830] mt-1">
            Maintenance &amp; Engineering Tickets
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Track HVAC, plumbing, electrical, and carpentry issues. Lock defective suites out of service and record maintenance repair costs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110 transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="size-4" /> New Work Order
        </button>
      </div>

      {/* Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STATUSES.map((s) => {
          const count = tickets.filter((t) => t.status === s.id).length;
          const isSelected = statusFilter === s.id;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStatusFilter(isSelected ? "all" : s.id)}
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

      {/* Filters & Search */}
      <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 size-3.5 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search room #, issue title, category..."
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
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical (Immediate Stop)</option>
          </select>
        </div>

        <div className="text-xs text-[#64748b]">
          Showing <strong>{filteredTickets.length}</strong> maintenance tickets
        </div>
      </div>

      {/* Tickets List */}
      <div className="rounded-2xl border border-gold/30 bg-white shadow-card overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="mx-auto size-10 text-emerald-600 stroke-1" />
            <h3 className="mt-2 text-sm font-bold text-[#061830]">Zero Engineering Defects</h3>
            <p className="text-xs text-[#64748b]">All facilities and suites are fully operational and verified.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#061830]">
              <thead>
                <tr className="border-b border-gold/20 bg-[#FAF7F2] text-[11px] uppercase tracking-wider text-gold font-semibold">
                  <th className="py-3 px-4">Room #</th>
                  <th className="py-3 px-4">Category &amp; Issue</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Assigned Tech</th>
                  <th className="py-3 px-4">Room Lock</th>
                  <th className="py-3 px-4">Expenses</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Workflow Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/15">
                {filteredTickets.map((t) => {
                  const statusObj = STATUSES.find((s) => s.id === t.status) || STATUSES[0];

                  return (
                    <tr key={t.id} className="hover:bg-gold/5 transition">
                      <td className="py-3.5 px-4 font-bold text-[#061830]">
                        <span className="rounded-xl bg-[#061830] text-champagne px-3 py-1 font-bold text-xs inline-block">
                          Suite {t.roomNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#061830]">{t.title}</div>
                        <div className="text-[11px] text-[#64748b]">{t.category} • {t.description || "General maintenance"}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            t.priority === "Critical"
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : t.priority === "High"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {t.priority || "Medium"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#061830]">
                        {t.assignedTo || "Chief Engineer"}
                      </td>
                      <td className="py-3.5 px-4">
                        {t.outOfService ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-300 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                            <Lock className="size-3" /> Out of Service
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <Unlock className="size-3" /> Habitable
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#061830]">{formatINR(t.cost || 0)}</div>
                        <button
                          type="button"
                          onClick={() => setExpenseModalTicket(t)}
                          className="text-[10px] text-gold font-bold hover:underline"
                        >
                          + Log Cost
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${statusObj.color}`}>
                          {statusObj.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status === "reported" && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceTicketStatus(t.id, "in_progress", t.roomNumber, t.outOfService)}
                              className="rounded-full bg-amber-600 px-3 py-1 text-xs font-bold text-white hover:bg-amber-500 cursor-pointer"
                            >
                              Start Repair
                            </button>
                          )}
                          {t.status === "in_progress" && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceTicketStatus(t.id, "completed", t.roomNumber, t.outOfService)}
                              className="rounded-full bg-cyan-600 px-3 py-1 text-xs font-bold text-white hover:bg-cyan-500 cursor-pointer"
                            >
                              Mark Fixed
                            </button>
                          )}
                          {t.status === "completed" && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceTicketStatus(t.id, "verified", t.roomNumber, t.outOfService)}
                              className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-500 flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="size-3" /> Verify &amp; Unlock
                            </button>
                          )}
                          {t.status === "verified" && (
                            <span className="text-emerald-700 font-bold text-xs">Closed ✓</span>
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

      {/* Create Ticket Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-3xl border border-gold/30 bg-white p-6 shadow-lift text-[#061830] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gold/15 pb-3">
              <h2 className="font-display text-lg font-bold">New Engineering Work Order</h2>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-full p-1 hover:bg-slate-100 text-[#64748b]"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
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
                        Suite {r.number} ({r.categoryId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Trade Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830]"
                  >
                    <option value="Plumbing">Plumbing &amp; Sanitary</option>
                    <option value="HVAC / Air Conditioning">HVAC / Air Conditioning</option>
                    <option value="Electrical">Electrical &amp; Lighting</option>
                    <option value="Carpentry & Furniture">Carpentry &amp; Furniture</option>
                    <option value="Smart TV & Wi-Fi">Smart TV &amp; Wi-Fi</option>
                    <option value="Masonry & Painting">Masonry &amp; Painting</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Issue Summary <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master bathroom hot water mixer leaking"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Priority Tier
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830]"
                  >
                    <option value="Low">Low (Routine maintenance)</option>
                    <option value="Medium">Medium (Fix within 24h)</option>
                    <option value="High">High (Urgent occupant impact)</option>
                    <option value="Critical">Critical (Immediate safety/leak)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                    Assign Technician (Staff &amp; User Roles)
                  </label>
                  <select
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#061830] cursor-pointer"
                  >
                    <option value="">Select Engineering Technician</option>
                    {maintenanceStaff.map((u) => (
                      <option key={u.email} value={u.name}>
                        {u.name} ({u.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-rose-300 bg-rose-50/70 p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-950 block">Lock Out of Service (OOS)</span>
                  <span className="text-[10px] text-rose-700">Prevents front desk &amp; website from booking this suite</span>
                </div>
                <input
                  type="checkbox"
                  checked={lockOutOfService}
                  onChange={(e) => setLockOutOfService(e.target.checked)}
                  className="size-5 rounded border-rose-400 text-rose-600 focus:ring-rose-500"
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
                  Dispatch Work Order
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Log Expense Modal */}
      {expenseModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-3xl border border-gold/30 bg-white p-6 shadow-lift text-[#061830] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gold/15 pb-3">
              <h2 className="font-display text-base font-bold">
                Log Expense: Suite #{expenseModalTicket.roomNumber}
              </h2>
              <button
                type="button"
                onClick={() => setExpenseModalTicket(null)}
                className="rounded-full p-1 hover:bg-slate-100 text-[#64748b]"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleLogExpense} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  Parts / Labor Expense (₹)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 1200"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3 py-2 text-sm font-bold text-[#061830]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExpenseModalTicket(null)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-[#64748b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gold-gradient px-5 py-2 text-xs font-bold uppercase tracking-wider text-navy-deep shadow-gold hover:brightness-110"
                >
                  Post to Ledger
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
