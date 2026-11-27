import { useSyncExternalStore } from "react";
import { createSeedState, CATEGORIES } from "./data.js";
import { addDays, datesOverlap, generateBookingId, quoteStay, todayISO } from "./pricing.js";

const KEY = "meri-hotel-frontend-v7";
const SESSION_KEY = "meri-hotel-tab-session-v7";
const serverState = createSeedState();
let state = null;
const listeners = new Set();

function readTabSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeTabSession(session) {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      window.sessionStorage.removeItem(SESSION_KEY);
    }
  } catch {
    /* ignore */
  }
}

function load() {
  if (typeof window === "undefined") return serverState;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === 1 || parsed.version === 2 || parsed.version === 3) {
        const fresh = createSeedState();

        // Check if stored rooms/categories are legacy
        const hasLegacyCategories =
          !parsed.rooms ||
          parsed.rooms.length !== 10 ||
          parsed.categories?.some(
            (c) =>
              c.id === "deluxe" ||
              c.id === "executive" ||
              c.id === "suite" ||
              c.id === "ac-family" ||
              c.id === "ac-premium" ||
              c.id === "non-ac"
          );

        if (hasLegacyCategories) {
          parsed.categories = fresh.categories;
          parsed.rooms = fresh.rooms;
          parsed.bookings = fresh.bookings;
        } else {
          // Refresh image references from code
          parsed.categories = parsed.categories.map((c) => ({
            ...c,
            image: fresh.categories.find((f) => f.id === c.id)?.image ?? c.image,
          }));
        }

        // Ensure all collections exist in persistent storage
        if (!parsed.guests) parsed.guests = fresh.guests;
        if (!parsed.housekeepingTasks) parsed.housekeepingTasks = fresh.housekeepingTasks;
        if (!parsed.maintenanceRequests) parsed.maintenanceRequests = fresh.maintenanceRequests;
        if (!parsed.hotelServices) parsed.hotelServices = fresh.hotelServices;
        if (!parsed.guestCharges) parsed.guestCharges = fresh.guestCharges;
        if (!parsed.financialTransactions) parsed.financialTransactions = fresh.financialTransactions;
        if (!parsed.offers) parsed.offers = fresh.offers;
        if (!parsed.auditLogs) parsed.auditLogs = fresh.auditLogs;
        if (!parsed.notifications) parsed.notifications = fresh.notifications;
        if (!parsed.facilities) parsed.facilities = fresh.facilities;
        if (!parsed.availableAmenities) parsed.availableAmenities = fresh.availableAmenities;

        // Ensure room objects have publication state and default amenities
        parsed.rooms = (parsed.rooms || []).map((r) => {
          const freshRoom = fresh.rooms.find((fr) => fr.number === r.number);
          return {
            ...r,
            image: freshRoom?.image || r.image,
            isAc: r.isAc !== undefined ? r.isAc : (freshRoom?.isAc ?? (r.categoryId !== "non-ac-double" && r.categoryId !== "non-ac")),
            bedType: r.bedType || freshRoom?.bedType || "Double Bed",
            capacity: r.capacity || freshRoom?.capacity || 2,
            isPublished: r.isPublished !== false,
            amenities: r.amenities && r.amenities.length > 0 ? r.amenities : (freshRoom?.amenities || ["Free Wi-Fi", "Attached Marble Bath", "Smart TV"]),
          };
        });

        // Ensure master administrator permanently exists in persistent storage
        const masterAdminEmail = "admin@merihotel.demo";
        if (!parsed.users?.some((u) => u.email.toLowerCase() === masterAdminEmail)) {
          const defaultAdmin = fresh.users.find((u) => u.email.toLowerCase() === masterAdminEmail) || {
            email: masterAdminEmail,
            password: "admin123",
            name: "General Manager",
            phone: "+91 94122 88334",
            role: "admin",
            city: "Bareilly",
          };
          parsed.users = [...(parsed.users || []), defaultAdmin];
        }

        // Ensure all default staff members (Housekeeping, Maintenance, Reception) permanently reflect in persistent storage
        if (Array.isArray(fresh.users)) {
          parsed.users = parsed.users || [];
          fresh.users.forEach((fu) => {
            if (fu.role !== "guest" && !parsed.users.some((u) => u.email.toLowerCase() === fu.email.toLowerCase())) {
              parsed.users.push(fu);
            }
          });
        }

        // Ensure every booking has bookingDate, bookingTime, bookedAt
        parsed.bookings = (parsed.bookings || []).map((b) => {
          const bDate = b.bookingDate || (b.createdAt && b.createdAt.length >= 10 ? b.createdAt.substring(0, 10) : todayISO());
          const bTime = b.bookingTime || "12:00 PM";
          return {
            ...b,
            bookingDate: bDate,
            bookingTime: bTime,
            bookedAt: b.bookedAt || b.createdAt || `${bDate}T12:00:00.000Z`,
          };
        });

        // Ensure settings have full tax, gstin, and bank info from fresh defaults
        parsed.settings = { ...fresh.settings, ...(parsed.settings || {}) };
        if (!parsed.settings.gstin || parsed.settings.taxRate !== 0.05) {
          parsed.settings = { ...parsed.settings, ...fresh.settings, taxRate: 0.05 };
        }

        // Ensure 109 demo booking is available
        if (!parsed.bookings.some((b) => b.id === "109")) {
          const b109 = fresh.bookings.find((b) => b.id === "109");
          if (b109) parsed.bookings.unshift(b109);
        }

        return parsed;
      }
    }
  } catch (e) {
    /* ignore corrupt storage */
  }
  return createSeedState();
}

