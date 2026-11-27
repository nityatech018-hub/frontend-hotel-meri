import React from "react";
import { Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  BedDouble,
  LogIn,
  LogOut,
  Users,
  CreditCard,
  CalendarDays,
  BarChart3,
  Settings,
  ShieldCheck,
  Tag,
  Sparkles,
  Wrench,
  BadgePercent,
  History,
} from "lucide-react";
import { RequireRole } from "@/components/dashboard/RequireRole.jsx";
import { DashboardShell } from "@/components/dashboard/DashboardShell.jsx";
import { useHotelState } from "@/lib/hotel/store.jsx";
import { todayISO } from "@/lib/hotel/pricing.js";

export default function AdminLayout() {
  const state = useHotelState();
  const today = todayISO();

  // Dynamic counters for operational badges
  const pendingCount = (state.bookings || []).filter((b) => b.status === "Pending").length;
  const arrivalsCount = (state.bookings || []).filter(
    (b) => b.checkIn === today && (b.status === "Confirmed" || b.status === "Pending")
  ).length;
  const departuresCount = (state.bookings || []).filter(
    (b) => b.checkOut === today && b.status === "Checked-In"
  ).length;
  const dirtyRoomsCount = (state.rooms || []).filter(
    (r) => r.status === "dirty" || r.status === "cleaning"
  ).length;
  const maintenanceCount = (state.rooms || []).filter(
    (r) => r.status === "maintenance" || r.status === "blocked"
  ).length;
  const staffCount = (state.users || []).filter((u) => u.role !== "guest").length;

  const nav = [
    // 1. OPERATIONS
    {
      to: "/admin",
      label: "Admin Overview",
      icon: LayoutDashboard,
      exact: true,
      section: "Operations",
    },
    {
      to: "/admin/bookings",
      label: "Reservations",
      icon: ClipboardList,
      badge: pendingCount > 0 ? `${pendingCount} Review` : null,
      badgeClass: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
      section: "Operations",
    },
    {
      to: "/admin/new",
      label: "Walk-In Booking",
      icon: PlusCircle,
      section: "Operations",
    },
    {
      to: "/admin/rooms",
      label: "Room Inventory",
      icon: BedDouble,
      section: "Operations",
    },
    {
      to: "/admin/check-in",
      label: "Express Check-In",
      icon: LogIn,
      badge: arrivalsCount > 0 ? `${arrivalsCount} Due` : null,
      badgeClass: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
      section: "Operations",
    },
    {
      to: "/admin/check-out",
      label: "Express Check-Out",
      icon: LogOut,
      badge: departuresCount > 0 ? `${departuresCount} Due` : null,
      badgeClass: "bg-rose-500/20 text-rose-300 border border-rose-500/40",
      section: "Operations",
    },

    // 2. ROOM TURNOVER & FACILITIES
    {
      to: "/admin/housekeeping",
      label: "Housekeeping",
      icon: Sparkles,
      badge: dirtyRoomsCount > 0 ? `${dirtyRoomsCount} ${dirtyRoomsCount === 1 ? "Room" : "Rooms"}` : null,
      badgeClass: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
      section: "Room Turnover & Facilities",
    },
    {
      to: "/admin/maintenance",
      label: "Maintenance",
      icon: Wrench,
      badge: maintenanceCount > 0 ? `${maintenanceCount} ${maintenanceCount === 1 ? "Issue" : "Issues"}` : null,
      badgeClass: "bg-rose-500/20 text-rose-300 border border-rose-500/40",
      section: "Room Turnover & Facilities",
    },

    // 3. MANAGEMENT & CRM
    {
      to: "/admin/staff",
      label: "Staff & Roles",
      icon: ShieldCheck,
      badge: `${staffCount} Staff`,
      badgeClass: "bg-gold/20 text-champagne border border-gold/30",
      section: "Management & CRM",
    },
    {
      to: "/admin/pricing",
      label: "Tariffs & Categories",
      icon: Tag,
      section: "Management & CRM",
    },
    {
      to: "/admin/guests",
      label: "Guest Directory CRM",
      icon: Users,
      section: "Management & CRM",
    },
    {
      to: "/admin/offers",
      label: "Pricing & Offers",
      icon: BadgePercent,
      section: "Management & CRM",
    },
    {
      to: "/admin/payments",
      label: "Financial Ledger",
      icon: CreditCard,
      section: "Management & CRM",
    },

    // 4. ANALYTICS & LOGS
    {
      to: "/admin/reports",
      label: "Reports & Analytics",
      icon: BarChart3,
      section: "Analytics & Logs",
    },
    {
      to: "/admin/calendar",
      label: "14-Day Calendar",
      icon: CalendarDays,
      section: "Analytics & Logs",
    },
    {
      to: "/admin/logs",
      label: "Activity & Audit Logs",
      icon: History,
      section: "Analytics & Logs",
    },
    {
      to: "/admin/settings",
      label: "Hotel Settings",
      icon: Settings,
      section: "Analytics & Logs",
    },
  ];

  return (
    <RequireRole role="admin">
      <DashboardShell
        variant="admin"
        title="Hotel Meri & Residency — Executive Console"
        subtitle="Full administrative control, staff governance, revenue analytics, and room inventory"
        navItems={nav}
      >
        <Outlet />
      </DashboardShell>
    </RequireRole>
  );
}
