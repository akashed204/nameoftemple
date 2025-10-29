import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import SplashScreen from "./components/SplashScreen";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ProfileFormPage from "./pages/ProfileFormPage";
import ProfilePage from "./pages/ProfilePage";
import MembershipPage from "./pages/MembershipPage";
import PaymentPage from "./pages/PaymentPage";
import StatusPage from "./pages/StatusPage";
import EventsPage from "./pages/EventsPage";
import DonatePage from "./pages/DonatePage";
import NotFound from "./pages/NotFound";
import BottomNavBar from "./components/BottomNavBar";

// Admin imports
import AdminLayout from "./layouts/AdminLayout";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import AdminProtectedRoute from "./components/auth/AdminProtectedRoute";
import ApplicationsPage from "./pages/admin/ApplicationsPage";
import MembersPage from "./pages/admin/MembersPage";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const showBottomNav = !location.pathname.startsWith('/admin') && !["/", "/auth"].includes(location.pathname);

  return (
    <>
      <Routes>
        {/* Public & User Auth Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* User Protected Routes */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/create-profile" element={<ProfileFormPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/donate" element={<DonatePage />} />
        
        {/* Admin Protected Routes */}
        <Route element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/admin/applications" element={<ApplicationsPage />} />
            <Route path="/admin/members" element={<MembersPage />} />
            {/* Future admin pages can be added here as nested routes */}
          </Route>
        </Route>

        {/* Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showBottomNav && <BottomNavBar />}
    </>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
