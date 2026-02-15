import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Building2 } from "lucide-react";
import type { Project } from "@/hooks/useProjects";
import type { ProjectPhase } from "@/hooks/useProjectPhases";

interface ProjectCardProps {
  project: Project;
  phases: ProjectPhase[];
  onOpen: () => void;
  onInitialize: () => void;
  isInitializing: boolean;
}

export function ProjectCard({ project, phases, onOpen, onInitialize, isInitializing }: ProjectCardProps) {
  const hasPipeline = phases.length > 0;
  const approvedCount = phases.filter((p) => p.status === "approved").length;
  const currentPhase = phases.find((p) => p.status === "in_progress" || p.status === "review");

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={hasPipeline ? onOpen : undefined}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-2">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{project.name}</p>
              <p className="text-[10px] text-muted-foreground">{project.company_name}</p>
            </div>
          </div>
          {hasPipeline && (
            <Badge variant="outline" className="text-[10px]">
              {approvedCount}/7
            </Badge>
          )}
        </div>

        {hasPipeline ? (
          <>
            {/* Mini progress bar */}
            <div className="flex gap-1">
              {phases.map((p) => (
                <div
                  key={p.id}
                  className={`h-1.5 flex-1 rounded-full ${
                    p.status === "approved"
                      ? "bg-success"
                      : p.status === "in_progress"
                      ? "bg-warning"
                      : p.status === "review"
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
            {currentPhase && (
              <p className="text-[10px] text-muted-foreground">
                Fase atual: {currentPhase.phase_name}
              </p>
            )}
            <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={onOpen}>
              <ArrowRight className="h-3 w-3 mr-1" />
              Abrir Workspace
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            className="w-full text-xs h-7"
            onClick={(e) => { e.stopPropagation(); onInitialize(); }}
            disabled={isInitializing}
          >
            <Play className="h-3 w-3 mr-1" />
            Iniciar Pipeline
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
