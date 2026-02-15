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
import { Pencil, X, Check, CalendarIcon, Clock, Ghost, Target, TrendingUp, Megaphone, Loader2, Building2, ClipboardList, FlaskConical } from "lucide-react";
import { TaxSimulator } from "./TaxSimulator";
import { PhaseChecklist } from "./PhaseChecklist";
import { ProjectAttachments } from "./ProjectAttachments";
import { formatBRL, parseBRL } from "./NewLeadModal";
import { useUpdateProject, type Project } from "@/hooks/useProjects";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ProjectDetailSheetProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenCompany?: (leadId: string) => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  prospeccao: { label: "Prospecção", className: "bg-blue-100 text-blue-800 border-blue-200" },
  qualificacao: { label: "Qualificação", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  diagnostico: { label: "Diagnóstico", className: "bg-orange-100 text-orange-800 border-orange-200" },
  proposta: { label: "Proposta", className: "bg-purple-100 text-purple-800 border-purple-200" },
  fechamento: { label: "Fechamento", className: "bg-green-100 text-green-800 border-green-200" },
  ganho: { label: "Ganho", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  perdido: { label: "Perdido", className: "bg-red-100 text-red-800 border-red-200" },
};

export function ProjectDetailSheet({ project, open, onOpenChange, onOpenCompany }: ProjectDetailSheetProps) {
  const updateProject = useUpdateProject();
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (project && editing) {
      setEditData({
        name: project.name || "",
        description: project.description || "",
        status: project.status,
        source_medium: project.source_medium || "",
        first_touch_channel: project.first_touch_channel || "",
        last_touch_channel: project.last_touch_channel || "",
        estimated_cac: project.estimated_cac ? formatBRL(String(Math.round(project.estimated_cac * 100))) : "",
        icp_score: project.icp_score ?? 0,
        pain_points: project.pain_points || "",
        context: project.context || "",
        objection: project.objection || "",
        next_action: project.next_action || "",
        next_action_date: project.next_action_date ? new Date(project.next_action_date) : undefined,
        content_consumed: project.content_consumed || "",
        last_contacted_date: project.last_contacted_date ? new Date(project.last_contacted_date) : undefined,
        last_activity_type: project.last_activity_type || "",
        next_activity_date: project.next_activity_date ? new Date(project.next_activity_date) : undefined,
        estimated_ltv: project.estimated_ltv ? formatBRL(String(Math.round(project.estimated_ltv * 100))) : "",
        probability: project.probability ?? 50,
        deal_value: project.deal_value ? formatBRL(String(Math.round(project.deal_value * 100))) : "",
        expected_close_date: project.expected_close_date ? new Date(project.expected_close_date) : undefined,
        // Frascati fields
        frascati_novidade: project.frascati_novidade ?? false,
        frascati_criatividade: project.frascati_criatividade ?? false,
        frascati_incerteza: project.frascati_incerteza ?? false,
        frascati_sistematicidade: project.frascati_sistematicidade ?? false,
        frascati_transferibilidade: project.frascati_transferibilidade ?? false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  if (!project) return null;

  const status = statusConfig[project.status] || statusConfig.prospeccao;
  const timeInStage = differenceInDays(new Date(), new Date(project.updated_at));
  const tisColor = timeInStage > 14 ? "text-red-600" : timeInStage > 7 ? "text-yellow-600" : "text-green-600";
  

  const ed = (field: string, value: any) => setEditData((prev) => ({ ...prev, [field]: value }));

  const frascatiScore = [project.frascati_novidade, project.frascati_criatividade, project.frascati_incerteza, project.frascati_sistematicidade, project.frascati_transferibilidade].filter(Boolean).length;
  const frascatiBadgeClass = frascatiScore < 3 ? "bg-red-100 text-red-700 border-red-200" : frascatiScore < 5 ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-green-100 text-green-700 border-green-200";

  const calcEditFrascatiScore = () => [editData.frascati_novidade, editData.frascati_criatividade, editData.frascati_incerteza, editData.frascati_sistematicidade, editData.frascati_transferibilidade].filter(Boolean).length;

  const handleSaveEdit = async () => {
    if (!editData.name?.trim()) { toast.error("Informe o nome do projeto."); return; }
    try {
      await updateProject.mutateAsync({
        id: project.id,
        name: editData.name,
        description: editData.description || null,
        status: editData.status,
        source_medium: editData.source_medium || null,
        first_touch_channel: editData.first_touch_channel || null,
        last_touch_channel: editData.last_touch_channel || null,
        estimated_cac: editData.estimated_cac ? parseBRL(editData.estimated_cac) : null,
        icp_score: editData.icp_score,
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
        // Frascati
        frascati_novidade: editData.frascati_novidade,
        frascati_criatividade: editData.frascati_criatividade,
        frascati_incerteza: editData.frascati_incerteza,
        frascati_sistematicidade: editData.frascati_sistematicidade,
        frascati_transferibilidade: editData.frascati_transferibilidade,
      } as any);
      toast.success("Projeto atualizado com sucesso!");
      setEditing(false);
    } catch {
      toast.error("Erro ao atualizar projeto.");
    }
  };

  // Build a lead-like object for TaxSimulator compatibility
  const taxSimLead = {
    ...project,
    company_name: project.company_name || project.name,
  } as any;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) setEditing(false); onOpenChange(v); }}>
      <SheetContent className="sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between pr-6">
            <SheetTitle>Detalhes do Projeto</SheetTitle>
            {!editing ? (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" /> Editar
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveEdit} disabled={updateProject.isPending}>
                  {updateProject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" /> Salvar</>}
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>
        <div className="space-y-6 mt-6">
          {/* Project info */}
          {!editing ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{project.name}</h3>
                <Badge variant="outline" className={status.className}>{status.label}</Badge>
              </div>
              {project.company_name && (
                <button
                  onClick={() => onOpenCompany?.(project.lead_id)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {project.company_name}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Projeto</Label>
                <Input value={editData.name} onChange={(e) => ed("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editData.status} onValueChange={(v) => ed("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Detalhe do Projeto */}
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Detalhe do Projeto
            </h4>
            {!editing ? (
              <div className="rounded-md border p-4 bg-muted/30">
                <p className="text-sm whitespace-pre-wrap">
                  {project.description || <span className="text-muted-foreground italic">Nenhuma descrição adicionada. Clique em "Editar" para detalhar o projeto.</span>}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Descrição do Projeto</Label>
                <Textarea
                  value={editData.description}
                  onChange={(e) => ed("description", e.target.value)}
                  rows={6}
                  placeholder="Descreva o projeto que está sendo vendido: escopo, objetivos, entregáveis, diferenciais..."
                />
              </div>
            )}
          </div>

          {/* Tax Simulator */}
          <Separator />
          <TaxSimulator lead={taxSimLead} hideProposalButton={project.status === "qualificacao"} />

          {/* Enrichment / Qualification */}
          <Separator />
          {!editing ? (
            <Accordion type="multiple" defaultValue={["attribution", "qualification", "revenue"]} className="w-full">
              <AccordionItem value="attribution">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2"><Megaphone className="h-4 w-4" /> Atribuição e Origem</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Source/Medium</span><p className="font-medium">{project.source_medium || "—"}</p></div>
                    <div><span className="text-muted-foreground">Primeiro Toque</span><p className="font-medium">{project.first_touch_channel || "—"}</p></div>
                    <div><span className="text-muted-foreground">Último Toque</span><p className="font-medium">{project.last_touch_channel || "—"}</p></div>
                    <div><span className="text-muted-foreground">CAC Estimado</span><p className="font-medium">{project.estimated_cac ? `R$ ${project.estimated_cac.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</p></div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="qualification">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2"><Target className="h-4 w-4" /> Qualificação e Fit</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">ICP Score (Empresa)</span>
                      <Badge variant="outline" className={cn(
                        project.icp_score != null && project.icp_score < 5 ? "bg-red-100 text-red-700 border-red-200" :
                        project.icp_score != null && project.icp_score < 7.5 ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                        project.icp_score != null ? "bg-green-100 text-green-700 border-green-200" : ""
                      )}>{project.icp_score ?? "—"}/10</Badge>
                    </div>
                    {/* Frascati Section */}
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Mérito Tecnológico (Frascati)</span>
                        <Badge variant="outline" className={frascatiBadgeClass}>{frascatiScore}/5</Badge>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={project.frascati_novidade ? "text-green-600" : "text-muted-foreground"}>
                            {project.frascati_novidade ? "✅" : "⬜"} Novidade
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={project.frascati_criatividade ? "text-green-600" : "text-muted-foreground"}>
                            {project.frascati_criatividade ? "✅" : "⬜"} Criatividade
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={project.frascati_incerteza ? "text-green-600" : "text-muted-foreground"}>
                            {project.frascati_incerteza ? "✅" : "⬜"} Incerteza (Risco Tecnológico)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={project.frascati_sistematicidade ? "text-green-600" : "text-muted-foreground"}>
                            {project.frascati_sistematicidade ? "✅" : "⬜"} Sistematicidade
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={project.frascati_transferibilidade ? "text-green-600" : "text-muted-foreground"}>
                            {project.frascati_transferibilidade ? "✅" : "⬜"} Transferibilidade
                          </span>
                        </div>
                      </div>
                    </div>
                    <div><span className="text-muted-foreground">Dor</span><p className="font-medium text-sm mt-1">{project.pain_points || "—"}</p></div>
                    <div><span className="text-muted-foreground">Contexto</span><p className="font-medium text-sm mt-1">{project.context || "—"}</p></div>
                    <div><span className="text-muted-foreground">Objeção</span><p className="font-medium text-sm mt-1">{project.objection || "—"}</p></div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="revenue">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Projeção de Receita</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">LTV Estimado</span><p className="font-medium">{project.estimated_ltv ? `R$ ${project.estimated_ltv.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</p></div>
                    <div><span className="text-muted-foreground">Valor do Negócio</span><p className="font-medium">{project.deal_value ? `R$ ${project.deal_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</p></div>
                    <div><span className="text-muted-foreground">Probabilidade</span><p className="font-medium">{project.probability != null ? `${project.probability}%` : "—"}</p></div>
                    <div><span className="text-muted-foreground">Fechamento Esperado</span><p className="font-medium">{project.expected_close_date ? format(new Date(project.expected_close_date), "dd/MM/yyyy") : "—"}</p></div>
                  </div>
                  {(project.estimated_benefit_min && project.estimated_benefit_max) && (
                    <div className="mt-3 p-3 rounded-md bg-muted/50 border">
                      <p className="text-xs text-muted-foreground mb-1">Benefício Fiscal Estimado (Lei do Bem)</p>
                      <p className="text-lg font-bold text-primary">
                        R$ {project.estimated_benefit_min.toLocaleString("pt-BR", { minimumFractionDigits: 0 })} – R$ {project.estimated_benefit_max.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <Accordion type="multiple" defaultValue={["attribution", "qualification", "revenue"]} className="w-full">
              <AccordionItem value="attribution">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2"><Megaphone className="h-4 w-4" /> Atribuição e Origem</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Source/Medium</Label><Input value={editData.source_medium} onChange={(e) => ed("source_medium", e.target.value)} /></div>
                    <div className="space-y-1"><Label className="text-xs">Primeiro Toque</Label><Input value={editData.first_touch_channel} onChange={(e) => ed("first_touch_channel", e.target.value)} /></div>
                    <div className="space-y-1"><Label className="text-xs">Último Toque</Label><Input value={editData.last_touch_channel} onChange={(e) => ed("last_touch_channel", e.target.value)} /></div>
                    <div className="space-y-1"><Label className="text-xs">CAC Estimado</Label><Input value={editData.estimated_cac} onChange={(e) => ed("estimated_cac", formatBRL(e.target.value))} /></div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="qualification">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2"><Target className="h-4 w-4" /> Qualificação e Fit</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">ICP Score (calculado na empresa): {project.icp_score ?? 0}/10</Label>
                    </div>
                    {/* Frascati Edit */}
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Mérito Tecnológico (Frascati): {calcEditFrascatiScore()}/5</Label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox checked={editData.frascati_novidade} onCheckedChange={(v) => ed("frascati_novidade", !!v)} />
                          Novidade — Visa resultados novos para a empresa ou mercado
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox checked={editData.frascati_criatividade} onCheckedChange={(v) => ed("frascati_criatividade", !!v)} />
                          Criatividade — Baseia-se em conceitos originais e não óbvios
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox checked={editData.frascati_incerteza} onCheckedChange={(v) => ed("frascati_incerteza", !!v)} />
                          Incerteza — Há dúvida se o resultado é alcançável
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox checked={editData.frascati_sistematicidade} onCheckedChange={(v) => ed("frascati_sistematicidade", !!v)} />
                          Sistematicidade — Planejamento, orçamento e registros
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox checked={editData.frascati_transferibilidade} onCheckedChange={(v) => ed("frascati_transferibilidade", !!v)} />
                          Transferibilidade — Conhecimento codificável e transferível
                        </label>
                      </div>
                      <Badge variant="outline" className={calcEditFrascatiScore() < 3 ? "bg-red-100 text-red-700 border-red-200" : calcEditFrascatiScore() < 5 ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-green-100 text-green-700 border-green-200"}>
                        Score: {calcEditFrascatiScore()}/5
                      </Badge>
                    </div>
                    <div className="space-y-1"><Label className="text-xs">Dor</Label><Textarea value={editData.pain_points} onChange={(e) => ed("pain_points", e.target.value)} rows={3} /></div>
                    <div className="space-y-1"><Label className="text-xs">Contexto</Label><Textarea value={editData.context} onChange={(e) => ed("context", e.target.value)} rows={3} /></div>
                    <div className="space-y-1"><Label className="text-xs">Objeção</Label><Textarea value={editData.objection} onChange={(e) => ed("objection", e.target.value)} rows={3} /></div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="revenue">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Projeção de Receita</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-xs">LTV Estimado</Label><Input value={editData.estimated_ltv} onChange={(e) => ed("estimated_ltv", formatBRL(e.target.value))} /></div>
                      <div className="space-y-1"><Label className="text-xs">Valor do Negócio</Label><Input value={editData.deal_value} onChange={(e) => ed("deal_value", formatBRL(e.target.value))} /></div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Probabilidade: {editData.probability}%</Label>
                      <Slider value={[editData.probability ?? 50]} onValueChange={([v]) => ed("probability", v)} min={0} max={100} step={5} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Data de Fechamento</Label>
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
          )}

          {/* Phase Checklist */}
          <Separator />
          <PhaseChecklist leadId={project.lead_id} phase={project.status} />

          {/* Attachments */}
          <Separator />
          <ProjectAttachments projectId={project.id} phase={project.status} />

          {/* Velocity & Health */}
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
                {project.next_action ? (
                  <span className="font-medium">{project.next_action}</span>
                ) : (
                  <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                    <Ghost className="h-3 w-3 mr-1" /> Zumbi
                  </Badge>
                )}
              </div>
              {project.next_action_date && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Data Próximo Passo</span>
                  <span className="font-medium">{format(new Date(project.next_action_date), "dd/MM/yyyy")}</span>
                </div>
              )}
              <Separator />
              <h4 className="text-sm font-semibold">Histórico de Interações</h4>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Último Contato</span>
                <span className="font-medium">{project.last_contacted_date ? format(new Date(project.last_contacted_date), "dd/MM/yyyy") : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tipo de Atividade</span>
                <span className="font-medium">{project.last_activity_type === "email" ? "E-mail" : project.last_activity_type === "reuniao" ? "Reunião" : project.last_activity_type === "ligacao" ? "Ligação" : project.last_activity_type || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Próxima Atividade</span>
                <span className="font-medium">{project.next_activity_date ? format(new Date(project.next_activity_date), "dd/MM/yyyy") : "—"}</span>
              </div>
              <Separator />
              <div><span className="text-muted-foreground">Notas</span><p className="font-medium text-sm mt-1">{project.content_consumed || "—"}</p></div>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2"><Clock className="h-4 w-4" /> Velocidade e Saúde</h4>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Time in Stage</span>
                <span className={cn("font-medium", tisColor)}>{timeInStage} dias</span>
              </div>
              <div className="space-y-1"><Label className="text-xs">Próximo Passo</Label><Input value={editData.next_action} onChange={(e) => ed("next_action", e.target.value)} /></div>
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
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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
              <div className="space-y-1"><Label className="text-xs">Notas</Label><Textarea value={editData.content_consumed} onChange={(e) => ed("content_consumed", e.target.value)} rows={3} /></div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
