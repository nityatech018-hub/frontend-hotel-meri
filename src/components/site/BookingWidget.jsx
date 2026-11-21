import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { todayISO, addDays } from "@/lib/hotel/pricing.js";

export function BookingWidget({ className }) {
  const navigate = useNavigate();
  const today = todayISO();
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(addDays(today, 2));
  const [guests, setGuests] = useState("2");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (checkOut <= checkIn) {
      toast.error("Check-out date must be after check-in date.");
      return;
    }
    navigate(`/book?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border border-gold/30 bg-navy/95 p-4 md:p-6 shadow-2xl backdrop-blur-xl ${className || ""}`}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
        {/* Check-in */}
        <div>
          <label className="text-xs font-semibold text-champagne/80 uppercase tracking-wider block mb-1.5">
            Check-In
          </label>
          <div className="relative">
            <input
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (e.target.value >= checkOut) {
                  setCheckOut(addDays(e.target.value, 1));
                }
              }}
              className="w-full rounded-lg border border-gold/30 bg-navy-deep px-3 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Check-out */}
        <div>
          <label className="text-xs font-semibold text-champagne/80 uppercase tracking-wider block mb-1.5">
            Check-Out
          </label>
          <div className="relative">
            <input
              type="date"
              value={checkOut}
              min={addDays(checkIn, 1)}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full rounded-lg border border-gold/30 bg-navy-deep px-3 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Guests */}
        <div>
          <label className="text-xs font-semibold text-champagne/80 uppercase tracking-wider block mb-1.5">
            Guests
          </label>
          <div className="relative">
            <select
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full rounded-lg border border-gold/30 bg-navy-deep px-3 py-2.5 text-sm text-navy-foreground focus:border-gold focus:outline-none"
            >
              <option value="1">1 Guest</option>
              <option value="2">2 Guests</option>
              <option value="3">3 Guests</option>
              <option value="4">4 Guests</option>
              <option value="5">5+ Guests</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-gradient py-3 text-xs font-semibold tracking-wider text-gold-foreground uppercase shadow-gold hover:brightness-110 transition"
          >
            Check Availability <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
