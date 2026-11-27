import React from "react";
import { Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  DoorOpen,
  BedDouble,
  LogIn,
  LogOut,
  Users,
  CreditCard,
  CalendarDays,
  BarChart3,
  Settings,
} from "lucide-react";
import { RequireRole } from "@/components/dashboard/RequireRole.jsx";
import { DashboardShell } from "@/components/dashboard/DashboardShell.jsx";
import { useHotelState } from "@/lib/hotel/store.jsx";
import { todayISO } from "@/lib/hotel/pricing.js";

export default function ReceptionLayout() {
  const state = useHotelState();
  const today = todayISO();

  // Dynamic live counters for Front Desk badges
  const arrivalsDueCount = (state.bookings || []).filter(
    (b) => b.checkIn === today && (b.status === "Confirmed" || b.status === "Pending")
  ).length;

  const departuresDueCount = (state.bookings || []).filter(
    (b) => b.checkOut === today && b.status === "Checked-In"
  ).length;

  const cleaningCount = (state.rooms || []).filter(
    (r) => r.status === "cleaning" || r.status === "dirty"
  ).length;

  const nav = [
    // 1. FRONT DESK OPERATIONS
    {
      to: "/reception",
      label: "Dashboard Overview",
      icon: LayoutDashboard,
      exact: true,
      section: "Front Desk Operations",
    },
    {
      to: "/reception/bookings",
      label: "All Bookings",
      icon: ClipboardList,
      section: "Front Desk Operations",
    },
    {
      to: "/reception/new",
      label: "Walk-In Booking",
      icon: PlusCircle,
      section: "Front Desk Operations",
    },
    {
      to: "/reception/check-in",
      label: "Check-In",
      icon: LogIn,
      badge: arrivalsDueCount > 0 ? `${arrivalsDueCount} Due` : null,
      section: "Front Desk Operations",
    },
    {
      to: "/reception/check-out",
      label: "Check-Out",
      icon: LogOut,
      badge: departuresDueCount > 0 ? `${departuresDueCount} Due` : null,
      section: "Front Desk Operations",
    },

    // 2. ROOMS & INVENTORY
    {
      to: "/reception/rooms",
      label: "Room Management",
      icon: BedDouble,
      badge: cleaningCount > 0 ? `${cleaningCount} Cleaning` : null,
      section: "Rooms & Inventory",
    },
    {
      to: "/reception/calendar",
      label: "Booking Calendar",
      icon: CalendarDays,
      section: "Rooms & Inventory",
    },

    // 3. GUEST CRM & RECORDS
    {
      to: "/reception/guests",
      label: "Guest Management",
      icon: Users,
      section: "Guest CRM & Records",
    },
    {
      to: "/reception/payments",
      label: "Payment Records",
      icon: CreditCard,
      section: "Guest CRM & Records",
    },
    {
      to: "/reception/reports",
      label: "Reports",
      icon: BarChart3,
      section: "Guest CRM & Records",
    },
    {
      to: "/reception/settings",
      label: "Settings",
      icon: Settings,
      section: "Guest CRM & Records",
    },
  ];

  return (
    <RequireRole role="reception">
      <DashboardShell variant="reception" title="Reception Desk" navItems={nav}>
        <Outlet />
      </DashboardShell>
    </RequireRole>
  );
}
