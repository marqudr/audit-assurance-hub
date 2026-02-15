import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PhaseOutput {
  id: string;
  project_id: string;
  phase_number: number;
  version_type: "ai" | "human";
  content: string;
  created_by: string;
  created_at: string;
}

export function usePhaseOutputs(projectId: string | undefined, phaseNumber: number | undefined) {
  return useQuery({
    queryKey: ["phase-outputs", projectId, phaseNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phase_outputs")
        .select("*")
        .eq("project_id", projectId!)
        .eq("phase_number", phaseNumber!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PhaseOutput[];
    },
    enabled: !!projectId && !!phaseNumber,
  });
}

export function useLatestOutputs(projectId: string | undefined, phaseNumber: number | undefined) {
  const { data: all } = usePhaseOutputs(projectId, phaseNumber);
  const aiOutput = all?.find((o) => o.version_type === "ai");
  const humanOutput = all?.find((o) => o.version_type === "human");
  return { aiOutput, humanOutput };
}

export function useSavePhaseOutput() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      projectId,
      phaseNumber,
      versionType,
      content,
    }: {
      projectId: string;
      phaseNumber: number;
      versionType: "ai" | "human";
      content: string;
    }) => {
      const { data, error } = await supabase
        .from("phase_outputs")
        .insert({
          project_id: projectId,
          phase_number: phaseNumber,
          version_type: versionType,
          content,
          created_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { projectId, phaseNumber }) => {
      queryClient.invalidateQueries({ queryKey: ["phase-outputs", projectId, phaseNumber] });
    },
  });
}
