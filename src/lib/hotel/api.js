// Hotel Meri & Residency — Enterprise API Client Bridge
const API_BASE = "http://localhost:5000/api";

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP error ${res.status}`);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export const api = {
  // Health
  checkHealth: () => request("/health"),

  // Auth & Staff
  login: (email, password, role) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password, role }) }),
  register: (user) => request("/auth/register", { method: "POST", body: JSON.stringify(user) }),
  getStaff: () => request("/auth/staff"),
  addStaff: (user) => request("/auth/staff", { method: "POST", body: JSON.stringify(user) }),
  updateStaff: (email, patch) => request(`/auth/staff/${email}`, { method: "PUT", body: JSON.stringify(patch) }),
  deleteStaff: (email) => request(`/auth/staff/${email}`, { method: "DELETE" }),

  // Bookings
  getBookings: (params = "") => request(`/bookings${params ? `?${params}` : ""}`),
  getBookingById: (id) => request(`/bookings/${id}`),
  createBooking: (booking) => request("/bookings", { method: "POST", body: JSON.stringify(booking) }),
  updateBooking: (id, patch) => request(`/bookings/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  checkIn: (id, payload) => request(`/bookings/${id}/check-in`, { method: "POST", body: JSON.stringify(payload) }),
  checkOut: (id, payload) => request(`/bookings/${id}/check-out`, { method: "POST", body: JSON.stringify(payload) }),
  modifyDates: (id, payload) => request(`/bookings/${id}/modify-dates`, { method: "POST", body: JSON.stringify(payload) }),
  markNoShow: (id, payload) => request(`/bookings/${id}/no-show`, { method: "POST", body: JSON.stringify(payload) }),
  recordPayment: (id, payload) => request(`/bookings/${id}/payment`, { method: "POST", body: JSON.stringify(payload) }),

  // Rooms
  getRooms: (params = "") => request(`/rooms${params ? `?${params}` : ""}`),
  addRoom: (room) => request("/rooms", { method: "POST", body: JSON.stringify(room) }),
  updateRoom: (number, patch) => request(`/rooms/${number}`, { method: "PUT", body: JSON.stringify(patch) }),
  deleteRoom: (number) => request(`/rooms/${number}`, { method: "DELETE" }),
  togglePublishRoom: (number, isPublished) =>
    request(`/rooms/${number}/publish`, { method: "POST", body: JSON.stringify({ isPublished }) }),
  updateRoomStatus: (number, status, notes, performedBy) =>
    request(`/rooms/${number}/status`, { method: "PUT", body: JSON.stringify({ status, notes, performedBy }) }),
  toggleBlockRoom: (number, blocked, reason, performedBy) =>
    request(`/rooms/${number}/toggle-block`, { method: "POST", body: JSON.stringify({ blocked, reason, performedBy }) }),

  // Categories & Tariffs
  getCategories: () => request("/categories"),
  updateCategory: (id, patch) => request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  updateCategoryTariff: (id, patch) => request(`/categories/${id}/tariff`, { method: "PUT", body: JSON.stringify(patch) }),

  // Guests CRM
  getGuests: (params = "") => request(`/guests${params ? `?${params}` : ""}`),
  getGuestById: (id) => request(`/guests/${id}`),
  addGuest: (guest) => request("/guests", { method: "POST", body: JSON.stringify(guest) }),
  updateGuest: (id, patch) => request(`/guests/${id}`, { method: "PUT", body: JSON.stringify(patch) }),

  // Housekeeping
  getHousekeeping: (params = "") => request(`/housekeeping${params ? `?${params}` : ""}`),
  createHousekeepingTask: (task) => request("/housekeeping", { method: "POST", body: JSON.stringify(task) }),
  updateHousekeepingStatus: (id, payload) => request(`/housekeeping/${id}/status`, { method: "PUT", body: JSON.stringify(payload) }),

  // Maintenance
  getMaintenance: (params = "") => request(`/maintenance${params ? `?${params}` : ""}`),
  createMaintenance: (payload) => request("/maintenance", { method: "POST", body: JSON.stringify(payload) }),
  updateMaintenanceStatus: (id, payload) => request(`/maintenance/${id}/status`, { method: "PUT", body: JSON.stringify(payload) }),

  // Hotel Services
  getServices: (params = "") => request(`/services${params ? `?${params}` : ""}`),
  addService: (service) => request("/services", { method: "POST", body: JSON.stringify(service) }),
  postGuestCharge: (payload) => request("/services/charge", { method: "POST", body: JSON.stringify(payload) }),

  // Financial Ledger
  getLedger: (params = "") => request(`/ledger${params ? `?${params}` : ""}`),
  recordTransaction: (txn) => request("/ledger", { method: "POST", body: JSON.stringify(txn) }),

  // Offers & Promo Codes
  getOffers: (params = "") => request(`/offers${params ? `?${params}` : ""}`),
  validatePromoCode: (payload) => request("/offers/validate", { method: "POST", body: JSON.stringify(payload) }),
  createOffer: (offer) => request("/offers", { method: "POST", body: JSON.stringify(offer) }),

  // Analytics & Reports
  getDashboardAnalytics: () => request("/reports/dashboard"),

  // Audit Logs & Notifications
  getAuditLogs: (params = "") => request(`/logs/audit${params ? `?${params}` : ""}`),
  getNotifications: () => request("/logs/notifications"),
  markNotificationRead: (id) => request(`/logs/notifications/${id}/read`, { method: "PUT" }),

  // Settings
  getSettings: () => request("/settings"),
  updateSettings: (settings) => request("/settings", { method: "PUT", body: JSON.stringify(settings) }),
};
