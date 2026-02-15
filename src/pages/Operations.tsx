import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useProjectPhases, useInitializePipeline } from "@/hooks/useProjectPhases";
import { ProjectCard } from "@/components/operations/ProjectCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

function useOperationsProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["operations-projects", user?.id],
    queryFn: async () => {
      // Get projects with status "ganho" or that already have phases
      const { data: wonProjects, error: e1 } = await supabase
        .from("projects")
        .select("*, leads!inner(company_name, cnpj)")
        .eq("status", "ganho")
        .order("updated_at", { ascending: false });
      if (e1) throw e1;

      const { data: allPhases, error: e2 } = await supabase
        .from("project_phases")
        .select("*")
        .order("phase_number");
      if (e2) throw e2;

      // Map phases by project
      const phaseMap: Record<string, any[]> = {};
      for (const p of allPhases || []) {
        if (!phaseMap[p.project_id]) phaseMap[p.project_id] = [];
        phaseMap[p.project_id].push(p);
      }

      // Include won projects + projects that have phases even if status changed
      const projectIds = new Set<string>();
      const result: any[] = [];
      
      for (const p of wonProjects || []) {
        projectIds.add(p.id);
        result.push({
          ...p,
          company_name: p.leads?.company_name,
          cnpj: p.leads?.cnpj,
          leads: undefined,
          phases: phaseMap[p.id] || [],
        });
      }

      // Add projects with phases that aren't already included
      for (const [pid, phases] of Object.entries(phaseMap)) {
        if (!projectIds.has(pid)) {
          const { data: proj } = await supabase
            .from("projects")
            .select("*, leads!inner(company_name, cnpj)")
            .eq("id", pid)
            .maybeSingle();
          if (proj) {
            result.push({
              ...proj,
              company_name: proj.leads?.company_name,
              cnpj: proj.leads?.cnpj,
              leads: undefined,
              phases,
            });
          }
        }
      }

      return result;
    },
    enabled: !!user,
  });
}

const Operations = () => {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useOperationsProjects();
  const initPipeline = useInitializePipeline();

  const handleInitialize = async (projectId: string) => {
    try {
      await initPipeline.mutateAsync(projectId);
      toast({ title: "Pipeline iniciado!" });
    } catch (err: any) {
      toast({ title: "Erro ao iniciar pipeline", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Operations</h1>
        <p className="text-sm text-muted-foreground">
          Pipeline operacional de Service Delivery — projetos ganhos
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && (!projects || projects.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm font-medium">Nenhum projeto com status "ganho"</p>
          <p className="text-xs mt-1">Feche negócios no CRM para iniciar o pipeline operacional.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.map((p: any) => (
          <ProjectCard
            key={p.id}
            project={p}
            phases={p.phases || []}
            onOpen={() => navigate(`/operations/${p.id}`)}
            onInitialize={() => handleInitialize(p.id)}
            isInitializing={initPipeline.isPending}
          />
        ))}
      </div>
    </div>
  );
};

export default Operations;