export function getState() {
  if (!state) {
    state = load();
    const tabSession = readTabSession();
    if (tabSession) {
      state = { ...state, session: tabSession };
    }
  }
  return state;
}

export function setState(updater) {
  const prevSession = getState().session;
  state = updater(getState());
  if (state.session !== prevSession) {
    writeTabSession(state.session);
  }
  try {
    // Persist shared hotel data without forcing other tabs' role sessions to change
    window.localStorage.setItem(KEY, JSON.stringify({ ...state, session: state.session }));
  } catch (e) {
    /* storage error */
  }
  listeners.forEach((l) => l());
}

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

// Cross-tab real-time shared state synchronization:
// When any tab modifies bookings, rooms, guests, or settings, other tabs update immediately
// while preserving each tab's own active role session (Guest / Reception / Admin).
function syncFromStorage() {
  const currentTabSession = readTabSession() ?? state?.session ?? null;
  const freshFromStorage = load();
  state = { ...freshFromStorage, session: currentTabSession };
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      syncFromStorage();
    }
  });
  window.addEventListener("focus", syncFromStorage);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      syncFromStorage();
    }
  });
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

export function activeBookingForRoom(s, roomNumber, onDate = todayISO()) {
  return s.bookings.find(
    (b) =>
      b.roomNumber === roomNumber &&
      ACTIVE.includes(b.status) &&
      b.checkIn <= onDate &&
      onDate < b.checkOut
  );
}

export function heldRoomNumbers(s, onDate = todayISO()) {
  return new Set(
    s.bookings
      .filter(
        (b) =>
          b.roomNumber &&
          ACTIVE.includes(b.status) &&
          b.checkIn <= onDate &&
          onDate < b.checkOut
      )
      .map((b) => b.roomNumber)
  );
}

export function occupiedRoomNumbers(s, onDate = todayISO()) {
  return new Set(
    s.bookings
      .filter(
        (b) =>
          b.roomNumber &&
          b.status === "Checked-In" &&
          b.checkIn <= onDate &&
          onDate < b.checkOut
      )
      .map((b) => b.roomNumber)
  );
}

export function getEffectiveRoomStatus(s, room, onDate = todayISO()) {
  if (!room) return "available";
  if (room.status === "maintenance") return "maintenance";
  if (room.status === "blocked") return "blocked";
  if (room.status === "cleaning" || room.status === "dirty") return "cleaning";

  const booking = activeBookingForRoom(s, room.number, onDate);
  if (booking) {
    if (booking.status === "Checked-In") return "occupied";
    if (booking.status === "Confirmed" || booking.status === "Pending") return "reserved";
  }
  return room.status || "available";
}

export function isPhysicalRoomAvailable(s, roomNumber, checkIn, checkOut, ignoreBookingId) {
  const room = s.rooms.find((r) => r.number === roomNumber);
  if (!room || room.status === "maintenance" || room.status === "blocked" || room.isPublished === false) {
    return false;
  }
  const today = todayISO();
  const start = checkIn || today;
  const end = checkOut || addDays(start, 1);

  const isBooked = s.bookings.some(
    (b) =>
      b.id !== ignoreBookingId &&
      b.roomNumber === roomNumber &&
      ACTIVE.includes(b.status) &&
      datesOverlap(b.checkIn, b.checkOut, start, end)
  );
  return !isBooked;
}

export function normalizeCategoryId(id) {
  if (!id) return "";
  if (id === "ac-family") return "ac-family-double";
  if (id === "ac-premium") return "ac-premium-round";
  if (id === "non-ac") return "non-ac-double";
  return id;
}

export function freePhysicalRoomsForCategory(s, categoryId, checkIn, checkOut, ignoreBookingId) {
  const norm = normalizeCategoryId(categoryId);
  return s.rooms
    .filter((r) => {
      if (!norm) return true;
      if (r.categoryId === norm) return true;
      if (norm === "ac-family-double" && (r.categoryId === "ac-family-double" || r.categoryId === "ac-family-triple")) return true;
      return false;
    })
    .filter((r) => isPhysicalRoomAvailable(s, r.number, checkIn, checkOut, ignoreBookingId))
    .map((r) => String(r.number));
}

export function availableUnits(s, categoryId, checkIn, checkOut, ignoreBookingId) {
  const today = todayISO();
  const start = checkIn || today;
  const end = checkOut || addDays(start, 1);
  return freePhysicalRoomsForCategory(s, categoryId, start, end, ignoreBookingId).length;
}

export function freeRoomsFor(s, categoryId, checkIn, checkOut) {
  const today = todayISO();
  const start = checkIn || today;
  const end = checkOut || addDays(start, 1);
  return freePhysicalRoomsForCategory(s, categoryId, start, end);
}

export function allFreeRooms(s, checkIn, checkOut) {
  const today = todayISO();
  const start = checkIn || today;
  const end = checkOut || addDays(start, 1);
  return freePhysicalRoomsForCategory(s, null, start, end);
}

export function firstAvailableRoomFor(s, categoryId, checkIn, checkOut) {
  const ready = freeRoomsFor(s, categoryId, checkIn, checkOut);
  if (ready.length > 0) return ready[0];

  const cleaning = s.rooms.find(
    (r) => r.categoryId === categoryId && r.status === "cleaning"
  );
  if (cleaning) return cleaning.number;

  const allFree = allFreeRooms(s, checkIn, checkOut);
  if (allFree.length > 0) return allFree[0];

  const occ = occupiedRoomNumbers(s);
  const unocc = s.rooms.find(
    (r) => r.categoryId === categoryId && !occ.has(r.number) && r.status !== "maintenance"
  );
  return unocc?.number || "";
}

export function getCategory(s, id) {
  const norm = normalizeCategoryId(id);
  return s.categories.find((c) => c.id === norm || c.id === id) ?? s.categories[0];
}

