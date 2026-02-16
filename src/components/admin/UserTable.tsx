import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUsers } from "@/hooks/useUsers";
import { toast } from "@/hooks/use-toast";

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  gestor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  closer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  consultor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  cfo: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  user: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export function UserTable() {
  const { users, isLoading, updateUserRole } = useUsers();

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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user: any) => {
          const currentRole = user.user_roles?.[0]?.role || "user";
          return (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.display_name || "—"}</TableCell>
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
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
