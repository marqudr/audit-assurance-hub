import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useClientMetrics,
  useClientAlerts,
  useClientProjects,
} from "@/hooks/useClientPortal";
import {
  DollarSign,
  FolderOpen,
  CheckCircle2,
  CalendarClock,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function PortalDashboard() {
  const metrics = useClientMetrics();
  const alerts = useClientAlerts();
  const { data: projects } = useClientProjects();
  const navigate = useNavigate();

  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Chart data: savings per project (won)
  const chartData = (projects ?? [])
    .filter((p) => p.status === "ganho" && p.estimated_benefit_min)
    .map((p) => ({
      name: p.name.length > 20 ? p.name.slice(0, 20) + "…" : p.name,
      economia: Number(p.estimated_benefit_min ?? 0),
    }));

  const alertIcon = (type: string) => {
    switch (type) {
      case "deadline":
        return <Clock className="h-4 w-4 text-warning" />;
      case "pending_docs":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "opportunity":
        return <Sparkles className="h-4 w-4 text-primary" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral dos seus incentivos fiscais</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Economia Acumulada
            </CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{formatCurrency(metrics.totalSavings)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projetos Ativos
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.activeProjects}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projetos Concluídos
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.completedProjects}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próximo Prazo
            </CardTitle>
            <CalendarClock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {metrics.nextDeadline
                ? new Date(metrics.nextDeadline).toLocaleDateString("pt-BR")
                : "—"}
            </p>
            {metrics.nextDeadlineProject && (
              <p className="text-xs text-muted-foreground truncate">
                {metrics.nextDeadlineProject}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Alertas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>
            )}
            {alerts.map((alert, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-md bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => alert.projectId && navigate(`/portal/projetos/${alert.projectId}`)}
              >
                {alertIcon(alert.type)}
                <div className="min-w-0">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Economia por Projeto</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Nenhum projeto concluído ainda.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                      "Economia",
                    ]}
                  />
                  <Bar dataKey="economia" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