/* ---------- Actions ---------- */

export function createBooking(input) {
  const s = getState();
  const roomNumberStr = input.roomNumber ? String(input.roomNumber) : "";
  const roomObj = roomNumberStr ? s.rooms.find((r) => String(r.number) === roomNumberStr) : null;
  const targetCategory = normalizeCategoryId(input.categoryId) || roomObj?.categoryId || "ac-family-double";
  const cat = getCategory(s, targetCategory);
  const baseRate = input.tariffRate || roomObj?.price || cat?.price || 1200;
  const q = quoteStay(baseRate, input.checkIn, input.checkOut, input.rooms || 1, s.settings.taxRate ?? 0.05);

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = todayISO();
  const currentISO = now.toISOString();

  // Keep roomNumber unassigned for category-based guest bookings; Reception assigns the actual room.
  const assignedRoomNum = roomNumberStr || "";

  const booking = {
    id: generateBookingId(s.bookings.map((b) => b.id)),
    guestId: input.guestId || `GST-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    guestName: input.guestName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    categoryId: targetCategory,
    roomNumber: assignedRoomNum,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    extraGuests: input.extraGuests || 0,
    rooms: input.rooms || 1,
    status: input.status ?? "Pending",
    payment: input.payment ?? "Unpaid",
    tariffRate: baseRate,
    taxAmount: q.taxes,
    discountAmount: input.discountAmount || 0,
    amountPaid: input.amountPaid ?? 0,
    total: input.total || q.total,
    depositAmount: input.depositAmount || 0,
    source: input.source || "Website",
    createdAt: currentISO,
    bookingDate: dateStr,
    bookingTime: timeStr,
    bookedAt: currentISO,
    requests: input.requests?.trim() || undefined,
    internalNotes: input.internalNotes || (input.source === "Walk-in" ? "Walk-in booking recorded at front desk." : ""),
    idType: input.idType?.trim() || undefined,
    idNumber: input.idNumber?.trim() || undefined,
    idName: input.idName?.trim() || input.guestName.trim(),
    idVerified: Boolean(input.idVerified),
  };

  // Instant notification for Reception Desk and Admin Consoles
  const newNotif = {
    id: `NOTIF-BOOK-${booking.id}`,
    type: "new_booking",
    title: `New Online Booking #${booking.id}`,
    message: `${booking.guestName} reserved ${booking.rooms}x ${cat.name} (${booking.checkIn} to ${booking.checkOut}). Total: ₹${Math.round(booking.total).toLocaleString("en-IN")}`,
    bookingId: booking.id,
    guestName: booking.guestName,
    time: timeStr,
    date: dateStr,
    timestamp: currentISO,
    read: false,
    link: `/reception/bookings?search=${booking.id}`,
  };

  // Sync to Guest CRM
  const existingGuest = s.guests?.find((g) => g.email.toLowerCase() === booking.email);
  const updatedGuests = existingGuest
    ? s.guests.map((g) =>
        g.email.toLowerCase() === booking.email
          ? { ...g, totalSpent: (g.totalSpent || 0) + booking.amountPaid, totalStays: (g.totalStays || 0) + 1 }
          : g
      )
    : [
        {
          id: booking.guestId,
          name: booking.guestName,
          email: booking.email,
          phone: booking.phone,
          city: "Bareilly",
          address: "",
          idType: booking.idType || "Aadhaar Card",
          idNumber: booking.idNumber || "",
          vip: false,
          preferences: booking.requests || "",
          notes: booking.source === "Walk-in" ? "Walk-in guest" : "Direct booking",
          complaints: "",
          totalSpent: booking.amountPaid,
          totalStays: 1,
        },
        ...(s.guests || []),
      ];

  // Sync to Financial Ledger if payment made
  const newTxns = booking.amountPaid > 0
    ? [
        {
          id: `TXN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          bookingId: booking.id,
          type: booking.status === "Checked-In" ? "payment" : "advance",
          paymentMethod: input.paymentMethod || "upi",
          amount: booking.amountPaid,
          referenceNo: `POS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          description: `Booking deposit for ${booking.guestName} (#${booking.id})`,
          createdBy: s.session?.name || "Front Desk",
          createdAt: todayISO(),
        },
        ...(s.financialTransactions || []),
      ]
    : (s.financialTransactions || []);

  setState((st) => ({
    ...st,
    bookings: [booking, ...st.bookings],
    notifications: [newNotif, ...(st.notifications || [])],
    guests: updatedGuests,
    financialTransactions: newTxns,
    rooms:
      booking.status === "Checked-In" && booking.roomNumber
        ? st.rooms.map((r) => (String(r.number) === String(booking.roomNumber) ? { ...r, status: "occupied" } : r))
        : (booking.status === "Confirmed" || booking.status === "Pending") && booking.roomNumber
        ? st.rooms.map((r) => (String(r.number) === String(booking.roomNumber) ? { ...r, status: "reserved" } : r))
        : st.rooms,
  }));
  return booking;
}

