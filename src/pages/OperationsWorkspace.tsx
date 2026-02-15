import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useProject } from "@/hooks/useProjects";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { PhaseTimeline } from "@/components/operations/PhaseTimeline";
import { DataRoomPanel } from "@/components/operations/DataRoomPanel";
import { EditorPanel } from "@/components/operations/EditorPanel";
import { AgentSidebar } from "@/components/operations/AgentSidebar";

export default function OperationsWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading: loadingProject } = useProject(projectId);
  const { data: phases, isLoading: loadingPhases } = useProjectPhases(projectId);
  const [activePhase, setActivePhase] = useState(1);
  const [streamingContent, setStreamingContent] = useState("");

  if (loadingProject || loadingPhases) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project || !phases || phases.length === 0) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/operations")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <p className="text-muted-foreground text-sm">Projeto não encontrado ou pipeline não iniciado.</p>
      </div>
    );
  }

  const currentPhaseData = phases.find((p) => p.phase_number === activePhase);

  return (
    <div className="space-y-4 h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/operations")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">{project.name}</h1>
          <p className="text-xs text-muted-foreground">{project.company_name}</p>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="p-3">
          <PhaseTimeline
            phases={phases}
            activePhase={activePhase}
            onSelectPhase={(n) => { setActivePhase(n); setStreamingContent(""); }}
          />
        </CardContent>
      </Card>

      {/* Main workspace */}
      {currentPhaseData && (
        <div className="flex gap-4 flex-1 min-h-0" style={{ height: "calc(100% - 140px)" }}>
          {/* Split view (75%) */}
          <Card className="flex-[3] overflow-hidden">
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={40} minSize={25}>
                <DataRoomPanel projectId={projectId!} phaseNumber={activePhase} />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={60} minSize={30}>
                <EditorPanel
                  projectId={projectId!}
                  phaseNumber={activePhase}
                  streamingContent={streamingContent}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </Card>

          {/* Agent sidebar (25%) */}
          <Card className="flex-1 min-w-[250px] overflow-hidden">
            <AgentSidebar
              projectId={projectId!}
              phase={currentPhaseData}
              projectUserId={project.user_id}
              onStreamingContent={setStreamingContent}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
