import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useUsers } from "@/hooks/useUsers";
import { useLeads } from "@/hooks/useLeads";
import { toast } from "@/hooks/use-toast";

const ALL_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "gestor", label: "Gestor" },
  { value: "closer", label: "Closer" },
  { value: "consultor", label: "Consultor" },
  { value: "cfo", label: "Admin Cliente" },
  { value: "user", label: "Usuário" },
];

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserModal({ open, onOpenChange }: InviteUserModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["user"]);
  const [userType, setUserType] = useState("staff");
  const [companyId, setCompanyId] = useState<string>("");
  const [managerId, setManagerId] = useState<string>("");
  const { inviteUser, users } = useUsers();
  const { data: leads } = useLeads();

  const gestores = users.filter((u) => u.user_roles?.some((r) => r.role === "gestor"));

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async () => {
    if (!email) return;
    if (selectedRoles.length === 0) {
      toast({ title: "Selecione ao menos uma role", variant: "destructive" });
      return;
    }
    try {
      await inviteUser.mutateAsync({
        email,
        roles: selectedRoles,
        user_type: userType,
        display_name: displayName || undefined,
        company_id: userType === "client" ? companyId || null : null,
        manager_id: managerId || null,
      });
      toast({ title: "Convite enviado", description: `Convite enviado para ${email}` });
      onOpenChange(false);
      setDisplayName("");
      setEmail("");
      setSelectedRoles(["user"]);
      setUserType("staff");
      setCompanyId("");
      setManagerId("");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Usuário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@empresa.com" />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff (Interno)</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ROLES.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`invite-role-${r.value}`}
                    checked={selectedRoles.includes(r.value)}
                    onCheckedChange={() => toggleRole(r.value)}
                  />
                  <Label htmlFor={`invite-role-${r.value}`} className="text-sm font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Gestor</Label>
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
          {userType === "client" && (
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger><SelectValue placeholder="Selecionar empresa" /></SelectTrigger>
                <SelectContent>
                  {(leads || []).map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>{lead.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={inviteUser.isPending}>
            {inviteUser.isPending ? "Enviando..." : "Enviar Convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