export function createWalkInBooking(input) {
  const isCheckInNow = input.checkInNow !== false;
  return createBooking({
    ...input,
    source: "Walk-in",
    status: isCheckInNow ? "Checked-In" : "Confirmed",
    payment: (input.amountPaid || 0) >= (input.total || 0) ? "Paid" : (input.amountPaid || 0) > 0 ? "Partial" : "Unpaid",
  });
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

export function confirmBooking(id, roomNumber) {
  const patch = { status: "Confirmed", confirmedAt: todayISO() };
  if (roomNumber) patch.roomNumber = roomNumber;
  updateBooking(id, patch);
  if (roomNumber) setRoomStatus(roomNumber, "reserved");
}

export function checkInBooking(id, roomNumber, extraPatch = {}) {
  const b = getState().bookings.find((x) => x.id === id);
  const updated = {
    status: "Checked-In",
    roomNumber,
    checkedInAt: todayISO(),
    ...extraPatch,
  };
  updateBooking(id, updated);
  if (roomNumber) setRoomStatus(roomNumber, "occupied");
  return { ...b, ...updated };
}

export function checkOutBooking(id, settlementPatch = {}) {
  const s = getState();
  const b = s.bookings.find((x) => x.id === id);
  if (!b) return;

  const roomNum = b.roomNumber;
  const discount = Number(settlementPatch.discount) || 0;
  const grandTotal = Math.max(0, (b.total || 0) - discount);
  const remainingBalance = Math.max(0, grandTotal - (b.amountPaid || 0));
  const explicitSettlement =
    settlementPatch.settlementAmount !== undefined
      ? Number(settlementPatch.settlementAmount)
      : settlementPatch.finalPaid !== undefined
      ? Number(settlementPatch.finalPaid)
      : null;

  if (remainingBalance > 0 && (explicitSettlement === null || explicitSettlement < remainingBalance)) {
    throw new Error(
      `Cannot check out before settling the pending balance of ₹${Math.round(remainingBalance).toLocaleString("en-IN")}.`
    );
  }

  const settlementAmt = explicitSettlement !== null ? explicitSettlement : remainingBalance;

  // Generate automated housekeeping task
  const newHkTask = roomNum
    ? {
        id: `HK-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        roomNumber: roomNum,
        taskType: "Checkout Turnover",
        priority: "High",
        assignedTo: "Unassigned",
        status: "dirty",
        remarks: `Room vacated by ${b.guestName}. Full turnover cleaning and sanitization required.`,
        reportedDamage: null,
        lostFound: null,
        inspectedBy: null,
        createdAt: todayISO(),
      }
    : null;

  // Add settlement transaction to financial ledger if amount paid
  const newTxns = settlementAmt > 0
    ? [
        {
          id: `TXN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          bookingId: b.id,
          type: "payment",
          paymentMethod: settlementPatch.paymentMethod || "card",
          amount: settlementAmt,
          referenceNo: `OUT-${b.id}`,
          description: `Folio checkout settlement for ${b.guestName}`,
          createdBy: s.session?.name || "Front Desk",
          createdAt: todayISO(),
        },
        ...(s.financialTransactions || []),
      ]
    : (s.financialTransactions || []);

  updateBooking(id, {
    status: "Checked-Out",
    payment: "Paid",
    amountPaid: b.total,
    checkedOutAt: todayISO(),
    internalNotes: `${b.internalNotes ? b.internalNotes + " | " : ""}Checked out. Remarks: ${settlementPatch.remarks || "Regular checkout"}`,
  });

  setState((st) => ({
    ...st,
    financialTransactions: newTxns,
    housekeepingTasks: newHkTask ? [newHkTask, ...(st.housekeepingTasks || [])] : st.housekeepingTasks,
    rooms: roomNum
      ? st.rooms.map((r) => (r.number === roomNum ? { ...r, status: "dirty" } : r))
      : st.rooms,
  }));
  return { ...b, status: "Checked-Out", amountPaid: b.total, roomNumber: roomNum, ...settlementPatch };
}

export function recordPayment(id, amount, paymentMethod = "upi") {
  const s = getState();
  const b = s.bookings.find((x) => x.id === id);
  if (!b) return;
  const numAmt = parseFloat(amount);
  if (isNaN(numAmt) || numAmt <= 0) return;

  const paid = Math.min(b.total, b.amountPaid + numAmt);
  updateBooking(id, {
    amountPaid: paid,
    payment: paid >= b.total ? "Paid" : paid > 0 ? "Partial" : "Unpaid",
  });

  const newTxn = {
    id: `TXN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    bookingId: b.id,
    type: "payment",
    paymentMethod,
    amount: numAmt,
    referenceNo: `PAY-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    description: `Payment recorded for ${b.guestName} (#${b.id})`,
    createdBy: s.session?.name || "Staff",
    createdAt: todayISO(),
  };

  setState((st) => ({
    ...st,
    financialTransactions: [newTxn, ...(st.financialTransactions || [])],
  }));
}

export function setRoomStatus(number, status, reason = "") {
  setState((st) => ({
    ...st,
    rooms: st.rooms.map((r) =>
      r.number === number
        ? {
            ...r,
            status,
            statusReason: reason || "",
            lastCleanedAt: status === "ready" || status === "available" ? todayISO() : r.lastCleanedAt,
          }
        : r
    ),
  }));
}

export function toggleBlockRoom(number, blocked, reason = "") {
  setState((st) => ({
    ...st,
    rooms: st.rooms.map((r) =>
      r.number === number
        ? {
            ...r,
            status: blocked ? "blocked" : "available",
            notes: blocked ? `BLOCKED: ${reason}` : "",
          }
        : r
    ),
  }));
}

