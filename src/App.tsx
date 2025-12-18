import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Intake from "./pages/Intake";
import PaymentSuccess from "./pages/PaymentSuccess";
import ViewReport from "./pages/ViewReport";
import GiftPurchase from "./pages/GiftPurchase";
import GiftSuccess from "./pages/GiftSuccess";
import RedeemGift from "./pages/RedeemGift";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminReports from "./pages/AdminReports";
import AdminSubscriptions from "./pages/AdminSubscriptions";
import AdminAffiliates from "./pages/AdminAffiliates";
import AdminGifts from "./pages/AdminGifts";
import BecomeAffiliate from "./pages/BecomeAffiliate";
import ReferralRedirect from "./pages/ReferralRedirect";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/intake" element={<Intake />} />
          <Route path="/gift" element={<GiftPurchase />} />
          <Route path="/gift-success" element={<GiftSuccess />} />
          <Route path="/redeem" element={<RedeemGift />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/report" element={<ViewReport />} />
          <Route path="/become-affiliate" element={<BecomeAffiliate />} />
          <Route path="/ref/:code" element={<ReferralRedirect />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
          <Route path="/admin/affiliates" element={<AdminAffiliates />} />
          <Route path="/admin/gifts" element={<AdminGifts />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
