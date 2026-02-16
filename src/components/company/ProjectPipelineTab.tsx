import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, Circle, Loader2, Clock } from "lucide-react";
import { useProjectPhases, type PhaseStatus } from "@/hooks/useProjectPhases";
import { usePhaseOutputs } from "@/hooks/usePhaseOutputs";
import ReactMarkdown from "react-markdown";

const statusIcon: Record<PhaseStatus, React.ReactNode> = {
  not_started: <Circle className="h-4 w-4 text-muted-foreground" />,
  in_progress: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  review: <Clock className="h-4 w-4 text-yellow-500" />,
  approved: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
};

const statusLabel: Record<PhaseStatus, string> = {
  not_started: "Não iniciada",
  in_progress: "Em andamento",
  review: "Em revisão",
  approved: "Aprovada",
};

function PhaseOutputSection({ projectId, phaseNumber }: { projectId: string; phaseNumber: number }) {
  const { data: outputs = [], isLoading } = usePhaseOutputs(projectId, phaseNumber);
  const aiOutput = outputs.find((o) => o.version_type === "ai");
  const humanOutput = outputs.find((o) => o.version_type === "human");

  if (isLoading) return <p className="text-xs text-muted-foreground">Carregando...</p>;
  if (!aiOutput && !humanOutput) return <p className="text-xs text-muted-foreground italic">Nenhum conteúdo produzido.</p>;

  return (
    <div className="space-y-3">
      {humanOutput && (
        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs flex items-center gap-1">
              <Badge variant="default" className="text-[10px]">Versão Final</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 prose prose-sm max-w-none text-xs">
            <ReactMarkdown>{humanOutput.content}</ReactMarkdown>
          </CardContent>
        </Card>
      )}
      {aiOutput && (
        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs flex items-center gap-1">
              <Badge variant="secondary" className="text-[10px]">Versão IA</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 prose prose-sm max-w-none text-xs">
            <ReactMarkdown>{aiOutput.content}</ReactMarkdown>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function ProjectPipelineTab({ projectId }: { projectId: string }) {
  const { data: phases = [], isLoading } = useProjectPhases(projectId);

  if (isLoading) return <p className="text-sm text-muted-foreground mt-4">Carregando pipeline...</p>;
  if (phases.length === 0) return <p className="text-sm text-muted-foreground italic mt-4">Pipeline operacional não iniciado.</p>;

  return (
    <div className="mt-4">
      <Accordion type="single" collapsible className="space-y-2">
        {phases.map((phase) => (
          <AccordionItem key={phase.id} value={phase.id} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3 text-sm">
                {statusIcon[phase.status]}
                <span className="font-medium">Fase {phase.phase_number}: {phase.phase_name}</span>
                <Badge variant="outline" className="text-[10px] ml-auto mr-2">
                  {statusLabel[phase.status]}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <PhaseOutputSection projectId={projectId} phaseNumber={phase.phase_number} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
