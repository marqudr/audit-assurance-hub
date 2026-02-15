import { DollarSign, CheckSquare, GripVertical, Clock, Ghost, Target, ShieldCheck, Trophy, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Lead } from "@/hooks/useLeads";
import type { ChecklistItem } from "@/hooks/useLeadChecklist";
import { getPhaseCompletionCount } from "@/hooks/useLeadChecklist";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

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

function icpBadge(score: number | null) {
  if (score == null) return null;
  if (score <= 3) return { label: `ICP ${score}`, className: "bg-red-100 text-red-700 border-red-200" };
  if (score <= 6) return { label: `ICP ${score}`, className: "bg-yellow-100 text-yellow-700 border-yellow-200" };
  return { label: `ICP ${score}`, className: "bg-green-100 text-green-700 border-green-200" };
}

function timeInStage(updatedAt: string) {
  const days = differenceInDays(new Date(), new Date(updatedAt));
  let color = "text-green-600";
  if (days > 14) color = "text-red-600";
  else if (days > 7) color = "text-yellow-600";
  return { days, color };
}

function borderClass(nextActionDate: string | null) {
  if (!nextActionDate) return "border-yellow-400 border-2";
  if (new Date(nextActionDate) < new Date()) return "border-red-500 border-2";
  return "border";
}

export function KanbanCard({ lead, checklist, onClick }: KanbanCardProps) {
  const { completed, total } = getPhaseCompletionCount(checklist, lead.status);
  const dealValue = formatValue(lead.deal_value);
  const cnpj = formatCnpj(lead.cnpj);
  const icp = icpBadge(lead.icp_score);
  const tis = timeInStage(lead.updated_at);
  const bantScore = [lead.has_budget, lead.has_authority, lead.has_need, lead.has_timeline].filter(Boolean).length;
  const isZombie = !lead.next_action;

  const isGanho = lead.status === "ganho";
  const isPerdido = lead.status === "perdido";

  return (
    <div
      draggable={!isGanho}
      onDragStart={(e) => {
        if (isGanho) { e.preventDefault(); return; }
        e.dataTransfer.setData("text/plain", lead.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onClick}
      className={cn(
        "bg-card rounded-lg p-3 hover:shadow-md transition-shadow space-y-2 select-none",
        isGanho ? "cursor-default ring-2 ring-emerald-400/50 bg-emerald-50/50 dark:bg-emerald-950/20" :
        isPerdido ? "cursor-grab active:cursor-grabbing opacity-60" :
        "cursor-grab active:cursor-grabbing",
        !isGanho && !isPerdido && borderClass(lead.next_action_date)
      )}
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

      {/* Badges row */}
      <div className="flex flex-wrap gap-1">
        {icp && (
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${icp.className}`}>
            <Target className="h-2.5 w-2.5 mr-0.5" />
            {icp.label}
          </Badge>
        )}
        {bantScore > 0 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
            <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
            BANT {bantScore}/4
          </Badge>
        )}
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tis.color}`}>
          <Clock className="h-2.5 w-2.5 mr-0.5" />
          {tis.days}d
        </Badge>
        {isZombie && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200">
            <Ghost className="h-2.5 w-2.5 mr-0.5" />
            Zumbi
          </Badge>
        )}
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