export function addRoom(room) {
  const st = getState();
  const roomNumStr = String(room.number).trim();
  if (!roomNumStr) return { success: false, error: "Please specify a valid room number." };
  if (st.rooms.some((r) => String(r.number) === roomNumStr)) {
    return { success: false, error: `Suite ${roomNumStr} already exists in inventory!` };
  }

  const newRoom = {
    number: roomNumStr,
    categoryId: room.categoryId || "ac-family",
    floor: Number(room.floor || 1),
    wing: room.wing || "Main Wing",
    bedType: room.bedType || room.bed || "1 King Bed",
    capacity: Number(room.capacity || room.maxGuests || 2),
    status: room.status || "available",
    isPublished: room.isPublished !== false,
    amenities: Array.isArray(room.amenities) && room.amenities.length > 0
      ? room.amenities
      : ["Free Wi-Fi", "Air conditioning", "Attached Marble Bath", "Smart TV"],
    notes: room.notes || "",
    lastCleanedAt: todayISO(),
  };

  setState((curr) => ({
    ...curr,
    rooms: [...curr.rooms, newRoom].sort(
      (a, b) => a.floor - b.floor || String(a.number).localeCompare(String(b.number), undefined, { numeric: true })
    ),
  }));

  addAuditLog({
    action: "ADD_ROOM",
    module: "Rooms",
    recordId: roomNumStr,
    details: `Suite ${roomNumStr} (${newRoom.categoryId.toUpperCase()}) added to inventory.`,
  });

  return { success: true, room: newRoom };
}

export function updateRoom(originalNumber, patch) {
  const st = getState();
  const origStr = String(originalNumber).trim();
  const targetRoom = st.rooms.find((r) => String(r.number) === origStr);
  if (!targetRoom) return { success: false, error: `Suite ${origStr} not found.` };

  let finalNumber = origStr;
  if (patch.number && String(patch.number).trim() !== origStr) {
    const newNumStr = String(patch.number).trim();
    if (st.rooms.some((r) => String(r.number) === newNumStr)) {
      return { success: false, error: `Suite number ${newNumStr} is already taken.` };
    }
    finalNumber = newNumStr;
  }

  setState((curr) => {
    const updatedRooms = curr.rooms.map((r) => {
      if (String(r.number) === origStr) {
        return {
          ...r,
          ...patch,
          number: finalNumber,
          floor: patch.floor !== undefined ? Number(patch.floor) : r.floor,
          capacity: patch.capacity !== undefined ? Number(patch.capacity) : r.capacity,
          amenities: patch.amenities !== undefined ? patch.amenities : r.amenities,
          isPublished: patch.isPublished !== undefined ? patch.isPublished : r.isPublished !== false,
        };
      }
      return r;
    }).sort((a, b) => a.floor - b.floor || String(a.number).localeCompare(String(b.number), undefined, { numeric: true }));

    // If room number changed, maintain referential integrity in bookings, housekeeping, and maintenance
    const updatedBookings = finalNumber !== origStr
      ? curr.bookings.map((b) => (String(b.roomNumber) === origStr ? { ...b, roomNumber: finalNumber } : b))
      : curr.bookings;

    const updatedHK = finalNumber !== origStr
      ? curr.housekeepingTasks.map((t) => (String(t.roomNumber) === origStr ? { ...t, roomNumber: finalNumber } : t))
      : curr.housekeepingTasks;

    const updatedMNT = finalNumber !== origStr
      ? curr.maintenanceRequests.map((m) => (String(m.roomNumber) === origStr ? { ...m, roomNumber: finalNumber } : m))
      : curr.maintenanceRequests;

    return {
      ...curr,
      rooms: updatedRooms,
      bookings: updatedBookings,
      housekeepingTasks: updatedHK,
      maintenanceRequests: updatedMNT,
    };
  });

  addAuditLog({
    action: "UPDATE_ROOM",
    module: "Rooms",
    recordId: finalNumber,
    details: `Suite ${origStr} configuration updated${finalNumber !== origStr ? ` (renumbered to ${finalNumber})` : ""}.`,
  });

  return { success: true };
}

export function deleteRoom(number) {
  const st = getState();
  const numStr = String(number).trim();
  const room = st.rooms.find((r) => String(r.number) === numStr);
  if (!room) return { success: false, error: `Suite ${numStr} not found.` };

  // Rule: Do not allow deletion of rooms that have active reservations
  const activeBooking = st.bookings.find(
    (b) => String(b.roomNumber) === numStr && ACTIVE.includes(b.status)
  );
  if (activeBooking) {
    return {
      success: false,
      error: `Cannot delete Suite ${numStr}: Active reservation (${activeBooking.id} for ${activeBooking.guestName}) is assigned. Reassign the booking or unpublish the room.`,
    };
  }

  // Rule: If historical reservations exist, preserve records and archive
  const hasHistory = st.bookings.some((b) => String(b.roomNumber) === numStr);
  if (hasHistory) {
    setState((curr) => ({
      ...curr,
      rooms: curr.rooms.map((r) =>
        String(r.number) === numStr
          ? { ...r, isPublished: false, status: "blocked", notes: "Archived: Historical stay records retained." }
          : r
      ),
    }));
    addAuditLog({
      action: "ARCHIVE_ROOM",
      module: "Rooms",
      recordId: numStr,
      details: `Suite ${numStr} archived and unpublished because historical booking records must be retained.`,
    });
    return {
      success: true,
      archived: true,
      message: `Suite ${numStr} has historical booking records and was securely archived/unpublished instead of permanently deleted.`,
    };
  }

  // No bookings ever linked: permanent delete
  setState((curr) => ({
    ...curr,
    rooms: curr.rooms.filter((r) => String(r.number) !== numStr),
    housekeepingTasks: curr.housekeepingTasks.filter((t) => String(t.roomNumber) !== numStr),
    maintenanceRequests: curr.maintenanceRequests.filter((m) => String(m.roomNumber) !== numStr),
  }));
  addAuditLog({
    action: "DELETE_ROOM",
    module: "Rooms",
    recordId: numStr,
    details: `Suite ${numStr} permanently deleted from inventory.`,
  });
  return { success: true, archived: false, message: `Suite ${numStr} permanently deleted from inventory.` };
}

