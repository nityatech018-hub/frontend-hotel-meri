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

export function formatCurrencyINR(amount) {
  const num = Number(amount || 0);
  return (
    "₹ " +
    num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function formatDateSlash(isoDate) {
  if (!isoDate) return "";
  const d = parseISODate(isoDate);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function numberToWordsINR(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num <= 0) return "Zero Rupees only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function helper(n) {
    if (n === 0) return "";
    if (n < 20) return ones[n] + " ";
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "") + " ";
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred " + (n % 100 !== 0 ? helper(n % 100) : "");
    if (n < 100000) return helper(Math.floor(n / 1000)) + "Thousand " + (n % 1000 !== 0 ? helper(n % 1000) : "");
    if (n < 10000000) return helper(Math.floor(n / 100000)) + "Lakh " + (n % 100000 !== 0 ? helper(n % 100000) : "");
    return helper(Math.floor(n / 10000000)) + "Crore " + (n % 10000000 !== 0 ? helper(n % 10000000) : "");
  }

  const words = helper(num).trim().replace(/\s+/g, " ");
  return words ? `${words} Rupees only` : "Zero Rupees only";
}

export function formatDate(isoDate, opts = { day: "numeric", month: "short", year: "numeric" }) {
  if (!isoDate) return "";
  const date = parseISODate(isoDate);
  return date.toLocaleDateString("en-IN", opts);
}

export function formatDateTime(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) + ", " + d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoString;
  }
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

export const GST_RATE = 0.05;
export const DEFAULT_EXTRA_GUEST_PRICE = 300;
export const DEFAULT_GST_RULE = "above_1000"; // "above_1000" (approved) | "all" (pending accountant confirmation)

/**
 * Calculates complete stay pricing breakdown:
 * - Base room charges
 * - Extra guest charges (₹300 per extra guest per night by default, configurable)
 * - Applicable GST (5% when room bill per night > ₹1,000; ₹0 on ₹1,000 unless gstRule === "all")
 * - Separate food and water bottle charges
 */
export function calculateStayPricing({
  baseRate = 0,
  nights = 1,
  rooms = 1,
  extraGuests = 0,
  extraGuestPrice = DEFAULT_EXTRA_GUEST_PRICE,
  taxRate = GST_RATE,
  gstRule = DEFAULT_GST_RULE,
  foodCharges = 0,
  waterBottleCharges = 0,
}) {
  const rate = Math.max(0, Number(baseRate) || 0);
  const numNights = Math.max(1, Number(nights) || 1);
  const numRooms = Math.max(1, Number(rooms) || 1);
  const numExtraGuests = Math.max(0, Number(extraGuests) || 0);
  const extraRate = Math.max(0, Number(extraGuestPrice) || 0);

  const baseRoomTotal = rate * numNights * numRooms;
  const extraGuestTotal = numExtraGuests * extraRate * numNights;
  const roomBill = baseRoomTotal + extraGuestTotal;
  const perNightRoomBill = roomBill / (numNights * numRooms);

  const isTaxable = gstRule === "all" ? roomBill > 0 : perNightRoomBill > 1000;
  const gstAmount = isTaxable ? Math.round(roomBill * taxRate) : 0;
  const sgst = gstAmount / 2;
  const cgst = gstAmount / 2;

  const foodTotal = Math.max(0, Number(foodCharges) || 0);
  const waterTotal = Math.max(0, Number(waterBottleCharges) || 0);
  const total = roomBill + gstAmount + foodTotal + waterTotal;

  return {
    baseRate: rate,
    basePrice: baseRoomTotal,
    baseRoomTotal,
    baseTotal: baseRoomTotal,
    extraGuests: numExtraGuests,
    extraGuestPrice: extraRate,
    extraGuestTotal,
    nights: numNights,
    rooms: numRooms,
    subtotal: roomBill,
    roomBill,
    taxRate,
    gstRule,
    isTaxable,
    gstAmount,
    tax: gstAmount,
    taxes: gstAmount,
    taxTotal: gstAmount,
    sgst,
    cgst,
    foodCharges: foodTotal,
    waterBottleCharges: waterTotal,
    total,
  };
}

/**
 * Calculates single-day pricing with GST rule for room cards and previews.
 */
export function calculateDailyRoomPrice(basePrice, taxRate = GST_RATE, gstRule = DEFAULT_GST_RULE) {
  const rate = Math.max(0, Number(basePrice) || 0);
  const isTaxable = gstRule === "all" ? rate > 0 : rate > 1000;
  const gst = isTaxable ? Math.round(rate * taxRate) : 0;
  return {
    base: rate,
    gst,
    total: rate + gst,
  };
}

export function quoteStay(
  pricePerNight,
  checkIn,
  checkOut,
  rooms = 1,
  taxRate = GST_RATE,
  options = {}
) {
  const nights = nightsBetween(checkIn, checkOut);
  return calculateStayPricing({
    baseRate: pricePerNight,
    nights,
    rooms,
    taxRate,
    ...options,
  });
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

export { validatePhoneNumber, validateEmail } from "./validation.js";

export const GOV_ID_TYPES = [
  { id: "Aadhaar Card", label: "Aadhaar Card", placeholder: "e.g. 12-digit Aadhaar (5482 1290 4589)" },
  { id: "PAN Card", label: "PAN Card", placeholder: "e.g. 10-character PAN (ABCDE1234F)" },
  { id: "Passport", label: "Passport", placeholder: "e.g. Passport Number (e.g. Z1234567)" },
  { id: "Driving License", label: "Driving License", placeholder: "e.g. DL Number (e.g. UP25 20210001234)" },
  { id: "Voter ID", label: "Voter ID Card", placeholder: "e.g. Voter ID / EPIC Number" },
  { id: "Other Gov ID", label: "Other Government ID", placeholder: "e.g. Official Government Photo ID" },
];
