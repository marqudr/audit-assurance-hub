import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useUsers, AdminUser } from "@/hooks/useUsers";
import { ChevronDown, ChevronRight, Pencil, User, Users } from "lucide-react";
import { EditUserModal } from "./EditUserModal";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  gestor: "Gestor",
  closer: "Closer",
  consultor: "Consultor",
  cfo: "Admin Cliente",
  user: "Usuário",
};

function UserNode({ user, onEdit }: { user: AdminUser; onEdit: (u: AdminUser) => void }) {
  const roles = user.user_roles?.map((r) => r.role) || [];
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50 group">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
        <User className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.display_name || user.email}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      <div className="flex flex-wrap gap-1">
        {roles.map((r) => (
          <Badge key={r} variant="secondary" className="text-xs">
            {ROLE_LABELS[r] || r}
          </Badge>
        ))}
      </div>
      {user.company_name && (
        <Badge variant="outline" className="text-xs">{user.company_name}</Badge>
      )}
      {user.is_deleted ? (
        <Badge variant="destructive" className="text-xs">Excluído</Badge>
      ) : (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">Ativo</Badge>
      )}
      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => onEdit(user)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function UserTree() {
  const { users, isLoading } = useUsers();
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando...</div>;

  const gestores = users.filter((u) => u.user_roles?.some((r) => r.role === "gestor"));
  const gestorIds = new Set(gestores.map((g) => g.user_id));

  const subordinatesByManager = new Map<string, AdminUser[]>();
  const unassigned: AdminUser[] = [];

  for (const user of users) {
    if (gestorIds.has(user.user_id)) continue; // gestores are root nodes
    if (user.manager_id && gestorIds.has(user.manager_id)) {
      const list = subordinatesByManager.get(user.manager_id) || [];
      list.push(user);
      subordinatesByManager.set(user.manager_id, list);
    } else {
      unassigned.push(user);
    }
  }

  return (
    <div className="space-y-2">
      {gestores.map((gestor) => {
        const subs = subordinatesByManager.get(gestor.user_id) || [];
        return (
          <GestorNode key={gestor.user_id} gestor={gestor} subordinates={subs} onEdit={setEditingUser} />
        );
      })}

      {unassigned.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-3 rounded-md hover:bg-muted/50 text-sm font-medium text-muted-foreground">
            <Users className="h-4 w-4" />
            Sem Gestor ({unassigned.length})
            <ChevronDown className="h-4 w-4 ml-auto" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="ml-6 border-l pl-3 space-y-0.5">
              {unassigned.map((u) => (
                <UserNode key={u.user_id} user={u} onEdit={setEditingUser} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />
    </div>
  );
}

function GestorNode({
  gestor,
  subordinates,
  onEdit,
}: {
  gestor: AdminUser;
  subordinates: AdminUser[];
  onEdit: (u: AdminUser) => void;
}) {
  const [open, setOpen] = useState(true);
  const roles = gestor.user_roles?.map((r) => r.role) || [];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-3 w-full py-2 px-3 rounded-md hover:bg-muted/50">
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium truncate">{gestor.display_name || gestor.email}</p>
          <p className="text-xs text-muted-foreground">{subordinates.length} subordinado{subordinates.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {roles.map((r) => (
            <Badge key={r} variant="secondary" className="text-xs">
              {ROLE_LABELS[r] || r}
            </Badge>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => { e.stopPropagation(); onEdit(gestor); }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-6 border-l pl-3 space-y-0.5">
          {subordinates.length > 0 ? (
            subordinates.map((u) => (
              <UserNode key={u.user_id} user={u} onEdit={onEdit} />
            ))
          ) : (
            <p className="text-xs text-muted-foreground py-2 px-3">Nenhum subordinado</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
