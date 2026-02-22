import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { LeadStatus } from "./useLeads";

export interface Project {
  id: string;
  lead_id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: LeadStatus;
  deal_value: number | null;
  probability: number | null;
  expected_close_date: string | null;
  estimated_benefit_min: number | null;
  estimated_benefit_max: number | null;
  engineering_headcount: number | null;
  rd_annual_budget: number | null;
  icp_score: number | null;
  frascati_novidade: boolean;
  frascati_criatividade: boolean;
  frascati_incerteza: boolean;
  frascati_sistematicidade: boolean;
  frascati_transferibilidade: boolean;
  classification: string | null;
  objective: string | null;
  innovation: string | null;
  technical_challenges: string | null;
  tech_lead: string | null;
  base_year: number | null;
  pain_points: string | null;
  context: string | null;
  objection: string | null;
  next_action: string | null;
  next_action_date: string | null;
  last_contacted_date: string | null;
  last_activity_type: string | null;
  next_activity_date: string | null;
  content_consumed: string | null;
  estimated_ltv: number | null;
  source_medium: string | null;
  first_touch_channel: string | null;
  last_touch_channel: string | null;
  estimated_cac: number | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  company_name?: string;
  cnpj?: string | null;
}

export function useProjects(leadId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["projects", user?.id, leadId],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*, leads!inner(company_name, cnpj)")
        .order("updated_at", { ascending: false });
      if (leadId) {
        query = query.eq("lead_id", leadId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        company_name: p.leads?.company_name,
        cnpj: p.leads?.cnpj,
        leads: undefined,
      })) as unknown as Project[];
    },
    enabled: !!user,
  });
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, leads!inner(company_name, cnpj)")
        .eq("id", projectId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        company_name: (data as any).leads?.company_name,
        cnpj: (data as any).leads?.cnpj,
        leads: undefined,
      } as unknown as Project;
    },
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (project: {
      lead_id: string;
      name: string;
      description?: string;
      deal_value?: number;
      status?: LeadStatus;
      classification?: string;
      objective?: string;
      innovation?: string;
      technical_challenges?: string;
      tech_lead?: string;
      base_year?: number;
    }) => {
      const { data, error } = await supabase
        .from("projects")
        .insert({ ...project, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { leads, company_name, cnpj, ...dbUpdates } = updates as any;
      const { data, error } = await supabase
        .from("projects")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
