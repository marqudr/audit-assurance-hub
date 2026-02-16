import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { NorthStarKPIs } from "@/components/dashboard/NorthStarKPIs";
import { OperationsPipeline } from "@/components/dashboard/OperationsPipeline";
import { SalesFunnel } from "@/components/dashboard/SalesFunnel";
import { DeliveryHealth } from "@/components/dashboard/DeliveryHealth";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { metrics, isLoading } = useDashboardMetrics();

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Cockpit Executivo — Visão Geral</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-52 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Cockpit Executivo — Visão Geral</p>
      </div>

      {/* Bloco 1: North Star KPIs */}
      <NorthStarKPIs
        economyYTD={metrics.economyYTD}
        glosaRate={metrics.glosaRate}
        throughputPerConsultant={metrics.throughputPerConsultant}
        sparkline={metrics.sparkline}
        firstPassYield={metrics.firstPassYield}
      />

      {/* Bloco 2: Pipeline de Operações */}
      <OperationsPipeline
        pipelineByPhase={metrics.pipelineByPhase}
        avgProjects={metrics.avgProjects}
        slaRiskProjects={metrics.slaRiskProjects}
      />

      {/* Bloco 3: Marketing & Vendas */}
      <SalesFunnel
        mqls={metrics.mqls}
        conversionRate={metrics.conversionRate}
        timeToClose={metrics.timeToClose}
        propostas={metrics.propostas}
        wonCount={metrics.wonCount}
        salesFunnelData={metrics.salesFunnelData}
      />

      {/* Bloco 4: Visão Detalhada */}
      <DeliveryHealth
        volumeByPhase={metrics.volumeByPhase}
        approvedThisMonth={metrics.approvedThisMonth}
        stalledProjects={metrics.stalledProjects}
        reworkRate={metrics.reworkRate}
        staffCount={metrics.staffCount}
      />
    </div>
  );
};

export default Dashboard;
