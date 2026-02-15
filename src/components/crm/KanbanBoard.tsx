import { useMemo } from "react";
import { KanbanColumn } from "./KanbanColumn";
import { useLeadChecklist, isPhaseComplete, getPendingItems } from "@/hooks/useLeadChecklist";
import { useUpdateProject, type Project } from "@/hooks/useProjects";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ChecklistItem } from "@/hooks/useLeadChecklist";

const PIPELINE_PHASES: { phase: string; label: string; color: string }[] = [
  { phase: "prospeccao", label: "Prospecção", color: "bg-blue-500" },
  { phase: "qualificacao", label: "Qualificação", color: "bg-yellow-500" },
  { phase: "diagnostico", label: "Diagnóstico", color: "bg-orange-500" },
  { phase: "proposta", label: "Proposta", color: "bg-purple-500" },
  { phase: "fechamento", label: "Fechamento", color: "bg-green-500" },
  { phase: "ganho", label: "Ganho", color: "bg-emerald-500" },
  { phase: "perdido", label: "Perdido", color: "bg-red-400" },
];

const PHASE_ORDER = PIPELINE_PHASES.map((p) => p.phase);

interface KanbanBoardProps {
  projects: Project[];
  onCardClick: (project: Project) => void;
}

export function KanbanBoard({ projects, onCardClick }: KanbanBoardProps) {
  const updateProject = useUpdateProject();

  // Fetch all checklist items for all projects' leads at once
  const leadIds = [...new Set(projects.map((p) => p.lead_id))];
  const { data: allChecklistRaw = [] } = useQuery({
    queryKey: ["lead-checklist-all", leadIds.sort().join(",")],
    queryFn: async () => {
      if (leadIds.length === 0) return [];
      const { data, error } = await supabase
        .from("lead_checklist_items")
        .select("*")
        .in("lead_id", leadIds);
      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: leadIds.length > 0,
  });

  const allChecklist = useMemo(() => {
    const map: Record<string, ChecklistItem[]> = {};
    allChecklistRaw.forEach((item) => {
      if (!map[item.lead_id]) map[item.lead_id] = [];
      map[item.lead_id].push(item);
    });
    return map;
  }, [allChecklistRaw]);

  const projectsByPhase = useMemo(() => {
    const map: Record<string, Project[]> = {};
    PIPELINE_PHASES.forEach((p) => (map[p.phase] = []));
    projects.forEach((project) => {
      if (map[project.status]) {
        map[project.status].push(project);
      }
    });
    return map;
  }, [projects]);

  const handleDrop = async (projectId: string, targetPhase: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project || project.status === targetPhase) return;

    const currentIndex = PHASE_ORDER.indexOf(project.status);
    const targetIndex = PHASE_ORDER.indexOf(targetPhase);

    // Prevent moving back from "ganho"
    if (project.status === "ganho") {
      toast.error("Projetos ganhos não podem retroceder no pipeline.");
      return;
    }

    // If moving forward, check gate
    if (targetIndex > currentIndex) {
      const checklist = allChecklist[project.lead_id] || [];
      const lastGatedIndex = PHASE_ORDER.indexOf("fechamento");
      for (let i = currentIndex; i < Math.min(targetIndex, lastGatedIndex + 1); i++) {
        const phase = PHASE_ORDER[i];
        if (phase === "ganho" || phase === "perdido") continue;
        if (!isPhaseComplete(checklist, phase)) {
          const pending = getPendingItems(checklist, phase);
          toast.error(`Complete o checklist de "${PIPELINE_PHASES[i].label}" antes de avançar`, {
            description: `Pendente: ${pending.join(", ")}`,
          });
          return;
        }
      }
    }

    try {
      await updateProject.mutateAsync({ id: projectId, status: targetPhase as any });
    } catch {
      toast.error("Erro ao mover projeto.");
    }
  };

  return (
    <div className="flex gap-3 w-full pb-4">
      {PIPELINE_PHASES.map(({ phase, label, color }) => (
        <KanbanColumn
          key={phase}
          phase={phase}
          label={label}
          color={color}
          projects={projectsByPhase[phase] || []}
          allChecklist={allChecklist}
          onDrop={handleDrop}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
}
