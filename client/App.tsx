import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import Forts from "./pages/Forts";
import FortDetail from "./pages/FortDetail";
import TrekPlanner from "./pages/TrekPlanner";
import About from "./pages/About";
import ContributeContent from "./pages/ContributeContent";
import AdminPanel from "./pages/AdminPanel";
import RideBooking from "./pages/RideBooking";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TrekGroups from "./pages/TrekGroups";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  // Create QueryClient inside component to ensure React context is available
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="fort-tracker-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen flex flex-col">
                <div className="flex-1">
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/forts" element={<Forts />} />
                    <Route path="/fort/:id" element={<FortDetail />} />
                    <Route path="/trek-groups" element={<TrekGroups />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected routes - require authentication */}
                    <Route
                      path="/trek-planner"
                      element={
                        <ProtectedRoute>
                          <TrekPlanner />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/contribute"
                      element={
                        <ProtectedRoute>
                          <ContributeContent />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin-only routes */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <AdminPanel />
                        </ProtectedRoute>
                      }
                    />

                    {/* Catch-all route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
                <Footer />
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
