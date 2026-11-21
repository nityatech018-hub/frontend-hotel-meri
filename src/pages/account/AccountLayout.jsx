import React from "react";
import { Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  History,
  UserRound,
  CreditCard,
  LifeBuoy,
} from "lucide-react";
import { RequireRole } from "@/components/dashboard/RequireRole.jsx";
import { DashboardShell } from "@/components/dashboard/DashboardShell.jsx";

const NAV = [
  {
    to: "/account",
    label: "My Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    to: "/account/book",
    label: "Book a Room",
    icon: BedDouble,
  },
  {
    to: "/account/bookings",
    label: "My Bookings",
    icon: CalendarCheck,
  },
  {
    to: "/account/history",
    label: "Booking History",
    icon: History,
  },
  {
    to: "/account/profile",
    label: "My Profile",
    icon: UserRound,
  },
  {
    to: "/account/payments",
    label: "Payments",
    icon: CreditCard,
  },
  {
    to: "/account/support",
    label: "Support",
    icon: LifeBuoy,
  },
];

export default function AccountLayout() {
  return (
    <RequireRole role="guest">
      <DashboardShell variant="guest" title="Guest Portal" navItems={NAV}>
        <Outlet />
      </DashboardShell>
    </RequireRole>
  );
}
