import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { ClientRoute } from "@/components/ClientRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import PortalLayout from "./pages/portal/PortalLayout";
import PortalDashboard from "./pages/portal/PortalDashboard";
import PortalProjects from "./pages/portal/PortalProjects";
import PortalProjectDetail from "./pages/portal/PortalProjectDetail";
import PortalSettings from "./pages/portal/PortalSettings";
import Dashboard from "./pages/Dashboard";
import CRM from "./pages/CRM";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import Operations from "./pages/Operations";
import AgentStudio from "./pages/AgentStudio";
import AgentForm from "./pages/AgentForm";
import AgentSpace from "./pages/AgentSpace";
import OperationsWorkspace from "./pages/OperationsWorkspace";
import CompanyProjectDetail from "./pages/CompanyProjectDetail";
import SettingsPage from "./pages/Settings";
import AdminUsers from "./pages/AdminUsers";
import AdminAudit from "./pages/AdminAudit";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
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
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/crm" element={<CRM />} />
              <Route path="/empresas" element={<Companies />} />
              <Route path="/empresas/:leadId" element={<CompanyDetail />} />
              <Route path="/empresas/:leadId/projetos/:projectId" element={<CompanyProjectDetail />} />
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
            {/* Portal do Cliente */}
            <Route
              element={
                <ClientRoute>
                  <PortalLayout />
                </ClientRoute>
              }
            >
              <Route path="/portal" element={<PortalDashboard />} />
              <Route path="/portal/projetos" element={<PortalProjects />} />
              <Route path="/portal/projetos/:projectId" element={<PortalProjectDetail />} />
              <Route path="/portal/configuracoes" element={<PortalSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
