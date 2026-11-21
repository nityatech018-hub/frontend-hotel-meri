import { addDays, nightsBetween } from "./pricing.js";

/**
 * Room revenue earned on each night: a stay's total is spread evenly across its nights.
 * Cancelled stays earn nothing. Returns one entry per day from `from` for `days` days.
 */
export function revenueByDay(bookings, from, days) {
  const out = Array.from({ length: days }, (_, i) => ({
    date: addDays(from, i),
    revenue: 0,
    bookings: 0,
  }));
  const index = new Map(out.map((d, i) => [d.date, i]));
  for (const b of bookings) {
    if (b.status === "Cancelled") continue;
    const nights = nightsBetween(b.checkIn, b.checkOut);
    const perNight = b.total / nights;
    for (let n = 0; n < nights; n++) {
      const i = index.get(addDays(b.checkIn, n));
      if (i !== undefined) out[i].revenue += perNight;
    }
    const ci = index.get(b.checkIn);
    if (ci !== undefined) out[ci].bookings += 1;
  }
  return out.map((d) => ({ ...d, revenue: Math.round(d.revenue) }));
}

/** Rooms booked per night across non-cancelled stays. */
export function roomsBookedOn(bookings, date, categoryId) {
  return bookings
    .filter(
      (b) =>
        b.status !== "Cancelled" &&
        b.status !== "Checked-Out" &&
        (!categoryId || b.categoryId === categoryId)
    )
    .filter((b) => b.checkIn <= date && date < b.checkOut)
    .reduce((n, b) => n + b.rooms, 0);
}
