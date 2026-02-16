import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, Shield, Upload, Loader2, Pencil, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyUsers, type CompanyUser } from "@/hooks/useCompanyUsers";
import { useQueryClient } from "@tanstack/react-query";

interface CompanyUsersProps {
  companyId: string;
  companyName: string;
}

const roleConfig: Record<string, { label: string; description: string; icon: React.ReactNode; className: string }> = {
  cfo: {
    label: "Admin",
    description: "Leitura de todos os projetos + gestão de usuários",
    icon: <Shield className="h-3.5 w-3.5" />,
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  user: {
    label: "Usuário",
    description: "Upload apenas no Data Room de projetos específicos",
    icon: <Upload className="h-3.5 w-3.5" />,
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
};

export function CompanyUsers({ companyId, companyName }: CompanyUsersProps) {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useCompanyUsers(companyId, true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("user");
  const [inviting, setInviting] = useState(false);

  // Edit state
  const [editUser, setEditUser] = useState<CompanyUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const openEdit = (user: CompanyUser) => {
    setEditUser(user);
    setEditName(user.display_name || "");
    setEditActive(!user.is_deleted);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      // Update name
      const { error: nameError } = await supabase
        .from("profiles")
        .update({ display_name: editName })
        .eq("user_id", editUser.user_id);
      if (nameError) throw nameError;

      // Toggle status if changed
      const wasActive = !editUser.is_deleted;
      if (editActive !== wasActive) {
        const { data, error } = await supabase.functions.invoke("admin-toggle-user", {
          body: { user_id: editUser.user_id, active: editActive },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      }

      toast.success("Usuário atualizado.");
      setEditUser(null);
      queryClient.invalidateQueries({ queryKey: ["company-users", companyId] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error("Informe o email do usuário.");
      return;
    }

    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: {
          email: email.trim(),
          role,
          user_type: "client",
          company_id: companyId,
          display_name: displayName.trim() || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Convite enviado para ${email}`);
      setDisplayName("");
      setEmail("");
      setRole("user");
      setInviteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["company-users", companyId] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao convidar usuário.");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" /> Usuários da Empresa ({users.length})
            </CardTitle>
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Convidar Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Carregando...</p>
          ) : users.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Users className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhum usuário vinculado a esta empresa.</p>
              <p className="text-xs text-muted-foreground">Convide usuários para acessar o portal do cliente.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => {
                const rc = roleConfig[user.role || "user"] || roleConfig.user;
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-md border px-4 py-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                        {(user.display_name || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{user.display_name || "Sem nome"}</p>
                          {user.is_deleted && (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] px-1.5 py-0">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">ID: {user.user_id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={rc.className}>
                        {rc.icon}
                        <span className="ml-1">{rc.label}</span>
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={() => openEdit(user)}
                        title="Editar usuário"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissões Reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Níveis de Acesso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(roleConfig).map(([key, config]) => (
            <div key={key} className="flex items-start gap-3">
              <Badge variant="outline" className={config.className}>
                {config.icon}
                <span className="ml-1">{config.label}</span>
              </Badge>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Usuário — {companyName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input placeholder="Nome completo" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="usuario@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Perfil de Acesso</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cfo">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5" /> Admin (CFO) — Leitura total + gestão
                    </div>
                  </SelectItem>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <Upload className="h-3.5 w-3.5" /> Usuário — Upload no Data Room
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={inviting}>
              {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nome do usuário" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch checked={editActive} onCheckedChange={setEditActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
