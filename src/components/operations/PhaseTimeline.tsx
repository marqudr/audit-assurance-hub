import { CheckCircle2, Circle, Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectPhase } from "@/hooks/useProjectPhases";

interface PhaseTimelineProps {
  phases: ProjectPhase[];
  activePhase: number;
  onSelectPhase: (n: number) => void;
}

const statusIcon = {
  not_started: Circle,
  in_progress: Clock,
  review: Eye,
  approved: CheckCircle2,
};

const statusColor = {
  not_started: "bg-muted-foreground/30",
  in_progress: "bg-warning",
  review: "bg-primary",
  approved: "bg-success",
};

export function PhaseTimeline({ phases, activePhase, onSelectPhase }: PhaseTimelineProps) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto">
      {phases.map((phase, i) => {
        const Icon = statusIcon[phase.status];
        const isActive = phase.phase_number === activePhase;
        return (
          <div key={phase.id} className="flex items-center">
            <button
              onClick={() => onSelectPhase(phase.phase_number)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-accent"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{phase.phase_name}</span>
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isActive ? "bg-primary-foreground" : statusColor[phase.status]
                )}
              />
            </button>
            {i < phases.length - 1 && (
              <div
                className={cn(
                  "h-px w-6 mx-1",
                  phase.status === "approved" ? "bg-success" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
