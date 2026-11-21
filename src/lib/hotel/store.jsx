import { useSyncExternalStore } from "react";
import { createSeedState, CATEGORIES } from "./data.js";
import { datesOverlap, generateBookingId, quoteStay, todayISO } from "./pricing.js";

const KEY = "meri-hotel-frontend-v1";
const serverState = createSeedState();
let state = null;
const listeners = new Set();

function load() {
  if (typeof window === "undefined") return serverState;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === 1) {
        // Refresh image references from code
        const fresh = createSeedState();
        parsed.categories = parsed.categories.map((c) => ({
          ...c,
          image: fresh.categories.find((f) => f.id === c.id)?.image ?? c.image,
        }));
        return parsed;
      }
    }
  } catch (e) {
    /* ignore corrupt storage */
  }
  return createSeedState();
}

export function getState() {
  if (!state) state = load();
  return state;
}

export function setState(updater) {
  state = updater(getState());
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    /* storage error */
  }
  listeners.forEach((l) => l());
}

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useHotel(selector) {
  return useSyncExternalStore(
    subscribe,
    () => selector(getState()),
    () => selector(serverState)
  );
}

export const useHotelState = () => useHotel((s) => s);

/* ---------- Derived queries ---------- */

const ACTIVE = ["Pending", "Confirmed", "Checked-In"];

export function availableUnits(s, categoryId, checkIn, checkOut, ignoreBookingId) {
  const total = s.rooms.filter(
    (r) => r.categoryId === categoryId && r.status !== "maintenance"
  ).length;
  const used = s.bookings
    .filter(
      (b) =>
        b.id !== ignoreBookingId &&
        b.categoryId === categoryId &&
        ACTIVE.includes(b.status) &&
        datesOverlap(b.checkIn, b.checkOut, checkIn, checkOut)
    )
    .reduce((sum, b) => sum + b.rooms, 0);
  return Math.max(0, total - used);
}

export function occupiedRoomNumbers(s) {
  return new Set(
    s.bookings.filter((b) => b.status === "Checked-In" && b.roomNumber).map((b) => b.roomNumber)
  );
}

export function freeRoomsFor(s, categoryId) {
  const occ = occupiedRoomNumbers(s);
  return s.rooms
    .filter((r) => r.categoryId === categoryId && r.status === "available" && !occ.has(r.number))
    .map((r) => r.number);
}

export function getCategory(s, id) {
  return s.categories.find((c) => c.id === id) ?? s.categories[0];
}

/* ---------- Actions ---------- */

export function createBooking(input) {
  const s = getState();
  const cat = getCategory(s, input.categoryId);
  const q = quoteStay(cat.price, input.checkIn, input.checkOut, input.rooms, s.settings.taxRate);

  const booking = {
    id: generateBookingId(s.bookings.map((b) => b.id)),
    guestName: input.guestName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    categoryId: input.categoryId,
    roomNumber: input.roomNumber,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    rooms: input.rooms,
    status: input.status ?? "Pending",
    payment: input.payment ?? "Unpaid",
    amountPaid: input.amountPaid ?? 0,
    total: q.total,
    source: input.source || "Website",
    createdAt: todayISO(),
    requests: input.requests?.trim() || undefined,
  };

  setState((st) => ({
    ...st,
    bookings: [booking, ...st.bookings],
    rooms:
      booking.status === "Checked-In" && booking.roomNumber
        ? st.rooms.map((r) => (r.number === booking.roomNumber ? { ...r, status: "occupied" } : r))
        : st.rooms,
  }));
  return booking;
}

export function updateBooking(id, patch) {
  setState((st) => ({
    ...st,
    bookings: st.bookings.map((b) => {
      if (b.id !== id) return b;
      const next = { ...b, ...patch };
      if (patch.checkIn || patch.checkOut || patch.rooms || patch.categoryId) {
        const cat = getCategory(st, next.categoryId);
        next.total = quoteStay(
          cat.price,
          next.checkIn,
          next.checkOut,
          next.rooms,
          st.settings.taxRate
        ).total;
      }
      return next;
    }),
  }));
}

export function setBookingStatus(id, status) {
  const b = getState().bookings.find((x) => x.id === id);
  const patch = { status };
  if (status === "Cancelled" && b && b.amountPaid > 0) patch.payment = "Refunded";
  if (status === "Checked-Out" && b) {
    patch.payment = "Paid";
    patch.amountPaid = b.total;
  }
  updateBooking(id, patch);
}

export function checkInBooking(id, roomNumber) {
  updateBooking(id, { status: "Checked-In", roomNumber });
  if (roomNumber) setRoomStatus(roomNumber, "occupied");
}

export function checkOutBooking(id) {
  const b = getState().bookings.find((x) => x.id === id);
  setBookingStatus(id, "Checked-Out");
  if (b?.roomNumber) setRoomStatus(b.roomNumber, "cleaning");
}

export function recordPayment(id, amount) {
  const b = getState().bookings.find((x) => x.id === id);
  if (!b) return;
  const paid = Math.min(b.total, b.amountPaid + amount);
  updateBooking(id, {
    amountPaid: paid,
    payment: paid >= b.total ? "Paid" : paid > 0 ? "Partial" : "Unpaid",
  });
}

export function setRoomStatus(number, status) {
  setState((st) => ({
    ...st,
    rooms: st.rooms.map((r) => (r.number === number ? { ...r, status } : r)),
  }));
}

export function markAllRoomsClean() {
  setState((st) => ({
    ...st,
    rooms: st.rooms.map((r) => (r.status === "cleaning" ? { ...r, status: "available" } : r)),
  }));
}

export function updateCategoryPrice(id, price) {
  setState((st) => ({
    ...st,
    categories: st.categories.map((c) => (c.id === id ? { ...c, price } : c)),
  }));
}

export function updateSettings(patch) {
  setState((st) => ({ ...st, settings: { ...st.settings, ...patch } }));
}

export function resetDemoData() {
  setState(() => createSeedState());
}

/* ---------- Auth ---------- */

export function login(email, password, role) {
  const u = getState().users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!u || u.password !== password) return "Email or password is incorrect.";
  if (role && u.role !== role)
    return role === "reception"
      ? "This account is not a reception account."
      : "Please use Reception login for staff accounts.";

  const session = { email: u.email, name: u.name, role: u.role };
  setState((st) => ({ ...st, session }));
  return session;
}

export function register(input) {
  const s = getState();
  if (s.users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase()))
    return "An account with this email already exists.";

  const user = { ...input, email: input.email.trim().toLowerCase(), role: "guest" };
  const session = { email: user.email, name: user.name, role: "guest" };
  setState((st) => ({ ...st, users: [...st.users, user], session }));
  return session;
}

export function logout() {
  setState((st) => ({ ...st, session: null }));
}

export function updateProfile(email, patch) {
  setState((st) => ({
    ...st,
    users: st.users.map((u) => (u.email === email ? { ...u, ...patch } : u)),
    session:
      st.session && st.session.email === email
        ? { ...st.session, name: patch.name ?? st.session.name }
        : st.session,
  }));
}

export function sendSupportMessage(email, subject, message) {
  setState((st) => ({
    ...st,
    messages: [
      { id: Math.random().toString(36).substring(2, 9), email, subject, message, createdAt: todayISO() },
      ...st.messages,
    ],
  }));
}
