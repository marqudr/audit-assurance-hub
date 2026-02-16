import { DollarSign, AlertTriangle, Users, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface Props {
  economyYTD: number;
  glosaRate: number;
  throughputPerConsultant: number;
  sparkline: { month: string; count: number }[];
  firstPassYield: number;
}

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const glosaColor = (rate: number) => {
  if (rate < 0.5) return { bg: "bg-success/10", text: "text-success", label: "Excelente" };
  if (rate <= 1.5) return { bg: "bg-warning/10", text: "text-warning", label: "Atenção" };
  return { bg: "bg-danger/10", text: "text-danger", label: "Crítico" };
};

const yieldColor = (rate: number) => {
  if (rate >= 95) return "text-success";
  if (rate >= 80) return "text-warning";
  return "text-danger";
};

export function NorthStarKPIs({ economyYTD, glosaRate, throughputPerConsultant, sparkline, firstPassYield }: Props) {
  const glosa = glosaColor(glosaRate);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Economy YTD */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Economia sob Gestão (YTD)</p>
              <p className="text-xl font-bold font-mono">{formatBRL(economyYTD)}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-2.5">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Projetos ganhos no ano corrente</p>
        </CardContent>
      </Card>

      {/* Glosa */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Glosa Histórica Estimada</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold font-mono">{glosaRate.toFixed(1)}%</p>
                <Badge variant="outline" className={`${glosa.bg} ${glosa.text} border-transparent text-xs`}>
                  {glosa.label}
                </Badge>
              </div>
            </div>
            <div className={`rounded-lg ${glosa.bg} p-2.5`}>
              <AlertTriangle className={`h-5 w-5 ${glosa.text}`} />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Taxa de retrabalho como proxy</p>
        </CardContent>
      </Card>

      {/* Throughput */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Throughput / Consultor</p>
              <p className="text-xl font-bold font-mono">{throughputPerConsultant.toFixed(1)}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 h-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkline}>
                <Line type="monotone" dataKey="count" stroke="hsl(224, 36%, 39%)" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* First Pass Yield */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Taxa de Aprovação (FPY)</p>
              <p className={`text-xl font-bold font-mono ${yieldColor(firstPassYield)}`}>
                {firstPassYield.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg bg-success/10 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Aprovados na 1ª passagem</p>
        </CardContent>
      </Card>
    </div>
  );
}
