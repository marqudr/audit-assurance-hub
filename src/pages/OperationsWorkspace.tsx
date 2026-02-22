import { ProjectWorkflowTab } from "@/components/company/ProjectWorkflowTab";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function OperationsWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  if (!projectId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/operations")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <p className="text-muted-foreground text-sm">Projeto não encontrado.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/operations")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para Operações
        </Button>
      </div>
      <ProjectWorkflowTab projectId={projectId} />
    </div>
  );
}
