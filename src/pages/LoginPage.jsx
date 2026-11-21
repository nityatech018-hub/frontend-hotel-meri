import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Lock, Mail, User, Phone, LogIn, ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/site/Logo.jsx";
import { login, register, useHotel } from "@/lib/hotel/store.jsx";
import { DEMO_GUEST, DEMO_RECEPTION } from "@/lib/hotel/data.js";
import { validatePhoneNumber, validateEmail } from "@/lib/hotel/pricing.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const session = useHotel((s) => s.session);

  const [mode, setMode] = useState("login"); // login | register
  const [role, setRole] = useState("guest"); // guest | reception

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const fillDemo = (type) => {
    if (type === "guest") {
      setRole("guest");
      setEmail(DEMO_GUEST.email);
      setPassword(DEMO_GUEST.password);
    } else {
      setRole("reception");
      setEmail(DEMO_RECEPTION.email);
      setPassword(DEMO_RECEPTION.password);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (mode === "login") {
      const emailRes = validateEmail(email);
      if (!emailRes.valid) {
        toast.error(emailRes.error);
        return;
      }
      if (!password) {
        toast.error("Please enter your password.");
        return;
      }

      const res = login(emailRes.email, password, role);
      if (typeof res === "string") {
        toast.error(res);
      } else {
        toast.success(`Welcome, ${res.name}!`);
        navigate(res.role === "reception" ? "/reception" : "/account");
      }
    } else {
      if (!name.trim() || name.trim().length < 2) {
        toast.error("Please enter your full name (at least 2 characters).");
        return;
      }
      const emailRes = validateEmail(email);
      if (!emailRes.valid) {
        toast.error(emailRes.error);
        return;
      }

      let formattedPhone = undefined;
      if (phone.trim()) {
        const phoneRes = validatePhoneNumber(phone);
        if (!phoneRes.valid) {
          toast.error(phoneRes.error);
          return;
        }
        formattedPhone = phoneRes.formatted;
      }

      if (!password || password.length < 6) {
        toast.error("Password must be at least 6 characters long.");
        return;
      }

      const res = register({ email: emailRes.email, password, name: name.trim(), phone: formattedPhone });
      if (typeof res === "string") {
        toast.error(res);
      } else {
        toast.success(`Account registered! Welcome, ${res.name}.`);
        navigate("/account");
      }
    }
  };

  return (
    <div className="min-h-screen bg-navy-deep flex items-center justify-center p-6 relative">
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs text-champagne hover:text-gold uppercase tracking-wider"
      >
        <ArrowLeft className="size-4" /> Return to Website
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-gold/30 bg-navy p-8 shadow-2xl">
        <div className="text-center mb-6">
          <LogoMark className="mx-auto size-16" />
          <h2 className="mt-3 font-display text-2xl font-semibold text-navy-foreground">
            HOTEL MERI &amp; RESIDENCY
          </h2>
          <p className="text-xs text-gold uppercase tracking-widest mt-1">
            {role === "reception" ? "Staff Reception Terminal" : "Guest Portal Access"}
          </p>
        </div>

        {/* Role toggle */}
        <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-xl bg-navy-deep border border-gold/20">
          <button
            type="button"
            onClick={() => setRole("guest")}
            className={`py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition ${
              role === "guest"
                ? "bg-gold text-gold-foreground shadow-gold"
                : "text-navy-foreground/60 hover:text-navy-foreground"
            }`}
          >
            Guest Login
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("reception");
              setMode("login");
            }}
            className={`py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition ${
              role === "reception"
                ? "bg-gold text-gold-foreground shadow-gold"
                : "text-navy-foreground/60 hover:text-navy-foreground"
            }`}
          >
            Reception Staff
          </button>
        </div>

        {/* Demo fill shortcuts */}
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => fillDemo("guest")}
            className="flex-1 py-1.5 rounded-lg border border-gold/25 text-[11px] text-champagne hover:bg-white/5 transition"
          >
            Autofill Guest
          </button>
          <button
            type="button"
            onClick={() => fillDemo("reception")}
            className="flex-1 py-1.5 rounded-lg border border-gold/25 text-[11px] text-champagne hover:bg-white/5 transition"
          >
            Autofill Reception
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="text-xs font-semibold text-champagne/80 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 size-4 text-gold" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full rounded-lg border border-gold/30 bg-navy-deep pl-10 pr-3 py-2 text-sm text-navy-foreground"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-champagne/80 block mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 size-4 text-gold" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d+ -]/g, "");
                      setPhone(val.slice(0, 15));
                    }}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full rounded-lg border border-gold/30 bg-navy-deep pl-10 pr-3 py-2 text-sm text-navy-foreground"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-champagne/80 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 size-4 text-gold" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-gold/30 bg-navy-deep pl-10 pr-3 py-2 text-sm text-navy-foreground"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-champagne/80 block mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 size-4 text-gold" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gold/30 bg-navy-deep pl-10 pr-3 py-2 text-sm text-navy-foreground"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-gold-gradient py-3 text-xs font-semibold uppercase tracking-wider text-gold-foreground shadow-gold hover:brightness-110 transition"
          >
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {role === "guest" && (
          <div className="mt-6 text-center text-xs text-navy-foreground/60 border-t border-gold/15 pt-4">
            {mode === "login" ? (
              <p>
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="text-gold font-semibold hover:underline ml-1"
                >
                  Register here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-gold font-semibold hover:underline ml-1"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
