import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FlaskConical } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import type { Project } from "@/hooks/useProjects";

interface CompanyProjectsProps {
  projects: Project[];
  leadId: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  prospeccao: { label: "Prospecção", className: "bg-blue-100 text-blue-800 border-blue-200" },
  qualificacao: { label: "Qualificação", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  diagnostico: { label: "Diagnóstico", className: "bg-orange-100 text-orange-800 border-orange-200" },
  proposta: { label: "Proposta", className: "bg-purple-100 text-purple-800 border-purple-200" },
  fechamento: { label: "Fechamento", className: "bg-green-100 text-green-800 border-green-200" },
  ganho: { label: "Ganho", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  perdido: { label: "Perdido", className: "bg-red-100 text-red-800 border-red-200" },
};

export function CompanyProjects({ projects, leadId }: CompanyProjectsProps) {
  const navigate = useNavigate();

  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground italic mt-4">Nenhum projeto vinculado.</p>;
  }

  return (
    <div className="space-y-3 mt-4">
      {projects.map((project) => {
        const status = statusConfig[project.status] || statusConfig.prospeccao;
        const frascatiScore = [project.frascati_novidade, project.frascati_criatividade, project.frascati_incerteza, project.frascati_sistematicidade, project.frascati_transferibilidade].filter(Boolean).length;
        const frascatiBadge = frascatiScore < 3 ? "bg-red-100 text-red-700 border-red-200" : frascatiScore < 5 ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-green-100 text-green-700 border-green-200";

        return (
          <Card key={project.id} className="group cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/empresas/${leadId}/projetos/${project.id}`)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm truncate">{project.name}</h3>
                    <Badge variant="outline" className={status.className}>{status.label}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {project.deal_value != null && (
                      <span>R$ {project.deal_value.toLocaleString("pt-BR")}</span>
                    )}
                    <span>Criado: {format(new Date(project.created_at), "dd/MM/yyyy")}</span>
                    <span>Atualizado: {format(new Date(project.updated_at), "dd/MM/yyyy")}</span>
                    <Badge variant="outline" className={frascatiBadge}>
                      <FlaskConical className="h-3 w-3 mr-1" /> Frascati {frascatiScore}/5
                    </Badge>
                  </div>
                  {project.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{project.description}</p>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 shrink-0 ml-2">
                  <Eye className="h-4 w-4 mr-1" /> Ver
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
