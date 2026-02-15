import { useMemo } from "react";
import { KanbanColumn } from "./KanbanColumn";
import { useLeadChecklist, isPhaseComplete, getPendingItems } from "@/hooks/useLeadChecklist";
import { useUpdateLead, type Lead, type LeadStatus } from "@/hooks/useLeads";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ChecklistItem } from "@/hooks/useLeadChecklist";

const PIPELINE_PHASES: { phase: string; label: string; color: string }[] = [
  { phase: "prospeccao", label: "Prospecção", color: "bg-blue-500" },
  { phase: "qualificacao", label: "Qualificação", color: "bg-yellow-500" },
  { phase: "diagnostico", label: "Diagnóstico", color: "bg-orange-500" },
  { phase: "proposta", label: "Proposta", color: "bg-purple-500" },
  { phase: "fechamento", label: "Fechamento", color: "bg-green-500" },
];

const PHASE_ORDER = PIPELINE_PHASES.map((p) => p.phase);

interface KanbanBoardProps {
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
}

export function KanbanBoard({ leads, onCardClick }: KanbanBoardProps) {
  const updateLead = useUpdateLead();

  // Fetch all checklist items for all leads at once
  const leadIds = leads.map((l) => l.id);
  const { data: allChecklistRaw = [] } = useQuery({
    queryKey: ["lead-checklist-all", leadIds.sort().join(",")],
    queryFn: async () => {
      if (leadIds.length === 0) return [];
      const { data, error } = await supabase
        .from("lead_checklist_items")
        .select("*")
        .in("lead_id", leadIds);
      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: leadIds.length > 0,
  });

  const allChecklist = useMemo(() => {
    const map: Record<string, ChecklistItem[]> = {};
    allChecklistRaw.forEach((item) => {
      if (!map[item.lead_id]) map[item.lead_id] = [];
      map[item.lead_id].push(item);
    });
    return map;
  }, [allChecklistRaw]);

  const leadsByPhase = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    PIPELINE_PHASES.forEach((p) => (map[p.phase] = []));
    leads.forEach((lead) => {
      if (map[lead.status]) {
        map[lead.status].push(lead);
      }
    });
    return map;
  }, [leads]);

  const handleDrop = async (leadId: string, targetPhase: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === targetPhase) return;

    const currentIndex = PHASE_ORDER.indexOf(lead.status);
    const targetIndex = PHASE_ORDER.indexOf(targetPhase);

    // If moving forward, check gate
    if (targetIndex > currentIndex) {
      const checklist = allChecklist[leadId] || [];
      // Check all phases between current and target
      for (let i = currentIndex; i < targetIndex; i++) {
        const phase = PHASE_ORDER[i];
        if (!isPhaseComplete(checklist, phase)) {
          const pending = getPendingItems(checklist, phase);
          toast.error(`Complete o checklist de "${PIPELINE_PHASES[i].label}" antes de avançar`, {
            description: `Pendente: ${pending.join(", ")}`,
          });
          return;
        }
      }
    }

    try {
      await updateLead.mutateAsync({ id: leadId, status: targetPhase as LeadStatus });
    } catch {
      toast.error("Erro ao mover lead.");
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {PIPELINE_PHASES.map(({ phase, label, color }) => (
        <KanbanColumn
          key={phase}
          phase={phase}
          label={label}
          color={color}
          leads={leadsByPhase[phase] || []}
          allChecklist={allChecklist}
          onDrop={handleDrop}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
}
