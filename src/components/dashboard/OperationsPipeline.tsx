import { AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const PHASE_COLORS = [
  "hsl(224, 36%, 39%)",
  "hsl(224, 36%, 47%)",
  "hsl(224, 36%, 55%)",
  "hsl(37, 92%, 63%)",
  "hsl(37, 92%, 53%)",
  "hsl(170, 88%, 37%)",
  "hsl(170, 88%, 30%)",
];

interface PipelineItem {
  phase: string;
  phaseNumber: number;
  count: number;
  value: number;
}

interface SlaRisk {
  projectId: string;
  projectName: string;
  phaseName: string;
  phaseNumber: number;
  days: number;
}

interface Props {
  pipelineByPhase: PipelineItem[];
  avgProjects: number;
  slaRiskProjects: SlaRisk[];
}

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function OperationsPipeline({ pipelineByPhase, avgProjects, slaRiskProjects }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            Pipeline de Operações
            <Badge variant="outline" className="text-xs font-normal">{pipelineByPhase.reduce((s, p) => s + p.count, 0)} projetos ativos</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pipelineByPhase} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(215, 14%, 46%)" />
              <YAxis
                dataKey="phase"
                type="category"
                width={130}
                tick={{ fontSize: 10 }}
                stroke="hsl(215, 14%, 46%)"
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "count") return [value, "Projetos"];
                  return [formatBRL(value), "Valor"];
                }}
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(214, 20%, 90%)",
                  borderRadius: "6px",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} name="count">
                {pipelineByPhase.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={PHASE_COLORS[i]}
                    stroke={entry.count > avgProjects ? "hsl(10, 85%, 61%)" : "none"}
                    strokeWidth={entry.count > avgProjects ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-danger" />
            Risco de SLA
          </CardTitle>
        </CardHeader>
        <CardContent>
          {slaRiskProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum projeto em risco 🎉</p>
          ) : (
            <div className="space-y-3 max-h-[240px] overflow-y-auto">
              {slaRiskProjects.slice(0, 8).map((r) => (
                <div key={r.projectId + r.phaseNumber} className="flex items-start gap-2 text-sm">
                  <Clock className="h-3.5 w-3.5 mt-0.5 text-danger shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{r.projectName}</p>
                    <p className="text-xs text-muted-foreground">{r.phaseName}</p>
                  </div>
                  <Badge variant="outline" className="bg-danger/10 text-danger border-transparent text-xs shrink-0">
                    {r.days}d
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
