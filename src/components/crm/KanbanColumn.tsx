import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { KanbanCard } from "./KanbanCard";
import type { Lead } from "@/hooks/useLeads";
import type { ChecklistItem } from "@/hooks/useLeadChecklist";

interface KanbanColumnProps {
  phase: string;
  label: string;
  color: string;
  leads: Lead[];
  allChecklist: Record<string, ChecklistItem[]>;
  onDrop: (leadId: string, targetPhase: string) => void;
  onCardClick: (lead: Lead) => void;
}

function formatColumnValue(leads: Lead[]) {
  const total = leads.reduce((sum, l) => sum + (l.deal_value || 0), 0);
  if (total === 0) return null;
  if (total >= 1_000_000) return `R$ ${(total / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (total >= 1_000) return `R$ ${(total / 1_000).toFixed(0)}K`;
  return `R$ ${total.toFixed(0)}`;
}

export function KanbanColumn({
  phase,
  label,
  color,
  leads,
  allChecklist,
  onDrop,
  onCardClick,
}: KanbanColumnProps) {
  const [dragOver, setDragOver] = useState(false);
  const totalValue = formatColumnValue(leads);

  return (
    <div
      className={`flex flex-col min-w-[260px] w-[260px] rounded-lg border bg-muted/30 transition-colors ${
        dragOver ? "ring-2 ring-primary border-dashed border-primary" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const leadId = e.dataTransfer.getData("text/plain");
        if (leadId) onDrop(leadId, phase);
      }}
    >
      {/* Header */}
      <div className="p-3 space-y-1">
        <div className={`h-1 w-full rounded-full ${color}`} />
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-semibold">{label}</span>
          <Badge variant="secondary" className="text-xs">
            {leads.length}
          </Badge>
        </div>
        {totalValue && (
          <p className="text-xs text-muted-foreground">{totalValue}</p>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)]">
        {leads.map((lead) => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            checklist={allChecklist[lead.id] || []}
            onClick={() => onCardClick(lead)}
          />
        ))}
        {leads.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Nenhum lead
          </p>
        )}
      </div>
    </div>
  );
}
