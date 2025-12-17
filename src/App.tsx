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
import RedeemGift from "./pages/RedeemGift";
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
          <Route path="/redeem" element={<RedeemGift />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/report" element={<ViewReport />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
