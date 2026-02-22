import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { DollarSign, Target } from "lucide-react";
import type { Project } from "@/hooks/useProjects";

interface CrmPipelineMetricsProps {
  projects: Project[];
}

const ACTIVE_PHASES = [
  { key: "qualificacao", label: "Qualificação", color: "#eab308" },
  { key: "qualificacao", label: "Qualificação", color: "#eab308" },
  { key: "diagnostico", label: "Diagnóstico", color: "#f97316" },
  { key: "proposta", label: "Proposta", color: "#a855f7" },
  { key: "fechamento", label: "Fechamento", color: "#22c55e" },
];

const MONTHLY_GOAL = 100_000;

function formatBRL(val: number) {
  if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (val >= 1_000) return `R$ ${(val / 1_000).toFixed(0)}K`;
  return `R$ ${val.toFixed(0)}`;
}

export function CrmPipelineMetrics({ projects }: CrmPipelineMetricsProps) {
  const stageData = useMemo(() => {
    return ACTIVE_PHASES.map(({ key, label, color }) => {
      const stageProjects = projects.filter((p) => p.status === key);
      const total = stageProjects.reduce((s, p) => s + (p.deal_value || 0), 0);
      const weighted = stageProjects.reduce(
        (s, p) => s + (p.deal_value || 0) * ((p.probability || 0) / 100),
        0
      );
      return { key, label, color, total, weighted, count: stageProjects.length };
    });
  }, [projects]);

  const totalWeighted = stageData.reduce((s, d) => s + d.weighted, 0);

  const realized = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return projects
      .filter((p) => {
        if (p.status !== "ganho") return false;
        const d = new Date(p.updated_at);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((s, p) => s + (p.deal_value || 0), 0);
  }, [projects]);

  const goalPercent = Math.min((realized / MONTHLY_GOAL) * 100, 100);
  const goalColor = goalPercent >= 80 ? "text-green-600" : goalPercent >= 50 ? "text-yellow-600" : "text-red-600";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Fábrica de Dinheiro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <p className="text-xs text-muted-foreground mb-2">Pipeline por Estágio</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="label" width={80} tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(val: number) => formatBRL(val)}
                    labelStyle={{ fontSize: 11 }}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {stageData.map((d) => (
                      <Cell key={d.key} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground mb-1">Pipeline Ponderado</p>
            <p className="text-3xl font-bold font-mono tracking-tight">{formatBRL(totalWeighted)}</p>
            <div className="mt-2 space-y-0.5 text-xs text-muted-foreground w-full max-w-[200px]">
              {stageData.filter((d) => d.weighted > 0).map((d) => (
                <div key={d.key} className="flex justify-between">
                  <span>{d.label}</span>
                  <span className="font-medium font-mono">{formatBRL(d.weighted)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Gap para Meta (mês)</p>
            </div>
            <Progress value={goalPercent} className="h-3 mb-2" />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Realizado: <span className="font-medium font-mono">{formatBRL(realized)}</span></span>
              <span className={`font-semibold ${goalColor}`}>
                {goalPercent >= 100 ? "Meta batida! 🎉" : `Faltam ${formatBRL(MONTHLY_GOAL - realized)}`}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Meta: {formatBRL(MONTHLY_GOAL)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
