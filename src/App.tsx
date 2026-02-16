import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import CRM from "./pages/CRM";
import Operations from "./pages/Operations";
import AgentStudio from "./pages/AgentStudio";
import AgentForm from "./pages/AgentForm";
import AgentSpace from "./pages/AgentSpace";
import OperationsWorkspace from "./pages/OperationsWorkspace";
import SettingsPage from "./pages/Settings";
import AdminUsers from "./pages/AdminUsers";
import AdminAudit from "./pages/AdminAudit";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/crm" element={<CRM />} />
              <Route path="/operations" element={<Operations />} />
              <Route path="/operations/:projectId" element={<OperationsWorkspace />} />
              <Route path="/agent-space" element={<AgentSpace />} />
              <Route path="/agent-studio" element={<AdminRoute><AgentStudio /></AdminRoute>} />
              <Route path="/agent-studio/new" element={<AdminRoute><AgentForm /></AdminRoute>} />
              <Route path="/agent-studio/:id" element={<AdminRoute><AgentForm /></AdminRoute>} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/audit" element={<AdminRoute><AdminAudit /></AdminRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
