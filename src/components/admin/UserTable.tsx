import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUsers, AdminUser } from "@/hooks/useUsers";
import { toast } from "@/hooks/use-toast";
import { Pencil } from "lucide-react";
import { EditUserModal } from "./EditUserModal";

export function UserTable() {
  const { users, isLoading, updateUserRole } = useUsers();
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const handleRoleChange = async (userId: string, oldRole: string, newRole: string) => {
    try {
      await updateUserRole.mutateAsync({ userId, oldRole, newRole });
      toast({ title: "Role atualizado" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

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
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const currentRole = user.user_roles?.[0]?.role || "user";
            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.display_name || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{user.email || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.company_name || "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{user.user_type === "client" ? "Cliente" : "Staff"}</Badge>
                </TableCell>
                <TableCell>
                  <Select value={currentRole} onValueChange={(v) => handleRoleChange(user.user_id, currentRole, v)}>
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="closer">Closer</SelectItem>
                      <SelectItem value="consultor">Consultor</SelectItem>
                      <SelectItem value="cfo">CFO</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
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
