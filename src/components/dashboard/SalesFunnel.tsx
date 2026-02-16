import { TrendingUp, Target, Clock, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Props {
  mqls: number;
  conversionRate: number;
  timeToClose: number;
  propostas: number;
  wonCount: number;
  salesFunnelData: { stage: string; count: number }[];
}

const FUNNEL_COLORS = ["hsl(224, 36%, 39%)", "hsl(37, 92%, 63%)", "hsl(170, 88%, 37%)"];

export function SalesFunnel({ mqls, conversionRate, timeToClose, propostas, wonCount, salesFunnelData }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* Mini KPI cards */}
      <div className="lg:col-span-2 grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><Target className="h-4 w-4 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">MQLs</p>
              <p className="text-lg font-bold font-mono">{mqls}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-success/10 p-2"><TrendingUp className="h-4 w-4 text-success" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Conversão</p>
              <p className="text-lg font-bold font-mono">{conversionRate.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-warning/10 p-2"><Clock className="h-4 w-4 text-warning" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Ciclo Médio</p>
              <p className="text-lg font-bold font-mono">{Math.round(timeToClose)}d</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><FileCheck className="h-4 w-4 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Propostas → Ganhos</p>
              <p className="text-lg font-bold font-mono">{propostas} → {wonCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel chart */}
      <Card className="lg:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Funil de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={salesFunnelData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(215, 14%, 46%)" />
              <YAxis dataKey="stage" type="category" width={80} tick={{ fontSize: 11 }} stroke="hsl(215, 14%, 46%)" />
              <Tooltip contentStyle={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(214, 20%, 90%)", borderRadius: "6px", fontSize: 12 }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {salesFunnelData.map((_, i) => (
                  <Cell key={i} fill={FUNNEL_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
