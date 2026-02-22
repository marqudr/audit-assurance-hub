import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowRight } from "lucide-react";
import { differenceInDays } from "date-fns";
import type { Project } from "@/hooks/useProjects";

interface CrmEnergyMetricsProps {
  projects: Project[];
  onCardClick: (project: Project) => void;
}

const ACTIVE_STATUSES = ["qualificacao", "diagnostico", "proposta", "fechamento"];
const FUNNEL_ORDER = ["qualificacao", "diagnostico", "proposta", "fechamento"];

const FUNNEL_LABELS: Record<string, string> = {
  qualificacao: "Qualificação",
  diagnostico: "Diagnóstico",
  proposta: "Proposta",
  fechamento: "Fechamento",
};

function formatBRL(val: number) {
  if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (val >= 1_000) return `R$ ${(val / 1_000).toFixed(0)}K`;
  return `R$ ${val.toFixed(0)}`;
}

export function CrmEnergyMetrics({ projects, onCardClick }: CrmEnergyMetricsProps) {
  const activeProjects = useMemo(
    () => projects.filter((p) => ACTIVE_STATUSES.includes(p.status)),
    [projects]
  );

  const topIcp = useMemo(
    () =>
      [...activeProjects]
        .filter((p) => p.icp_score != null)
        .sort((a, b) => (b.icp_score || 0) - (a.icp_score || 0))
        .slice(0, 5),
    [activeProjects]
  );

  const funnel = useMemo(() => {
    const counts = FUNNEL_ORDER.map((phase) => ({
      phase,
      label: FUNNEL_LABELS[phase],
      count: projects.filter((p) => {
        const idx = FUNNEL_ORDER.indexOf(p.status);
        const phaseIdx = FUNNEL_ORDER.indexOf(phase);
        return idx >= phaseIdx || p.status === "ganho";
      }).length,
    }));
    return counts.map((c, i) => ({
      ...c,
      rate: i === 0 ? 100 : counts[0].count > 0 ? Math.round((c.count / counts[0].count) * 100) : 0,
    }));
  }, [projects]);

  const avgAge = useMemo(() => {
    if (activeProjects.length === 0) return 0;
    const now = new Date();
    const totalDays = activeProjects.reduce(
      (sum, p) => sum + differenceInDays(now, new Date(p.created_at)),
      0
    );
    return Math.round(totalDays / activeProjects.length);
  }, [activeProjects]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Gestão de Energia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Top Projetos (ICP Score)</p>
            {topIcp.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum projeto com ICP score</p>
            ) : (
              <div className="space-y-1">
                {topIcp.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => onCardClick(project)}
                    className="flex items-center justify-between w-full text-xs hover:bg-muted/50 rounded px-1.5 py-1"
                  >
                    <span className="truncate font-medium">{project.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-[10px] px-1.5">
                        ICP {project.icp_score}
                      </Badge>
                      {project.deal_value ? (
                        <span className="text-muted-foreground font-mono">{formatBRL(project.deal_value)}</span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Conversão por Etapa</p>
            <div className="space-y-1">
              {funnel.map((step, i) => (
                <div key={step.phase} className="flex items-center gap-1 text-xs">
                  <span className="w-20 truncate">{step.label}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-full transition-all"
                      style={{ width: `${step.rate}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-muted-foreground">
                    {step.count} ({step.rate}%)
                  </span>
                  {i < funnel.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0 hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground mb-1">Idade Média da Oportunidade</p>
            <p className="text-3xl font-bold font-mono">{avgAge}</p>
            <p className="text-xs text-muted-foreground">dias</p>
            {avgAge > 0 && (
              <div className="mt-2 space-y-0.5 text-xs w-full max-w-[200px]">
                {activeProjects
                  .filter((p) => differenceInDays(new Date(), new Date(p.created_at)) > avgAge * 2)
                  .slice(0, 3)
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onCardClick(p)}
                      className="flex justify-between w-full text-muted-foreground hover:underline"
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="text-red-500 font-medium shrink-0">
                        {differenceInDays(new Date(), new Date(p.created_at))}d
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