export function togglePublishRoom(number) {
  let nextStatus = true;
  setState((st) => ({
    ...st,
    rooms: st.rooms.map((r) => {
      if (String(r.number) === String(number)) {
        nextStatus = r.isPublished === false ? true : false;
        return { ...r, isPublished: nextStatus };
      }
      return r;
    }),
  }));
  addAuditLog({
    action: "TOGGLE_ROOM_PUBLISH",
    module: "Rooms",
    recordId: String(number),
    details: `Suite ${number} publication status set to ${nextStatus ? "Published" : "Unpublished"}.`,
  });
  return nextStatus;
}

export function markAllRoomsClean() {
  setState((st) => ({
    ...st,
    rooms: st.rooms.map((r) => (r.status === "cleaning" || r.status === "dirty" ? { ...r, status: "available" } : r)),
  }));
}

/* ---------- Housekeeping Management Actions ---------- */

export function addHousekeepingTask(task) {
  const newTask = {
    id: `HK-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    roomNumber: task.roomNumber,
    taskType: task.taskType || "Turnover Cleaning",
    priority: task.priority || "Medium",
    assignedTo: task.assignedTo || "Unassigned",
    status: task.assignedTo && task.assignedTo !== "Unassigned" ? "assigned" : "dirty",
    remarks: task.remarks || "",
    reportedDamage: null,
    lostFound: null,
    inspectedBy: null,
    createdAt: todayISO(),
  };

  setState((st) => ({
    ...st,
    housekeepingTasks: [newTask, ...(st.housekeepingTasks || [])],
    rooms: st.rooms.map((r) =>
      r.number === task.roomNumber && r.status !== "occupied" ? { ...r, status: "cleaning" } : r
    ),
  }));
  return newTask;
}

export function updateHousekeepingStatus(id, status, details = {}) {
  const s = getState();
  const task = s.housekeepingTasks?.find((t) => t.id === id);
  if (!task) return;

  const roomNum = task.roomNumber;

  setState((st) => ({
    ...st,
    housekeepingTasks: st.housekeepingTasks.map((t) =>
      t.id === id ? { ...t, status, ...details, completedAt: status === "ready" ? todayISO() : t.completedAt } : t
    ),
    rooms: st.rooms.map((r) => {
      if (r.number !== roomNum || r.status === "occupied") return r;
      if (status === "ready") return { ...r, status: "available", lastCleanedAt: todayISO() };
      if (status === "inspection_pending") return { ...r, status: "inspection_pending" };
      if (status === "in_progress" || status === "assigned") return { ...r, status: "cleaning" };
      return r;
    }),
  }));
}

/* ---------- Maintenance Management Actions ---------- */

export function addMaintenanceRequest(req) {
  const newReq = {
    id: `MNT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    roomNumber: req.roomNumber,
    issueTitle: req.issueTitle,
    description: req.description || "",
    priority: req.priority || "Medium",
    status: req.assignedTo ? "assigned" : "reported",
    assignedTo: req.assignedTo || "Unassigned",
    cost: Number(req.cost || 0),
    reportedBy: req.reportedBy || "Staff",
    outOfService: req.outOfService !== undefined ? Boolean(req.outOfService) : true,
    remarks: "",
    createdAt: todayISO(),
  };

  setState((st) => ({
    ...st,
    maintenanceRequests: [newReq, ...(st.maintenanceRequests || [])],
    rooms: st.rooms.map((r) =>
      r.number === req.roomNumber && newReq.outOfService
        ? { ...r, status: "maintenance", notes: `MAINTENANCE: ${req.issueTitle}` }
        : r
    ),
  }));
  return newReq;
}

export function updateMaintenanceStatus(id, status, details = {}) {
  const s = getState();
  const ticket = s.maintenanceRequests?.find((m) => m.id === id);
  if (!ticket) return;

  const roomNum = ticket.roomNumber;
  const isResolved = status === "verified" || status === "closed";

  setState((st) => ({
    ...st,
    maintenanceRequests: st.maintenanceRequests.map((m) =>
      m.id === id
        ? { ...m, status, ...details, outOfService: isResolved ? false : m.outOfService, resolvedAt: isResolved ? todayISO() : m.resolvedAt }
        : m
    ),
    rooms: st.rooms.map((r) =>
      r.number === roomNum && isResolved && r.status === "maintenance"
        ? { ...r, status: "available", notes: "" }
        : r
    ),
  }));
}

/* ---------- Hotel Services & Folio Charges Actions ---------- */

