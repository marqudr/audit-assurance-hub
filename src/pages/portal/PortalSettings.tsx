import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User, Save, Users, Plus, Shield, Upload, Loader2, Pencil } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useUserRoles } from "@/hooks/useUserRole";
import { useCompanyUsers, type CompanyUser } from "@/hooks/useCompanyUsers";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const roleConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  cfo: {
    label: "Admin",
    icon: <Shield className="h-3.5 w-3.5" />,
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  user: {
    label: "Usuário",
    icon: <Upload className="h-3.5 w-3.5" />,
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
};

export default function PortalSettings() {
  const { profile, isLoading: profileLoading, updateProfile } = useProfile();
  const { data: roles } = useUserRoles();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (profile && !initialized) {
    setDisplayName(profile.display_name || "");
    setAvatarUrl(profile.avatar_url || "");
    setInitialized(true);
  }

  const isCfo = roles?.includes("cfo") ?? false;
  const companyId = profile?.company_id;

  // CFO sees inactive users too
  const { data: companyUsers = [], isLoading: usersLoading } = useCompanyUsers(
    isCfo ? companyId ?? undefined : undefined,
    isCfo
  );

  // Invite state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
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
      const { error: nameError } = await supabase
        .from("profiles")
        .update({ display_name: editName })
        .eq("user_id", editUser.user_id);
      if (nameError) throw nameError;

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

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName,
        avatar_url: avatarUrl || undefined,
      });
      toast.success("Perfil atualizado com sucesso!");
    } catch {
      toast.error("Erro ao atualizar perfil.");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Informe o email do usuário.");
      return;
    }
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: {
          email: inviteEmail.trim(),
          role: inviteRole,
          user_type: "client",
          company_id: companyId,
          display_name: inviteName.trim() || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Convite enviado para ${inviteEmail}`);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("user");
      setInviteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["company-users", companyId] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao convidar usuário.");
    } finally {
      setInviting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      {/* Profile Section — all users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Meu Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome" />
          </div>
          <div className="space-y-2">
            <Label>URL do Avatar</Label>
            <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
          </div>
          <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar
          </Button>
        </CardContent>
      </Card>

      {/* User Management — CFO only */}
      {isCfo && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Usuários da Empresa ({companyUsers.length})
              </CardTitle>
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Convidar Usuário
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <p className="text-xs text-muted-foreground">Carregando...</p>
            ) : companyUsers.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Users className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Nenhum usuário vinculado.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {companyUsers.map((user) => {
                  const rc = roleConfig[user.role || "user"] || roleConfig.user;
                  return (
                    <div key={user.id} className="flex items-center justify-between rounded-md border px-4 py-3 group">
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
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input placeholder="Nome completo" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="usuario@empresa.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Perfil de Acesso</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cfo">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5" /> Admin (CFO)
                    </div>
                  </SelectItem>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <Upload className="h-3.5 w-3.5" /> Usuário
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

      {/* Edit Dialog — CFO only */}
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
