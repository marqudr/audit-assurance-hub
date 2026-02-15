import { DollarSign, CheckSquare, GripVertical } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Lead } from "@/hooks/useLeads";
import type { ChecklistItem } from "@/hooks/useLeadChecklist";
import { getPhaseCompletionCount } from "@/hooks/useLeadChecklist";

interface KanbanCardProps {
  lead: Lead;
  checklist: ChecklistItem[];
  onClick: () => void;
}

function formatCnpj(cnpj: string | null) {
  if (!cnpj) return null;
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function formatValue(val: number | null) {
  if (!val) return null;
  if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (val >= 1_000) return `R$ ${(val / 1_000).toFixed(0)}K`;
  return `R$ ${val.toFixed(0)}`;
}

function probColor(prob: number | null) {
  if (!prob) return "bg-muted";
  if (prob < 30) return "bg-red-500";
  if (prob <= 60) return "bg-yellow-500";
  return "bg-green-500";
}

export function KanbanCard({ lead, checklist, onClick }: KanbanCardProps) {
  const { completed, total } = getPhaseCompletionCount(checklist, lead.status);
  const dealValue = formatValue(lead.deal_value);
  const cnpj = formatCnpj(lead.cnpj);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onClick}
      className="bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow space-y-2 select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{lead.company_name}</p>
          {cnpj && (
            <p className="text-xs text-muted-foreground font-mono truncate">{cnpj}</p>
          )}
        </div>
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      </div>

      <div className="flex items-center gap-3 text-xs">
        {dealValue && (
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <DollarSign className="h-3 w-3" />
            {dealValue}
          </span>
        )}
        <span className="flex items-center gap-1 text-muted-foreground">
          <CheckSquare className="h-3 w-3" />
          {completed}/{total}
        </span>
      </div>

      {lead.probability != null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Probabilidade</span>
            <span className="font-medium">{lead.probability}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${probColor(lead.probability)}`}
              style={{ width: `${lead.probability}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
