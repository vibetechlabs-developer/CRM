import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import PipelineView from "./pages/PipelineView";
import Clients from "./pages/Clients";
import Tickets from "./pages/Tickets";
import NewTicket from "./pages/NewTicket";
import UserControl from "./pages/UserControl";
import SettingsPage from "./pages/SettingsPage";
import MyProfile from "./pages/MyProfile";
import DiscardedLeads from "./pages/DiscardedLeads";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import InsuranceForm from "./pages/InsuranceForm";
import InsuranceFormManual from "./pages/InsuranceFormManual";
import Notifications from "./pages/Notifications";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { isLoggedIn, user } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pipeline" element={<PipelineView />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/new-ticket" element={<NewTicket />} />
        <Route path="/insurance-form/manual" element={<InsuranceFormManual />} />
        <Route path="/discarded-leads" element={<DiscardedLeads />} />
        <Route path="/notifications" element={<Notifications />} />
        {user?.role === "ADMIN" && <Route path="/user-control" element={<UserControl />} />}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<MyProfile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/insurance-form" element={<InsuranceForm />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
