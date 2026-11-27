import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { Intro } from "@/components/site/Intro.jsx";
import {
  ScrollToTop,
  RouteProgress,
  RouteCurtain,
  PageTransition,
} from "@/components/site/Motion.jsx";

// Public Pages
import HomePage from "@/pages/HomePage.jsx";
import AboutPage from "@/pages/AboutPage.jsx";
import RoomsPage from "@/pages/RoomsPage.jsx";
import RoomDetailPage from "@/pages/RoomDetailPage.jsx";
import GalleryPage from "@/pages/GalleryPage.jsx";
import ContactPage from "@/pages/ContactPage.jsx";
import BookPage from "@/pages/BookPage.jsx";
import LoginPage from "@/pages/LoginPage.jsx";
import InvoicePage from "@/pages/InvoicePage.jsx";
import NotFoundPage from "@/pages/NotFoundPage.jsx";

// Guest Account Pages
import AccountLayout from "@/pages/account/AccountLayout.jsx";
import AccountOverview from "@/pages/account/AccountOverview.jsx";
import AccountBook from "@/pages/account/AccountBook.jsx";
import AccountBookings from "@/pages/account/AccountBookings.jsx";
import AccountHistory from "@/pages/account/AccountHistory.jsx";
import AccountProfile from "@/pages/account/AccountProfile.jsx";
import AccountPayments from "@/pages/account/AccountPayments.jsx";
import AccountSupport from "@/pages/account/AccountSupport.jsx";

// Reception Pages
import ReceptionLayout from "@/pages/reception/ReceptionLayout.jsx";
import ReceptionOverview from "@/pages/reception/ReceptionOverview.jsx";
import ReceptionBookings from "@/pages/reception/ReceptionBookings.jsx";
import ReceptionNewBooking from "@/pages/reception/ReceptionNewBooking.jsx";
import ReceptionRooms from "@/pages/reception/ReceptionRooms.jsx";
import ReceptionCheckIn from "@/pages/reception/ReceptionCheckIn.jsx";
import ReceptionCheckOut from "@/pages/reception/ReceptionCheckOut.jsx";
import ReceptionGuests from "@/pages/reception/ReceptionGuests.jsx";
import ReceptionPayments from "@/pages/reception/ReceptionPayments.jsx";
import ReceptionCalendar from "@/pages/reception/ReceptionCalendar.jsx";
import ReceptionReports from "@/pages/reception/ReceptionReports.jsx";
import ReceptionSettings from "@/pages/reception/ReceptionSettings.jsx";

// Admin Executive Portal Pages
import AdminLayout from "@/pages/admin/AdminLayout.jsx";
import AdminOverview from "@/pages/admin/AdminOverview.jsx";
import AdminReservationsPage from "@/pages/admin/AdminReservationsPage.jsx";
import AdminWalkInPage from "@/pages/admin/AdminWalkInPage.jsx";
import AdminRoomsPage from "@/pages/admin/AdminRoomsPage.jsx";
import AdminCheckInPage from "@/pages/admin/AdminCheckInPage.jsx";
import AdminCheckOutPage from "@/pages/admin/AdminCheckOutPage.jsx";
import AdminHousekeepingPage from "@/pages/admin/AdminHousekeepingPage.jsx";
import AdminMaintenancePage from "@/pages/admin/AdminMaintenancePage.jsx";
import AdminStaffPage from "@/pages/admin/AdminStaffPage.jsx";
import AdminPricingPage from "@/pages/admin/AdminPricingPage.jsx";
import AdminGuestsPage from "@/pages/admin/AdminGuestsPage.jsx";
import AdminOffersPage from "@/pages/admin/AdminOffersPage.jsx";
import AdminLedgerPage from "@/pages/admin/AdminLedgerPage.jsx";
import AdminReportsPage from "@/pages/admin/AdminReportsPage.jsx";
import AdminLogsPage from "@/pages/admin/AdminLogsPage.jsx";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage.jsx";

function AppRoutes() {
  const location = useLocation();
  const top = location.pathname.split("/")[1] ?? "";
  const section = top === "account" || top === "reception" || top === "admin" ? top : location.pathname;

  return (
    <>
      {/* Scroll to Top on every route change */}
      <ScrollToTop />

      {/* Sweeping Golden Laser Route Bar */}
      <RouteProgress />

      {/* Royal Curtain wipe with Hotel Meri Crest */}
      <RouteCurtain section={section} logo="/favicon.png" />

      {/* Page Transition & Routes */}
      <PageTransition id={location.pathname}>
        <Routes location={location} key={location.pathname}>
          {/* Public Site Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/book" element={<BookPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invoice" element={<InvoicePage />} />
          <Route path="/invoice/:bookingId" element={<InvoicePage />} />

          {/* Guest Account Portal */}
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<AccountOverview />} />
            <Route path="book" element={<AccountBook />} />
            <Route path="bookings" element={<AccountBookings />} />
            <Route path="history" element={<AccountHistory />} />
            <Route path="profile" element={<AccountProfile />} />
            <Route path="payments" element={<AccountPayments />} />
            <Route path="support" element={<AccountSupport />} />
          </Route>

          {/* Reception Management Portal */}
          <Route path="/reception" element={<ReceptionLayout />}>
            <Route index element={<ReceptionOverview />} />
            <Route path="bookings" element={<ReceptionBookings />} />
            <Route path="new" element={<ReceptionNewBooking />} />
            <Route path="rooms" element={<ReceptionRooms />} />
            <Route path="check-in" element={<ReceptionCheckIn />} />
            <Route path="check-out" element={<ReceptionCheckOut />} />
            <Route path="guests" element={<ReceptionGuests />} />
            <Route path="payments" element={<ReceptionPayments />} />
            <Route path="calendar" element={<ReceptionCalendar />} />
            <Route path="reports" element={<ReceptionReports />} />
            <Route path="settings" element={<ReceptionSettings />} />
          </Route>

          {/* Admin Executive Portal */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="bookings" element={<AdminReservationsPage />} />
            <Route path="new" element={<AdminWalkInPage />} />
            <Route path="rooms" element={<AdminRoomsPage />} />
            <Route path="check-in" element={<AdminCheckInPage />} />
            <Route path="check-out" element={<AdminCheckOutPage />} />
            <Route path="housekeeping" element={<AdminHousekeepingPage />} />
            <Route path="maintenance" element={<AdminMaintenancePage />} />
            <Route path="staff" element={<AdminStaffPage />} />
            <Route path="pricing" element={<AdminPricingPage />} />
            <Route path="guests" element={<AdminGuestsPage />} />
            <Route path="offers" element={<AdminOffersPage />} />
            <Route path="payments" element={<AdminLedgerPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="calendar" element={<ReceptionCalendar />} />
            <Route path="logs" element={<AdminLogsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </PageTransition>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Intro />
      <Toaster richColors position="top-right" theme="dark" />
      <AppRoutes />
    </BrowserRouter>
  );
}
