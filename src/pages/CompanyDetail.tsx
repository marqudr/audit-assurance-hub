import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, FolderKanban, Clock, FileText, Users } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useProjects } from "@/hooks/useProjects";
import { CompanyOverview } from "@/components/company/CompanyOverview";
import { CompanyProjects } from "@/components/company/CompanyProjects";
import { CompanyTimeline } from "@/components/company/CompanyTimeline";
import { CompanyDataRoom } from "@/components/company/CompanyDataRoom";
import { CompanyUsers } from "@/components/company/CompanyUsers";

const CompanyDetail = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: allProjects = [], isLoading: projectsLoading } = useProjects();

  const lead = leads.find((l) => l.id === leadId) || null;
  const companyProjects = allProjects.filter((p) => p.lead_id === leadId);

  if (leadsLoading || projectsLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  if (!lead) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/empresas")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <p className="text-muted-foreground">Empresa não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/empresas")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Building2 className="h-5 w-5" /> {lead.company_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lead.cnpj || "CNPJ não informado"} · {lead.sector || "Setor não informado"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <Building2 className="h-4 w-4" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-1.5">
            <FolderKanban className="h-4 w-4" /> Projetos ({companyProjects.length})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5">
            <Clock className="h-4 w-4" /> Histórico
          </TabsTrigger>
          <TabsTrigger value="dataroom" className="gap-1.5">
            <FileText className="h-4 w-4" /> Data Room
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-4 w-4" /> Usuários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CompanyOverview lead={lead} />
        </TabsContent>
        <TabsContent value="projects">
          <CompanyProjects projects={companyProjects} leadId={lead.id} />
        </TabsContent>
        <TabsContent value="timeline">
          <CompanyTimeline projects={companyProjects} />
        </TabsContent>
        <TabsContent value="dataroom">
          <CompanyDataRoom leadId={lead.id} />
        </TabsContent>
        <TabsContent value="users">
          <CompanyUsers companyId={lead.id} companyName={lead.company_name} />
        </TabsContent>
      </Tabs>

    </div>
  );
};

export default CompanyDetail;
