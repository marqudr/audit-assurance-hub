import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  FileText,
  MessageSquare,
  Bot,
  Shield,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const phases = [
  { id: 1, name: "Intake", status: "complete" as const, icon: FileText },
  { id: 2, name: "Tech Dive", status: "complete" as const, icon: MessageSquare },
  { id: 3, name: "Data Room", status: "complete" as const, icon: FileText },
  { id: 4, name: "Analysis", status: "in_progress" as const, icon: Eye },
  { id: 5, name: "Narrative", status: "not_started" as const, icon: FileText },
  { id: 6, name: "QA/Audit", status: "not_started" as const, icon: Shield },
  { id: 7, name: "Publish", status: "not_started" as const, icon: Lock },
];

const statusConfig = {
  complete: { label: "Complete", color: "bg-success", textColor: "text-success" },
  in_progress: { label: "In Progress", color: "bg-warning", textColor: "text-warning" },
  review: { label: "In Review", color: "bg-primary", textColor: "text-primary" },
  not_started: { label: "Not Started", color: "bg-muted-foreground/30", textColor: "text-muted-foreground" },
};

const Operations = () => {
  const [activePhase, setActivePhase] = useState(4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Operations</h1>
        <p className="text-sm text-muted-foreground">TechCorp — Tax Review 2025</p>
      </div>

      {/* Phase Timeline */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-0 overflow-x-auto">
            {phases.map((phase, i) => {
              const config = statusConfig[phase.status];
              const isActive = phase.id === activePhase;
              return (
                <div key={phase.id} className="flex items-center">
                  <button
                    onClick={() => setActivePhase(phase.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-accent"
                    )}
                  >
                    {phase.status === "complete" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : phase.status === "in_progress" ? (
                      <Clock className="h-3.5 w-3.5" />
                    ) : (
                      <Circle className="h-3.5 w-3.5" />
                    )}
                    <span>{phase.name}</span>
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        isActive ? "bg-primary-foreground" : config.color
                      )}
                    />
                  </button>
                  {i < phases.length - 1 && (
                    <div
                      className={cn(
                        "h-px w-6 mx-1",
                        phase.status === "complete" ? "bg-success" : "bg-border"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Workspace Area */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="min-h-[500px]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Phase {activePhase}: {phases.find((p) => p.id === activePhase)?.name}
                </CardTitle>
                <Badge variant="outline" className={statusConfig[phases[activePhase - 1].status].textColor}>
                  {statusConfig[phases[activePhase - 1].status].label}
                </Badge>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-6">
              {activePhase === 4 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Split-View workspace for document analysis. The PDF viewer and text editor will appear here side-by-side.
                  </p>
                  <div className="grid grid-cols-2 gap-4 min-h-[350px]">
                    <div className="rounded-md border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
                      <div className="text-center text-sm text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="font-medium">Document Viewer</p>
                        <p className="text-xs">PDF / Evidence Panel</p>
                      </div>
                    </div>
                    <div className="rounded-md border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
                      <div className="text-center text-sm text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="font-medium">Text Editor</p>
                        <p className="text-xs">Analysis / Narrative Panel</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activePhase !== 4 && (() => {
                const PhaseIcon = phases[activePhase - 1].icon;
                return (
                  <div className="flex items-center justify-center min-h-[350px]">
                    <div className="text-center text-muted-foreground">
                      <PhaseIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">Phase {activePhase} Workspace</p>
                      <p className="text-xs">Content for {phases[activePhase - 1].name} phase</p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Agent Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Analyst Agent</CardTitle>
                  <p className="text-[10px] text-muted-foreground">Phase 4 Specialist</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md bg-muted/50 p-2.5 text-xs">
                <p className="text-muted-foreground italic">
                  "Reading financial statements... Cross-referencing with Law 12.973/2014..."
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Suggestions</p>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8">
                  Review depreciation schedule
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8">
                  Flag transfer pricing risk
                </Button>
              </div>
              <Separator />
              <Button size="sm" className="w-full text-xs">
                Accept Analysis
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Operations;
