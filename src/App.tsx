import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/i18n/LanguageContext";

// Eagerly loaded (landing + auth are critical path)
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy loaded (only when navigated to)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Report = lazy(() => import("./pages/Report"));
const MapView = lazy(() => import("./pages/MapView"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const CreatePickupRequest = lazy(() => import("./pages/CreatePickupRequest"));
const PickupRequestDetail = lazy(() => import("./pages/PickupRequestDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const MyRequests = lazy(() => import("./pages/MyRequests"));
const MyBids = lazy(() => import("./pages/MyBids"));
const MyCompany = lazy(() => import("./pages/MyCompany"));
const DemoPreview = lazy(() => import("./pages/DemoPreview"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/demo" element={<DemoPreview />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/report" element={<Report />} />
                <Route path="/map" element={<MapView />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/marketplace/new" element={<CreatePickupRequest />} />
                <Route path="/marketplace/:id" element={<PickupRequestDetail />} />
                <Route path="/my-requests" element={<MyRequests />} />
                <Route path="/my-bids" element={<MyBids />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/my-company" element={<MyCompany />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
