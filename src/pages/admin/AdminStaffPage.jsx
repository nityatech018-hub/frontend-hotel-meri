import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Building2,
  Trash2,
  Edit2,
  Search,
  Check,
  X,
  Phone,
  Mail,
  MapPin,
  Lock,
  Sparkles,
  Wrench,
  Eye,
  EyeOff,
  KeyRound,
  Shield,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import {
  addStaff,
  updateStaff,
  deleteStaff,
  useHotelState,
} from "@/lib/hotel/store.jsx";
import { validateEmail, validatePhoneNumber } from "@/lib/hotel/pricing.js";

const ROLE_COLORS = {
  admin: "bg-gold/20 text-[#061830] border-gold font-bold",
  reception: "bg-blue-50 text-blue-700 border-blue-300 font-semibold",
  housekeeping: "bg-amber-50 text-amber-700 border-amber-300 font-semibold",
  maintenance: "bg-purple-50 text-purple-700 border-purple-300 font-semibold",
  guest: "bg-slate-100 text-slate-700 border-slate-300 font-medium",
};

export default function AdminStaffPage() {
  const state = useHotelState();
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Form State for New Staff
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("reception");
  const [password, setPassword] = useState("staff123");
  const [city, setCity] = useState("Bareilly");

  // Editing state
  const [editingEmail, setEditingEmail] = useState(null);
  const [editRole, setEditRole] = useState("");

  // Password visibility & reset state
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [pwdModalUser, setPwdModalUser] = useState(null);
  const [resetPwdValue, setResetPwdValue] = useState("");

  const togglePasswordVisibility = (targetEmail) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [targetEmail]: !prev[targetEmail],
    }));
  };

  const handleOpenResetPwd = (user) => {
    setPwdModalUser(user);
    setResetPwdValue(user.password || "");
  };

  const handleSaveNewPassword = (e) => {
    e.preventDefault();
    if (!resetPwdValue || resetPwdValue.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    updateStaff(pwdModalUser.email, { password: resetPwdValue.trim() });
    toast.success(`Password updated for ${pwdModalUser.name} (${pwdModalUser.email})!`);
    setPwdModalUser(null);
    setResetPwdValue("");
  };

  const staffList = (state.users || []).filter((u) => {
    if (roleFilter === "staff") return u.role !== "guest";
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q))
      );
    }
    return true;
  });

  const totalAdmins = state.users.filter((u) => u.role === "admin").length;
  const totalReception = state.users.filter((u) => u.role === "reception").length;
  const totalHousekeeping = state.users.filter((u) => u.role === "housekeeping").length;
  const totalMaintenance = state.users.filter((u) => u.role === "maintenance").length;
  const totalGuests = state.users.filter((u) => u.role === "guest").length;

  const handleCreateStaff = (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Please enter staff member's full name.");
      return;
    }
    const emailRes = validateEmail(email);
    if (!emailRes.valid) {
      toast.error(emailRes.error);
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    const res = addStaff({
      name: name.trim(),
      email: emailRes.email,
      phone: phone.trim() || "+91 90000 00000",
      role,
      password,
      city: city.trim() || "Bareilly",
    });

    if (typeof res === "string") {
      toast.error(res);
      return;
    }

    toast.success(`Staff member ${res.name} (${res.role}) successfully registered!`);
    setName("");
    setEmail("");
    setPhone("");
    setRole("reception");
    setPassword("staff123");
    setModalOpen(false);
  };

  const handleDelete = (targetEmail) => {
    if (targetEmail.toLowerCase() === "admin@merihotel.demo") {
      toast.error("The Primary Administrator account cannot be deleted.");
      return;
    }
    if (targetEmail.toLowerCase() === state.session?.email?.toLowerCase()) {
      toast.error("You cannot delete your own active administrator account.");
      return;
    }
    const res = deleteStaff(targetEmail);
    if (typeof res === "string") {
      toast.error(res);
      return;
    }
    toast.success(`User ${targetEmail} removed from system.`);
  };

  const handleSaveRole = (targetEmail) => {
    updateStaff(targetEmail, { role: editRole });
    toast.success(`Role updated for ${targetEmail} to ${editRole}`);
    setEditingEmail(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-[#061830]">
            Staff &amp; Role Governance
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Provision staff IDs, assign login passwords, configure operational roles, and manage system access.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-gold-foreground shadow-gold hover:brightness-110 transition cursor-pointer shrink-0"
        >
          <UserPlus className="size-4" /> Provision Staff Member
        </button>
      </div>

      {/* RBAC Governance Notice Card */}
      <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-sm flex items-start gap-3">
        <div className="p-2 rounded-xl bg-gold/15 text-gold shrink-0">
          <ShieldCheck className="size-5" />
        </div>
        <div className="text-xs">
          <div className="font-bold text-[#061830] text-sm">Role-Based Access Control (RBAC) Governance</div>
          <p className="text-[#64748b] mt-0.5 leading-relaxed">
            The Primary Administrator is permanently protected and cannot be overwritten. Only the Administrator can assign staff login IDs, passwords, and permissions (Receptionist, Sub-Admin, Housekeeping). Public registration is locked to the <strong>Guest</strong> role by default.
          </p>
        </div>
      </div>

      {/* Role Counts Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div
          onClick={() => setRoleFilter("admin")}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            roleFilter === "admin"
              ? "border-gold bg-gold/15 shadow-gold"
              : "border-gold/30 bg-white hover:border-gold shadow-card hover:shadow-lift"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              Administrators
            </span>
            <ShieldCheck className="size-4 text-gold" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-[#061830]">{totalAdmins}</div>
          <p className="text-[10px] text-gold font-semibold mt-0.5">Full System Authority</p>
        </div>

        <div
          onClick={() => setRoleFilter("reception")}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            roleFilter === "reception"
              ? "border-blue-400 bg-blue-50/80 shadow-md"
              : "border-gold/30 bg-white hover:border-gold shadow-card hover:shadow-lift"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              Front Desk Staff
            </span>
            <Building2 className="size-4 text-blue-600" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-[#061830]">{totalReception}</div>
          <p className="text-[10px] text-blue-600 font-medium mt-0.5">Reception Desk Operations</p>
        </div>

        <div
          onClick={() => setRoleFilter("housekeeping")}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            roleFilter === "housekeeping"
              ? "border-amber-400 bg-amber-50/80 shadow-md"
              : "border-gold/30 bg-white hover:border-gold shadow-card hover:shadow-lift"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              Housekeeping
            </span>
            <Sparkles className="size-4 text-amber-600" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-[#061830]">{totalHousekeeping}</div>
          <p className="text-[10px] text-amber-700 font-medium mt-0.5">Turnover &amp; Readiness</p>
        </div>

        <div
          onClick={() => setRoleFilter("maintenance")}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            roleFilter === "maintenance"
              ? "border-purple-400 bg-purple-50/80 shadow-md"
              : "border-gold/30 bg-white hover:border-gold shadow-card hover:shadow-lift"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              Maintenance
            </span>
            <Wrench className="size-4 text-purple-600" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-[#061830]">{totalMaintenance}</div>
          <p className="text-[10px] text-purple-700 font-medium mt-0.5">Engineering &amp; Repairs</p>
        </div>

        <div
          onClick={() => setRoleFilter("guest")}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            roleFilter === "guest"
              ? "border-slate-400 bg-slate-100 shadow-md"
              : "border-gold/30 bg-white hover:border-gold shadow-card hover:shadow-lift"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              Registered Guests
            </span>
            <Users className="size-4 text-slate-500" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-[#061830]">{totalGuests}</div>
          <p className="text-[10px] text-[#64748b] mt-0.5">Guest Portal Accounts</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            ["all", "All Accounts"],
            ["staff", "All Staff Only"],
            ["admin", "Admins"],
            ["reception", "Front Desk"],
            ["housekeeping", "Housekeeping"],
            ["maintenance", "Maintenance"],
            ["guest", "Guests"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setRoleFilter(id)}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                roleFilter === id
                  ? "bg-gold text-gold-foreground font-bold shadow-gold"
                  : "border border-gold/30 bg-white text-[#061830] hover:bg-gold/15"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3.5 top-2.5 size-4 text-gold" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name or email..."
            className="w-full rounded-full border border-gold/30 bg-white pl-10 pr-4 py-2 text-xs text-[#061830] placeholder:text-[#94a3b8] focus:border-gold focus:outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Staff Table in Luxury Light Theme */}
      <div className="overflow-hidden rounded-2xl border border-gold/30 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#061830]">
            <thead>
              <tr className="border-b border-gold/20 bg-[#FAF7F2] text-[11px] uppercase tracking-wider text-gold font-semibold">
                <th className="py-3.5 px-4">Staff Member / Login ID</th>
                <th className="py-3.5 px-4">Role &amp; Privileges</th>
                <th className="py-3.5 px-4">Assigned Password</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/15">
              {staffList.map((user) => {
                const isMaster = user.email.toLowerCase() === "admin@merihotel.demo";
                return (
                  <tr key={user.email} className="hover:bg-gold/5 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-xl bg-gold/20 text-gold font-display font-bold text-sm shrink-0 border border-gold/30">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#061830] flex items-center gap-1.5">
                            {user.name}
                            {isMaster && (
                              <span className="rounded-full bg-gold/20 border border-gold/50 px-1.5 py-0.5 text-[9px] font-bold text-gold uppercase tracking-wider">
                                Permanent
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#64748b] flex items-center gap-1">
                            <Mail className="size-3 text-gold" /> {user.email}
                          </div>
                          {user.role === "housekeeping" && (
                            <div className="text-[10px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                              <Sparkles className="size-2.5 shrink-0" />
                              {(() => {
                                const assignedTasks = (state.housekeepingTasks || []).filter(
                                  (t) => t.assignedTo === user.name || t.assignedTo?.toLowerCase() === user.name.toLowerCase()
                                );
                                const activeTask = assignedTasks.find((t) => t.status === "in_progress" || t.status === "assigned");
                                return activeTask
                                  ? `Assigned: Suite ${activeTask.roomNumber} (${activeTask.status.toUpperCase()})`
                                  : assignedTasks.length > 0
                                  ? `${assignedTasks.length} tasks registered`
                                  : "Available for assignment";
                              })()}
                            </div>
                          )}
                          {user.role === "maintenance" && (
                            <div className="text-[10px] text-purple-700 font-semibold mt-1 flex items-center gap-1">
                              <Wrench className="size-2.5 shrink-0" />
                              {(() => {
                                const activeReq = (state.maintenanceRequests || []).find(
                                  (m) => (m.assignedTo === user.name || m.assignedTo?.toLowerCase().includes(user.name.toLowerCase())) && m.status !== "verified"
                                );
                                return activeReq
                                  ? `Work Order: Suite ${activeReq.roomNumber} (${activeReq.status.toUpperCase()})`
                                  : "On standby for tickets";
                              })()}
                            </div>
                          )}
                          {user.role === "reception" && (
                            <div className="text-[10px] text-blue-700 font-semibold mt-1 flex items-center gap-1">
                              <Building2 className="size-2.5 shrink-0" /> Active Front Desk Operator
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {editingEmail === user.email && !isMaster ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="rounded-lg border border-gold bg-[#FAF7F2] px-2 py-1 text-xs text-[#061830]"
                          >
                            <option value="admin">Administrator</option>
                            <option value="reception">Reception Staff</option>
                            <option value="housekeeping">Housekeeping</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="guest">Guest</option>
                          </select>
                          <button
                            onClick={() => handleSaveRole(user.email)}
                            className="p-1 rounded bg-emerald-600 text-white cursor-pointer"
                            title="Save Role"
                          >
                            <Check className="size-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingEmail(null)}
                            className="p-1 rounded bg-slate-200 text-slate-700 cursor-pointer"
                            title="Cancel"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              ROLE_COLORS[user.role] || "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {user.role}
                          </span>
                          {user.role === "housekeeping" && (
                            <Link
                              to="/admin/housekeeping"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:text-amber-900 hover:underline"
                            >
                              <Sparkles className="size-2.5" /> View Housekeeping Tasks
                            </Link>
                          )}
                          {user.role === "maintenance" && (
                            <Link
                              to="/admin/maintenance"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 hover:text-purple-900 hover:underline"
                            >
                              <Wrench className="size-2.5" /> View Maintenance Issues
                            </Link>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#061830] font-semibold bg-[#FAF7F2] px-2 py-1 rounded border border-gold/20">
                          {visiblePasswords[user.email] ? user.password || "••••••" : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(user.email)}
                          className="p-1 text-[#64748b] hover:text-[#061830] rounded cursor-pointer"
                          title={visiblePasswords[user.email] ? "Hide Password" : "Show Password"}
                        >
                          {visiblePasswords[user.email] ? <EyeOff className="size-3.5 text-gold" /> : <Eye className="size-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenResetPwd(user)}
                          className="p-1 text-[#64748b] hover:text-gold rounded cursor-pointer"
                          title="Change / Assign Password"
                        >
                          <KeyRound className="size-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#475569]">
                      <span className="flex items-center gap-1 font-medium">
                        <Phone className="size-3 text-gold" /> {user.phone || "—"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#64748b]">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3 text-gold" /> {user.city || "Bareilly, UP"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isMaster ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#061830] bg-gold/15 border border-gold/40 rounded-full px-2.5 py-1 uppercase">
                          <ShieldCheck className="size-3 text-gold" /> Primary Admin
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEmail(user.email);
                              setEditRole(user.role);
                            }}
                            className="rounded-full border border-gold/40 bg-[#FAF7F2] p-1.5 text-[#061830] hover:bg-gold/20 transition cursor-pointer"
                            title="Edit Role"
                          >
                            <Edit2 className="size-3.5 text-gold" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(user.email)}
                            className="rounded-full border border-rose-300 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                            title="Remove User"
                          >
                            <Trash2 className="size-3.5" />
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
      </div>

      {/* Add Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-gold/40 bg-white p-6 md:p-8 shadow-2xl text-[#061830]">
            <div className="flex items-center justify-between border-b border-gold/20 pb-3 mb-4">
              <h3 className="font-display text-xl font-bold text-[#061830]">
                Add New Staff Member
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full text-[#64748b] hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-semibold text-[#061830] uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vikramaditya Rathore"
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-[#061830] uppercase tracking-wider">
                  Official Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@merihotel.demo"
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-[#061830] uppercase tracking-wider">
                    Role Privilege
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none cursor-pointer"
                  >
                    <option value="reception">Reception Staff</option>
                    <option value="admin">Administrator</option>
                    <option value="housekeeping">Housekeeping</option>
                    <option value="maintenance">Maintenance Staff</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-[#061830] uppercase tracking-wider">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-[#061830] uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-[#061830] uppercase tracking-wider">
                    Base City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bareilly"
                    className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-full border border-gold/30 py-2.5 text-[#061830] hover:bg-gold/10 cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-gold-gradient py-2.5 text-gold-foreground font-bold uppercase tracking-wider shadow-gold hover:brightness-110 cursor-pointer"
                >
                  Create Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {pwdModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-gold/40 bg-white p-6 shadow-2xl text-[#061830]">
            <div className="flex items-center justify-between border-b border-gold/20 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="size-5 text-gold" />
                <h3 className="font-display text-lg font-bold text-[#061830]">
                  Assign / Reset Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPwdModalUser(null)}
                className="p-1 rounded-full text-[#64748b] hover:bg-slate-100 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mb-4 text-xs text-[#64748b] bg-[#FAF7F2] p-3 rounded-xl border border-gold/20">
              Updating login credentials for:
              <div className="font-bold text-[#061830] text-sm mt-0.5">{pwdModalUser.name}</div>
              <div className="text-[11px] text-gold">{pwdModalUser.email}</div>
            </div>

            <form onSubmit={handleSaveNewPassword} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-semibold text-[#061830] uppercase tracking-wider">
                  New Password
                </label>
                <input
                  type="text"
                  required
                  value={resetPwdValue}
                  onChange={(e) => setResetPwdValue(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="w-full rounded-xl border border-gold/30 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#061830] focus:border-gold focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPwdModalUser(null)}
                  className="flex-1 rounded-full border border-gold/30 py-2.5 text-[#061830] hover:bg-gold/10 cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-gold-gradient py-2.5 text-gold-foreground font-bold uppercase tracking-wider shadow-gold hover:brightness-110 cursor-pointer"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
