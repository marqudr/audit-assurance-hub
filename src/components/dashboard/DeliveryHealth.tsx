import { BarChart3, Clock, RefreshCw, CheckCircle2 } from "lucide-react";
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

interface VolumeItem {
  phase: string;
  fullName: string;
  count: number;
  value: number;
}

interface StalledProject {
  projectId: string;
  projectName: string;
  phaseName: string;
  phaseNumber: number;
  days: number;
}

interface Props {
  volumeByPhase: VolumeItem[];
  approvedThisMonth: number;
  stalledProjects: StalledProject[];
  reworkRate: number;
  staffCount: number;
}

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const VOLUME_COLORS = [
  "hsl(224, 36%, 55%)",
  "hsl(224, 36%, 50%)",
  "hsl(224, 36%, 45%)",
  "hsl(224, 36%, 40%)",
  "hsl(224, 36%, 35%)",
  "hsl(170, 88%, 37%)",
  "hsl(170, 88%, 30%)",
];

export function DeliveryHealth({ volumeByPhase, approvedThisMonth, stalledProjects, reworkRate, staffCount }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Volume by Phase */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Volumetria por Fase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={volumeByPhase} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(215, 14%, 46%)" />
              <YAxis dataKey="phase" type="category" width={35} tick={{ fontSize: 10 }} stroke="hsl(215, 14%, 46%)" />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "value") return [formatBRL(value), "Valor Travado"];
                  return [value, "Projetos"];
                }}
                labelFormatter={(label) => {
                  const item = volumeByPhase.find((v) => v.phase === label);
                  return item?.fullName || label;
                }}
                contentStyle={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(214, 20%, 90%)", borderRadius: "6px", fontSize: 12 }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} name="count">
                {volumeByPhase.map((_, i) => (
                  <Cell key={i} fill={VOLUME_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pipeline Health */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Saúde do Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Throughput */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">Entregas este mês</p>
              <p className="text-lg font-bold font-mono">{approvedThisMonth} <span className="text-xs font-normal text-muted-foreground">fases aprovadas</span></p>
            </div>
          </div>

          {/* Rework Rate */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <RefreshCw className={`h-5 w-5 ${reworkRate > 2 ? "text-danger" : reworkRate > 0.5 ? "text-warning" : "text-success"}`} />
            <div>
              <p className="text-xs text-muted-foreground">Taxa de Retrabalho</p>
              <p className="text-lg font-bold font-mono">{reworkRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Stalled */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-danger" />
              <p className="text-xs font-medium text-muted-foreground uppercase">Projetos Parados (&gt;5d)</p>
            </div>
            {stalledProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">Nenhum projeto parado</p>
            ) : (
              <div className="space-y-2 max-h-[120px] overflow-y-auto">
                {stalledProjects.slice(0, 5).map((s) => (
                  <div key={s.projectId + s.phaseNumber} className="flex items-center justify-between text-sm">
                    <div className="truncate flex-1 min-w-0">
                      <span className="font-medium">{s.projectName}</span>
                      <span className="text-muted-foreground"> — {s.phaseName}</span>
                    </div>
                    <Badge variant="outline" className="bg-danger/10 text-danger border-transparent text-xs ml-2">
                      {s.days}d
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
