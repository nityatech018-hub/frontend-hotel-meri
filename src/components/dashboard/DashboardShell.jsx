import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  LogOut,
  Menu,
  X,
  Home,
  ArrowLeft,
  ShieldCheck,
  Building2,
  User,
  ArrowRightLeft,
  ExternalLink,
  PlusCircle,
  Sparkles,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronDown,
  Settings,
} from "lucide-react";
import { LogoMark } from "@/components/site/Logo.jsx";
import { restartIntro } from "@/components/site/introState.js";
import { NotificationBell } from "./NotificationBell.jsx";
import { useHotel, logout } from "@/lib/hotel/store.jsx";
import { cn } from "@/lib/utils.js";

export function DashboardShell({ variant = "guest", title, subtitle, navItems = [], children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("meri-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("meri-sidebar-collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const session = useHotel((s) => s.session);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [globalSearch, setGlobalSearch] = useState(searchParams.get("search") || "");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const searchInputRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    setGlobalSearch(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleGlobalSearchChange = (val) => {
    setGlobalSearch(val);
    if (location.pathname === "/reception/bookings") {
      const next = new URLSearchParams(searchParams);
      if (val.trim()) next.set("search", val);
      else next.delete("search");
      navigate(`/reception/bookings?${next.toString()}`, { replace: true });
    }
  };

  const handleGlobalSearchSubmit = (e) => {
    e.preventDefault();
    const q = globalSearch.trim();
    navigate(q ? `/reception/bookings?search=${encodeURIComponent(q)}` : "/reception/bookings");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isReception = variant === "reception";
  const isAdmin = variant === "admin";
  const isGuest = variant === "guest";

  const portalBadge = isAdmin
    ? "Executive Admin"
    : isReception
    ? "Front Desk Reception"
    : "Guest Residency Portal";

  const homeLink = isAdmin ? "/admin" : isReception ? "/reception" : "/";

  return (
    <div className={cn("flex min-h-screen text-[#071A32]", isReception ? "bg-[#FFFFFF]" : "bg-[#FAF7F2]")}>
      {/* Scoped CSS to enforce 100% invisible scrollbars on sidebar across all browsers & OS */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar,
        aside::-webkit-scrollbar,
        aside *::-webkit-scrollbar,
        nav::-webkit-scrollbar,
        nav *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
          -webkit-appearance: none !important;
        }
        .no-scrollbar,
        aside,
        aside *,
        nav,
        nav * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
      `}</style>

      {/* Desktop Sidebar (Collapsible Signature Royal Navy - Sticky, Clean No-Scrollbar) */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-gold/25 bg-[#061830] shrink-0 text-white sticky top-0 h-screen z-40 overflow-hidden no-scrollbar transition-[width] duration-300 ease-in-out",
          collapsed ? "w-20" : "w-72"
        )}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-4 border-b border-gold/20 shrink-0 bg-[#041021]">
          <Link
            to={homeLink}
            onClick={isGuest ? restartIntro : undefined}
            className={cn(
              "flex items-center gap-3 hover:opacity-95 transition min-w-0",
              collapsed && "justify-center w-full"
            )}
            title="Hotel Meri"
            aria-label="Hotel Meri Home"
          >
            <LogoMark className="size-9 shrink-0" />
            {!collapsed && (
              <div className="min-w-0">
                <h2 className="font-display text-sm font-bold tracking-wider text-white truncate">
                  HOTEL MERI
                </h2>
                <p className="text-[9px] tracking-[0.2em] text-gold uppercase font-semibold truncate">
                  {portalBadge}
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation items with invisible smooth scroll */}
        <nav
          className="flex-1 space-y-1 p-3 overflow-y-auto no-scrollbar"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {navItems.map((item, idx) => {
            const isFirstInSection =
              item.section && (idx === 0 || navItems[idx - 1]?.section !== item.section);

            return (
              <React.Fragment key={item.to}>
                {!collapsed && isFirstInSection && (
                  <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gold/60 flex items-center gap-2">
                    <span className="truncate">{item.section}</span>
                    <span className="h-px bg-gold/15 flex-1" />
                  </div>
                )}
                <NavLink
                  to={item.to}
                  end={item.exact}
                  title={collapsed ? `${item.label}${item.badge ? ` (${item.badge})` : ""}` : undefined}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center rounded-xl text-xs font-medium tracking-wide transition group relative",
                      collapsed ? "justify-center p-3" : "justify-between gap-2.5 px-3.5 py-2",
                      isActive
                        ? "bg-gold-gradient text-navy-deep font-bold shadow-gold"
                        : "text-white/80 hover:bg-white/10 hover:text-champagne"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn("flex items-center gap-2.5 min-w-0", collapsed ? "justify-center" : "flex-1")}>
                        <item.icon
                          className={cn(
                            "size-4 shrink-0 transition-transform group-hover:scale-110",
                            isActive ? "text-navy-deep" : "text-gold/80"
                          )}
                        />
                        {!collapsed && <span className="truncate whitespace-nowrap">{item.label}</span>}
                      </div>
                      {!collapsed && item.badge && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[9px] font-bold shrink-0 ml-1.5 leading-none border transition-colors",
                            isActive
                              ? "bg-[#061830]/25 text-[#061830] border-[#061830]/30 font-extrabold"
                              : item.badgeClass || "bg-gold/20 text-gold border border-gold/30"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                      {collapsed && item.badge && (
                        <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-gold animate-pulse" />
                      )}
                    </>
                  )}
                </NavLink>
              </React.Fragment>
            );
          })}
        </nav>

        {/* User Account Footer & Collapse Toggle */}
        <div className="border-t border-gold/20 p-3 bg-[#030d1b] mt-auto shrink-0 space-y-2">
          {!collapsed && (
            <div className="px-1 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{session?.name || "User"}</p>
                <p className="text-[10px] text-white/50 truncate">{session?.email}</p>
              </div>
              <span className="rounded-full bg-gold/20 border border-gold/40 px-2 py-0.5 text-[9px] font-bold text-gold uppercase">
                {session?.role || "Guest"}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleCollapsed}
              className={cn(
                "flex items-center justify-center rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer",
                collapsed ? "w-full" : "w-8 shrink-0"
              )}
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? <ChevronRight className="size-4 text-gold" /> : <ChevronLeft className="size-4" />}
            </button>

            {!collapsed && (
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="size-3.5" /> Sign Out
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header in Crisp Luxury White with Gold Accents */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gold/20 bg-white/95 backdrop-blur-sm px-4 sm:px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-[#061830] hover:bg-slate-100 rounded-xl transition cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>

            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex items-center justify-center size-8 rounded-lg border border-slate-200 text-[#061830]/70 hover:bg-slate-100 hover:text-[#061830] transition cursor-pointer"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </button>

            {isReception ? (
              <form onSubmit={handleGlobalSearchSubmit} className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={globalSearch}
                  onChange={(e) => handleGlobalSearchChange(e.target.value)}
                  placeholder="Search by Booking ID, Guest Name, Mobile or Room No."
                  className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] pl-9 pr-8 py-2 text-xs text-[#071A32] placeholder:text-slate-400 focus:border-[#071A32] focus:bg-white focus:outline-none transition"
                />
                <span className="pointer-events-none hidden sm:grid place-items-center absolute right-2.5 top-1/2 -translate-y-1/2 size-5 rounded border border-[#E5E7EB] bg-white text-[10px] font-semibold text-slate-400">
                  /
                </span>
              </form>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-[#061830] tracking-wide font-display">
                    {title}
                  </h1>
                  <span className="hidden sm:inline-block rounded-full bg-gold/15 border border-gold/30 px-2.5 py-0.5 text-[10px] font-bold text-[#061830] uppercase">
                    {portalBadge}
                  </span>
                </div>
                {subtitle && <p className="text-xs text-[#64748b] mt-0.5 hidden md:block">{subtitle}</p>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            {isReception && (
              <>
                <NotificationBell />

                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((o) => !o)}
                    className="flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white pl-1.5 pr-3 py-1 text-xs font-semibold text-[#071A32] hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-[#D5A43D]/20 text-[11px] font-bold text-[#071A32]">
                      {(session?.name || "RS")
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <span className="hidden sm:inline">{session?.name?.split(" ")[0] || "Reception"}</span>
                    <ChevronDown className="size-3.5 text-slate-400" />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[#E5E7EB] bg-white py-1.5 shadow-lg z-50">
                      <div className="px-3.5 py-2 border-b border-[#E5E7EB]">
                        <p className="text-xs font-bold text-[#071A32] truncate">{session?.name || "Reception Staff"}</p>
                        <p className="text-[11px] text-slate-500 truncate">{session?.email || "Front Desk"}</p>
                      </div>
                      <Link
                        to="/reception/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#071A32] hover:bg-slate-50 transition"
                      >
                        <Settings className="size-3.5 text-slate-500" /> Settings
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <LogOut className="size-3.5" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {isAdmin && (
              <>
                <NotificationBell />

                <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-[#061830]">
                  <ShieldCheck className="size-3.5 text-gold" />
                  <span>Admin Active</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="size-3.5" /> Sign Out
                </button>
              </>
            )}

            {isGuest && (
              <>
                <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-gold/30 bg-[#FAF7F2] px-3.5 py-1.5 text-xs font-semibold text-[#061830]">
                  <User className="size-3.5 text-gold" />
                  <span>{session?.name || "Guest Resident"}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="size-3.5" /> Sign Out
                </button>
              </>
            )}
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-black/60 backdrop-blur-sm">
            <div
              className="w-80 max-w-[85vw] bg-[#061830] text-white flex flex-col h-full border-r border-gold/25 p-4 shadow-2xl overflow-hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div className="flex items-center justify-between pb-4 border-b border-gold/20">
                <Link
                  to={homeLink}
                  onClick={() => {
                    setMobileOpen(false);
                    if (isGuest) restartIntro();
                  }}
                  className="flex items-center gap-2.5 hover:opacity-90 transition"
                  aria-label="Hotel Meri Home"
                >
                  <LogoMark className="size-8" />
                  <div>
                    <span className="font-display font-bold text-white tracking-wide block">HOTEL MERI</span>
                    <span className="text-[9px] text-gold uppercase tracking-widest">{portalBadge}</span>
                  </div>
                </Link>
                <button onClick={() => setMobileOpen(false)} className="p-1 text-white hover:bg-white/10 rounded-lg">
                  <X className="size-5" />
                </button>
              </div>

              <nav
                className="flex-1 space-y-1 py-3 overflow-y-auto no-scrollbar"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-between gap-3 rounded-xl px-3.5 py-2 text-xs font-medium tracking-wide",
                        isActive
                          ? "bg-gold-gradient text-navy-deep font-bold"
                          : "text-white/80 hover:bg-white/10"
                      )
                    }
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <item.icon className="size-4 shrink-0 text-gold" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="rounded-full bg-gold/20 text-champagne border border-gold/30 px-2 py-0.5 text-[9px] font-bold shrink-0 ml-auto leading-none">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
              >
                <LogOut className="size-4" /> Sign Out
              </button>
            </div>
            <div className="flex-1" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        {/* Content Body Area in Luxury Ivory (#FAF7F2) */}
        <main className="flex-1 p-6 lg:p-8 bg-[#FAF7F2] text-[#061830]">
          {children}
        </main>
      </div>
    </div>
  );
}
