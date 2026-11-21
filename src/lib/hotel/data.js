import { IMG } from "./images.js";
import { addDays, toISODate, todayISO } from "./pricing.js";

export const CATEGORIES = [
  {
    id: "deluxe",
    name: "Deluxe Room",
    tagline: "Quiet comfort, beautifully appointed",
    description:
      "A calm retreat with a plush king bed, velvet headboard and soft city light — ideal for couples and solo travellers.",
    price: 3499,
    maxGuests: 2,
    bed: "1 King Bed",
    size: "28 m²",
    image: IMG.deluxe,
    amenities: ["Free Wi‑Fi", "Air conditioning", "Smart TV", "Tea & coffee", "Rain shower"],
  },
  {
    id: "premium",
    name: "Premium Room",
    tagline: "Twin queens with a skyline view",
    description:
      "Generous twin queen beds, a reading corner and sweeping views — space to unwind for friends or small families.",
    price: 4999,
    maxGuests: 3,
    bed: "2 Queen Beds",
    size: "34 m²",
    image: IMG.premium,
    amenities: ["Free Wi‑Fi", "City view", "Mini bar", "Smart TV", "Breakfast included"],
  },
  {
    id: "executive",
    name: "Executive Room",
    tagline: "Built for the business traveller",
    description:
      "A refined king room with a full work desk, ergonomic chair and evening turndown — productivity meets indulgence.",
    price: 6499,
    maxGuests: 2,
    bed: "1 King Bed",
    size: "38 m²",
    image: IMG.executive,
    amenities: [
      "High‑speed Wi‑Fi",
      "Work desk",
      "Lounge access",
      "Espresso machine",
      "Breakfast included",
    ],
  },
  {
    id: "family",
    name: "Family Room",
    tagline: "Room for everyone to settle in",
    description:
      "A king bed plus two singles and a lounge area, so the whole family can stay together in comfort.",
    price: 7999,
    maxGuests: 5,
    bed: "1 King + 2 Single",
    size: "52 m²",
    image: IMG.family,
    amenities: ["Free Wi‑Fi", "Sofa lounge", "Kids amenities", "Mini fridge", "Breakfast for 4"],
  },
  {
    id: "suite",
    name: "Luxury Suite",
    tagline: "Our most royal address",
    description:
      "A separate living salon, marble bath with soaking tub and dedicated butler service — the full Meri experience.",
    price: 11999,
    maxGuests: 3,
    bed: "1 Super King Bed",
    size: "78 m²",
    image: IMG.suite,
    amenities: ["Butler service", "Living room", "Soaking tub", "Airport transfer", "All meals"],
  },
];

export const categoryById = (id, list = CATEGORIES) =>
  list.find((c) => c.id === id) ?? list[0];

export function makeRooms() {
  const plan = [
    ["deluxe", 1, 8],
    ["premium", 2, 6],
    ["executive", 3, 4],
    ["family", 3, 4],
    ["suite", 4, 2],
  ];
  const rooms = [];
  const floorCount = {};
  for (const [cat, floor, n] of plan) {
    for (let i = 0; i < n; i++) {
      floorCount[floor] = (floorCount[floor] ?? 0) + 1;
      rooms.push({
        number: `${floor}${String(floorCount[floor]).padStart(2, "0")}`,
        categoryId: cat,
        floor,
        status: "available",
      });
    }
  }
  if (rooms[3]) rooms[3].status = "cleaning";
  if (rooms[12]) rooms[12].status = "maintenance";
  return rooms;
}

export const DEMO_GUEST = {
  email: "guest@merihotel.demo",
  password: "guest123",
  name: "Aarav Sharma",
  phone: "+91 98765 43210",
};

export const DEMO_RECEPTION = {
  email: "reception@merihotel.demo",
  password: "admin123",
  name: "Front Desk Staff",
  phone: "+91 90000 00000",
};

export const DEFAULT_SETTINGS = {
  hotelName: "Hotel Meri & Residency",
  address: "Near Railway Station, Civil Lines, Bareilly, Uttar Pradesh 243001",
  phone: "+91 94122 56789",
  email: "reservations@hotelmeri.com",
  whatsapp: "+91 94122 56789",
  checkInTime: "14:00",
  checkOutTime: "11:00",
  taxRate: 0.12,
};

export function createSeedState() {
  const today = todayISO();
  const rooms = makeRooms();

  const bookings = [
    {
      id: "HMR-DEMO01",
      guestName: "Aarav Sharma",
      email: "guest@merihotel.demo",
      phone: "+91 98765 43210",
      categoryId: "deluxe",
      roomNumber: "101",
      checkIn: today,
      checkOut: addDays(today, 2),
      guests: 2,
      rooms: 1,
      status: "Checked-In",
      payment: "Paid",
      amountPaid: 7838,
      total: 7838,
      source: "Website",
      createdAt: today,
      requests: "Quiet room away from elevator",
    },
    {
      id: "HMR-DEMO02",
      guestName: "Priya Nair",
      email: "priya.nair@example.com",
      phone: "+91 98765 11111",
      categoryId: "premium",
      roomNumber: "201",
      checkIn: today,
      checkOut: addDays(today, 3),
      guests: 2,
      rooms: 1,
      status: "Checked-In",
      payment: "Partial",
      amountPaid: 5000,
      total: 16797,
      source: "Website",
      createdAt: today,
    },
    {
      id: "HMR-DEMO03",
      guestName: "Rohan Mehta",
      email: "rohan.mehta@example.com",
      phone: "+91 98765 22222",
      categoryId: "suite",
      roomNumber: "401",
      checkIn: addDays(today, 1),
      checkOut: addDays(today, 4),
      guests: 3,
      rooms: 1,
      status: "Confirmed",
      payment: "Paid",
      amountPaid: 40317,
      total: 40317,
      source: "Website",
      createdAt: today,
    },
    {
      id: "HMR-DEMO04",
      guestName: "Vikram Singh",
      email: "vikram.singh@example.com",
      phone: "+91 98765 33333",
      categoryId: "executive",
      roomNumber: "301",
      checkIn: addDays(today, -3),
      checkOut: addDays(today, -1),
      guests: 1,
      rooms: 1,
      status: "Checked-Out",
      payment: "Paid",
      amountPaid: 14558,
      total: 14558,
      source: "Walk-in",
      createdAt: addDays(today, -4),
    },
  ];

  const users = [
    { ...DEMO_GUEST, role: "guest", city: "Mumbai" },
    { ...DEMO_RECEPTION, role: "reception", city: "Bareilly" },
  ];

  return {
    version: 1,
    categories: CATEGORIES,
    rooms,
    bookings,
    users,
    session: null,
    messages: [],
    settings: DEFAULT_SETTINGS,
  };
}
