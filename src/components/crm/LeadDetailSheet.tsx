import { useState } from "react";
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
import { Plus, Trash2, Loader2, MapPin, User } from "lucide-react";
import { TaxSimulator } from "./TaxSimulator";
import { formatPhone } from "./NewLeadModal";
import { useLeadContacts, useCreateLeadContact, useDeleteLeadContact, type Lead } from "@/hooks/useLeads";
import { toast } from "sonner";

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  novo: { label: "Novo", className: "bg-blue-100 text-blue-800 border-blue-200" },
  qualificado: { label: "Qualificado", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  proposta: { label: "Proposta", className: "bg-purple-100 text-purple-800 border-purple-200" },
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

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes do Lead</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 mt-6">
          {/* Info principal */}
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
          </div>

          {/* Endereço */}
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
          <TaxSimulator lead={lead} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
