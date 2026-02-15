import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type LeadStatus = "novo" | "qualificado" | "proposta" | "ganho";

export interface Lead {
  id: string;
  user_id: string;
  company_name: string;
  cnpj: string | null;
  cnae: string | null;
  sector: string | null;
  revenue_range: string | null;
  status: LeadStatus;
  engineering_headcount: number | null;
  rd_annual_budget: number | null;
  estimated_benefit_min: number | null;
  estimated_benefit_max: number | null;
  created_at: string;
  updated_at: string;
}

export function useLeads() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["leads", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!user,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (lead: {
      company_name: string;
      cnpj?: string;
      cnae?: string;
      sector?: string;
      revenue_range?: string;
    }) => {
      const { data, error } = await supabase
        .from("leads")
        .insert({ ...lead, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}
