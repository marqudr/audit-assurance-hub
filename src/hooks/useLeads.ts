import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type LeadStatus = "novo" | "qualificado" | "proposta" | "ganho" | "perdido" | "prospeccao" | "qualificacao" | "diagnostico" | "fechamento";

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
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  tax_regime: string | null;
  fiscal_regime: string | null;
  probability: number | null;
  deal_value: number | null;
  // Attribution
  source_medium: string | null;
  first_touch_channel: string | null;
  last_touch_channel: string | null;
  estimated_cac: number | null;
  // Qualification
  icp_score: number | null;
  has_lucro_fiscal: boolean;
  has_regularidade_fiscal: boolean;
  qualification_method: string | null;
  has_budget: boolean;
  has_authority: boolean;
  has_need: boolean;
  has_timeline: boolean;
  pain_points: string | null;
  context: string | null;
  objection: string | null;
  // Velocity
  next_action: string | null;
  next_action_date: string | null;
  content_consumed: string | null;
  // Interaction history
  last_contacted_date: string | null;
  last_activity_type: string | null;
  next_activity_date: string | null;
  // Revenue
  estimated_ltv: number | null;
  expected_close_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadContact {
  id: string;
  lead_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
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

export function useLeadContacts(leadId: string | undefined) {
  return useQuery({
    queryKey: ["lead-contacts", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_contacts")
        .select("*")
        .eq("lead_id", leadId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as LeadContact[];
    },
    enabled: !!leadId,
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
      address_street?: string;
      address_number?: string;
      address_complement?: string;
      address_neighborhood?: string;
      address_city?: string;
      address_state?: string;
      address_zip?: string;
      tax_regime?: string;
      fiscal_regime?: string;
    }) => {
      const { data, error } = await supabase
        .from("leads")
        .insert({ ...lead, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useCreateLeadContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contact: {
      lead_id: string;
      name: string;
      role?: string;
      phone?: string;
      email?: string;
    }) => {
      const { data, error } = await supabase
        .from("lead_contacts")
        .insert(contact)
        .select()
        .single();
      if (error) throw error;
      return data as LeadContact;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead-contacts", variables.lead_id] });
    },
  });
}

export function useDeleteLeadContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, lead_id }: { id: string; lead_id: string }) => {
      const { error } = await supabase.from("lead_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead-contacts", variables.lead_id] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
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
