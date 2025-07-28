import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import CourseLearning from "./pages/CourseLearning";
import NotFound from "./pages/NotFound";
import Home from "../pages/Home/Home";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import TnC from "../pages/Terms&Conditions";
import RefundPolicy from "../pages/RefundPolicy";
import ContactUs from "../pages/ContactUs";
import ScrollToTop from "../components/ScrollToTop";



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<div className="page"><Home /></div>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/privacy-policy" element={<div className="page"><PrivacyPolicy /></div>} />
            <Route path="/terms-and-conditions" element={<TnC />} />
            <Route path="/refund-policy" element={<div className="page"><RefundPolicy /></div>} />
            <Route path="/contact-us" element={<div className="page"><ContactUs /></div>} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/course/:courseId" element={<CourseLearning />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
