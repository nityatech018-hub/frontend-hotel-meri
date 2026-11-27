import { addDays, todayISO } from "./pricing.js";

const CATS = [
  "ac-family-double",
  "ac-family-triple",
  "ac-premium-round",
  "non-ac-double",
  "ac-family",
  "ac-premium",
  "non-ac",
];
const isDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(10, Math.floor(n)) : undefined;
};

export function validateStaySearch(s = {}) {
  return {
    checkIn: isDate(s["checkIn"]) ? s["checkIn"] : undefined,
    checkOut: isDate(s["checkOut"]) ? s["checkOut"] : undefined,
    guests: num(s["guests"]),
    rooms: num(s["rooms"]),
    category: CATS.includes(s["category"]) ? s["category"] : undefined,
  };
}

export function resolveStay(s = {}) {
  const today = todayISO();
  const checkIn = s.checkIn && s.checkIn >= today ? s.checkIn : addDays(today, 1);
  const checkOut = s.checkOut && s.checkOut > checkIn ? s.checkOut : addDays(checkIn, 2);
  return { checkIn, checkOut, guests: s.guests ?? 2, rooms: s.rooms ?? 1, category: s.category };
}
