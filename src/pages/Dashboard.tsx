import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { NorthStarKPIs } from "@/components/dashboard/NorthStarKPIs";
import { OperationsPipeline } from "@/components/dashboard/OperationsPipeline";
import { SalesFunnel } from "@/components/dashboard/SalesFunnel";
import { DeliveryHealth } from "@/components/dashboard/DeliveryHealth";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div>
    <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Cockpit Executivo — Visão Geral</p>
      </div>

      {/* Seção 1: Receita & Financeiro */}
      <section className="space-y-4">
        <SectionHeader title="Receita & Financeiro" description="KPIs de saúde financeira e eficiência operacional" />
        <NorthStarKPIs
          economyYTD={metrics.economyYTD}
          glosaRate={metrics.glosaRate}
          throughputPerConsultant={metrics.throughputPerConsultant}
          sparkline={metrics.sparkline}
          firstPassYield={metrics.firstPassYield}
        />
      </section>

      <Separator />

      {/* Seção 2: Funil de Vendas */}
      <section className="space-y-4">
        <SectionHeader title="Funil de Vendas" description="Conversão de leads, propostas e ciclo comercial" />
        <SalesFunnel
          mqls={metrics.mqls}
          conversionRate={metrics.conversionRate}
          timeToClose={metrics.timeToClose}
          propostas={metrics.propostas}
          wonCount={metrics.wonCount}
          salesFunnelData={metrics.salesFunnelData}
        />
      </section>

      <Separator />

      {/* Seção 3: Operações */}
      <section className="space-y-4">
        <SectionHeader title="Operações" description="Pipeline de 7 fases, volumetria e saúde de entrega" />
        <OperationsPipeline
          pipelineByPhase={metrics.pipelineByPhase}
          avgProjects={metrics.avgProjects}
          slaRiskProjects={metrics.slaRiskProjects}
        />
        <DeliveryHealth
          volumeByPhase={metrics.volumeByPhase}
          approvedThisMonth={metrics.approvedThisMonth}
          stalledProjects={metrics.stalledProjects}
          reworkRate={metrics.reworkRate}
          staffCount={metrics.staffCount}
        />
      </section>
    </div>
  );
};

export default Dashboard;
