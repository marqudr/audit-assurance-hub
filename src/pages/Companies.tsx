import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2 } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useProjects } from "@/hooks/useProjects";

const Companies = () => {
  const navigate = useNavigate();
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: projects = [] } = useProjects();

  const companiesWithMetrics = leads.map((lead) => {
    const companyProjects = projects.filter((p) => p.lead_id === lead.id);
    const totalValue = companyProjects.reduce((sum, p) => sum + (p.deal_value || 0), 0);
    return { ...lead, projectCount: companyProjects.length, totalValue };
  });

  const icpBadgeClass = (score: number | null) => {
    if (score == null) return "";
    if (score < 5) return "bg-red-100 text-red-700 border-red-200";
    if (score < 7.5) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-green-100 text-green-700 border-green-200";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Building2 className="h-6 w-6" /> Empresas
        </h1>
        <p className="text-sm text-muted-foreground">Cadastro e histórico completo das empresas</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Regime Tributário</TableHead>
                <TableHead>ICP Score</TableHead>
                <TableHead className="text-center">Projetos</TableHead>
                <TableHead>Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Carregando empresas...
                  </TableCell>
                </TableRow>
              ) : companiesWithMetrics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma empresa cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                companiesWithMetrics.map((company) => (
                  <TableRow
                    key={company.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/empresas/${company.id}`)}
                  >
                    <TableCell className="font-medium">{company.company_name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{company.cnpj || "—"}</TableCell>
                    <TableCell className="text-xs">{company.sector || "—"}</TableCell>
                    <TableCell className="text-xs">{company.tax_regime || "—"}</TableCell>
                    <TableCell>
                      {company.icp_score != null ? (
                        <Badge variant="outline" className={icpBadgeClass(company.icp_score)}>
                          {company.icp_score}/10
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-center">{company.projectCount}</TableCell>
                    <TableCell className="text-xs">
                      {company.totalValue > 0
                        ? `R$ ${company.totalValue.toLocaleString("pt-BR")}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Companies;
