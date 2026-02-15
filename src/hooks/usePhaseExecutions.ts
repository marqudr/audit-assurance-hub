import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PhaseExecution {
  id: string;
  project_id: string;
  phase_number: number;
  agent_id: string;
  status: "running" | "completed" | "failed";
  started_at: string;
  completed_at: string | null;
}

export function usePhaseExecutions(projectId: string | undefined, phaseNumber: number | undefined) {
  return useQuery({
    queryKey: ["phase-executions", projectId, phaseNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phase_executions")
        .select("*")
        .eq("project_id", projectId!)
        .eq("phase_number", phaseNumber!)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data as PhaseExecution[];
    },
    enabled: !!projectId && !!phaseNumber,
  });
}

export function useCreateExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      phaseNumber,
      agentId,
    }: {
      projectId: string;
      phaseNumber: number;
      agentId: string;
    }) => {
      const { data, error } = await supabase
        .from("phase_executions")
        .insert({
          project_id: projectId,
          phase_number: phaseNumber,
          agent_id: agentId,
          status: "running",
        })
        .select()
        .single();
      if (error) throw error;
      return data as PhaseExecution;
    },
    onSuccess: (_, { projectId, phaseNumber }) => {
      queryClient.invalidateQueries({ queryKey: ["phase-executions", projectId, phaseNumber] });
    },
  });
}

export function useUpdateExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      projectId,
      phaseNumber,
    }: {
      id: string;
      status: "completed" | "failed";
      projectId: string;
      phaseNumber: number;
    }) => {
      const { error } = await supabase
        .from("phase_executions")
        .update({ status, completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { projectId, phaseNumber }) => {
      queryClient.invalidateQueries({ queryKey: ["phase-executions", projectId, phaseNumber] });
    },
  });
}
