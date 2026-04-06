import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/AppLayout";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center h-full w-full">
      <div className="text-destructive mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
      </div>
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-6 max-w-md">{error.message}</p>
      <button onClick={resetErrorBoundary} className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md shadow-sm">Try again</button>
    </div>
  );
}

const Dashboard = lazy(() => import("./pages/Dashboard"));
const PipelineView = lazy(() => import("./pages/PipelineView"));
const RenewalPipelineView = lazy(() => import("./pages/RenewalPipelineView"));
const ChangesPipelineView = lazy(() => import("./pages/ChangesPipelineView"));
const Clients = lazy(() => import("./pages/Clients"));
const Tickets = lazy(() => import("./pages/Tickets"));
const BinderPipeline = lazy(() => import("./pages/BinderPipeline"));
const DailyPlanner = lazy(() => import("./pages/DailyPlanner"));
const NewTicket = lazy(() => import("./pages/NewTicket"));
const UserControl = lazy(() => import("./pages/UserControl"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const MyProfile = lazy(() => import("./pages/MyProfile"));
const DiscardedLeads = lazy(() => import("./pages/DiscardedLeads"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const InsuranceFormManual = lazy(() => import("./pages/InsuranceFormManual"));
const RenewalRequestForm = lazy(() => import("./pages/RenewalRequestForm"));
const PolicyChangeForm = lazy(() => import("./pages/PolicyChangeForm"));
const CancellationForm = lazy(() => import("./pages/CancellationForm"));
const CustomerIssueForm = lazy(() => import("./pages/CustomerIssueForm"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NewBusinessForm = lazy(() => import("./pages/NewBusinessForm"));
const ClientFormsLanding = lazy(() => import("./pages/ClientFormsLanding"));
import ScrollToTop from "./components/ScrollToTop";
import { GlobalAuthListener } from "@/components/GlobalAuthListener";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { isLoggedIn, isLoading, user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return (
    <AppLayout>
      <Suspense fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pipeline" element={<PipelineView />} />
            <Route path="/renewal-pipeline" element={<RenewalPipelineView />} />
            <Route path="/changes-pipeline" element={<ChangesPipelineView />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/binder-pipeline" element={<BinderPipeline />} />
            <Route path="/daily-planner" element={<DailyPlanner />} />
            <Route path="/new-ticket" element={<NewTicket />} />
            <Route path="/insurance-form/manual" element={<InsuranceFormManual />} />
            <Route path="/discarded-leads" element={<DiscardedLeads />} />
            <Route path="/notifications" element={<Notifications />} />
            {(user?.role === "ADMIN" || user?.role === "MANAGER") && <Route path="/user-control" element={<UserControl />} />}
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/crm/forms/new-business" element={<NewBusinessForm />} />
            <Route path="/crm/forms/renewal" element={<RenewalRequestForm />} />
            <Route path="/crm/forms/changes" element={<PolicyChangeForm />} />
            <Route path="/crm/forms/cancellation" element={<CancellationForm />} />
            <Route path="/crm/forms/customer-issue" element={<CustomerIssueForm />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </Suspense>
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
          <GlobalAuthListener />
          <ScrollToTop />
          <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          }>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forms" element={<ClientFormsLanding />} />
              <Route path="/client/forms" element={<ClientFormsLanding />} />
              <Route path="/forms/new-business" element={<NewBusinessForm />} />
              <Route path="/forms/new-buisness" element={<NewBusinessForm />} />
              <Route path="/forms/renewal" element={<RenewalRequestForm />} />
              <Route path="/forms/changes" element={<PolicyChangeForm />} />
              <Route path="/forms/cancellation" element={<CancellationForm />} />
              <Route path="/forms/customer-issue" element={<CustomerIssueForm />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
