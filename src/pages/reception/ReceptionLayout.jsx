import React from "react";
import { Outlet, Link } from "react-router-dom";
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
} from "lucide-react";
import { RequireRole } from "@/components/dashboard/RequireRole.jsx";
import { DashboardShell } from "@/components/dashboard/DashboardShell.jsx";

const NAV = [
  {
    to: "/reception",
    label: "Dashboard Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    to: "/reception/bookings",
    label: "All Bookings",
    icon: ClipboardList,
  },
  {
    to: "/reception/new",
    label: "New Booking",
    icon: PlusCircle,
  },
  {
    to: "/reception/rooms",
    label: "Room Management",
    icon: BedDouble,
  },
  {
    to: "/reception/check-in",
    label: "Check-In",
    icon: LogIn,
  },
  {
    to: "/reception/check-out",
    label: "Check-Out",
    icon: LogOut,
  },
  {
    to: "/reception/guests",
    label: "Guest Management",
    icon: Users,
  },
  {
    to: "/reception/payments",
    label: "Payment Records",
    icon: CreditCard,
  },
  {
    to: "/reception/calendar",
    label: "Booking Calendar",
    icon: CalendarDays,
  },
  {
    to: "/reception/reports",
    label: "Reports",
    icon: BarChart3,
  },
  {
    to: "/reception/settings",
    label: "Settings",
    icon: Settings,
  },
];

export default function ReceptionLayout() {
  return (
    <RequireRole role="reception">
      <DashboardShell variant="reception" title="Reception Desk" navItems={NAV}>
        <Outlet />
      </DashboardShell>
    </RequireRole>
  );
}
