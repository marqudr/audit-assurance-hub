import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LeadStatus } from "./useLeads";

export interface ChecklistItem {
  id: string;
  lead_id: string;
  phase: LeadStatus;
  item_key: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export const PHASE_CHECKLIST: Record<string, { key: string; label: string }[]> = {
  prospeccao: [
    { key: "contato_decisor", label: "Contato decisor identificado" },
    { key: "cnpj_validado", label: "CNPJ validado" },
    { key: "setor_confirmado", label: "Setor confirmado" },
    { key: "icp_score_ok", label: "ICP Score ≥ 7,5 (Elegibilidade confirmada)" },
  ],
  qualificacao: [
    { key: "regime_tributario", label: "Regime tributário definido" },
    { key: "faixa_receita", label: "Faixa de receita preenchida" },
    { key: "reuniao_qualificacao", label: "Reunião de qualificação realizada" },
    { key: "frascati_completo", label: "Filtro Frascati completo (5/5)" },
  ],
  diagnostico: [
    { key: "headcount_engenharia", label: "Headcount de engenharia informado" },
    { key: "orcamento_pd", label: "Orçamento de P&D preenchido" },
    { key: "simulacao_fiscal", label: "Simulação fiscal executada" },
  ],
  proposta: [
    { key: "proposta_enviada", label: "Proposta comercial enviada" },
    { key: "retorno_cliente", label: "Retorno do cliente registrado" },
  ],
  fechamento: [
    { key: "contrato_assinado", label: "Contrato assinado" },
    { key: "kickoff_agendado", label: "Kickoff agendado" },
  ],
};

export function useLeadChecklist(leadId: string | undefined) {
  return useQuery({
    queryKey: ["lead-checklist", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_checklist_items")
        .select("*")
        .eq("lead_id", leadId!);
      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: !!leadId,
  });
}

export function useToggleChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      phase,
      itemKey,
      completed,
    }: {
      leadId: string;
      phase: LeadStatus;
      itemKey: string;
      completed: boolean;
    }) => {
      if (completed) {
        const { error } = await supabase
          .from("lead_checklist_items")
          .upsert(
            {
              lead_id: leadId,
              phase: phase as any,
              item_key: itemKey,
              completed: true,
              completed_at: new Date().toISOString(),
            },
            { onConflict: "lead_id,phase,item_key" }
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("lead_checklist_items")
          .delete()
          .eq("lead_id", leadId)
          .eq("phase", phase as any)
          .eq("item_key", itemKey);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead-checklist", variables.leadId] });
    },
  });
}

export function getPhaseCompletionCount(
  checklist: ChecklistItem[],
  phase: string
): { completed: number; total: number } {
  const items = PHASE_CHECKLIST[phase] || [];
  const completedItems = items.filter((item) =>
    checklist.some((c) => c.phase === phase && c.item_key === item.key && c.completed)
  );
  return { completed: completedItems.length, total: items.length };
}

export function isPhaseComplete(checklist: ChecklistItem[], phase: string): boolean {
  const { completed, total } = getPhaseCompletionCount(checklist, phase);
  return total > 0 && completed === total;
}

export function getPendingItems(checklist: ChecklistItem[], phase: string): string[] {
  const items = PHASE_CHECKLIST[phase] || [];
  return items
    .filter((item) => !checklist.some((c) => c.phase === phase && c.item_key === item.key && c.completed))
    .map((item) => item.label);
}
