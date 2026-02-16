import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, MapPin, Target, User, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import { useLeadContacts, useCreateLeadContact, useDeleteLeadContact, type Lead } from "@/hooks/useLeads";
import { TaxSimulator } from "@/components/crm/TaxSimulator";

interface CompanyOverviewProps {
  lead: Lead;
}

function formatAddress(lead: Lead): string | null {
  const parts = [
    lead.address_street, lead.address_number, lead.address_complement,
    lead.address_neighborhood,
    lead.address_city && lead.address_state ? `${lead.address_city}/${lead.address_state}` : lead.address_city,
    lead.address_zip,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export function CompanyOverview({ lead }: CompanyOverviewProps) {
  const { data: contacts = [] } = useLeadContacts(lead.id);
  const createContact = useCreateLeadContact();
  const deleteContact = useDeleteLeadContact();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const address = formatAddress(lead);

  const icpScore = lead.icp_score ?? 0;
  const icpBadgeClass = icpScore < 5 ? "bg-red-100 text-red-700 border-red-200" :
    icpScore < 7.5 ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
    "bg-green-100 text-green-700 border-green-200";

  const handleAddContact = async () => {
    if (!newName.trim()) { toast.error("Informe o nome do contato."); return; }
    await createContact.mutateAsync({ lead_id: lead.id, name: newName, role: newRole || undefined, phone: newPhone || undefined, email: newEmail || undefined });
    setNewName(""); setNewRole(""); setNewPhone(""); setNewEmail("");
    setAdding(false);
    toast.success("Contato adicionado!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      {/* Dados Cadastrais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Dados Cadastrais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-muted-foreground">CNPJ</span><p className="font-medium">{lead.cnpj || "—"}</p></div>
            <div><span className="text-muted-foreground">CNAE</span><p className="font-medium">{lead.cnae || "—"}</p></div>
            <div><span className="text-muted-foreground">Setor</span><p className="font-medium">{lead.sector || "—"}</p></div>
            <div><span className="text-muted-foreground">Faturamento</span><p className="font-medium">{lead.revenue_range || "—"}</p></div>
            <div><span className="text-muted-foreground">Regime Tributário</span><p className="font-medium">{lead.tax_regime || "—"}</p></div>
            <div><span className="text-muted-foreground">Regime Fiscal</span><p className="font-medium">{lead.fiscal_regime || "—"}</p></div>
          </div>
          {address && (
            <>
              <Separator />
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm">{address}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Elegibilidade ICP */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" /> Elegibilidade ICP
            <Badge variant="outline" className={icpBadgeClass}>{icpScore}/10</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={lead.tax_regime === "Lucro Real" ? "text-green-600" : "text-muted-foreground"}>
                {lead.tax_regime === "Lucro Real" ? "✅" : "⬜"} Regime Tributário: Lucro Real
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={lead.has_lucro_fiscal ? "text-green-600" : "text-muted-foreground"}>
                {lead.has_lucro_fiscal ? "✅" : "⬜"} Resultado Fiscal positivo
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={lead.has_regularidade_fiscal ? "text-green-600" : "text-muted-foreground"}>
                {lead.has_regularidade_fiscal ? "✅" : "⬜"} Regularidade Fiscal (CND/CPEND)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={(lead.rd_annual_budget && lead.rd_annual_budget > 0) ? "text-green-600" : "text-muted-foreground"}>
                {(lead.rd_annual_budget && lead.rd_annual_budget > 0) ? "✅" : "⬜"} Investimento em P&D comprovado
              </span>
            </div>
          </div>
          <Separator />
          <TaxSimulator lead={lead as any} />
        </CardContent>
      </Card>

      {/* Contatos */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" /> Contatos ({contacts.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setAdding(!adding)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Contato
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {adding && (
            <div className="flex items-end gap-2 mb-3 pb-3 border-b">
              <Input placeholder="Nome" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1" />
              <Input placeholder="Cargo" value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-28" />
              <Input placeholder="Telefone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-32" />
              <Input placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-40" />
              <Button size="sm" onClick={handleAddContact} disabled={createContact.isPending}>Salvar</Button>
            </div>
          )}
          {contacts.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Nenhum contato cadastrado.</p>
          ) : (
            <div className="space-y-1">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs group">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{c.name}</span>
                    {c.role && <span className="text-muted-foreground">{c.role}</span>}
                    {c.phone && <span className="text-muted-foreground">{c.phone}</span>}
                    {c.email && <span className="text-muted-foreground">{c.email}</span>}
                  </div>
                  <Button
                    variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => deleteContact.mutate({ id: c.id, lead_id: lead.id })}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
