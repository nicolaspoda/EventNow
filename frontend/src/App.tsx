import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './utils/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage';
import { ClientDashboardPage } from './pages/ClientDashboardPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import { CreateEventPage } from './pages/CreateEventPage';
import { EventEditPage } from './pages/EventEditPage';
import { EventStatsPage } from './pages/EventStatsPage';
import { EventParticipantsPage } from './pages/EventParticipantsPage';
import BookingsPage from './pages/BookingsPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import MyTicketsPage from './pages/MyTicketsPage';
import MyOrdersPage from './pages/MyOrdersPage';
import MyUpcomingEventsPage from './pages/MyUpcomingEventsPage';
import MyParticipatedEventsPage from './pages/MyParticipatedEventsPage';
import MyCalendarPage from './pages/MyCalendarPage';
import { RefundRequestsPage } from './pages/RefundRequestsPage';
import { StaffScanPage } from './pages/StaffScanPage';
import { StaffValidationsPage } from './pages/StaffValidationsPage';
import LandingPage from './pages/LandingPage';
import { ProfilePage } from './pages/ProfilePage';

import EventParticipantReviewsPage from './pages/EventParticipantReviewsPage';
import EventParticipationRequestsPage from './pages/EventParticipationRequestsPage';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route element={<AppLayout />}>
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/create" element={
            <ProtectedRoute>
              <CreateEventPage />
            </ProtectedRoute>
          } />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/events/:id/edit" element={
            <ProtectedRoute>
              <EventEditPage />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <BookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId/success"
            element={
              <ProtectedRoute>
                <OrderSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-upcoming-events"
            element={
              <ProtectedRoute>
                <MyUpcomingEventsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-participated-events"
            element={
              <ProtectedRoute>
                <MyParticipatedEventsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-calendar"
            element={
              <ProtectedRoute>
                <MyCalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-tickets"
            element={
              <ProtectedRoute>
                <MyTicketsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/organizer"
            element={
              <ProtectedRoute roles={['ORGANIZER']}>
                <OrganizerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/organizer/refund-requests"
            element={
              <ProtectedRoute roles={['ORGANIZER']}>
                <RefundRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/client"
            element={
              <ProtectedRoute roles={['CLIENT']}>
                <ClientDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/events/:id/stats"
            element={
              <ProtectedRoute roles={['ORGANIZER']}>
                <EventStatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/events/:id/participants"
            element={
              <ProtectedRoute roles={['CLIENT']}>
                <EventParticipantsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId/participation-requests"
            element={
              <ProtectedRoute>
                <EventParticipationRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId/participant-reviews"
            element={
              <ProtectedRoute>
                <EventParticipantReviewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/:userId/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/scan"
            element={
              <ProtectedRoute roles={['STAFF']}>
                <StaffScanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/validations"
            element={
              <ProtectedRoute roles={['STAFF']}>
                <StaffValidationsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<LandingPage />} />
        </Route>
        </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
