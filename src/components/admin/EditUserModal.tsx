import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useUsers, AdminUser } from "@/hooks/useUsers";
import { toast } from "@/hooks/use-toast";

const ALL_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "gestor", label: "Gestor" },
  { value: "closer", label: "Closer" },
  { value: "consultor", label: "Consultor" },
  { value: "cfo", label: "Admin Cliente" },
  { value: "user", label: "Usuário" },
];

interface EditUserModalProps {
  user: AdminUser | null;
  onClose: () => void;
}

export function EditUserModal({ user, onClose }: EditUserModalProps) {
  const { users, updateUserProfile, updateUserRoles, toggleUserActive } = useUsers();
  const [displayName, setDisplayName] = useState("");
  const [userType, setUserType] = useState("staff");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [managerId, setManagerId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const gestores = users.filter(
    (u) => u.user_roles?.some((r) => r.role === "gestor") && u.user_id !== user?.user_id
  );

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || "");
      setUserType(user.user_type || "staff");
      setSelectedRoles(user.user_roles?.map((r) => r.role) || []);
      setManagerId(user.manager_id || "");
      setIsActive(!user.is_deleted);
    }
  }, [user]);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile.mutateAsync({
        userId: user.user_id,
        updates: {
          display_name: displayName,
          user_type: userType,
          manager_id: managerId || null,
        },
      });

      const currentRoles = user.user_roles?.map((r) => r.role) || [];
      const rolesChanged =
        selectedRoles.length !== currentRoles.length ||
        selectedRoles.some((r) => !currentRoles.includes(r));
      if (rolesChanged) {
        await updateUserRoles.mutateAsync({
          userId: user.user_id,
          roles: selectedRoles,
        });
      }

      const wasActive = !user.is_deleted;
      if (isActive !== wasActive) {
        await toggleUserActive.mutateAsync({ userId: user.user_id, active: isActive });
      }

      toast({ title: "Usuário atualizado" });
      onClose();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <div className="rounded-md border p-2.5 text-sm text-muted-foreground">
              {user?.email || "—"}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Nome</label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Tipo</label>
            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff Interno</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Roles</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ROLES.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${r.value}`}
                    checked={selectedRoles.includes(r.value)}
                    onCheckedChange={() => toggleRole(r.value)}
                  />
                  <Label htmlFor={`role-${r.value}`} className="text-sm font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Gestor</label>
            <Select value={managerId || "none"} onValueChange={(val) => setManagerId(val === "none" ? "" : val)}>
              <SelectTrigger><SelectValue placeholder="Sem gestor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem gestor</SelectItem>
                {gestores.map((g) => (
                  <SelectItem key={g.user_id} value={g.user_id}>
                    {g.display_name || g.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Usuário ativo</p>
              <p className="text-xs text-muted-foreground">
                {isActive ? "O usuário pode acessar o sistema" : "O acesso do usuário está bloqueado"}
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
