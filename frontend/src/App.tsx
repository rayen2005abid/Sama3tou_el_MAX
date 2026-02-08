import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import MarketOverview from "@/pages/MarketOverview";
import StockAnalysis from "@/pages/StockAnalysis";
import Portfolio from "@/pages/Portfolio";
import Monitoring from "@/pages/Monitoring";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";
import Chatbot from "@/pages/Chatbot";
import NotFound from "./pages/NotFound";
import { QuizModal } from "@/components/QuizModal";
import { api } from "@/services/api";

const queryClient = new QueryClient();

function AppContent() {
  const [showQuiz, setShowQuiz] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      // Don't check on register or login page
      if (location.pathname === "/register" || location.pathname === "/login") return;

      try {
        const user = await api.getMe();
        // Show quiz if user hasn't completed it (risk_score is 0)
        if (user.risk_score === 0) {
          setShowQuiz(true);
        }
      } catch (e) {
        // Not logged in, redirect to login
        navigate("/login");
      }
    };
    checkUser();
  }, [location.pathname]);

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<MarketOverview />} />
        <Route path="/analysis" element={<StockAnalysis />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="/chat" element={<Chatbot />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <QuizModal open={showQuiz} onOpenChange={setShowQuiz} onComplete={() => setShowQuiz(false)} />
    </AppLayout>
  );
}

const App = () => (
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

export default App;
