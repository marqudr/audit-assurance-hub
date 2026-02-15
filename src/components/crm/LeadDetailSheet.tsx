import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, MapPin, User, Pencil, X, Check } from "lucide-react";
import { TaxSimulator } from "./TaxSimulator";
import { PhaseChecklist } from "./PhaseChecklist";
import { formatPhone, formatBRL } from "./NewLeadModal";
import { useLeadContacts, useCreateLeadContact, useDeleteLeadContact, useUpdateLead, type Lead, type LeadStatus } from "@/hooks/useLeads";
import { toast } from "sonner";

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  prospeccao: { label: "Prospecção", className: "bg-blue-100 text-blue-800 border-blue-200" },
  qualificacao: { label: "Qualificação", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  diagnostico: { label: "Diagnóstico", className: "bg-orange-100 text-orange-800 border-orange-200" },
  proposta: { label: "Proposta", className: "bg-purple-100 text-purple-800 border-purple-200" },
  fechamento: { label: "Fechamento", className: "bg-green-100 text-green-800 border-green-200" },
  novo: { label: "Novo", className: "bg-blue-100 text-blue-800 border-blue-200" },
  qualificado: { label: "Qualificado", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  ganho: { label: "Ganho", className: "bg-green-100 text-green-800 border-green-200" },
};

function formatAddress(lead: Lead): string | null {
  const parts = [
    lead.address_street,
    lead.address_number,
    lead.address_complement,
    lead.address_neighborhood,
    lead.address_city && lead.address_state ? `${lead.address_city}/${lead.address_state}` : lead.address_city,
    lead.address_zip,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export function LeadDetailSheet({ lead, open, onOpenChange }: LeadDetailSheetProps) {
  const { data: contacts = [] } = useLeadContacts(lead?.id);
  const createContact = useCreateLeadContact();
  const deleteContact = useDeleteLeadContact();
  const updateLead = useUpdateLead();

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    company_name: "",
    cnpj: "",
    cnae: "",
    sector: "",
    revenue_range: "",
    tax_regime: "",
    fiscal_regime: "",
    status: "novo" as LeadStatus,
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    address_zip: "",
  });

  useEffect(() => {
    if (lead && editing) {
      setEditData({
        company_name: lead.company_name || "",
        cnpj: lead.cnpj || "",
        cnae: lead.cnae || "",
        sector: lead.sector || "",
        revenue_range: lead.revenue_range || "",
        tax_regime: lead.tax_regime || "",
        fiscal_regime: lead.fiscal_regime || "",
        status: lead.status,
        address_street: lead.address_street || "",
        address_number: lead.address_number || "",
        address_complement: lead.address_complement || "",
        address_neighborhood: lead.address_neighborhood || "",
        address_city: lead.address_city || "",
        address_state: lead.address_state || "",
        address_zip: lead.address_zip || "",
      });
    }
  }, [lead, editing]);

  if (!lead) return null;

  const status = statusConfig[lead.status] || statusConfig.novo;
  const address = formatAddress(lead);

  const handleAddContact = async () => {
    if (!newName.trim()) { toast.error("Informe o nome do contato."); return; }
    await createContact.mutateAsync({
      lead_id: lead.id,
      name: newName,
      role: newRole || undefined,
      phone: newPhone || undefined,
      email: newEmail || undefined,
    });
    setNewName(""); setNewRole(""); setNewPhone(""); setNewEmail("");
    setAdding(false);
    toast.success("Contato adicionado!");
  };

  const handleSaveEdit = async () => {
    if (!editData.company_name.trim()) {
      toast.error("Informe o nome da empresa.");
      return;
    }
    try {
      await updateLead.mutateAsync({
        id: lead.id,
        company_name: editData.company_name,
        cnpj: editData.cnpj || null,
        cnae: editData.cnae || null,
        sector: editData.sector || null,
        revenue_range: editData.revenue_range || null,
        tax_regime: editData.tax_regime || null,
        fiscal_regime: editData.fiscal_regime || null,
        status: editData.status,
        address_street: editData.address_street || null,
        address_number: editData.address_number || null,
        address_complement: editData.address_complement || null,
        address_neighborhood: editData.address_neighborhood || null,
        address_city: editData.address_city || null,
        address_state: editData.address_state || null,
        address_zip: editData.address_zip || null,
      } as any);
      toast.success("Lead atualizado com sucesso!");
      setEditing(false);
    } catch {
      toast.error("Erro ao atualizar lead.");
    }
  };

  const handleCancelEdit = () => setEditing(false);

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) setEditing(false); onOpenChange(v); }}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between pr-6">
            <SheetTitle>Detalhes do Lead</SheetTitle>
            {!editing ? (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" /> Editar
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveEdit} disabled={updateLead.isPending}>
                  {updateLead.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" /> Salvar</>}
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>
        <div className="space-y-6 mt-6">
          {/* Info principal */}
          {!editing ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{lead.company_name}</h3>
                <Badge variant="outline" className={status.className}>{status.label}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">CNPJ</span><p className="font-medium">{lead.cnpj || "—"}</p></div>
                <div><span className="text-muted-foreground">CNAE</span><p className="font-medium">{lead.cnae || "—"}</p></div>
                <div><span className="text-muted-foreground">Setor</span><p className="font-medium">{lead.sector || "—"}</p></div>
                <div><span className="text-muted-foreground">Faixa de Receita</span><p className="font-medium">{lead.revenue_range || "—"}</p></div>
                <div><span className="text-muted-foreground">Regime Tributário</span><p className="font-medium">{lead.tax_regime || "—"}</p></div>
                <div><span className="text-muted-foreground">Regime Fiscal</span><p className="font-medium">{lead.fiscal_regime || "—"}</p></div>
              </div>

              {address && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <MapPin className="h-4 w-4" /> Endereço
                    </div>
                    <p className="text-sm text-muted-foreground">{address}</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Razão Social</Label>
                  <Input value={editData.company_name} onChange={(e) => setEditData({ ...editData, company_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input value={editData.cnpj} onChange={(e) => setEditData({ ...editData, cnpj: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                   <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v as LeadStatus })}>
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="prospeccao">Prospecção</SelectItem>
                       <SelectItem value="qualificacao">Qualificação</SelectItem>
                       <SelectItem value="diagnostico">Diagnóstico</SelectItem>
                       <SelectItem value="proposta">Proposta</SelectItem>
                       <SelectItem value="fechamento">Fechamento</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                  <Label>CNAE</Label>
                  <Input value={editData.cnae} onChange={(e) => setEditData({ ...editData, cnae: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Setor</Label>
                  <Input value={editData.sector} onChange={(e) => setEditData({ ...editData, sector: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Faixa de Receita</Label>
                  <Input value={editData.revenue_range} onChange={(e) => setEditData({ ...editData, revenue_range: formatBRL(e.target.value) })} placeholder="R$ 0,00" />
                </div>
                <div className="space-y-2">
                  <Label>Regime Tributário</Label>
                  <Select value={editData.tax_regime} onValueChange={(v) => setEditData({ ...editData, tax_regime: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                      <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                      <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                      <SelectItem value="Lucro Arbitrado">Lucro Arbitrado</SelectItem>
                      <SelectItem value="MEI">MEI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Regime Fiscal</Label>
                  <Select value={editData.fiscal_regime} onValueChange={(v) => setEditData({ ...editData, fiscal_regime: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cumulativo">Cumulativo</SelectItem>
                      <SelectItem value="Não Cumulativo">Não Cumulativo</SelectItem>
                      <SelectItem value="Misto">Misto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />
              <h4 className="text-sm font-semibold flex items-center gap-2"><MapPin className="h-4 w-4" /> Endereço</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Logradouro</Label>
                  <Input value={editData.address_street} onChange={(e) => setEditData({ ...editData, address_street: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Número</Label>
                  <Input value={editData.address_number} onChange={(e) => setEditData({ ...editData, address_number: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Complemento</Label>
                  <Input value={editData.address_complement} onChange={(e) => setEditData({ ...editData, address_complement: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Bairro</Label>
                  <Input value={editData.address_neighborhood} onChange={(e) => setEditData({ ...editData, address_neighborhood: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Cidade</Label>
                  <Input value={editData.address_city} onChange={(e) => setEditData({ ...editData, address_city: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">UF</Label>
                  <Input maxLength={2} value={editData.address_state} onChange={(e) => setEditData({ ...editData, address_state: e.target.value.toUpperCase() })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CEP</Label>
                  <Input value={editData.address_zip} onChange={(e) => setEditData({ ...editData, address_zip: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {/* Contatos */}
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4" /> Contatos
              </div>
              <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
            {contacts.length === 0 && !adding && (
              <p className="text-xs text-muted-foreground">Nenhum contato cadastrado.</p>
            )}
            {contacts.map((c) => (
              <div key={c.id} className="flex items-start justify-between rounded-md border p-3 text-sm">
                <div className="space-y-0.5">
                  <p className="font-medium">{c.name}</p>
                  {c.role && <p className="text-xs text-muted-foreground">{c.role}</p>}
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {c.phone && <span>{c.phone}</span>}
                    {c.email && <span>{c.email}</span>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => deleteContact.mutate({ id: c.id, lead_id: lead.id })}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {adding && (
              <div className="space-y-3 rounded-md border p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Nome</Label><Input placeholder="Nome" value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
                  <div className="space-y-1"><Label className="text-xs">Cargo</Label><Input placeholder="Cargo" value={newRole} onChange={(e) => setNewRole(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Telefone</Label><Input placeholder="(11) 99999-9999" value={newPhone} onChange={(e) => setNewPhone(formatPhone(e.target.value))} /></div>
                  <div className="space-y-1"><Label className="text-xs">E-mail</Label><Input placeholder="email@empresa.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddContact} disabled={createContact.isPending}>
                    {createContact.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>

          <Separator />
          <PhaseChecklist leadId={lead.id} phase={lead.status} />

          <Separator />
          <TaxSimulator lead={lead} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
