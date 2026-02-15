import {
  TrendingUp,
  TrendingDown,
  FileCheck,
  Clock,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Mock data
const statusCards = [
  { label: "Active Projects", value: 24, trend: +12, icon: FileCheck, trendUp: true },
  { label: "Pending Reviews", value: 8, trend: -3, icon: Clock, trendUp: false },
  { label: "Completed This Month", value: 15, trend: +5, icon: CheckCircle2, trendUp: true },
  { label: "Total Revenue", value: "R$ 2.4M", trend: +18, icon: DollarSign, trendUp: true },
];

const pipelineData = [
  { phase: "Intake", count: 6 },
  { phase: "Tech Dive", count: 5 },
  { phase: "Data Room", count: 4 },
  { phase: "Analysis", count: 8 },
  { phase: "Narrative", count: 3 },
  { phase: "QA/Audit", count: 2 },
  { phase: "Publish", count: 1 },
];

const riskData = [
  { name: "Low Risk", value: 14, color: "hsl(170 88% 37%)" },
  { name: "Medium Risk", value: 7, color: "hsl(37 92% 63%)" },
  { name: "High Risk", value: 3, color: "hsl(10 85% 61%)" },
];

const recentActivity = [
  { action: "Report approved", project: "TechCorp — Tax Review", time: "2 min ago", type: "success" as const },
  { action: "Risk flagged", project: "GlobalBank — Compliance", time: "15 min ago", type: "danger" as const },
  { action: "Phase completed", project: "StartupXYZ — R&D Credit", time: "1 hr ago", type: "success" as const },
  { action: "Pending review", project: "RetailCo — VAT Audit", time: "2 hr ago", type: "warning" as const },
  { action: "New project created", project: "HealthPlus — Transfer Pricing", time: "3 hr ago", type: "default" as const },
];

const clientHealth = [
  { name: "TechCorp", score: 92, status: "healthy" as const, projects: 4 },
  { name: "GlobalBank", score: 68, status: "warning" as const, projects: 3 },
  { name: "StartupXYZ", score: 45, status: "critical" as const, projects: 2 },
  { name: "RetailCo", score: 88, status: "healthy" as const, projects: 5 },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Executive overview — Tax Assurance Platform</p>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <card.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs">
                {card.trendUp ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-danger" />
                )}
                <span className={card.trendUp ? "text-success" : "text-danger"}>
                  {card.trendUp ? "+" : ""}{card.trend}%
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pipeline Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Project Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
                <XAxis dataKey="phase" tick={{ fontSize: 11 }} stroke="hsl(215 14% 46%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(215 14% 46%)" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0 0% 100%)",
                    border: "1px solid hsl(214 20% 90%)",
                    borderRadius: "6px",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="hsl(224 36% 39%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {riskData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 text-xs mt-2">
              {riskData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${
                    item.type === "success" ? "bg-success" :
                    item.type === "danger" ? "bg-danger" :
                    item.type === "warning" ? "bg-warning" : "bg-muted-foreground"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{item.action}</span>
                    <span className="text-muted-foreground"> — {item.project}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Client Health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Client Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clientHealth.map((client) => (
                <div key={client.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${
                      client.status === "healthy" ? "bg-success" :
                      client.status === "warning" ? "bg-warning" : "bg-danger"
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.projects} active projects</p>
                    </div>
                  </div>
                  <Badge variant={
                    client.status === "healthy" ? "default" :
                    client.status === "warning" ? "secondary" : "destructive"
                  } className={
                    client.status === "healthy" ? "bg-success/10 text-success border-success/20 hover:bg-success/20" :
                    client.status === "warning" ? "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20" :
                    "bg-danger/10 text-danger border-danger/20 hover:bg-danger/20"
                  }>
                    {client.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
