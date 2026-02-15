import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface RagFile {
  id: string;
  agent_id: string;
  file_name: string;
  storage_path: string;
  file_size: number;
  created_at: string;
}

export function useRagFiles(agentId: string | undefined) {
  return useQuery({
    queryKey: ["rag-files", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_rag_files")
        .select("*")
        .eq("agent_id", agentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as RagFile[];
    },
    enabled: !!agentId,
  });
}

export function useUploadRagFile() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ agentId, file }: { agentId: string; file: File }) => {
      const path = `${user!.id}/${agentId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("rag-files")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("agent_rag_files").insert({
        agent_id: agentId,
        file_name: file.name,
        storage_path: path,
        file_size: file.size,
      });
      if (dbError) throw dbError;
    },
    onSuccess: (_, { agentId }) => {
      qc.invalidateQueries({ queryKey: ["rag-files", agentId] });
      toast({ title: "Arquivo enviado com sucesso!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao enviar arquivo", description: e.message, variant: "destructive" });
    },
  });
}

export function useDeleteRagFile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storagePath, agentId }: { id: string; storagePath: string; agentId: string }) => {
      const { error: storageError } = await supabase.storage
        .from("rag-files")
        .remove([storagePath]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from("agent_rag_files").delete().eq("id", id);
      if (dbError) throw dbError;

      return agentId;
    },
    onSuccess: (agentId) => {
      qc.invalidateQueries({ queryKey: ["rag-files", agentId] });
      toast({ title: "Arquivo removido!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao remover arquivo", description: e.message, variant: "destructive" });
    },
  });
}
