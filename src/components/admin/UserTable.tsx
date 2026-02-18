import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUsers, AdminUser } from "@/hooks/useUsers";
import { Pencil } from "lucide-react";
import { EditUserModal } from "./EditUserModal";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  gestor: "Gestor",
  closer: "Closer",
  consultor: "Consultor",
  cfo: "Admin Cliente",
  user: "Usuário",
};

export function UserTable() {
  const { users, isLoading } = useUsers();
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando...</div>;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Gestor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const roles = user.user_roles?.map((r) => r.role) || [];
            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.display_name || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{user.email || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.user_type === "staff" ? "LISTEC" : (user.company_name || "—")}</TableCell>
                <TableCell>
                  <Badge variant="outline">{user.user_type === "client" ? "Cliente" : "Staff"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {roles.length > 0 ? roles.map((r) => (
                      <Badge key={r} variant="secondary" className="text-xs">
                        {ROLE_LABELS[r] || r}
                      </Badge>
                    )) : <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.manager_name || "—"}
                </TableCell>
                <TableCell>
                  {user.is_deleted ? (
                    <Badge variant="destructive">Excluído</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Ativo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />
    </>
  );
}
