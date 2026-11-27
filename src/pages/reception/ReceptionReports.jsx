import React, { useState } from "react";
import {
  CalendarRange,
  Printer,
  Download,
  FileText,
  Users,
  LogIn,
  LogOut,
  BedDouble,
  IndianRupee,
  AlertCircle,
  XCircle,
  UserX,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { FilterChips, Panel, StatCard } from "@/components/dashboard/ui.jsx";
import { StatusBadge, PaymentBadge } from "@/components/site/StatusBadge.jsx";
import { addDays, formatDate, formatINR, todayISO } from "@/lib/hotel/pricing.js";
import { getCategory, occupiedRoomNumbers, useHotelState } from "@/lib/hotel/store.jsx";

const REPORT_TYPES = [
  { id: "arrivals", label: "Daily Arrivals", icon: LogIn },
  { id: "departures", label: "Daily Departures", icon: LogOut },
  { id: "inhouse", label: "In-House Guests", icon: Users },
  { id: "payments", label: "Front Desk Collections", icon: IndianRupee },
  { id: "outstanding", label: "Outstanding Balances", icon: AlertCircle },
  { id: "occupancy", label: "Room Status & Turnover", icon: BedDouble },
  { id: "noshow_cancel", label: "No-Shows & Cancellations", icon: UserX },
];

export default function ReceptionReports() {
  const state = useHotelState();
  const today = todayISO();
  const [selectedReport, setSelectedReport] = useState("arrivals");
  const [dateRange, setDateRange] = useState("today"); // 'today' | 'tomorrow' | '7days' | 'month' | 'all'
  const [categoryFilter, setCategoryFilter] = useState("all");

  const occ = occupiedRoomNumbers(state);

  // Date boundaries
  let startDate = today;
  let endDate = today;

  if (dateRange === "tomorrow") {
    startDate = addDays(today, 1);
    endDate = addDays(today, 1);
  } else if (dateRange === "7days") {
    startDate = addDays(today, -7);
    endDate = today;
  } else if (dateRange === "month") {
    startDate = `${today.slice(0, 7)}-01`;
    endDate = today;
  } else if (dateRange === "all") {
    startDate = "2026-01-01";
    endDate = "2026-12-31";
  }

  // Generate Report Data based on selectedReport
  let reportTitle = "";
  let reportRows = [];
  let reportColumns = [];
  let kpis = [];

  if (selectedReport === "arrivals") {
    reportTitle = "Front Desk Daily Arrivals Report";
    reportColumns = ["Booking ID", "Guest Name", "Phone", "Category", "Room", "Check-In", "Guests", "Payment", "Total"];
    reportRows = state.bookings
      .filter((b) => (b.status === "Confirmed" || b.status === "Pending" || b.status === "Checked-In"))
      .filter((b) => b.checkIn >= startDate && b.checkIn <= endDate)
      .filter((b) => categoryFilter === "all" || b.categoryId === categoryFilter)
      .map((b) => ({
        id: b.id,
        col1: b.id,
        col2: b.guestName,
        col3: b.phone,
        col4: getCategory(state, b.categoryId)?.name,
        col5: b.roomNumber ? `Room ${b.roomNumber}` : "Unassigned",
        col6: formatDate(b.checkIn),
        col7: `${b.guests} Guests`,
        col8: b.payment,
        col9: formatINR(b.total),
      }));

    kpis = [
      { label: "Total Arrivals", value: reportRows.length, tone: "gold" },
      { label: "Checked-In Already", value: state.bookings.filter((b) => b.checkIn === today && b.status === "Checked-In").length, tone: "emerald" },
      { label: "Pending Check-In", value: reportRows.filter((r) => r.col8 !== "Paid").length, tone: "default" },
    ];
  } else if (selectedReport === "departures") {
    reportTitle = "Front Desk Daily Departures Report";
    reportColumns = ["Booking ID", "Room", "Guest Name", "Check-Out", "Folio Total", "Paid", "Balance Due", "Status"];
    reportRows = state.bookings
      .filter((b) => b.checkOut >= startDate && b.checkOut <= endDate)
      .filter((b) => categoryFilter === "all" || b.categoryId === categoryFilter)
      .map((b) => {
        const bal = Math.max(0, (b.total || 0) - (b.amountPaid || 0));
        return {
          id: b.id,
          col1: b.id,
          col2: b.roomNumber ? `Room ${b.roomNumber}` : "—",
          col3: b.guestName,
          col4: formatDate(b.checkOut),
          col5: formatINR(b.total),
          col6: formatINR(b.amountPaid),
          col7: bal > 0 ? formatINR(bal) : "Settled (₹0)",
          col8: b.status,
        };
      });

    kpis = [
      { label: "Scheduled Departures", value: reportRows.length, tone: "default" },
      { label: "Checked-Out Today", value: state.bookings.filter((b) => b.checkOut === today && b.status === "Checked-Out").length, tone: "emerald" },
      { label: "Pending Departures", value: reportRows.filter((r) => r.col8 === "Checked-In").length, tone: "gold" },
    ];
  } else if (selectedReport === "inhouse") {
    reportTitle = "In-House Guests Roster Report";
    reportColumns = ["Room #", "Guest Name", "Phone", "Category", "Arrival Date", "Departure Date", "Folio Total", "Balance Due"];
    reportRows = state.bookings
      .filter((b) => b.status === "Checked-In")
      .filter((b) => categoryFilter === "all" || b.categoryId === categoryFilter)
      .map((b) => {
        const bal = Math.max(0, b.total - b.amountPaid);
        return {
          id: b.id,
          col1: `Room ${b.roomNumber || "—"}`,
          col2: b.guestName,
          col3: b.phone,
          col4: getCategory(state, b.categoryId)?.name,
          col5: formatDate(b.checkIn),
          col6: formatDate(b.checkOut),
          col7: formatINR(b.total),
          col8: bal > 0 ? formatINR(bal) : "Settled",
        };
      });

    kpis = [
      { label: "Currently In-House", value: reportRows.length, tone: "emerald" },
      { label: "Total Occupants", value: state.bookings.filter((b) => b.status === "Checked-In").reduce((s, b) => s + b.guests, 0), tone: "gold" },
      { label: "Occupancy Rate", value: `${Math.round((reportRows.length / (state.rooms.length || 1)) * 100)}%`, tone: "default" },
    ];
  } else if (selectedReport === "payments") {
    reportTitle = "Front Desk Collections & Payment Records Report";
    reportColumns = ["Txn ID", "Booking ID", "Guest / Description", "Method", "Amount (₹)", "Date", "Received By"];
    reportRows = (state.financialTransactions || [])
      .filter((t) => t.createdAt >= startDate && t.createdAt <= endDate)
      .map((t) => ({
        id: t.id,
        col1: t.id,
        col2: t.bookingId || "—",
        col3: t.description || "Folio Settlement",
        col4: (t.paymentMethod || "CASH").toUpperCase(),
        col5: formatINR(t.amount),
        col6: formatDate(t.createdAt || today),
        col7: t.createdBy || "Front Desk",
      }));

    const totalAmt = (state.financialTransactions || [])
      .filter((t) => t.createdAt >= startDate && t.createdAt <= endDate)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    kpis = [
      { label: "Transactions Recorded", value: reportRows.length, tone: "default" },
      { label: "Total Amount Collected", value: formatINR(totalAmt), tone: "emerald" },
    ];
  } else if (selectedReport === "outstanding") {
    reportTitle = "Unsettled Folio & Outstanding Balances Report";
    reportColumns = ["Booking ID", "Guest Name", "Phone", "Room", "Stay Dates", "Folio Total", "Paid", "Balance Due"];
    reportRows = state.bookings
      .filter((b) => b.status !== "Cancelled" && (b.total - b.amountPaid) > 0)
      .filter((b) => categoryFilter === "all" || b.categoryId === categoryFilter)
      .map((b) => {
        const bal = Math.max(0, b.total - b.amountPaid);
        return {
          id: b.id,
          col1: b.id,
          col2: b.guestName,
          col3: b.phone,
          col4: b.roomNumber ? `Room ${b.roomNumber}` : "Unassigned",
          col5: `${formatDate(b.checkIn)} → ${formatDate(b.checkOut)}`,
          col6: formatINR(b.total),
          col7: formatINR(b.amountPaid),
          col8: formatINR(bal),
        };
      });

    const totalDue = reportRows.reduce((sum, r) => {
      const b = state.bookings.find((x) => x.id === r.id);
      return sum + Math.max(0, (b?.total || 0) - (b?.amountPaid || 0));
    }, 0);

    kpis = [
      { label: "Unsettled Bookings", value: reportRows.length, tone: "default" },
      { label: "Total Outstanding Amount", value: formatINR(totalDue), tone: "gold" },
    ];
  } else if (selectedReport === "occupancy") {
    reportTitle = "Room Status & Housekeeping Inventory Report";
    reportColumns = ["Room #", "Category", "Floor", "Bed Configuration", "Current Status", "Housekeeping", "Occupant"];
    reportRows = state.rooms.map((r) => {
      const isOcc = occ.has(r.number);
      const b = state.bookings.find((x) => x.status === "Checked-In" && x.roomNumber === r.number);
      return {
        id: r.number,
        col1: `Room ${r.number}`,
        col2: getCategory(state, r.categoryId)?.name,
        col3: `Floor ${r.floor}`,
        col4: r.bedType || "1 King Bed",
        col5: isOcc ? "Occupied" : r.status,
        col6: r.status === "cleaning" ? "Cleaning Underway" : r.status === "dirty" ? "Dirty / Vacated" : "Clean & Ready",
        col7: b ? `${b.guestName} (#${b.id})` : "—",
      };
    });

    kpis = [
      { label: "Total Rooms", value: state.rooms.length, tone: "default" },
      { label: "Occupied Rooms", value: occ.size, tone: "gold" },
      { label: "Available Rooms", value: state.rooms.filter((r) => r.status === "available" && !occ.has(r.number)).length, tone: "emerald" },
      { label: "Under Cleaning", value: state.rooms.filter((r) => r.status === "cleaning" || r.status === "dirty").length, tone: "default" },
    ];
  } else if (selectedReport === "noshow_cancel") {
    reportTitle = "No-Show & Cancelled Reservations Report";
    reportColumns = ["Booking ID", "Guest Name", "Phone", "Category", "Scheduled Check-In", "Status", "Folio Total", "Amount Refunded"];
    reportRows = state.bookings
      .filter((b) => b.status === "Cancelled" || b.status === "No-Show")
      .map((b) => ({
        id: b.id,
        col1: b.id,
        col2: b.guestName,
        col3: b.phone,
        col4: getCategory(state, b.categoryId)?.name,
        col5: formatDate(b.checkIn),
        col6: b.status,
        col7: formatINR(b.total),
        col8: b.payment === "Refunded" ? formatINR(b.amountPaid) : "₹0",
      }));

    kpis = [
      { label: "No-Show Bookings", value: reportRows.filter((r) => r.col6 === "No-Show").length, tone: "gold" },
      { label: "Cancelled Bookings", value: reportRows.filter((r) => r.col6 === "Cancelled").length, tone: "default" },
    ];
  }

  // Print Report Handler
  const handlePrintReport = () => {
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(`
      <html>
        <head>
          <title>${reportTitle} - Hotel Meri & Residency</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; color: #111; font-size: 11px; }
            .header { text-align: center; border-bottom: 2px solid #061830; padding-bottom: 12px; margin-bottom: 15px; }
            .hotel-name { font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #061830; }
            .report-title { font-size: 14px; font-weight: bold; margin: 10px 0 4px; text-transform: uppercase; color: #D4AF37; }
            .meta { font-size: 10px; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background-color: #FAF7F2; border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 10px; text-transform: uppercase; color: #061830; }
            td { border: 1px solid #ddd; padding: 6px; }
            .sign-box { margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; }
            .sign-line { border-top: 1px solid #444; width: 200px; text-align: center; padding-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hotel-name">${state.settings?.hotelName || "HOTEL MERI & RESIDENCY"}</div>
            <div class="meta">${state.settings?.address || "Civil Lines, Bareilly"} · Ph: ${state.settings?.phone || "+91 94122 56789"}</div>
            <div class="report-title">${reportTitle}</div>
            <div class="meta">Generated: ${new Date().toLocaleString("en-IN")} · Period: ${formatDate(startDate)} to ${formatDate(endDate)}</div>
          </div>
          <table>
            <thead>
              <tr>
                ${reportColumns.map((c) => `<th>${c}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${reportRows.map((r) => `
                <tr>
                  <td>${r.col1}</td>
                  <td>${r.col2}</td>
                  <td>${r.col3}</td>
                  <td>${r.col4}</td>
                  <td>${r.col5}</td>
                  <td>${r.col6}</td>
                  <td>${r.col7}</td>
                  ${r.col8 ? `<td>${r.col8}</td>` : ""}
                  ${r.col9 ? `<td>${r.col9}</td>` : ""}
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="sign-box">
            <div class="sign-line">Front Desk Receptionist</div>
            <div class="sign-line">Duty Manager / GM</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        reportColumns.join(","),
        ...reportRows.map((r) =>
          [
            `"${r.col1}"`,
            `"${r.col2}"`,
            `"${r.col3}"`,
            `"${r.col4}"`,
            `"${r.col5}"`,
            `"${r.col6}"`,
            `"${r.col7}"`,
            r.col8 ? `"${r.col8}"` : "",
            r.col9 ? `"${r.col9}"` : "",
          ].filter(Boolean).join(",")
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hotel_meri_${selectedReport}_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${reportRows.length} rows to CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Report Selector Pills */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gold/30 bg-white p-3.5 shadow-card">
        <span className="text-xs font-bold text-gold uppercase tracking-wider mr-1">
          Reports Catalog:
        </span>
        {REPORT_TYPES.map((rep) => {
          const Icon = rep.icon;
          const active = selectedReport === rep.id;
          return (
            <button
              key={rep.id}
              type="button"
              onClick={() => setSelectedReport(rep.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                active
                  ? "bg-gold-gradient text-gold-foreground font-bold shadow-sm"
                  : "border border-gold/30 bg-[#FAF7F2] text-[#061830] hover:bg-gold/15"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{rep.label}</span>
            </button>
          );
        })}
      </div>

      {/* Summary KPI Cards */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {kpis.map((kpi, idx) => (
            <StatCard
              key={idx}
              label={kpi.label}
              value={kpi.value}
              tone={kpi.tone || "gold"}
            />
          ))}
        </div>
      )}

      {/* Main Report Panel */}
      <Panel
        title={reportTitle}
        subtitle={`Period: ${formatDate(startDate)} → ${formatDate(endDate)} · ${reportRows.length} records found`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            {/* Date filter dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#64748b]">Period:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="rounded-lg border border-gold/30 bg-[#FAF7F2] px-2.5 py-1 text-xs text-[#061830] font-semibold"
              >
                <option value="today">Today ({formatDate(today)})</option>
                <option value="tomorrow">Tomorrow ({formatDate(addDays(today, 1))})</option>
                <option value="7days">Last 7 Days</option>
                <option value="month">Month-to-Date</option>
                <option value="all">All Dates</option>
              </select>
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#64748b]">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-gold/30 bg-[#FAF7F2] px-2.5 py-1 text-xs text-[#061830] font-semibold"
              >
                <option value="all">All Categories</option>
                {state.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handlePrintReport}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gold/40 bg-white px-3 py-1.5 text-xs font-semibold text-[#061830] hover:bg-gold/15 transition shadow-sm cursor-pointer"
            >
              <Printer className="size-3.5 text-gold" /> Print Report
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gold/40 bg-white px-3 py-1.5 text-xs font-semibold text-[#061830] hover:bg-gold/15 transition shadow-sm cursor-pointer"
            >
              <Download className="size-3.5 text-gold" /> Export CSV
            </button>
          </div>
        }
      >
        {reportRows.length === 0 ? (
          <p className="py-8 text-center text-xs text-[#64748b]">
            No records found for the selected report filters.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gold/20">
            <table className="w-full min-w-[850px] text-left text-xs bg-white">
              <thead className="border-b border-gold/20 bg-[#FAF7F2] text-[#061830] font-bold uppercase tracking-wider">
                <tr>
                  {reportColumns.map((col, idx) => (
                    <th key={idx} className="py-3 px-3">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10 text-[#061830]">
                {reportRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gold/5 transition">
                    <td className="py-2.5 px-3 font-semibold font-mono">{r.col1}</td>
                    <td className="py-2.5 px-3 font-bold">{r.col2}</td>
                    <td className="py-2.5 px-3 text-[#64748b]">{r.col3}</td>
                    <td className="py-2.5 px-3">{r.col4}</td>
                    <td className="py-2.5 px-3">{r.col5}</td>
                    <td className="py-2.5 px-3">{r.col6}</td>
                    <td className="py-2.5 px-3 font-semibold">{r.col7}</td>
                    {r.col8 && <td className="py-2.5 px-3 font-bold">{r.col8}</td>}
                    {r.col9 && <td className="py-2.5 px-3 font-bold text-navy-deep">{r.col9}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