export function addHotelService(service) {
  const newService = {
    id: `SRV-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    name: service.name,
    department: service.department || "Front Desk",
    price: Number(service.price),
    taxRate: Number(service.taxRate || 0.18),
    timings: service.timings || "24 Hours",
    description: service.description || "",
    isActive: true,
  };

  setState((st) => ({
    ...st,
    hotelServices: [...(st.hotelServices || []), newService],
  }));
  return newService;
}

export function postGuestFolioCharge(arg1, arg2) {
  const charge = typeof arg1 === "string" ? { ...arg2, bookingId: arg1 } : arg1;
  const s = getState();
  const b = s.bookings.find((item) => item.id === charge.bookingId);
  if (!b) return;

  const qty = Number(charge.quantity || 1);
  const price = Number(charge.amount || charge.unitPrice || 0);
  const tax = Number((price * 0.05).toFixed(2));
  const total = charge.amount ? Number(charge.amount) : price * qty + tax;

  const newCharge = {
    id: `CHG-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    bookingId: charge.bookingId,
    serviceId: charge.serviceId || null,
    category: charge.category || "Service",
    description: charge.description || charge.serviceName || "Guest Service Charge",
    serviceName: charge.serviceName || charge.description || "Guest Service",
    quantity: qty,
    unitPrice: price,
    taxAmount: tax,
    totalAmount: total,
    amount: total,
    notes: charge.notes || "",
    createdBy: s.session?.name || "Staff",
    createdAt: todayISO(),
  };

  const newTxn = {
    id: `TXN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    bookingId: charge.bookingId,
    guestName: b.guestName,
    type: "Service Charge",
    method: "Folio Balance",
    amount: total,
    referenceNo: newCharge.id,
    description: `${newCharge.serviceName} billed to Room ${b.roomNumber || b.id}`,
    createdBy: s.session?.name || "Staff",
    createdAt: todayISO(),
  };

  updateBooking(charge.bookingId, {
    total: b.total + total,
    payment: b.amountPaid >= b.total + total ? "Paid" : "Partial",
  });

  setState((st) => ({
    ...st,
    guestCharges: [newCharge, ...(st.guestCharges || [])],
    financialTransactions: [newTxn, ...(st.financialTransactions || [])],
  }));
}

export const addGuestCharge = postGuestFolioCharge;

/* ---------- Financial Ledger & Offers Actions ---------- */

export function recordFinancialTransaction(txn) {
  const s = getState();
  const newTxn = {
    id: `TXN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    bookingId: txn.bookingId || null,
    type: txn.type || "payment",
    paymentMethod: txn.paymentMethod || "cash",
    amount: Number(txn.amount),
    referenceNo: txn.referenceNo || `MAN-${Date.now().toString().slice(-6)}`,
    description: txn.description || "Manual ledger entry",
    createdBy: s.session?.name || "Staff",
    createdAt: todayISO(),
  };

  setState((st) => ({
    ...st,
    financialTransactions: [newTxn, ...(st.financialTransactions || [])],
  }));
  return newTxn;
}

export function addOffer(offer) {
  const newOffer = {
    id: `OFFER-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    code: offer.code.trim().toUpperCase(),
    title: offer.title.trim(),
    discountType: offer.discountType || "percentage",
    discountValue: Number(offer.discountValue),
    minBookingValue: Number(offer.minBookingValue || 0),
    validFrom: offer.validFrom || "2026-01-01",
    validTo: offer.validTo || "2026-12-31",
    usageLimit: Number(offer.usageLimit || 100),
    usedCount: 0,
    applicableCategories: offer.applicableCategories || [
      "ac-family-double",
      "ac-family-triple",
      "ac-premium-round",
      "non-ac-double",
    ],
    isActive: true,
  };

  setState((st) => ({
    ...st,
    offers: [...(st.offers || []), newOffer],
  }));
  return newOffer;
}

export function toggleOffer(id) {
  setState((st) => ({
    ...st,
    offers: (st.offers || []).map((o) => (o.id === id ? { ...o, isActive: !o.isActive } : o)),
  }));
}

/* ---------- Guest CRM Actions ---------- */

export function addGuestCRM(guest) {
  const newGuest = {
    id: `GST-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    name: guest.name.trim(),
    email: guest.email.trim().toLowerCase(),
    phone: guest.phone.trim(),
    city: guest.city || "Bareilly",
    address: guest.address || "",
    idType: guest.idType || "Aadhaar Card",
    idNumber: guest.idNumber || "",
    vip: Boolean(guest.vip),
    preferences: guest.preferences || "",
    notes: guest.notes || "",
    complaints: "",
    totalSpent: 0,
    totalStays: 0,
    createdAt: todayISO(),
  };

  setState((st) => ({
    ...st,
    guests: [newGuest, ...(st.guests || [])],
  }));
  return newGuest;
}

export function updateGuestCRM(id, patch) {
  setState((st) => ({
    ...st,
    guests: (st.guests || []).map((g) => (g.id === id ? { ...g, ...patch } : g)),
  }));
}

export function toggleVipGuest(id) {
  setState((st) => ({
    ...st,
    guests: (st.guests || []).map((g) => (g.id === id ? { ...g, vip: !g.vip } : g)),
  }));
}

/* ---------- Audit Logs & Notifications Actions ---------- */

export function addAuditLog(entry) {
  const s = getState();
  const logItem = {
    id: Date.now(),
    userEmail: s.session?.email || "admin@merihotel.demo",
    userName: s.session?.name || "Staff",
    action: entry.action,
    module: entry.module,
    recordId: entry.recordId || "",
    details: entry.details,
    createdAt: todayISO(),
  };

  setState((st) => ({
    ...st,
    auditLogs: [logItem, ...(st.auditLogs || [])].slice(0, 50),
  }));
}

export function markNotificationRead(id) {
  setState((st) => ({
    ...st,
    notifications: (st.notifications || []).map((n) => (n.id === id ? { ...n, isRead: true } : n)),
  }));
}

export function updateCategoryPrice(id, price) {
  setState((st) => ({
    ...st,
    categories: st.categories.map((c) => (c.id === id ? { ...c, price: Number(price) } : c)),
  }));
  addAuditLog({
    action: "UPDATE_TARIFF",
    module: "Tariffs",
    recordId: id,
    details: `Tariff updated for category ${id} to ₹${price}.`,
  });
}

export function updateCategory(id, patch) {
  setState((st) => ({
    ...st,
    categories: st.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  }));
  addAuditLog({
    action: "UPDATE_CATEGORY",
    module: "Tariffs",
    recordId: id,
    details: `Category ${id} details and specifications updated.`,
  });
  return { success: true };
}

