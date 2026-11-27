import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Lock, Mail, User, Phone, LogIn, ArrowLeft, ShieldCheck, UserCheck, KeyRound } from "lucide-react";
import { LogoMark } from "@/components/site/Logo.jsx";
import { login, register, useHotel } from "@/lib/hotel/store.jsx";
import { DEMO_GUEST, DEMO_RECEPTION, DEMO_ADMIN } from "@/lib/hotel/data.js";
import {
  validatePhoneNumber,
  validateEmail,
  validateName,
  validatePassword,
  validateConfirmPassword,
  sanitizePhoneInput,
  sanitizeNameInput,
} from "@/lib/hotel/validation.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const session = useHotel((s) => s.session);

  const initialRole = params.get("role") || "guest";
  const [mode, setMode] = useState("login"); // login | register
  const [role, setRole] = useState(initialRole === "admin" ? "admin" : initialRole === "reception" ? "reception" : "guest");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  useEffect(() => {
    const r = params.get("role");
    if (r === "admin" || r === "reception" || r === "guest") {
      setRole(r);
    }
  }, [params]);

  const fillDemo = (type) => {
    if (type === "guest") {
      setRole("guest");
      setEmail(DEMO_GUEST.email);
      setPassword(DEMO_GUEST.password);
    } else if (type === "reception") {
      setRole("reception");
      setEmail(DEMO_RECEPTION.email);
      setPassword(DEMO_RECEPTION.password);
    } else if (type === "admin") {
      setRole("admin");
      setEmail(DEMO_ADMIN.email);
      setPassword(DEMO_ADMIN.password);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;

    const nextErrors = {};

    if (mode === "login") {
      const emailRes = validateEmail(email);
      if (!emailRes.valid) nextErrors.email = emailRes.error;
      const passRes = validatePassword(password, { min: 1 });
      if (!passRes.valid) nextErrors.password = passRes.error;

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        toast.error(Object.values(nextErrors)[0]);
        return;
      }

      setSubmitting(true);
      const res = login(emailRes.email, password, role);
      setSubmitting(false);
      if (typeof res === "string") {
        setErrors({ password: res });
        toast.error(res);
      } else {
        toast.success(`Welcome back, ${res.name}!`);
        if (res.role === "admin") {
          navigate("/admin");
        } else if (res.role === "reception") {
          navigate("/reception");
        } else {
          navigate("/account");
        }
      }
    } else {
      const nameRes = validateName(name, { label: "Full name" });
      if (!nameRes.valid) nextErrors.name = nameRes.error;

      const emailRes = validateEmail(email);
      if (!emailRes.valid) nextErrors.email = emailRes.error;

      let formattedPhone = "";
      if (phone.trim()) {
        const phoneRes = validatePhoneNumber(phone);
        if (!phoneRes.valid) nextErrors.phone = phoneRes.error;
        else formattedPhone = phoneRes.formatted;
      }

      const passRes = validatePassword(password, { min: 6, max: 64 });
      if (!passRes.valid) nextErrors.password = passRes.error;

      const confirmRes = validateConfirmPassword(password, confirmPassword);
      if (!confirmRes.valid) nextErrors.confirmPassword = confirmRes.error;

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        toast.error(Object.values(nextErrors)[0]);
        return;
      }

      setSubmitting(true);
      const res = register({ email: emailRes.email, password, name: nameRes.value, phone: formattedPhone });
      setSubmitting(false);
      if (typeof res === "string") {
        setErrors({ email: res });
        toast.error(res);
      } else {
        toast.success(`Account registered! Welcome, ${res.name}.`);
        navigate("/account");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#061830] flex items-center justify-center p-6 relative">
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs text-[#061830] hover:text-gold uppercase tracking-wider font-semibold transition"
      >
        <ArrowLeft className="size-4" /> Return to Website
      </Link>

      <div className="w-full max-w-md rounded-3xl border border-gold/30 bg-white p-8 md:p-10 shadow-lift">
        <div className="text-center mb-6">
          <LogoMark className="mx-auto size-16" />
          <h2 className="mt-3 font-display text-2xl font-bold tracking-wide text-[#061830]">
            HOTEL MERI &amp; RESIDENCY
          </h2>
          <p className="text-xs text-gold uppercase tracking-widest mt-1 font-semibold">
            {role === "admin"
              ? "Executive Admin Console"
              : role === "reception"
              ? "Staff Reception Desk"
              : "Guest Residency Portal"}
          </p>
        </div>

        {/* 3-Way Role Selector */}
        <div className="grid grid-cols-3 gap-1 mb-6 p-1.5 rounded-2xl bg-[#FAF7F2] border border-gold/25 text-center">
          <button
            type="button"
            onClick={() => {
              setRole("guest");
            }}
            className={`py-2 text-[11px] font-semibold uppercase tracking-wider rounded-xl transition ${
              role === "guest"
                ? "bg-gold text-gold-foreground shadow-gold"
                : "text-[#64748b] hover:text-[#061830]"
            }`}
          >
            Guest
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("reception");
              setMode("login");
            }}
            className={`py-2 text-[11px] font-semibold uppercase tracking-wider rounded-xl transition ${
              role === "reception"
                ? "bg-gold text-gold-foreground shadow-gold"
                : "text-[#64748b] hover:text-[#061830]"
            }`}
          >
            Reception
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("admin");
              setMode("login");
            }}
            className={`py-2 text-[11px] font-semibold uppercase tracking-wider rounded-xl transition ${
              role === "admin"
                ? "bg-[#061830] text-champagne border border-gold/40 shadow-sm"
                : "text-[#64748b] hover:text-[#061830]"
            }`}
          >
            Admin
          </button>
        </div>

        {/* 1-Click Demo Fill Shortcuts */}
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => fillDemo("guest")}
            className={`flex-1 py-1.5 rounded-xl border text-[11px] font-semibold transition ${
              role === "guest"
                ? "border-gold bg-gold/15 text-gold-foreground"
                : "border-slate-200 text-[#64748b] hover:bg-slate-50"
            }`}
          >
            Demo Guest
          </button>
          <button
            type="button"
            onClick={() => fillDemo("reception")}
            className={`flex-1 py-1.5 rounded-xl border text-[11px] font-semibold transition ${
              role === "reception"
                ? "border-gold bg-gold/15 text-gold-foreground"
                : "border-slate-200 text-[#64748b] hover:bg-slate-50"
            }`}
          >
            Demo Reception
          </button>
          <button
            type="button"
            onClick={() => fillDemo("admin")}
            className={`flex-1 py-1.5 rounded-xl border text-[11px] font-semibold transition ${
              role === "admin"
                ? "border-[#061830] bg-[#061830] text-gold"
                : "border-slate-200 text-[#64748b] hover:bg-slate-50"
            }`}
          >
            Demo Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {mode === "register" && role === "guest" && (
            <>
              <div>
                <label className="text-xs font-semibold text-[#061830] block mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 size-4 text-gold" />
                  <input
                    type="text"
                    value={name}
                    maxLength={80}
                    onChange={(e) => {
                      setName(sanitizeNameInput(e.target.value));
                      clearError("name");
                    }}
                    placeholder="e.g. Aarav Sharma"
                    className={`w-full rounded-xl border bg-[#FAF7F2] pl-10 pr-3 py-2 text-sm text-[#061830] focus:outline-none ${
                      errors.name ? "border-rose-500 focus:border-rose-500" : "border-gold/30 focus:border-gold"
                    }`}
                  />
                </div>
                {errors.name && <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.name}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#061830] block mb-1">Mobile Number (10 digits)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 size-4 text-gold" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      setPhone(sanitizePhoneInput(e.target.value));
                      clearError("phone");
                    }}
                    placeholder="9876543210"
                    className={`w-full rounded-xl border bg-[#FAF7F2] pl-10 pr-3 py-2 text-sm text-[#061830] focus:outline-none ${
                      errors.phone ? "border-rose-500 focus:border-rose-500" : "border-gold/30 focus:border-gold"
                    }`}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.phone}</p>}
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-[#061830] block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 size-4 text-gold" />
              <input
                type="email"
                value={email}
                maxLength={254}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError("email");
                }}
                placeholder="name@example.com"
                className={`w-full rounded-xl border bg-[#FAF7F2] pl-10 pr-3 py-2 text-sm text-[#061830] focus:outline-none ${
                  errors.email ? "border-rose-500 focus:border-rose-500" : "border-gold/30 focus:border-gold"
                }`}
              />
            </div>
            {errors.email && <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.email}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-[#061830] block mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 size-4 text-gold" />
              <input
                type="password"
                value={password}
                maxLength={64}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError("password");
                }}
                placeholder="••••••••"
                className={`w-full rounded-xl border bg-[#FAF7F2] pl-10 pr-3 py-2 text-sm text-[#061830] focus:outline-none ${
                  errors.password ? "border-rose-500 focus:border-rose-500" : "border-gold/30 focus:border-gold"
                }`}
              />
            </div>
            {errors.password && <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.password}</p>}
          </div>

          {mode === "register" && role === "guest" && (
            <div>
              <label className="text-xs font-semibold text-[#061830] block mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 size-4 text-gold" />
                <input
                  type="password"
                  value={confirmPassword}
                  maxLength={64}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearError("confirmPassword");
                  }}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border bg-[#FAF7F2] pl-10 pr-3 py-2 text-sm text-[#061830] focus:outline-none ${
                    errors.confirmPassword ? "border-rose-500 focus:border-rose-500" : "border-gold/30 focus:border-gold"
                  }`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-gold-gradient py-3 text-xs font-bold uppercase tracking-wider text-gold-foreground shadow-gold hover:brightness-110 transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <LogIn className="size-4" />
            {submitting
              ? "Please wait…"
              : mode === "login"
              ? `Sign In as ${role === "admin" ? "Admin" : role === "reception" ? "Reception" : "Guest"}`
              : "Create Account"}
          </button>
        </form>

        {role === "guest" ? (
          <div className="mt-6 text-center text-xs text-[#64748b] border-t border-gold/15 pt-4">
            {mode === "login" ? (
              <p>
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="text-gold font-bold hover:underline ml-1 cursor-pointer"
                >
                  Register here (Guest)
                </button>
              </p>
            ) : (
              <p>
                Already have a guest account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-gold font-bold hover:underline ml-1 cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-[#FAF7F2] border border-gold/25 p-3.5 text-center text-xs text-[#64748b]">
            <div className="flex items-center justify-center gap-1.5 text-[#061830] font-bold mb-1">
              <ShieldCheck className="size-4 text-gold" />
              <span>{role === "admin" ? "Executive Administrator Access" : "Front Desk Staff Access"}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#475569]">
              Staff &amp; Admin accounts are assigned exclusively by Hotel Administration via the Executive Staff Governance console. Public registration is restricted to Guests.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
