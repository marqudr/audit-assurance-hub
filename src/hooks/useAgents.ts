import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  persona: string;
  instructions: string;
  temperature: number;
  model_config: { model: string };
  status: "active" | "inactive" | "draft";
  created_at: string;
  updated_at: string;
}

export type AgentInsert = Omit<Agent, "id" | "created_at" | "updated_at">;

export function useAgents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Agent[];
    },
    enabled: !!user,
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (agent: Partial<AgentInsert>) => {
      const { data, error } = await supabase
        .from("agents")
        .insert([{ ...agent, user_id: user!.id } as any])
        .select()
        .single();
      if (error) throw error;
      return data as Agent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      toast({ title: "Agente criado com sucesso!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao criar agente", description: e.message, variant: "destructive" });
    },
  });
}

export function useUpdateAgent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Agent> & { id: string }) => {
      const { data, error } = await supabase
        .from("agents")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Agent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      toast({ title: "Agente atualizado!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" });
    },
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      toast({ title: "Agente excluído!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
    },
  });
}