export function addCategoryAmenity(categoryId, amenity) {
  const amClean = (amenity || "").trim();
  if (!amClean) return;
  setState((st) => ({
    ...st,
    categories: st.categories.map((c) => {
      if (c.id === categoryId && !c.amenities.includes(amClean)) {
        return { ...c, amenities: [...c.amenities, amClean] };
      }
      return c;
    }),
    availableAmenities: st.availableAmenities?.includes(amClean)
      ? st.availableAmenities
      : [...(st.availableAmenities || []), amClean],
  }));
  addAuditLog({
    action: "ADD_CATEGORY_AMENITY",
    module: "Tariffs",
    recordId: categoryId,
    details: `Added amenity "${amClean}" to category ${categoryId}.`,
  });
}

export function removeCategoryAmenity(categoryId, amenity) {
  setState((st) => ({
    ...st,
    categories: st.categories.map((c) => {
      if (c.id === categoryId) {
        return { ...c, amenities: c.amenities.filter((a) => a !== amenity) };
      }
      return c;
    }),
  }));
  addAuditLog({
    action: "REMOVE_CATEGORY_AMENITY",
    module: "Tariffs",
    recordId: categoryId,
    details: `Removed amenity "${amenity}" from category ${categoryId}.`,
  });
}

export function addHotelFacility(facility) {
  const facClean = (facility || "").trim();
  if (!facClean) return;
  setState((st) => ({
    ...st,
    facilities: (st.facilities || []).includes(facClean)
      ? st.facilities
      : [...(st.facilities || []), facClean],
  }));
  addAuditLog({
    action: "ADD_FACILITY",
    module: "Settings",
    recordId: facClean,
    details: `Added hotel facility: "${facClean}".`,
  });
}

export function removeHotelFacility(facility) {
  setState((st) => ({
    ...st,
    facilities: (st.facilities || []).filter((f) => f !== facility),
  }));
  addAuditLog({
    action: "REMOVE_FACILITY",
    module: "Settings",
    recordId: facility,
    details: `Removed hotel facility: "${facility}".`,
  });
}

export function addHotelAmenity(amenity) {
  const amClean = (amenity || "").trim();
  if (!amClean) return;
  setState((st) => ({
    ...st,
    availableAmenities: (st.availableAmenities || []).includes(amClean)
      ? st.availableAmenities
      : [...(st.availableAmenities || []), amClean],
  }));
  addAuditLog({
    action: "ADD_AMENITY_CATALOG",
    module: "Settings",
    recordId: amClean,
    details: `Added "${amClean}" to hotel amenities catalog.`,
  });
}

export function removeHotelAmenity(amenity) {
  setState((st) => ({
    ...st,
    availableAmenities: (st.availableAmenities || []).filter((a) => a !== amenity),
  }));
}

export function addStaff(user) {
  const s = getState();
  const normalizedEmail = user.email.trim().toLowerCase();
  if (s.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return "A user with this email/ID already exists.";
  }
  const newStaff = {
    ...user,
    email: normalizedEmail,
    password: (user.password || "staff123").trim(),
    role: user.role || "reception",
    name: user.name.trim(),
    phone: user.phone ? user.phone.trim() : "",
    city: user.city ? user.city.trim() : "Bareilly",
    createdAt: todayISO(),
  };
  setState((st) => ({
    ...st,
    users: [...st.users, newStaff],
  }));
  return newStaff;
}

export function updateStaff(email, patch) {
  const normalized = email.trim().toLowerCase();
  const isMasterAdmin = normalized === "admin@merihotel.demo";

  setState((st) => ({
    ...st,
    users: st.users.map((u) => {
      if (u.email.toLowerCase() === normalized) {
        // Master admin role cannot be altered
        const role = isMasterAdmin ? "admin" : (patch.role ?? u.role);
        return { ...u, ...patch, role };
      }
      return u;
    }),
    session:
      st.session && st.session.email.toLowerCase() === normalized && patch.name
        ? { ...st.session, name: patch.name }
        : st.session,
  }));
}

export function deleteStaff(email) {
  const normalized = email.trim().toLowerCase();
  if (normalized === "admin@merihotel.demo") {
    return "The primary administrator account cannot be deleted.";
  }
  const s = getState();
  const remainingAdmins = s.users.filter((u) => u.role === "admin" && u.email.toLowerCase() !== normalized);
  const targetUser = s.users.find((u) => u.email.toLowerCase() === normalized);
  if (targetUser?.role === "admin" && remainingAdmins.length === 0) {
    return "Cannot delete the only remaining administrator account.";
  }

  setState((st) => ({
    ...st,
    users: st.users.filter((u) => u.email.toLowerCase() !== normalized),
  }));
  return true;
}

export function updateSettings(patch) {
  setState((st) => ({ ...st, settings: { ...st.settings, ...patch } }));
}

export function resetDemoData() {
  setState(() => createSeedState());
}

/* ---------- Auth ---------- */

export function login(email, password, role) {
  const normalized = email.trim().toLowerCase();
  const u = getState().users.find((x) => x.email.toLowerCase() === normalized);
  if (!u || u.password !== password) return "Email or password is incorrect.";

  if (role && u.role !== role) {
    if (role === "admin") return "This account does not have Administrator privileges.";
    if (role === "reception") return "This account is not a Front Desk Reception account.";
    return "This is an internal staff account. Please sign in via the Reception or Admin tab.";
  }

  const session = { email: u.email, name: u.name, role: u.role };
  setState((st) => ({ ...st, session }));
  return session;
}

export function register(input) {
  const s = getState();
  const normalized = input.email.trim().toLowerCase();

  if (normalized === "admin@merihotel.demo") {
    return "The Administrator account is permanent and cannot be re-registered.";
  }

  if (s.users.some((u) => u.email.toLowerCase() === normalized)) {
    return "An account with this email already exists. Please sign in.";
  }

  // All public registrations strictly receive the "guest" role
  const user = {
    ...input,
    email: normalized,
    role: "guest",
    createdAt: todayISO(),
  };
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
