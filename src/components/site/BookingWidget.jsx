import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { todayISO, addDays, parseISODate, nightsBetween } from "@/lib/hotel/pricing.js";

function formatDisplayDate(isoDate) {
  if (!isoDate) return "";
  try {
    const d = parseISODate(isoDate);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return isoDate;
  }
}

export function BookingWidget({ className }) {
  const navigate = useNavigate();
  const today = todayISO();
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(addDays(today, 2));
  const [guests, setGuests] = useState("2");
  const [rooms, setRooms] = useState("1");

  const checkInRef = useRef(null);
  const checkOutRef = useRef(null);
  const guestsRef = useRef(null);

  const nights = nightsBetween(checkIn, checkOut);

  const triggerPicker = (ref) => {
    if (ref.current) {
      if (typeof ref.current.showPicker === "function") {
        try {
          ref.current.showPicker();
        } catch {
          ref.current.focus();
        }
      } else {
        ref.current.focus();
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (checkOut <= checkIn) {
      toast.error("Check-out date must be strictly after check-in date.");
      return;
    }
    navigate(`/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className={`relative mx-auto w-full max-w-5xl rounded-xl bg-[#071A32] border border-[#D5A43D]/30 p-4 sm:p-6 shadow-lg ${
        className || ""
      }`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-end gap-3 sm:gap-4">
        {/* Check-In Input Box */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#F8F6F1]/80">
            Check-in
          </label>
          <div
            onClick={() => triggerPicker(checkInRef)}
            className="relative flex items-center justify-between rounded-lg bg-[#0D2545] border border-white/15 px-3.5 py-3 text-white cursor-pointer hover:border-[#D5A43D] transition-colors group"
          >
            <span className="text-sm font-medium tracking-wide text-white">
              {formatDisplayDate(checkIn)}
            </span>
            <Calendar className="size-4 text-[#D5A43D] shrink-0" />
            <input
              ref={checkInRef}
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (e.target.value >= checkOut) {
                  setCheckOut(addDays(e.target.value, 1));
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              title="Choose check-in date"
              required
            />
          </div>
        </div>

        {/* Check-Out Input Box */}
        <div className="flex flex-col gap-1.5 text-left">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#F8F6F1]/80">
              Check-out
            </label>
            <span className="text-[11px] text-[#D5A43D] font-medium">
              {nights} {nights === 1 ? "Night" : "Nights"}
            </span>
          </div>
          <div
            onClick={() => triggerPicker(checkOutRef)}
            className="relative flex items-center justify-between rounded-lg bg-[#0D2545] border border-white/15 px-3.5 py-3 text-white cursor-pointer hover:border-[#D5A43D] transition-colors group"
          >
            <span className="text-sm font-medium tracking-wide text-white">
              {formatDisplayDate(checkOut)}
            </span>
            <Calendar className="size-4 text-[#D5A43D] shrink-0" />
            <input
              ref={checkOutRef}
              type="date"
              value={checkOut}
              min={addDays(checkIn, 1)}
              onChange={(e) => setCheckOut(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              title="Choose check-out date"
              required
            />
          </div>
        </div>

        {/* Guests Dropdown Box */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#F8F6F1]/80">
            Guests
          </label>
          <div
            onClick={() => triggerPicker(guestsRef)}
            className="relative flex items-center justify-between rounded-lg bg-[#0D2545] border border-white/15 px-3.5 py-3 text-white cursor-pointer hover:border-[#D5A43D] transition-colors group"
          >
            <span className="text-sm font-medium tracking-wide text-white">
              {guests} {Number(guests) === 1 ? "Guest" : "Guests"}
            </span>
            <ChevronDown className="size-4 text-[#D5A43D] shrink-0" />
            <select
              ref={guestsRef}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10 bg-[#0D2545] text-white"
              title="Select number of guests"
            >
              <option value="1">1 Guest</option>
              <option value="2">2 Guests (Double)</option>
              <option value="3">3 Guests (Triple Room 103)</option>
            </select>
          </div>
        </div>

        {/* Check Availability CTA Button */}
        <div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full h-[46px] flex items-center justify-center gap-2 rounded-lg bg-[#D5A43D] hover:bg-[#e2b656] px-5 text-xs font-bold tracking-wider text-[#071A32] uppercase transition-colors cursor-pointer"
          >
            <span>Check Availability</span>
            <ArrowRight className="size-4" />
          </motion.button>
        </div>
      </div>
    </motion.form>
  );
}
