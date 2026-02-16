import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, LayoutList, GitBranch, FileText } from "lucide-react";
import { useProject } from "@/hooks/useProjects";
import { ProjectOverviewTab } from "@/components/company/ProjectOverviewTab";
import { ProjectPipelineTab } from "@/components/company/ProjectPipelineTab";
import { ProjectDataRoomTab } from "@/components/company/ProjectDataRoomTab";

const CompanyProjectDetail = () => {
  const { leadId, projectId } = useParams<{ leadId: string; projectId: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(projectId);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(`/empresas/${leadId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <p className="text-muted-foreground">Projeto não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/empresas/${leadId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <p className="text-sm text-muted-foreground">{project.company_name || "Empresa"}</p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <LayoutList className="h-4 w-4" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-1.5">
            <GitBranch className="h-4 w-4" /> Pipeline Operacional
          </TabsTrigger>
          <TabsTrigger value="dataroom" className="gap-1.5">
            <FileText className="h-4 w-4" /> Data Room
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ProjectOverviewTab project={project} />
        </TabsContent>
        <TabsContent value="pipeline">
          <ProjectPipelineTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="dataroom">
          <ProjectDataRoomTab projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanyProjectDetail;
