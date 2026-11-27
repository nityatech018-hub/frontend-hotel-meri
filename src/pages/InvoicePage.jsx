import React, { useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Printer, Phone, Mail, MapPin } from "lucide-react";
import { useHotelState, getCategory } from "@/lib/hotel/store.jsx";
import {
  calculateStayPricing,
  formatCurrencyINR,
  formatDateSlash,
  numberToWordsINR,
  nightsBetween,
} from "@/lib/hotel/pricing.js";

export default function InvoicePage() {
  const { bookingId } = useParams();
  const state = useHotelState();
  const printRef = useRef(null);

  // Find booking or use sample 109 fallback
  const booking = state.bookings.find((x) => x.id === bookingId) || {
    id: "109",
    invoiceNo: "109",
    guestName: "Pramod Kumar Sahu",
    phone: "8120713045",
    guestState: "23-Madhya Pradesh",
    categoryId: "ac-premium-round",
    roomNumber: "105",
    isAc: true,
    checkIn: "2026-11-17",
    checkInTime: "11:00Pm",
    checkOut: "2026-11-19",
    checkOutTime: "07:00AM",
    guests: 2,
    rooms: 1,
    paymentMethod: "Cash",
    tariffRate: 1500,
    amountPaid: 3150,
    total: 3150,
    createdAt: "2026-11-19T07:00:00.000Z",
    bookingDate: "2026-11-19",
  };

  const backLink =
    state.session?.role === "reception"
      ? "/reception/bookings"
      : state.session?.role === "admin"
      ? "/admin/checkout"
      : state.session
      ? "/account/bookings"
      : "/";

  const cat = getCategory(state, booking.categoryId) || {
    name: "AC Premium Room – Queen Round Bed",
    price: booking.tariffRate || 1500,
  };

  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const unitPrice = booking.tariffRate || cat.price || 1500;
  const pricing = calculateStayPricing({
    baseRate: unitPrice,
    nights,
    rooms: booking.rooms || 1,
    extraGuests: booking.extraGuests || 0,
    extraGuestPrice: state.settings?.extraGuestPrice ?? 300,
    gstRate: state.settings?.taxRate ?? 0.05,
    gstRule: state.settings?.gstRule || "above_1000",
  });
  const bookingCharges = (state.guestCharges || []).filter((c) => c.bookingId === booking.id);
  const extrasTotal = bookingCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const subtotal = pricing.roomBill + extrasTotal;
  const totalTax = pricing.gstAmount;
  const sgstTax = totalTax / 2;
  const cgstTax = totalTax / 2;
  const grandTotal = booking.total ? Math.max(booking.total, subtotal + totalTax) : subtotal + totalTax;
  const amountPaid = booking.amountPaid != null ? booking.amountPaid : grandTotal;
  const balance = Math.max(0, grandTotal - amountPaid);
  const paymentMode = booking.paymentMethod || booking.payment || "Cash";

  const isCancelled = booking.status === "Cancelled";
  const isFinalInvoice = booking.status === "Checked-Out";
  const isInterimFolio = booking.status === "Checked-In";
  const docTitle = isFinalInvoice
    ? "Tax Invoice"
    : isInterimFolio
    ? "Interim Folio"
    : "Proforma Receipt";
  const printButtonLabel = isFinalInvoice
    ? "Download / Print Tax Invoice"
    : isInterimFolio
    ? "Download / Print Interim Folio"
    : "Download / Print Proforma";

  // Date formatting helpers
  const invoiceDate = booking.bookingDate
    ? formatDateSlash(booking.bookingDate)
    : booking.createdAt
    ? formatDateSlash(booking.createdAt.substring(0, 10))
    : formatDateSlash(booking.checkOut || booking.checkIn);

  const checkInFormatted = `${formatDateSlash(booking.checkIn)}&${booking.checkInTime || "11:00Pm"}`;
  const checkOutFormatted = `${formatDateSlash(booking.checkOut)}&${booking.checkOutTime || "07:00AM"}`;

  const amountInWords = numberToWordsINR(grandTotal);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900/90 py-8 px-2 sm:px-4 print:bg-white print:p-0 print:min-h-0 text-slate-800">
      {/* Top Action Bar (Screen Only) */}
      <div className="mx-auto mb-6 flex max-w-[850px] items-center justify-between print:hidden">
        <Link
          to={backLink}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-slate-800/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-200 hover:bg-slate-700/80 transition shadow-sm"
        >
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-3">
          {!isCancelled && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-900/30 transition cursor-pointer"
            >
              <Printer className="size-4" /> {printButtonLabel}
            </button>
          )}
        </div>
      </div>

      {isCancelled ? (
        <div className="mx-auto max-w-[600px] rounded-2xl bg-white p-8 text-center shadow-2xl border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Booking Cancelled</h2>
          <p className="mt-2 text-sm text-slate-600">
            Reservation <strong>{booking.id}</strong> was cancelled. GST Tax Invoices are not issued for cancelled bookings.
          </p>
          <Link
            to={backLink}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#182230] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>
        </div>
      ) : (
      /* Main Invoice Sheet (A4 Proportion) */
      <div
        ref={printRef}
        className="mx-auto max-w-[850px] bg-white shadow-2xl overflow-hidden print:shadow-none print:max-w-none print:w-full print:m-0 border border-slate-200 print:border-none relative flex flex-col justify-between"
        style={{ minHeight: "1120px" }}
      >
        <div>
          {/* Header Top Red Banner */}
          <div className="relative bg-[#d32f2f] text-white pt-4 pb-4 px-6 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left Circle Logo Container */}
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-full bg-[#182230] p-1.5 flex items-center justify-center shrink-0 shadow-md">
                <img
                  src="/favicon.png"
                  alt="Hotel Meri"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>

              {/* Direct Phone & Email in header */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2 font-medium">
                  <Phone className="size-3.5 fill-white text-white" />
                  <span>{state.settings.phone || "9039408329"}</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Mail className="size-3.5 text-white" />
                  <span>{state.settings.email || "hotelmeri24@gmail.com"}</span>
                </div>
              </div>
            </div>

            {/* Address Block with MapPin */}
            <div className="flex items-start gap-2.5 text-xs text-right sm:max-w-xs ml-auto">
              <MapPin className="size-4 text-white shrink-0 mt-0.5" />
              <div className="leading-tight text-white font-normal text-left sm:text-right">
                <strong className="block font-semibold">Hotel Meri &amp; Residency</strong>
                NO-30, Nirmal State Colony,<br />
                Koushal Nagar, Nr, Satyam Showroom,<br />
                Hoshangabad Road Bhopal MP 462047
              </div>
            </div>
          </div>

          {/* Sub Header: Dark Badge (Left) & Tax Invoice Meta (Right) */}
          <div className="flex flex-wrap items-start justify-between px-6 sm:px-8 pt-0 pb-4">
            {/* Dark Brand & GST Badge (Left) */}
            <div className="bg-[#182230] text-white px-6 py-3.5 rounded-br-2xl shadow-sm -mt-0.5 max-w-sm">
              <h1 className="font-display text-2xl font-bold tracking-wide text-white">
                Hotel Meri
              </h1>
              <div className="mt-1 space-y-0.5 text-[11px] text-slate-200">
                <div>
                  <span className="text-slate-400">GSTIN: </span>
                  <strong className="font-semibold">{state.settings.gstin || "23ERMPM8248F1ZG"}</strong>
                </div>
                <div>
                  <span className="text-slate-400">State: </span>
                  <span>{state.settings.state || "23-Madhya Pradesh"}</span>
                </div>
              </div>
            </div>

            {/* Tax Invoice / Proforma Header & Details (Right) */}
            <div className="text-right pt-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {docTitle}
              </h2>
              {!isFinalInvoice && (
                <p className="mt-1 text-[11px] font-semibold text-amber-700">
                  {isInterimFolio
                    ? "Active stay folio — Final Tax Invoice issued at check-out"
                    : "Proforma estimate — Final Tax Invoice issued at check-out"}
                </p>
              )}
              <div className="mt-3 text-xs space-y-1 text-slate-800">
                <div className="flex justify-end gap-6">
                  <span className="font-bold text-slate-900 min-w-28 text-left">Invoice No.:</span>
                  <span className="font-bold text-slate-900">{booking.invoiceNo || booking.id.replace(/[^\d]/g, "") || booking.id}</span>
                </div>
                <div className="flex justify-end gap-6">
                  <span className="font-bold text-slate-900 min-w-28 text-left">Date:</span>
                  <span>{invoiceDate}</span>
                </div>
                <div className="flex justify-end gap-6">
                  <span className="font-bold text-slate-900 min-w-28 text-left">Place of Supply:</span>
                  <span>{state.settings.state || "23-Madhya Pradesh"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To Section */}
          <div className="px-6 sm:px-8 py-3">
            <span className="text-sm font-bold text-[#d32f2f] block uppercase tracking-wide">
              Bill To:
            </span>
            <div className="mt-1">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                {booking.guestName}
              </h3>
              <div className="mt-1 space-y-0.5 text-xs text-slate-800">
                <div>
                  <strong className="font-bold">Contact No.:</strong>{" "}
                  <span className="ml-1">{booking.phone}</span>
                </div>
                <div>
                  <strong className="font-bold">State:</strong>{" "}
                  <span className="ml-1">{booking.guestState || state.settings.state || "23-Madhya Pradesh"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="px-6 sm:px-8 mt-3">
            <div className="border border-neutral-300 overflow-hidden">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="bg-[#d32f2f] text-white font-bold text-[11px]">
                    <th className="py-2.5 px-1 border-r border-red-400/50 w-8">#</th>
                    <th className="py-2.5 px-2 border-r border-red-400/50">Room</th>
                    <th className="py-2.5 px-2 border-r border-red-400/50">AC &amp; NON AC</th>
                    <th className="py-2.5 px-2 border-r border-red-400/50">Checking<br />Date &amp; Time</th>
                    <th className="py-2.5 px-2 border-r border-red-400/50">Checkout<br />Date &amp; Time</th>
                    <th className="py-2.5 px-2 border-r border-red-400/50">No of<br />People</th>
                    <th className="py-2.5 px-2 border-r border-red-400/50">Quantity</th>
                    <th className="py-2.5 px-2 border-r border-red-400/50">Unit</th>
                    <th className="py-2.5 px-2 border-r border-red-400/50">Price/<br />Unit</th>
                    <th className="py-2.5 px-2 border-r border-red-400/50">GST</th>
                    <th className="py-2.5 px-2">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800 font-medium">
                  {/* Primary Room Booking Row */}
                  <tr className="border-b border-neutral-300">
                    <td className="py-3 px-1 border-r border-neutral-300 align-top">1</td>
                    <td className="py-3 px-2 border-r border-neutral-300 align-top font-bold text-slate-900">
                      {booking.roomNumber || "TBA"}
                    </td>
                    <td className="py-3 px-2 border-r border-neutral-300 align-top">
                      {booking.isAc !== false ? "AC" : "NON AC"}
                    </td>
                    <td className="py-3 px-2 border-r border-neutral-300 align-top whitespace-nowrap text-[11px]">
                      {checkInFormatted}
                    </td>
                    <td className="py-3 px-2 border-r border-neutral-300 align-top whitespace-nowrap text-[11px]">
                      {checkOutFormatted}
                    </td>
                    <td className="py-3 px-2 border-r border-neutral-300 align-top">
                      {String(booking.guests || 1).padStart(2, "0")}
                    </td>
                    <td className="py-3 px-2 border-r border-neutral-300 align-top">
                      {nights}
                    </td>
                    <td className="py-3 px-2 border-r border-neutral-300 align-top">
                      Day
                    </td>
                    <td className="py-3 px-2 border-r border-neutral-300 align-top text-right whitespace-nowrap">
                      {formatCurrencyINR(unitPrice)}
                    </td>
                    <td className="py-3 px-2 border-r border-neutral-300 align-top text-center whitespace-nowrap">
                      <div>{formatCurrencyINR(totalTax)}</div>
                      <div className="text-[10px] text-slate-600">(5%)</div>
                    </td>
                    <td className="py-3 px-2 align-top text-right font-semibold whitespace-nowrap">
                      {formatCurrencyINR(grandTotal)}
                    </td>
                  </tr>

                  {/* Empty Height Padder row like standard tax invoices */}
                  <tr className="h-32">
                    <td className="border-r border-neutral-300"></td>
                    <td className="border-r border-neutral-300"></td>
                    <td className="border-r border-neutral-300"></td>
                    <td className="border-r border-neutral-300"></td>
                    <td className="border-r border-neutral-300"></td>
                    <td className="border-r border-neutral-300"></td>
                    <td className="border-r border-neutral-300"></td>
                    <td className="border-r border-neutral-300"></td>
                    <td className="border-r border-neutral-300"></td>
                    <td className="border-r border-neutral-300"></td>
                    <td></td>
                  </tr>
                </tbody>

                {/* Table Footer Total Bar */}
                <tfoot>
                  <tr className="bg-[#d32f2f] text-white font-bold text-xs">
                    <td colSpan={9} className="py-2.5 px-4 text-left border-r border-red-400/50">
                      Total
                    </td>
                    <td className="py-2.5 px-2 border-r border-red-400/50 text-right whitespace-nowrap">
                      {formatCurrencyINR(totalTax)}
                    </td>
                    <td className="py-2.5 px-2 text-right whitespace-nowrap">
                      {formatCurrencyINR(grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Lower Details: Bank Info & Signature (Left) and Summary Box (Right) */}
          <div className="px-6 sm:px-8 mt-5 flex flex-col md:flex-row justify-between gap-6">
            {/* Left Column: Bank Details, Words, Stamp */}
            <div className="flex-1 space-y-4">
              {/* Pay To */}
              <div>
                <span className="text-xs font-bold text-[#d32f2f] block uppercase tracking-wide">
                  Pay To:
                </span>
                <div className="mt-1 space-y-0.5 text-xs text-slate-900">
                  <div>
                    <span className="font-semibold">Bank Name : </span>
                    <span>{state.settings.bankName || "BANK OF BARODA"}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Bank Account No. : </span>
                    <span>{state.settings.bankAccountNo || "83340200000068"}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Bank IFSC code : </span>
                    <span>{state.settings.bankIfsc || "BARB0MISROD"}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Account holder's name : </span>
                    <span>{state.settings.accountHolderName || "HOTEL MERI"}</span>
                  </div>
                </div>
              </div>

              {/* Invoice Amount In Words */}
              <div>
                <span className="text-xs font-bold text-[#d32f2f] block">
                  Invoice Amount In Words
                </span>
                <p className="mt-0.5 text-xs font-semibold text-slate-800">
                  {amountInWords}
                </p>
              </div>

              {/* Stamp & Authorized Signatory Block */}
              <div className="pt-2">
                <span className="text-xs font-medium text-slate-700 block mb-2">
                  For : Hotel Meri
                </span>

                {/* Violet Ink Stamp Box */}
                <div className="relative inline-block border-2 border-purple-700/80 rounded-md p-2 bg-purple-50/20 text-purple-900 font-sans shadow-sm select-none">
                  {/* Faux Signature Graphic */}
                  <svg
                    className="absolute -top-3 left-4 w-28 h-10 pointer-events-none opacity-85"
                    viewBox="0 0 120 40"
                    fill="none"
                    stroke="#4338ca"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M 5 28 Q 20 8 45 15 T 75 10 T 95 24 T 115 14" />
                    <path d="M 25 32 Q 40 22 65 24 T 100 20" />
                  </svg>

                  <div className="text-center font-bold text-[11px] tracking-wider uppercase text-purple-950">
                    HOTEL MERI
                  </div>
                  <div className="text-[8px] leading-tight text-center text-purple-900 font-medium mt-0.5 max-w-[190px]">
                    Add: No-30, Nirmal State Colony,<br />
                    Koushal Nagar Near Satyam Showroom,<br />
                    Hoshangabad Road, Bhopal-462047<br />
                    M: 9039408329
                  </div>
                </div>

                <div className="mt-2 text-xs font-bold text-slate-900">
                  Authorized Signatory
                </div>
              </div>
            </div>

            {/* Right Column: Breakdown Table */}
            <div className="w-full md:w-80 shrink-0">
              <div className="border border-neutral-400/80 text-xs text-slate-900 overflow-hidden shadow-sm">
                <div className="flex justify-between py-1.5 px-3 border-b border-neutral-300">
                  <span>Sub Total</span>
                  <span className="font-semibold">{formatCurrencyINR(subtotal)}</span>
                </div>
                <div className="flex justify-between py-1.5 px-3 border-b border-neutral-300">
                  <span>SGST@2.5%</span>
                  <span className="font-semibold">{formatCurrencyINR(sgstTax)}</span>
                </div>
                <div className="flex justify-between py-1.5 px-3 border-b border-neutral-300">
                  <span>CGST@2.5%</span>
                  <span className="font-semibold">{formatCurrencyINR(cgstTax)}</span>
                </div>
                <div className="flex justify-between py-2 px-3 bg-[#d32f2f] text-white font-bold text-sm">
                  <span>Total</span>
                  <span>{formatCurrencyINR(grandTotal)}</span>
                </div>
                <div className="flex justify-between py-1.5 px-3 border-b border-neutral-300">
                  <span>Received</span>
                  <span className="font-semibold">{formatCurrencyINR(amountPaid)}</span>
                </div>
                <div className="flex justify-between py-1.5 px-3 border-b border-neutral-300">
                  <span>Balance</span>
                  <span className="font-semibold">{formatCurrencyINR(balance)}</span>
                </div>
                <div className="flex justify-between py-1.5 px-3">
                  <span>Payment Mode</span>
                  <span className="font-semibold">{paymentMode}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Decorative Graphic Bar */}
        <div className="mt-8 relative">
          <div className="h-3.5 bg-[#d32f2f] w-full"></div>
          <div className="absolute right-0 bottom-0 h-8 w-48 bg-[#182230] rounded-tl-full"></div>
        </div>
      </div>
      )}
    </div>
  );
}
