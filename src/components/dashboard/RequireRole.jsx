import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useHotel } from "@/lib/hotel/store.jsx";

export function RequireRole({ role, children }) {
  const session = useHotel((s) => s.session);
  const navigate = useNavigate();
  const ok = session?.role === role;

  useEffect(() => {
    if (!ok) {
      navigate(`/login?role=${role}`, { replace: true });
    }
  }, [ok, role, navigate]);

  if (!ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-deep text-navy-foreground">
        <div className="flex items-center gap-3">
          <div className="size-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="text-sm font-medium text-champagne">Redirecting to sign-in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
