import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CookieConsent } from "@/components/CookieConsent";

// Eagerly loaded pages (core user journey)
import Index from "./pages/Index";
import Intake from "./pages/Intake";
import PaymentSuccess from "./pages/PaymentSuccess";
import ViewReport from "./pages/ViewReport";
import GiftPurchase from "./pages/GiftPurchase";
import GiftSuccess from "./pages/GiftSuccess";
import RedeemGift from "./pages/RedeemGift";
import NotFound from "./pages/NotFound";

// Lazy loaded pages (less frequently accessed)
const Auth = lazy(() => import("./pages/Auth"));
const MyReports = lazy(() => import("./pages/MyReports"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminSubscriptions = lazy(() => import("./pages/AdminSubscriptions"));
const AdminAffiliates = lazy(() => import("./pages/AdminAffiliates"));
const AdminGifts = lazy(() => import("./pages/AdminGifts"));
const BecomeAffiliate = lazy(() => import("./pages/BecomeAffiliate"));
const ReferralRedirect = lazy(() => import("./pages/ReferralRedirect"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Contact = lazy(() => import("./pages/Contact"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const Account = lazy(() => import("./pages/Account"));

const queryClient = new QueryClient();

// Loading fallback for lazy components
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-pulse text-muted-foreground">Loading...</div>
  </div>
);

// App component with all providers
const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <CookieConsent />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/intake" element={<Intake />} />
                <Route path="/gift" element={<GiftPurchase />} />
                <Route path="/gift-success" element={<GiftSuccess />} />
                <Route path="/redeem" element={<RedeemGift />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/report" element={<ViewReport />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/my-reports" element={<MyReports />} />
                <Route path="/become-affiliate" element={<BecomeAffiliate />} />
                <Route path="/ref/:code" element={<ReferralRedirect />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                <Route path="/account" element={<Account />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                <Route path="/admin/affiliates" element={<AdminAffiliates />} />
                <Route path="/admin/gifts" element={<AdminGifts />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
