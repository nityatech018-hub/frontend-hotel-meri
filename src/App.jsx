import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { Intro } from "@/components/site/Intro.jsx";
import {
  CursorGlow,
  ScrollToTop,
  RouteProgress,
  RouteCurtain,
  PageTransition,
} from "@/components/site/Motion.jsx";

// Public Pages
import HomePage from "@/pages/HomePage.jsx";
import AboutPage from "@/pages/AboutPage.jsx";
import RoomsPage from "@/pages/RoomsPage.jsx";
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

function AppRoutes() {
  const location = useLocation();
  const top = location.pathname.split("/")[1] ?? "";
  const section = top === "account" || top === "reception" ? top : location.pathname;

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
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/book" element={<BookPage />} />
          <Route path="/login" element={<LoginPage />} />
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

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </PageTransition>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CursorGlow />
      <Intro />
      <Toaster richColors position="top-right" theme="dark" />
      <AppRoutes />
    </BrowserRouter>
  );
}
