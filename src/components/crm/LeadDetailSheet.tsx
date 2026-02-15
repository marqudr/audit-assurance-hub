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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, Loader2, MapPin, User, Pencil, X, Check, CalendarIcon, Clock, Ghost, Target, ShieldCheck, TrendingUp, Megaphone } from "lucide-react";
import { TaxSimulator } from "./TaxSimulator";
import { PhaseChecklist } from "./PhaseChecklist";
import { formatPhone, formatBRL, parseBRL } from "./NewLeadModal";
import { useLeadContacts, useCreateLeadContact, useDeleteLeadContact, useUpdateLead, type Lead, type LeadStatus } from "@/hooks/useLeads";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
    lead.address_street, lead.address_number, lead.address_complement,
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

  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});

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
        source_medium: lead.source_medium || "",
        first_touch_channel: lead.first_touch_channel || "",
        last_touch_channel: lead.last_touch_channel || "",
        estimated_cac: lead.estimated_cac ? formatBRL(String(Math.round(lead.estimated_cac * 100))) : "",
        icp_score: lead.icp_score ?? 5,
        qualification_method: lead.qualification_method || "",
        has_budget: lead.has_budget ?? false,
        has_authority: lead.has_authority ?? false,
        has_need: lead.has_need ?? false,
        has_timeline: lead.has_timeline ?? false,
        pain_points: lead.pain_points || "",
        next_action: lead.next_action || "",
        next_action_date: lead.next_action_date ? new Date(lead.next_action_date) : undefined,
        content_consumed: lead.content_consumed || "",
        estimated_ltv: lead.estimated_ltv ? formatBRL(String(Math.round(lead.estimated_ltv * 100))) : "",
        probability: lead.probability ?? 50,
        deal_value: lead.deal_value ? formatBRL(String(Math.round(lead.deal_value * 100))) : "",
        expected_close_date: lead.expected_close_date ? new Date(lead.expected_close_date) : undefined,
      });
    }
    // Only run when editing is toggled on, not when lead data changes mid-edit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  if (!lead) return null;

  const status = statusConfig[lead.status] || statusConfig.novo;
  const address = formatAddress(lead);
  const timeInStage = differenceInDays(new Date(), new Date(lead.updated_at));
  const tisColor = timeInStage > 14 ? "text-red-600" : timeInStage > 7 ? "text-yellow-600" : "text-green-600";
  const bantScore = [lead.has_budget, lead.has_authority, lead.has_need, lead.has_timeline].filter(Boolean).length;

  const handleAddContact = async () => {
    if (!newName.trim()) { toast.error("Informe o nome do contato."); return; }
    await createContact.mutateAsync({ lead_id: lead.id, name: newName, role: newRole || undefined, phone: newPhone || undefined, email: newEmail || undefined });
    setNewName(""); setNewRole(""); setNewPhone(""); setNewEmail("");
    setAdding(false);
    toast.success("Contato adicionado!");
  };

  const handleSaveEdit = async () => {
    if (!editData.company_name?.trim()) { toast.error("Informe o nome da empresa."); return; }
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
        // Attribution
        source_medium: editData.source_medium || null,
        first_touch_channel: editData.first_touch_channel || null,
        last_touch_channel: editData.last_touch_channel || null,
        estimated_cac: editData.estimated_cac ? parseBRL(editData.estimated_cac) : null,
        // Qualification
        icp_score: editData.icp_score,
        qualification_method: editData.qualification_method || null,
        has_budget: editData.has_budget,
        has_authority: editData.has_authority,
        has_need: editData.has_need,
        has_timeline: editData.has_timeline,
        pain_points: editData.pain_points || null,
        // Velocity
        next_action: editData.next_action || null,
        next_action_date: editData.next_action_date ? editData.next_action_date.toISOString() : null,
        content_consumed: editData.content_consumed || null,
        // Revenue
        estimated_ltv: editData.estimated_ltv ? parseBRL(editData.estimated_ltv) : null,
        probability: editData.probability,
        deal_value: editData.deal_value ? parseBRL(editData.deal_value) : null,
        expected_close_date: editData.expected_close_date ? format(editData.expected_close_date, "yyyy-MM-dd") : null,
      } as any);
      toast.success("Lead atualizado com sucesso!");
      setEditing(false);
    } catch {
      toast.error("Erro ao atualizar lead.");
    }
  };

  const handleCancelEdit = () => setEditing(false);
  const ed = (field: string, value: any) => setEditData((prev) => ({ ...prev, [field]: value }));

  const readOnlySections = (
    <Accordion type="multiple" defaultValue={["attribution", "qualification", "velocity", "revenue"]} className="w-full">
      {/* Attribution */}
      <AccordionItem value="attribution">
        <AccordionTrigger className="text-sm">
          <span className="flex items-center gap-2"><Megaphone className="h-4 w-4" /> Atribuição e Origem</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Source/Medium</span><p className="font-medium">{lead.source_medium || "—"}</p></div>
            <div><span className="text-muted-foreground">Primeiro Toque</span><p className="font-medium">{lead.first_touch_channel || "—"}</p></div>
            <div><span className="text-muted-foreground">Último Toque</span><p className="font-medium">{lead.last_touch_channel || "—"}</p></div>
            <div><span className="text-muted-foreground">CAC Estimado</span><p className="font-medium">{lead.estimated_cac ? `R$ ${lead.estimated_cac.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</p></div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Qualification */}
      <AccordionItem value="qualification">
        <AccordionTrigger className="text-sm">
          <span className="flex items-center gap-2"><Target className="h-4 w-4" /> Qualificação e Fit</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ICP Score</span>
              <Badge variant="outline" className={cn(
                lead.icp_score != null && lead.icp_score <= 3 ? "bg-red-100 text-red-700 border-red-200" :
                lead.icp_score != null && lead.icp_score <= 6 ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                lead.icp_score != null ? "bg-green-100 text-green-700 border-green-200" : ""
              )}>{lead.icp_score ?? "—"}/10</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Método</span>
              <span className="font-medium">{lead.qualification_method || "—"}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">BANT</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <ShieldCheck className="h-3 w-3 mr-1" /> {bantScore}/4
              </Badge>
            </div>
            <div className="flex gap-4 text-xs">
              <span className={lead.has_budget ? "text-green-600 font-medium" : "text-muted-foreground"}>💰 Budget</span>
              <span className={lead.has_authority ? "text-green-600 font-medium" : "text-muted-foreground"}>👤 Authority</span>
              <span className={lead.has_need ? "text-green-600 font-medium" : "text-muted-foreground"}>🎯 Need</span>
              <span className={lead.has_timeline ? "text-green-600 font-medium" : "text-muted-foreground"}>⏰ Timeline</span>
            </div>
            <div><span className="text-muted-foreground">Pain Points</span><p className="font-medium text-sm mt-1">{lead.pain_points || "—"}</p></div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Velocity */}
      <AccordionItem value="velocity">
        <AccordionTrigger className="text-sm">
          <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Velocidade e Saúde</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Time in Stage</span>
              <span className={cn("font-medium", tisColor)}>{timeInStage} dias</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Próximo Passo</span>
              {lead.next_action ? (
                <span className="font-medium">{lead.next_action}</span>
              ) : (
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                  <Ghost className="h-3 w-3 mr-1" /> Zumbi
                </Badge>
              )}
            </div>
            {lead.next_action_date && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Data Próximo Passo</span>
                <span className="font-medium">{format(new Date(lead.next_action_date), "dd/MM/yyyy")}</span>
              </div>
            )}
            <div><span className="text-muted-foreground">Conteúdo Consumido</span><p className="font-medium text-sm mt-1">{lead.content_consumed || "—"}</p></div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Revenue */}
      <AccordionItem value="revenue">
        <AccordionTrigger className="text-sm">
          <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Projeção de Receita</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">LTV Estimado</span><p className="font-medium">{lead.estimated_ltv ? `R$ ${lead.estimated_ltv.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</p></div>
            <div><span className="text-muted-foreground">Valor do Negócio</span><p className="font-medium">{lead.deal_value ? `R$ ${lead.deal_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</p></div>
            <div><span className="text-muted-foreground">Probabilidade</span><p className="font-medium">{lead.probability != null ? `${lead.probability}%` : "—"}</p></div>
            <div><span className="text-muted-foreground">Fechamento Esperado</span><p className="font-medium">{lead.expected_close_date ? format(new Date(lead.expected_close_date), "dd/MM/yyyy") : "—"}</p></div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  const editSections = (
    <Accordion type="multiple" defaultValue={["attribution", "qualification", "velocity", "revenue"]} className="w-full">
      {/* Attribution Edit */}
      <AccordionItem value="attribution">
        <AccordionTrigger className="text-sm">
          <span className="flex items-center gap-2"><Megaphone className="h-4 w-4" /> Atribuição e Origem</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs">Source/Medium</Label><Input value={editData.source_medium} onChange={(e) => ed("source_medium", e.target.value)} placeholder="Google Ads / CPC" /></div>
            <div className="space-y-1"><Label className="text-xs">Primeiro Toque</Label><Input value={editData.first_touch_channel} onChange={(e) => ed("first_touch_channel", e.target.value)} placeholder="Webinar" /></div>
            <div className="space-y-1"><Label className="text-xs">Último Toque</Label><Input value={editData.last_touch_channel} onChange={(e) => ed("last_touch_channel", e.target.value)} placeholder="Formulário site" /></div>
            <div className="space-y-1"><Label className="text-xs">CAC Estimado</Label><Input value={editData.estimated_cac} onChange={(e) => ed("estimated_cac", formatBRL(e.target.value))} placeholder="R$ 0,00" /></div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Qualification Edit */}
      <AccordionItem value="qualification">
        <AccordionTrigger className="text-sm">
          <span className="flex items-center gap-2"><Target className="h-4 w-4" /> Qualificação e Fit</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">ICP Score: {editData.icp_score}/10</Label>
              <Slider value={[editData.icp_score ?? 5]} onValueChange={([v]) => ed("icp_score", v)} min={0} max={10} step={1} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Método de Qualificação</Label>
              <Select value={editData.qualification_method} onValueChange={(v) => ed("qualification_method", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANT">BANT</SelectItem>
                  <SelectItem value="ANUM">ANUM</SelectItem>
                  <SelectItem value="MEDDIC">MEDDIC</SelectItem>
                  <SelectItem value="SPIN">SPIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">BANT</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "has_budget", label: "Budget (Orçamento)" },
                  { key: "has_authority", label: "Authority (Autoridade)" },
                  { key: "has_need", label: "Need (Necessidade)" },
                  { key: "has_timeline", label: "Timeline (Urgência)" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={editData[key]} onCheckedChange={(v) => ed(key, !!v)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Pain Points</Label>
              <Textarea value={editData.pain_points} onChange={(e) => ed("pain_points", e.target.value)} placeholder="Dores identificadas..." rows={3} />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Velocity Edit */}
      <AccordionItem value="velocity">
        <AccordionTrigger className="text-sm">
          <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Velocidade e Saúde</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Time in Stage</span>
              <span className={cn("font-medium", tisColor)}>{timeInStage} dias</span>
            </div>
            <div className="space-y-1"><Label className="text-xs">Próximo Passo</Label><Input value={editData.next_action} onChange={(e) => ed("next_action", e.target.value)} placeholder="Ex: Enviar proposta técnica" /></div>
            <div className="space-y-1">
              <Label className="text-xs">Data Próximo Passo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editData.next_action_date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editData.next_action_date ? format(editData.next_action_date, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editData.next_action_date} onSelect={(d) => ed("next_action_date", d)} locale={ptBR} /></PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1"><Label className="text-xs">Conteúdo Consumido</Label><Textarea value={editData.content_consumed} onChange={(e) => ed("content_consumed", e.target.value)} placeholder="Whitepapers, webinars..." rows={2} /></div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Revenue Edit */}
      <AccordionItem value="revenue">
        <AccordionTrigger className="text-sm">
          <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Projeção de Receita</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">LTV Estimado</Label><Input value={editData.estimated_ltv} onChange={(e) => ed("estimated_ltv", formatBRL(e.target.value))} placeholder="R$ 0,00" /></div>
              <div className="space-y-1"><Label className="text-xs">Valor do Negócio</Label><Input value={editData.deal_value} onChange={(e) => ed("deal_value", formatBRL(e.target.value))} placeholder="R$ 0,00" /></div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Probabilidade: {editData.probability}%</Label>
              <Slider value={[editData.probability ?? 50]} onValueChange={([v]) => ed("probability", v)} min={0} max={100} step={5} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Data de Fechamento Esperada</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editData.expected_close_date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editData.expected_close_date ? format(editData.expected_close_date, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editData.expected_close_date} onSelect={(d) => ed("expected_close_date", d)} locale={ptBR} /></PopoverContent>
              </Popover>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

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
                    <div className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4" /> Endereço</div>
                    <p className="text-sm text-muted-foreground">{address}</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2"><Label>Razão Social</Label><Input value={editData.company_name} onChange={(e) => ed("company_name", e.target.value)} /></div>
                <div className="space-y-2"><Label>CNPJ</Label><Input value={editData.cnpj} onChange={(e) => ed("cnpj", e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editData.status} onValueChange={(v) => ed("status", v)}>
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
                <div className="space-y-2"><Label>CNAE</Label><Input value={editData.cnae} onChange={(e) => ed("cnae", e.target.value)} /></div>
                <div className="space-y-2"><Label>Setor</Label><Input value={editData.sector} onChange={(e) => ed("sector", e.target.value)} /></div>
                <div className="space-y-2"><Label>Faixa de Receita</Label><Input value={editData.revenue_range} onChange={(e) => ed("revenue_range", formatBRL(e.target.value))} placeholder="R$ 0,00" /></div>
                <div className="space-y-2">
                  <Label>Regime Tributário</Label>
                  <Select value={editData.tax_regime} onValueChange={(v) => ed("tax_regime", v)}>
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
                  <Select value={editData.fiscal_regime} onValueChange={(v) => ed("fiscal_regime", v)}>
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
                <div className="col-span-2 space-y-1"><Label className="text-xs">Logradouro</Label><Input value={editData.address_street} onChange={(e) => ed("address_street", e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-xs">Número</Label><Input value={editData.address_number} onChange={(e) => ed("address_number", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Complemento</Label><Input value={editData.address_complement} onChange={(e) => ed("address_complement", e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-xs">Bairro</Label><Input value={editData.address_neighborhood} onChange={(e) => ed("address_neighborhood", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label className="text-xs">Cidade</Label><Input value={editData.address_city} onChange={(e) => ed("address_city", e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-xs">UF</Label><Input maxLength={2} value={editData.address_state} onChange={(e) => ed("address_state", e.target.value.toUpperCase())} /></div>
                <div className="space-y-1"><Label className="text-xs">CEP</Label><Input value={editData.address_zip} onChange={(e) => ed("address_zip", e.target.value)} /></div>
              </div>
            </div>
          )}

          {/* Enrichment Sections */}
          <Separator />
          {!editing ? readOnlySections : editSections}

          {/* Contatos */}
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold"><User className="h-4 w-4" /> Contatos</div>
              <Button variant="ghost" size="sm" onClick={() => setAdding(true)}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
            </div>
            {contacts.length === 0 && !adding && <p className="text-xs text-muted-foreground">Nenhum contato cadastrado.</p>}
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
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => deleteContact.mutate({ id: c.id, lead_id: lead.id })}><Trash2 className="h-3 w-3" /></Button>
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
                  <Button size="sm" onClick={handleAddContact} disabled={createContact.isPending}>{createContact.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
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
