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
  ganho: { label: "Ganho", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  perdido: { label: "Perdido", className: "bg-red-100 text-red-800 border-red-200" },
  novo: { label: "Novo", className: "bg-blue-100 text-blue-800 border-blue-200" },
  qualificado: { label: "Qualificado", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
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
        // Eligibility fields for ICP auto-calc
        has_lucro_fiscal: lead.has_lucro_fiscal ?? false,
        has_regularidade_fiscal: lead.has_regularidade_fiscal ?? false,
        qualification_method: lead.qualification_method || "",
        has_budget: lead.has_budget ?? false,
        has_authority: lead.has_authority ?? false,
        has_need: lead.has_need ?? false,
        has_timeline: lead.has_timeline ?? false,
        pain_points: lead.pain_points || "",
        context: lead.context || "",
        objection: lead.objection || "",
        next_action: lead.next_action || "",
        next_action_date: lead.next_action_date ? new Date(lead.next_action_date) : undefined,
        content_consumed: lead.content_consumed || "",
        last_contacted_date: lead.last_contacted_date ? new Date(lead.last_contacted_date) : undefined,
        last_activity_type: lead.last_activity_type || "",
        next_activity_date: lead.next_activity_date ? new Date(lead.next_activity_date) : undefined,
        estimated_ltv: lead.estimated_ltv ? formatBRL(String(Math.round(lead.estimated_ltv * 100))) : "",
        probability: lead.probability ?? 50,
        deal_value: lead.deal_value ? formatBRL(String(Math.round(lead.deal_value * 100))) : "",
        expected_close_date: lead.expected_close_date ? new Date(lead.expected_close_date) : undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  if (!lead) return null;

  const status = statusConfig[lead.status] || statusConfig.novo;
  const address = formatAddress(lead);
  const timeInStage = differenceInDays(new Date(), new Date(lead.updated_at));
  const tisColor = timeInStage > 14 ? "text-red-600" : timeInStage > 7 ? "text-yellow-600" : "text-green-600";
  const bantScore = [lead.has_budget, lead.has_authority, lead.has_need, lead.has_timeline].filter(Boolean).length;

  // Auto-calculated ICP Score based on eligibility
  const calcIcpScore = (data: Record<string, any>) => {
    let score = 0;
    if (data.tax_regime === "Lucro Real") score += 2.5;
    if (data.has_lucro_fiscal) score += 2.5;
    if (data.has_regularidade_fiscal) score += 2.5;
    if (lead.rd_annual_budget && lead.rd_annual_budget > 0) score += 2.5;
    return score;
  };
  const currentIcpScore = calcIcpScore({
    tax_regime: lead.tax_regime,
    has_lucro_fiscal: lead.has_lucro_fiscal,
    has_regularidade_fiscal: lead.has_regularidade_fiscal,
  });
  const icpBadgeClass = currentIcpScore < 5 ? "bg-red-100 text-red-700 border-red-200" :
    currentIcpScore < 7.5 ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
    "bg-green-100 text-green-700 border-green-200";

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
      const computedIcp = calcIcpScore(editData);
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
        source_medium: editData.source_medium || null,
        first_touch_channel: editData.first_touch_channel || null,
        last_touch_channel: editData.last_touch_channel || null,
        estimated_cac: editData.estimated_cac ? parseBRL(editData.estimated_cac) : null,
        // Auto-calculated ICP
        icp_score: computedIcp,
        has_lucro_fiscal: editData.has_lucro_fiscal,
        has_regularidade_fiscal: editData.has_regularidade_fiscal,
        qualification_method: editData.qualification_method || null,
        has_budget: editData.has_budget,
        has_authority: editData.has_authority,
        has_need: editData.has_need,
        has_timeline: editData.has_timeline,
        pain_points: editData.pain_points || null,
        context: editData.context || null,
        objection: editData.objection || null,
        next_action: editData.next_action || null,
        next_action_date: editData.next_action_date ? editData.next_action_date.toISOString() : null,
        content_consumed: editData.content_consumed || null,
        last_contacted_date: editData.last_contacted_date ? editData.last_contacted_date.toISOString() : null,
        last_activity_type: editData.last_activity_type || null,
        next_activity_date: editData.next_activity_date ? editData.next_activity_date.toISOString() : null,
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
    <Accordion type="multiple" defaultValue={["attribution", "qualification", "revenue"]} className="w-full">
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
            {/* Elegibilidade ICP */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Elegibilidade (ICP Score)</span>
                <Badge variant="outline" className={icpBadgeClass}>{currentIcpScore}/10</Badge>
              </div>
              <div className="space-y-1.5 text-xs">
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
            </div>
            <Separator />
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
            <div><span className="text-muted-foreground">Dor</span><p className="font-medium text-sm mt-1">{lead.pain_points || "—"}</p></div>
            <div><span className="text-muted-foreground">Contexto</span><p className="font-medium text-sm mt-1">{lead.context || "—"}</p></div>
            <div><span className="text-muted-foreground">Objeção</span><p className="font-medium text-sm mt-1">{lead.objection || "—"}</p></div>
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
          {(lead.estimated_benefit_min && lead.estimated_benefit_max) && (
            <div className="mt-3 p-3 rounded-md bg-muted/50 border">
              <p className="text-xs text-muted-foreground mb-1">Benefício Fiscal Estimado (Lei do Bem)</p>
              <p className="text-lg font-bold text-primary">
                R$ {lead.estimated_benefit_min.toLocaleString("pt-BR", { minimumFractionDigits: 0 })} – R$ {lead.estimated_benefit_max.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
              </p>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  const editSections = (
    <Accordion type="multiple" defaultValue={["attribution", "qualification", "revenue"]} className="w-full">
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
            {/* Eligibility checkboxes for auto ICP */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Elegibilidade (ICP Score): {calcIcpScore(editData)}/10</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={editData.tax_regime === "Lucro Real"} onCheckedChange={(v) => ed("tax_regime", v ? "Lucro Real" : "")} />
                  Regime Tributário: Lucro Real
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={editData.has_lucro_fiscal} onCheckedChange={(v) => ed("has_lucro_fiscal", !!v)} />
                  Resultado Fiscal positivo no ano-base
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={editData.has_regularidade_fiscal} onCheckedChange={(v) => ed("has_regularidade_fiscal", !!v)} />
                  Regularidade Fiscal (CND/CPEND ativa)
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer text-muted-foreground">
                  <Checkbox checked={!!(lead.rd_annual_budget && lead.rd_annual_budget > 0)} disabled />
                  Investimento em P&D comprovado (via Simulador Fiscal)
                </label>
              </div>
              <Badge variant="outline" className={calcIcpScore(editData) < 5 ? "bg-red-100 text-red-700 border-red-200" : calcIcpScore(editData) < 7.5 ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-green-100 text-green-700 border-green-200"}>
                Score: {calcIcpScore(editData)}/10
              </Badge>
            </div>
            <Separator />
            <div className="space-y-1">
              <Label className="text-xs">Método de Qualificação</Label>
              <Select value={editData.qualification_method} onValueChange={(v) => ed("qualification_method", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione um método" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANT">Orçamento, Decisor, Necessidade e Prazo</SelectItem>
                  <SelectItem value="ANUM">Autoridade, Necessidade, Urgência e Dinheiro</SelectItem>
                  <SelectItem value="MEDDIC">Métricas, Decisor e Critérios de Decisão</SelectItem>
                  <SelectItem value="SPIN">Situação, Problema, Implicação e Solução</SelectItem>
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
              <Label className="text-xs">Dor</Label>
              <Textarea value={editData.pain_points} onChange={(e) => ed("pain_points", e.target.value)} placeholder="Dores identificadas..." rows={3} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Contexto</Label>
              <Textarea value={editData.context} onChange={(e) => ed("context", e.target.value)} placeholder="Contexto do lead..." rows={3} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Objeção</Label>
              <Textarea value={editData.objection} onChange={(e) => ed("objection", e.target.value)} placeholder="Objeções identificadas..." rows={3} />
            </div>
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
      <SheetContent className="sm:max-w-3xl overflow-y-auto">
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
                      <SelectItem value="ganho">Ganho</SelectItem>
                      <SelectItem value="perdido">Perdido</SelectItem>
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

          {/* Simulador de Potencial Fiscal — hide proposal button in qualification */}
          <Separator />
          <TaxSimulator lead={lead} hideProposalButton={lead.status === "qualificacao"} />

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

          {/* Enrichment Sections */}
          <Separator />
          {!editing ? readOnlySections : editSections}

          {/* Phase Checklist */}
          <Separator />
          <PhaseChecklist leadId={lead.id} phase={lead.status} />

          {/* Velocidade e Saúde — por último */}
          <Separator />
          {!editing ? (
            <div className="space-y-3 text-sm">
              <h4 className="text-sm font-semibold flex items-center gap-2"><Clock className="h-4 w-4" /> Velocidade e Saúde</h4>
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
              <Separator />
              <h4 className="text-sm font-semibold">Histórico de Interações</h4>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Último Contato</span>
                <span className="font-medium">{lead.last_contacted_date ? format(new Date(lead.last_contacted_date), "dd/MM/yyyy") : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tipo de Atividade</span>
                <span className="font-medium">{lead.last_activity_type === "email" ? "E-mail" : lead.last_activity_type === "reuniao" ? "Reunião" : lead.last_activity_type === "ligacao" ? "Ligação" : lead.last_activity_type || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Próxima Atividade</span>
                <span className="font-medium">{lead.next_activity_date ? format(new Date(lead.next_activity_date), "dd/MM/yyyy") : "—"}</span>
              </div>
              <Separator />
              <div><span className="text-muted-foreground">Notas</span><p className="font-medium text-sm mt-1">{lead.content_consumed || "—"}</p></div>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2"><Clock className="h-4 w-4" /> Velocidade e Saúde</h4>
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
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editData.next_action_date} onSelect={(d) => ed("next_action_date", d)} locale={ptBR} className="pointer-events-auto" /></PopoverContent>
                </Popover>
              </div>
              <Separator />
              <h4 className="text-sm font-semibold">Histórico de Interações</h4>
              <div className="space-y-1">
                <Label className="text-xs">Último Contato</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editData.last_contacted_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editData.last_contacted_date ? format(editData.last_contacted_date, "dd/MM/yyyy") : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editData.last_contacted_date} onSelect={(d) => ed("last_contacted_date", d)} locale={ptBR} className="pointer-events-auto" /></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo de Atividade</Label>
                <Select value={editData.last_activity_type} onValueChange={(v) => ed("last_activity_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="reuniao">Reunião</SelectItem>
                    <SelectItem value="ligacao">Ligação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Próxima Atividade</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editData.next_activity_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editData.next_activity_date ? format(editData.next_activity_date, "dd/MM/yyyy") : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editData.next_activity_date} onSelect={(d) => ed("next_activity_date", d)} locale={ptBR} className="pointer-events-auto" /></PopoverContent>
                </Popover>
              </div>
              <Separator />
              <div className="space-y-1"><Label className="text-xs">Notas</Label><Textarea value={editData.content_consumed} onChange={(e) => ed("content_consumed", e.target.value)} placeholder="Anotações sobre o lead..." rows={3} /></div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
