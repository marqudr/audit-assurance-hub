import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ProjectAttachment {
  id: string;
  project_id: string;
  user_id: string;
  file_name: string;
  file_size: number | null;
  storage_path: string;
  phase: string | null;
  custom_name?: string | null;
  description?: string | null;
  created_at: string;
}

export function useProjectAttachments(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-attachments", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_attachments")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProjectAttachment[];
    },
    enabled: !!projectId,
  });
}

const CRM_PHASES = ["qualificacao", "diagnostico", "proposta", "fechamento", "ganho", "perdido", "novo", "qualificado"];

export function useCompanyAttachments(leadId: string | undefined) {
  return useQuery({
    queryKey: ["company-attachments", leadId],
    queryFn: async () => {
      const { data: projects, error: pErr } = await supabase
        .from("projects")
        .select("id, name")
        .eq("lead_id", leadId!);
      if (pErr) throw pErr;
      if (!projects || projects.length === 0) return [];

      const projectIds = projects.map((p) => p.id);
      const { data, error } = await supabase
        .from("project_attachments")
        .select("*")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));
      // Filter only CRM-phase attachments
      return (data || [])
        .filter((a) => a.phase && CRM_PHASES.includes(a.phase))
        .map((a) => ({
          ...a,
          project_name: projectMap[a.project_id] || "—",
        }));
    },
    enabled: !!leadId,
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      projectId,
      file,
      phase,
      customName,
      description,
    }: {
      projectId: string;
      file: File;
      phase?: string;
      customName?: string;
      description?: string;
    }) => {
      const storagePath = `${user!.id}/${projectId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(storagePath, file);
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("project_attachments")
        .insert({
          project_id: projectId,
          user_id: user!.id,
          file_name: file.name,
          file_size: file.size,
          storage_path: storagePath,
          phase: phase as any,
          custom_name: customName || null,
          description: description || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-attachments", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["company-attachments"] });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storagePath, projectId }: { id: string; storagePath: string; projectId: string }) => {
      await supabase.storage.from("project-files").remove([storagePath]);
      const { error } = await supabase.from("project_attachments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-attachments", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["company-attachments"] });
    },
  });
}
