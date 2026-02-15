import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, DollarSign, TrendingUp, Plus, Eye } from "lucide-react";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { NewLeadModal } from "@/components/crm/NewLeadModal";
import { LeadDetailSheet } from "@/components/crm/LeadDetailSheet";

const statusConfig: Record<string, { label: string; className: string }> = {
  novo: { label: "Novo", className: "bg-blue-100 text-blue-800 border-blue-200" },
  qualificado: { label: "Qualificado", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  proposta: { label: "Proposta", className: "bg-purple-100 text-purple-800 border-purple-200" },
  ganho: { label: "Ganho", className: "bg-green-100 text-green-800 border-green-200" },
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

const CRM = () => {
  const { data: leads = [], isLoading } = useLeads();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeLeads = leads.filter((l) => l.status !== "ganho").length;
  const totalBudget = leads.reduce((sum, l) => sum + (l.rd_annual_budget || 0), 0);
  const avgDeal = leads.length > 0 ? totalBudget / leads.length : 0;

  const formatMetric = (val: number) => {
    if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1).replace(".", ",")}M`;
    if (val >= 1_000) return `R$ ${(val / 1_000).toFixed(0)}K`;
    return `R$ ${val.toFixed(0)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CRM — Vendas & Originação</h1>
          <p className="text-sm text-muted-foreground">Pipeline de vendas e gestão de leads</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Lead
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Tabela de Leads */}
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
                  const status = statusConfig[lead.status] || statusConfig.novo;
                  return (
                    <TableRow
                      key={lead.id}
                      className="group cursor-pointer"
                      onClick={() => { setSelectedLead(lead); setSheetOpen(true); }}
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
                            setSelectedLead(lead);
                            setSheetOpen(true);
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

      <NewLeadModal open={modalOpen} onOpenChange={setModalOpen} />
      <LeadDetailSheet lead={selectedLead} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
};

export default CRM;
