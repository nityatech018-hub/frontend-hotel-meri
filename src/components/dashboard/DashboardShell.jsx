import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, Home, ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/site/Logo.jsx";
import { restartIntro } from "@/components/site/introState.js";
import { NotificationBell } from "./NotificationBell.jsx";
import { useHotel, logout } from "@/lib/hotel/store.jsx";
import { cn } from "@/lib/utils.js";

export function DashboardShell({ variant = "guest", title, subtitle, navItems = [], children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const session = useHotel((s) => s.session);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isReception = variant === "reception";

  return (
    <div className="flex min-h-screen bg-navy-deep text-navy-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-gold/20 bg-navy shrink-0">
        <Link
          to="/"
          onClick={restartIntro}
          className="flex items-center gap-3 p-6 border-b border-gold/15 hover:opacity-90 transition"
          aria-label="Hotel Meri Home"
        >
          <LogoMark className="size-10" />
          <div>
            <h2 className="font-display text-lg font-semibold tracking-wide text-navy-foreground">
              HOTEL MERI
            </h2>
            <p className="text-[10px] tracking-widest text-gold uppercase">
              {isReception ? "Reception Desk" : "Guest Portal"}
            </p>
          </div>
        </Link>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-medium tracking-wide uppercase transition",
                  isActive
                    ? "bg-gold-gradient text-gold-foreground font-semibold shadow-gold"
                    : "text-navy-foreground/70 hover:bg-white/5 hover:text-champagne"
                )
              }
            >
              <item.icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info and Logout */}
        <div className="border-t border-gold/15 p-4 bg-navy-deep/40">
          <div className="mb-3 px-2">
            <p className="text-xs font-semibold text-navy-foreground truncate">{session?.name || "User"}</p>
            <p className="text-[11px] text-navy-foreground/50 truncate">{session?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gold/30 py-2 text-xs text-champagne hover:bg-white/5 transition"
            >
              <Home className="size-3.5" /> Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10 transition"
              title="Sign Out"
            >
              <LogOut className="size-3.5" /> Exit
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-gold/15 bg-navy/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-navy-foreground rounded-lg"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-navy-foreground tracking-wide">{title}</h1>
              {subtitle && <p className="text-xs text-navy-foreground/60">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {isReception && <NotificationBell />}
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 text-xs text-champagne hover:text-gold transition"
            >
              <ArrowLeft className="size-3.5" /> Back to Website
            </Link>
          </div>
        </header>

        {/* Mobile Sidebar Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-navy-deep/80 backdrop-blur-sm">
            <div className="w-72 bg-navy flex flex-col h-full border-r border-gold/20 p-4">
              <div className="flex items-center justify-between pb-4 border-b border-gold/15">
                <Link
                  to="/"
                  onClick={() => {
                    setMobileOpen(false);
                    restartIntro();
                  }}
                  className="flex items-center gap-2.5 hover:opacity-90 transition"
                  aria-label="Hotel Meri Home"
                >
                  <LogoMark className="size-8" />
                  <span className="font-display font-semibold tracking-wide">HOTEL MERI</span>
                </Link>
                <button onClick={() => setMobileOpen(false)} className="p-1 text-navy-foreground">
                  <X className="size-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 py-4 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-xs uppercase",
                        isActive
                          ? "bg-gold-gradient text-gold-foreground font-semibold"
                          : "text-navy-foreground/70"
                      )
                    }
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-lg border border-rose-500/30 py-2.5 text-xs text-rose-300"
              >
                <LogOut className="size-4" /> Sign Out
              </button>
            </div>
            <div className="flex-1" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        {/* Body */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-navy-deep">{children}</main>
      </div>
    </div>
  );
}
