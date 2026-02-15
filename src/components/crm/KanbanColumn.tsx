import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { KanbanCard } from "./KanbanCard";
import type { Project } from "@/hooks/useProjects";
import type { ChecklistItem } from "@/hooks/useLeadChecklist";

interface KanbanColumnProps {
  phase: string;
  label: string;
  color: string;
  projects: Project[];
  allChecklist: Record<string, ChecklistItem[]>;
  onDrop: (projectId: string, targetPhase: string) => void;
  onCardClick: (project: Project) => void;
}

function formatColumnValue(projects: Project[]) {
  const total = projects.reduce((sum, p) => sum + (p.deal_value || 0), 0);
  if (total === 0) return null;
  if (total >= 1_000_000) return `R$ ${(total / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (total >= 1_000) return `R$ ${(total / 1_000).toFixed(0)}K`;
  return `R$ ${total.toFixed(0)}`;
}

export function KanbanColumn({
  phase,
  label,
  color,
  projects,
  allChecklist,
  onDrop,
  onCardClick,
}: KanbanColumnProps) {
  const [dragOver, setDragOver] = useState(false);
  const totalValue = formatColumnValue(projects);

  return (
    <div
      className={`flex flex-col flex-1 min-w-[200px] rounded-lg border bg-muted/30 transition-colors ${
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
        const projectId = e.dataTransfer.getData("text/plain");
        if (projectId) onDrop(projectId, phase);
      }}
    >
      {/* Header */}
      <div className="p-3 space-y-1">
        <div className={`h-1 w-full rounded-full ${color}`} />
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-semibold">{label}</span>
          <Badge variant="secondary" className="text-xs">
            {projects.length}
          </Badge>
        </div>
        {totalValue && (
          <p className="text-xs text-muted-foreground">{totalValue}</p>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)]">
        {projects.map((project) => (
          <KanbanCard
            key={project.id}
            project={project}
            checklist={allChecklist[project.lead_id] || []}
            onClick={() => onCardClick(project)}
          />
        ))}
        {projects.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Nenhum projeto
          </p>
        )}
      </div>
    </div>
  );
}
