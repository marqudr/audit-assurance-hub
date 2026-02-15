import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Users, DollarSign, TrendingUp, Plus, Eye, LayoutGrid, TableIcon, ClipboardList } from "lucide-react";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { NewLeadModal } from "@/components/crm/NewLeadModal";
import { LeadDetailSheet } from "@/components/crm/LeadDetailSheet";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { CrmActionAlerts } from "@/components/crm/CrmActionAlerts";
import { CrmPipelineMetrics } from "@/components/crm/CrmPipelineMetrics";
import { CrmEnergyMetrics } from "@/components/crm/CrmEnergyMetrics";
import { CrmRecentActivity } from "@/components/crm/CrmRecentActivity";
import { differenceInDays } from "date-fns";

// ... keep existing code (statusConfig, formatDate, formatCnpj)

const statusConfig: Record<string, { label: string; className: string }> = {
  prospeccao: { label: "Prospecção", className: "bg-blue-100 text-blue-800 border-blue-200" },
  qualificacao: { label: "Qualificação", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  diagnostico: { label: "Diagnóstico", className: "bg-orange-100 text-orange-800 border-orange-200" },
  proposta: { label: "Proposta", className: "bg-purple-100 text-purple-800 border-purple-200" },
  fechamento: { label: "Fechamento", className: "bg-green-100 text-green-800 border-green-200" },
  ganho: { label: "Ganho", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  perdido: { label: "Perdido", className: "bg-red-100 text-red-800 border-red-200" },
  novo: { label: "Novo", className: "bg-blue-100 text-blue-800 border-blue-200" },
  qualificado: { label: "Qualificado", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCnpj(cnpj: string | null) {
  if (!cnpj) return "—";
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

const ACTIVE_STATUSES = ["prospeccao", "qualificacao", "diagnostico", "proposta", "fechamento"];

const CRM = () => {
  const { data: leads = [], isLoading } = useLeads();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const activeLeads = leads.filter((l) => l.status !== "ganho" && l.status !== "perdido").length;
  const totalDealValue = leads.reduce((sum, l) => sum + (l.deal_value || 0), 0);
  const totalBudget = leads.reduce((sum, l) => sum + (l.deal_value || l.rd_annual_budget || 0), 0);
  const avgDeal = leads.length > 0 ? totalBudget / leads.length : 0;

  // Count total alerts for the badge
  const alertCount = useMemo(() => {
    const active = leads.filter((l) => ACTIVE_STATUSES.includes(l.status));
    const noContact = active.filter((l) => l.status === "prospeccao" && !l.last_contacted_date).length;
    const now = new Date();
    const overdue = active.filter((l) => {
      const d1 = l.next_activity_date ? new Date(l.next_activity_date) : null;
      const d2 = l.next_action_date ? new Date(l.next_action_date) : null;
      return (d1 && d1 < now) || (d2 && d2 < now);
    }).length;
    const stalled = active.filter((l) => {
      const days = l.last_contacted_date ? differenceInDays(now, new Date(l.last_contacted_date)) : 999;
      return days >= 3;
    }).length;
    return noContact + overdue + stalled;
  }, [leads]);

  const formatMetric = (val: number) => {
    if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1).replace(".", ",")}M`;
    if (val >= 1_000) return `R$ ${(val / 1_000).toFixed(0)}K`;
    return `R$ ${val.toFixed(0)}`;
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CRM — Vendas & Originação</h1>
          <p className="text-sm text-muted-foreground">Pipeline de vendas e gestão de leads</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Alerts icon button */}
          <Button
            variant="outline"
            size="icon"
            className="relative"
            onClick={() => setAlertsOpen(true)}
          >
            <ClipboardList className="h-5 w-5" />
            {alertCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                {alertCount > 99 ? "99+" : alertCount}
              </span>
            )}
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Lead
          </Button>
        </div>
      </div>

      {/* Métricas no topo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Leads Ativos</p>
              <p className="text-2xl font-bold">{isLoading ? "—" : activeLeads}</p>
            </div>
            <Badge variant="secondary" className="ml-auto text-xs">
              <TrendingUp className="h-3 w-3 mr-1" /> +5%
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-2">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor dos Negócios</p>
              <p className="text-2xl font-bold">{isLoading ? "—" : formatMetric(totalDealValue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-2">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Receita Potencial</p>
              <p className="text-2xl font-bold">{isLoading ? "—" : formatMetric(totalBudget)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ticket Médio</p>
              <p className="text-2xl font-bold">{isLoading ? "—" : formatMetric(avgDeal)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Operacional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CrmPipelineMetrics leads={leads} />
        <CrmEnergyMetrics leads={leads} onCardClick={handleLeadClick} />
      </div>

      

      {/* Tabs: Tabela | Pipeline */}
      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="tabela" className="gap-1.5">
            <TableIcon className="h-4 w-4" /> Tabela
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-1.5">
            <LayoutGrid className="h-4 w-4" /> Pipeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <KanbanBoard leads={leads} onCardClick={handleLeadClick} />
        </TabsContent>

        <TabsContent value="tabela">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>CNAE</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Carregando leads...
                      </TableCell>
                    </TableRow>
                  ) : leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum lead cadastrado. Clique em "Novo Lead" para começar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map((lead) => {
                      const status = statusConfig[lead.status] || statusConfig.prospeccao;
                      return (
                        <TableRow
                          key={lead.id}
                          className="group cursor-pointer"
                          onClick={() => handleLeadClick(lead)}
                        >
                          <TableCell className="font-medium">{lead.company_name}</TableCell>
                          <TableCell className="text-muted-foreground text-xs font-mono">
                            {formatCnpj(lead.cnpj)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {lead.cnae || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={status.className}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {formatDate(lead.updated_at)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLeadClick(lead);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" /> Ver Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alerts side panel */}
      <Sheet open={alertsOpen} onOpenChange={setAlertsOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              O que eu faço agora?
              {alertCount > 0 && (
                <Badge variant="destructive" className="text-xs">{alertCount}</Badge>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-6">
            <CrmActionAlerts
              leads={leads}
              onCardClick={(lead) => {
                setAlertsOpen(false);
                handleLeadClick(lead);
              }}
              inline
            />
            <div className="border-t pt-4">
              <CrmRecentActivity
                leads={leads}
                onCardClick={(lead) => {
                  setAlertsOpen(false);
                  handleLeadClick(lead);
                }}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <NewLeadModal open={modalOpen} onOpenChange={setModalOpen} />
      <LeadDetailSheet lead={selectedLead} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
};

export default CRM;
