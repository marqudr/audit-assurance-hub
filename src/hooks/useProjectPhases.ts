import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const PHASE_NAMES = [
  "Elegibilidade",
  "Diagnóstico Técnico",
  "Rastreabilidade",
  "Memória de Cálculo",
  "Engenharia de Narrativa",
  "Stress Test",
  "Transmissão",
];

export type PhaseStatus = "not_started" | "in_progress" | "review" | "approved";

export interface ProjectPhase {
  id: string;
  project_id: string;
  phase_number: number;
  phase_name: string;
  status: PhaseStatus;
  approved_by: string | null;
  approved_at: string | null;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useProjectPhases(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-phases", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_phases")
        .select("*")
        .eq("project_id", projectId!)
        .order("phase_number");
      if (error) throw error;
      return data as ProjectPhase[];
    },
    enabled: !!projectId,
  });
}

export function useInitializePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const rows = PHASE_NAMES.map((name, i) => ({
        project_id: projectId,
        phase_number: i + 1,
        phase_name: name,
        status: i === 0 ? "in_progress" : "not_started",
      }));
      const { error } = await supabase.from("project_phases").insert(rows);
      if (error) throw error;
    },
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["project-phases", projectId] });
      queryClient.invalidateQueries({ queryKey: ["operations-projects"] });
    },
  });
}

export function useApprovePhase() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, phaseNumber }: { projectId: string; phaseNumber: number }) => {
      // Approve current phase
      const { error: e1 } = await supabase
        .from("project_phases")
        .update({
          status: "approved",
          approved_by: user!.id,
          approved_at: new Date().toISOString(),
        })
        .eq("project_id", projectId)
        .eq("phase_number", phaseNumber);
      if (e1) throw e1;

      // Advance next phase if exists
      if (phaseNumber < 7) {
        const { error: e2 } = await supabase
          .from("project_phases")
          .update({ status: "in_progress" })
          .eq("project_id", projectId)
          .eq("phase_number", phaseNumber + 1);
        if (e2) throw e2;
      }
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["project-phases", projectId] });
    },
  });
}

export function useUpdatePhaseAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, phaseNumber, agentId }: { projectId: string; phaseNumber: number; agentId: string | null }) => {
      const { error } = await supabase
        .from("project_phases")
        .update({ agent_id: agentId })
        .eq("project_id", projectId)
        .eq("phase_number", phaseNumber);
      if (error) throw error;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["project-phases", projectId] });
    },
  });
}

export function useUpdatePhaseStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, phaseNumber, status }: { projectId: string; phaseNumber: number; status: PhaseStatus }) => {
      const { error } = await supabase
        .from("project_phases")
        .update({ status })
        .eq("project_id", projectId)
        .eq("phase_number", phaseNumber);
      if (error) throw error;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["project-phases", projectId] });
    },
  });
}
