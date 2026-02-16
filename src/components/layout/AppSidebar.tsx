import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  Bot,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ScrollText,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useUserRole";

const baseNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "CRM", url: "/crm", icon: Users },
  { title: "Empresas", url: "/empresas", icon: Building2 },
  { title: "Operações", url: "/operations", icon: FolderKanban },
  { title: "Agent Space", url: "/agent-space", icon: MessageSquare },
];

const adminNavItems = [
  { title: "Agent Studio", url: "/agent-studio", icon: Bot },
  { title: "Usuários", url: "/admin/users", icon: ShieldCheck },
  { title: "Auditoria", url: "/admin/audit", icon: ScrollText },
];

const bottomNavItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { hasRole: isAdmin } = useIsAdmin();

  const navItems = [
    ...baseNavItems,
    ...(isAdmin ? adminNavItems : []),
    ...bottomNavItems,
  ];

  return (
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
          <span className="text-lg font-bold text-sidebar-primary mx-auto">
            IS
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 space-y-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
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

      {/* Collapse Toggle */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full rounded-md py-2 text-sm text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
