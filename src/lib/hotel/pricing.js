const DAY = 86_400_000;

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(s) {
  if (!s) return new Date();
  const [y = 1970, m = 1, d = 1] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatINR(amount) {
  return "₹" + Math.round(amount || 0).toLocaleString("en-IN");
}

export function formatDate(isoDate, opts = { day: "numeric", month: "short", year: "numeric" }) {
  if (!isoDate) return "";
  const date = parseISODate(isoDate);
  return date.toLocaleDateString("en-IN", opts);
}

export function todayISO() {
  return toISODate(new Date());
}

export function addDays(isoDate, days) {
  const dt = parseISODate(isoDate);
  dt.setDate(dt.getDate() + days);
  return toISODate(dt);
}

export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1;
  const diff = Math.round((parseISODate(checkOut).getTime() - parseISODate(checkIn).getTime()) / DAY);
  return Math.max(1, diff);
}

export function quoteStay(pricePerNight, checkIn, checkOut, rooms = 1, taxRate = 0.12) {
  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = pricePerNight * nights * Math.max(1, rooms);
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;
  return { nights, subtotal, tax, total };
}

export const FREE_CANCEL_DAYS = 2;

export function canGuestCancel(booking, today = todayISO()) {
  const cancellable = ["Pending", "Confirmed"];
  if (!cancellable.includes(booking?.status)) return false;
  const daysAhead = Math.round(
    (parseISODate(booking.checkIn).getTime() - parseISODate(today).getTime()) / DAY
  );
  return daysAhead >= FREE_CANCEL_DAYS;
}

export function datesOverlap(aIn, aOut, bIn, bOut) {
  return aIn < bOut && bIn < aOut;
}

const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateBookingId(existing = [], rand = Math.random) {
  const taken = new Set(existing);
  for (;;) {
    let code = "";
    for (let i = 0; i < 6; i++) code += ID_CHARS[Math.floor(rand() * ID_CHARS.length)];
    const id = `HMR-${code}`;
    if (!taken.has(id)) return id;
  }
}

export function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== "string" || !phone.trim()) {
    return { valid: false, error: "Please enter a contact mobile number." };
  }
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }
  if (digits.length !== 10) {
    return {
      valid: false,
      error: `Please enter a valid 10-digit mobile number (you entered ${digits.length} digit${digits.length === 1 ? "" : "s"}).`,
    };
  }
  if (!/^[6-9]/.test(digits)) {
    return {
      valid: false,
      error: "Indian mobile numbers must start with 6, 7, 8, or 9.",
    };
  }
  return {
    valid: true,
    digits,
    formatted: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
  };
}

export function validateEmail(email) {
  if (!email || typeof email !== "string" || !email.trim()) {
    return { valid: false, error: "Please enter your email address." };
  }
  const clean = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    return { valid: false, error: "Please enter a valid email address (e.g. name@example.com)." };
  }
  return { valid: true, email: clean.toLowerCase() };
}
