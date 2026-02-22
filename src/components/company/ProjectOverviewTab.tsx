import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, CalendarDays, DollarSign, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import type { Project } from "@/hooks/useProjects";

const statusConfig: Record<string, { label: string; className: string }> = {
  qualificacao: { label: "Qualificação", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  diagnostico: { label: "Diagnóstico", className: "bg-orange-100 text-orange-800 border-orange-200" },
  proposta: { label: "Proposta", className: "bg-purple-100 text-purple-800 border-purple-200" },
  fechamento: { label: "Fechamento", className: "bg-green-100 text-green-800 border-green-200" },
  ganho: { label: "Ganho", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  perdido: { label: "Perdido", className: "bg-red-100 text-red-800 border-red-200" },
};

const frascatiItems = [
  { key: "frascati_novidade" as const, label: "Novidade" },
  { key: "frascati_criatividade" as const, label: "Criatividade" },
  { key: "frascati_incerteza" as const, label: "Incerteza" },
  { key: "frascati_sistematicidade" as const, label: "Sistematicidade" },
  { key: "frascati_transferibilidade" as const, label: "Transferibilidade" },
];

export function ProjectOverviewTab({ project }: { project: Project }) {
  const status = statusConfig[project.status] || statusConfig.qualificacao;
  const frascatiScore = frascatiItems.filter((f) => project[f.key]).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {/* Status & Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Informações do Projeto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="outline" className={status.className}>{status.label}</Badge>
          </div>
          {project.description && (
            <div>
              <span className="text-muted-foreground block mb-1">Descrição</span>
              <p className="text-xs whitespace-pre-wrap">{project.description}</p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Criado em</span>
            <span>{format(new Date(project.created_at), "dd/MM/yyyy")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Atualizado em</span>
            <span>{format(new Date(project.updated_at), "dd/MM/yyyy")}</span>
          </div>
          {project.expected_close_date && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Previsão de Fechamento</span>
              <span>{format(new Date(project.expected_close_date), "dd/MM/yyyy")}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financeiro */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1"><DollarSign className="h-4 w-4" /> Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Valor do Negócio</span>
            <span className="font-medium">{project.deal_value != null ? `R$ ${project.deal_value.toLocaleString("pt-BR")}` : "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Probabilidade</span>
            <span>{project.probability != null ? `${project.probability}%` : "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Benefício Estimado</span>
            <span>
              {project.estimated_benefit_min != null || project.estimated_benefit_max != null
                ? `R$ ${(project.estimated_benefit_min ?? 0).toLocaleString("pt-BR")} – ${(project.estimated_benefit_max ?? 0).toLocaleString("pt-BR")}`
                : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Frascati */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1"><FlaskConical className="h-4 w-4" /> Mérito Tecnológico (Frascati) — {frascatiScore}/5</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {frascatiItems.map((f) => (
              <Badge key={f.key} variant={project[f.key] ? "default" : "outline"} className={project[f.key] ? "" : "opacity-50"}>
                {f.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Qualificação */}
      {(project.pain_points || project.context || project.objection) && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Qualificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {project.pain_points && <div><span className="text-muted-foreground block text-xs">Dor</span><p className="text-xs">{project.pain_points}</p></div>}
            {project.context && <div><span className="text-muted-foreground block text-xs">Contexto</span><p className="text-xs">{project.context}</p></div>}
            {project.objection && <div><span className="text-muted-foreground block text-xs">Objeção</span><p className="text-xs">{project.objection}</p></div>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
