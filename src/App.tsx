// Build trigger v2 - March 8 2026
import { lazy, Suspense, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/react";
import { checkAndStoreReferralFromURL } from "@/lib/referralTracking";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ABTestProvider } from "@/contexts/ABTestContext";
import { CookieConsent } from "@/components/CookieConsent";
import { Analytics } from "@vercel/analytics/react";

// Eagerly loaded pages (core user journey)
import Index from "./pages/Index";
import Intake from "./pages/Intake";
// QuickCheckout React component exists but /checkout routes to checkout.html (the original design)
import PaymentSuccess from "./pages/PaymentSuccess";
const ViewReport = lazy(() => import("./pages/ViewReport"));
import GiftPurchase from "./pages/GiftPurchase";
import GiftSuccess from "./pages/GiftSuccess";
import RedeemGift from "./pages/RedeemGift";
import GiftIntake from "./pages/GiftIntake";
import NotFound from "./pages/NotFound";

// Lazy loaded pages (less frequently accessed)
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const MyReports = lazy(() => import("./pages/MyReports"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminSubscriptions = lazy(() => import("./pages/AdminSubscriptions"));
const AdminAffiliates = lazy(() => import("./pages/AdminAffiliates"));
const AdminGifts = lazy(() => import("./pages/AdminGifts"));
const AdminCoupons = lazy(() => import("./pages/AdminCoupons"));
const AdminEmailSequences = lazy(() => import("./pages/AdminEmailSequences"));
const BecomeAffiliate = lazy(() => import("./pages/BecomeAffiliate"));
const AdminInfluencers = lazy(() => import("./pages/AdminInfluencers"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminBlogStats = lazy(() => import("./pages/AdminBlogStats"));
const AffiliateDashboard = lazy(() => import("./pages/AffiliateDashboard"));
const ReferralRedirect = lazy(() => import("./pages/ReferralRedirect"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Contact = lazy(() => import("./pages/Contact"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const Account = lazy(() => import("./pages/Account"));
const AffiliateMediaKit = lazy(() => import("./pages/AffiliateMediaKit"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const AdminABTest = lazy(() => import("./pages/AdminABTest"));
const AdminRedeemCodes = lazy(() => import("./pages/AdminRedeemCodes"));
const AdminQATest = lazy(() => import("./pages/AdminQATest"));
const RedeemCode = lazy(() => import("./pages/RedeemCode"));
const FindReport = lazy(() => import("./pages/FindReport"));

// Redirect /checkout to the static HTML checkout page (Supabase credentials now fixed)
function CheckoutRedirect() {
  const params = new URLSearchParams(window.location.search);
  const qs = params.toString();
  window.location.href = '/checkout.html' + (qs ? '?' + qs : '');
  return null;
}

// GiftPurchase is now a React component (gift-v2.html had stale Supabase credentials)

// Redirect /chat to the static HTML soul chat page
function SoulChatRedirect() {
  const params = new URLSearchParams(window.location.search);
  window.location.href = '/soul-chat.html?id=' + (params.get('id') || '');
  return null;
}

// Capture ?ref= on any page load (not just Index)
function ReferralCapture({ children }: { children: React.ReactNode }) {
  useEffect(() => { checkAndStoreReferralFromURL(); }, []);
  return <>{children}</>;
}

const queryClient = new QueryClient();

// Loading fallback for lazy components
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-pulse text-muted-foreground">Loading...</div>
  </div>
);

// Error fallback for crashed pages
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">We hit a cosmic hiccup. Please try again.</p>
        <button
          onClick={resetErrorBoundary}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

// App component with all providers
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ABTestProvider>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <CookieConsent />
            <BrowserRouter>
              <ReferralCapture>
              <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.href = '/'}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/intake" element={<Intake />} />
                  <Route path="/checkout" element={<CheckoutRedirect />} />
                  <Route path="/gift" element={<GiftPurchase />} />
                  <Route path="/gift-success" element={<GiftSuccess />} />
                  <Route path="/redeem" element={<RedeemGift />} />
                  <Route path="/redeem-intake" element={<GiftIntake />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="/report" element={<ViewReport />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/my-reports" element={<MyReports />} />
                  <Route path="/become-affiliate" element={<BecomeAffiliate />} />
                  <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
                  <Route path="/affiliate/media-kit" element={<AffiliateMediaKit />} />
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
                  <Route path="/admin/coupons" element={<AdminCoupons />} />
                  <Route path="/admin/email-sequences" element={<AdminEmailSequences />} />
                  <Route path="/admin/influencers" element={<AdminInfluencers />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/blog" element={<AdminBlogStats />} />
                  <Route path="/admin/ab-test" element={<AdminABTest />} />
                  <Route path="/admin/redeem-codes" element={<AdminRedeemCodes />} />
                  <Route path="/admin/qa-test" element={<AdminQATest />} />
                  <Route path="/redeem-code" element={<RedeemCode />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/find-report" element={<FindReport />} />
                  <Route path="/chat" element={<SoulChatRedirect />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              </ErrorBoundary>
              </ReferralCapture>
            </BrowserRouter>
            <Analytics />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ABTestProvider>
  </QueryClientProvider>
);

export default App;
