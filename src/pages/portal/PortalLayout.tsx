import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useClientProfile } from "@/hooks/useClientPortal";
import { useProfile } from "@/hooks/useProfile";
import { NewProjectRequestModal } from "./NewProjectRequestModal";

const portalNavItems = [
  { title: "Dashboard", url: "/portal", icon: LayoutDashboard },
  { title: "Meus Projetos", url: "/portal/projetos", icon: FolderOpen },
  { title: "Configurações", url: "/portal/configuracoes", icon: Settings },
];

export default function PortalLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const { signOut } = useAuth();
  const { data: clientProfile } = useClientProfile();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const companyName = (clientProfile as any)?.leads?.company_name ?? "Minha Empresa";
  const userName = profile?.display_name || "Usuário";
  const userInitials = userName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200 shrink-0",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-sidebar-border">
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-primary tracking-tight">
              InnovaSys
            </span>
          )}
          {collapsed && (
            <span className="text-lg font-bold text-sidebar-primary mx-auto">IS</span>
          )}
        </div>

        {/* Company name */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-sidebar-border">
            <p className="text-xs text-sidebar-muted uppercase tracking-wider">Empresa</p>
            <p className="text-sm font-medium text-sidebar-foreground truncate">{companyName}</p>
          </div>
        )}

        {/* New project button */}
        <div className="px-2 pt-3">
          <Button
            size="sm"
            className={cn("w-full", collapsed && "px-2")}
            onClick={() => setShowNewProject(true)}
          >
            <Plus className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Novo Projeto</span>}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 space-y-1 px-2">
          {portalNavItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/portal"}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2"
              )}
              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-sidebar-border p-2 space-y-1">
          {/* Profile badge */}
          <button
            onClick={() => navigate("/portal/configuracoes")}
            className={cn(
              "flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
            {!collapsed && <span className="truncate text-sidebar-foreground">{userName}</span>}
          </button>
          <button
            onClick={() => signOut()}
            className={cn(
              "flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full rounded-md py-2 text-sm text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span className="ml-2">Recolher</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      <NewProjectRequestModal
        open={showNewProject}
        onOpenChange={setShowNewProject}
      />
    </div>
  );
}
