import { useNavigate } from "react-router-dom";
import { useClientProjects, getClientFriendlyStatus } from "@/hooks/useClientPortal";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ChevronRight } from "lucide-react";

function ProjectPhaseInfo({ projectId }: { projectId: string }) {
  const { data: phases, isLoading } = useProjectPhases(projectId);

  if (isLoading) return <span className="text-muted-foreground text-xs">...</span>;
  if (!phases || phases.length === 0) return <span className="text-muted-foreground text-xs">—</span>;

  const currentPhase = phases.find((p) => p.status === "in_progress" || p.status === "review");
  const allApproved = phases.every((p) => p.status === "approved");

  const statusLabel = allApproved
    ? "Concluído"
    : currentPhase
    ? getClientFriendlyStatus(currentPhase.status)
    : "Em análise técnica";

  const phaseNum = currentPhase?.phase_number ?? (allApproved ? 7 : 1);

  const statusColor = allApproved
    ? "bg-success/10 text-success border-success/20"
    : currentPhase?.status === "review"
    ? "bg-warning/10 text-warning border-warning/20"
    : "bg-primary/10 text-primary border-primary/20";

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={statusColor}>
        {statusLabel}
      </Badge>
      <span className="text-xs text-muted-foreground">Fase {phaseNum}/7</span>
    </div>
  );
}

export default function PortalProjects() {
  const { data: projects, isLoading } = useClientProjects();
  const navigate = useNavigate();

  const formatCurrency = (val: number | null) =>
    val
      ? val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "—";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meus Projetos</h1>
        <p className="text-muted-foreground text-sm">
          Acompanhe o progresso dos seus projetos de incentivo fiscal
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Benefício Estimado</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!projects || projects.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum projeto encontrado.
                  </TableCell>
                </TableRow>
              )}
              {projects?.map((project) => (
                <TableRow
                  key={project.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/portal/projetos/${project.id}`)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-xs">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ProjectPhaseInfo projectId={project.id} />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatCurrency(project.estimated_benefit_min)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(project.updated_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
