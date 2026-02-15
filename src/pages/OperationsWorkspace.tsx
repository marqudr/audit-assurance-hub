import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, Loader2, Play, ShieldCheck, CheckCircle2, FolderOpen } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useProject } from "@/hooks/useProjects";
import { useProjectPhases, useUpdatePhaseAgent, useApprovePhase } from "@/hooks/useProjectPhases";
import { useActiveAgents } from "@/hooks/useActiveAgents";
import { usePhaseExecutions, useCreateExecution, useUpdateExecution } from "@/hooks/usePhaseExecutions";
import { useSavePhaseOutput } from "@/hooks/usePhaseOutputs";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useUserRole";
import { PhaseTimeline } from "@/components/operations/PhaseTimeline";
import { DataRoomPanel } from "@/components/operations/DataRoomPanel";
import { EditorPanel } from "@/components/operations/EditorPanel";
import { AgentChatPanel, type ChatMsg } from "@/components/operations/AgentChatPanel";
import { toast } from "@/hooks/use-toast";

export default function OperationsWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasRole: isAdmin } = useIsAdmin();
  const { data: project, isLoading: loadingProject } = useProject(projectId);
  const { data: phases, isLoading: loadingPhases } = useProjectPhases(projectId);
  const { data: agents } = useActiveAgents();
  const [activePhase, setActivePhase] = useState(1);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);

  const currentPhaseData = phases?.find((p) => p.phase_number === activePhase);
  const linkedAgent = agents?.find((a) => a.id === currentPhaseData?.agent_id) || null;

  const updateAgent = useUpdatePhaseAgent();
  const approvePhase = useApprovePhase();
  const { data: executions } = usePhaseExecutions(projectId, activePhase);
  const createExecution = useCreateExecution();
  const updateExecution = useUpdateExecution();
  const saveOutput = useSavePhaseOutput();
  const [isRunning, setIsRunning] = useState(false);

  const lastExecution = executions?.[0];
  const canApprove =
    (isAdmin || user?.id === project?.user_id) &&
    (currentPhaseData?.status === "in_progress" || currentPhaseData?.status === "review");

  const handleAgentChange = (agentId: string) => {
    if (!projectId) return;
    updateAgent.mutate({ projectId, phaseNumber: activePhase, agentId: agentId === "none" ? null : agentId });
  };

  const handleExecute = async () => {
    if (!currentPhaseData?.agent_id || !linkedAgent || !projectId) {
      toast({ title: "Vincule um agente antes de executar", variant: "destructive" });
      return;
    }

    setIsRunning(true);
    let executionId: string | null = null;

    try {
      const execution = await createExecution.mutateAsync({
        projectId,
        phaseNumber: activePhase,
        agentId: currentPhaseData.agent_id,
      });
      executionId = execution.id;

      // Auto-send a phase execution message into chat
      const autoMsg: ChatMsg = {
        role: "user",
        content: `Você está executando a fase "${currentPhaseData.phase_name}" (fase ${currentPhaseData.phase_number}/7) do pipeline operacional. Gere o conteúdo técnico correspondente a esta fase.`,
      };
      const newMessages = [...chatMessages, autoMsg];
      setChatMessages(newMessages);

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: autoMsg.content }],
          systemPrompt: linkedAgent.persona || linkedAgent.instructions || "",
          model: (linkedAgent.model_config as any)?.model || "google/gemini-3-flash-preview",
          temperature: linkedAgent.temperature,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";
      let streamDone = false;

      setChatMessages([...newMessages, { role: "assistant", content: "" }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setChatMessages([...newMessages, { role: "assistant", content: fullContent }]);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      setChatMessages([...newMessages, { role: "assistant", content: fullContent }]);

      if (fullContent) {
        await saveOutput.mutateAsync({
          projectId,
          phaseNumber: activePhase,
          versionType: "ai",
          content: fullContent,
        });
      }

      await updateExecution.mutateAsync({ id: executionId, status: "completed", projectId, phaseNumber: activePhase });
      toast({ title: "Agente concluiu a execução" });
    } catch (err: any) {
      if (executionId) {
        await updateExecution.mutateAsync({ id: executionId, status: "failed", projectId: projectId!, phaseNumber: activePhase }).catch(() => {});
      }
      toast({ title: "Erro na execução", description: err.message, variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  };

  const handleApprove = async () => {
    if (!projectId) return;
    try {
      await approvePhase.mutateAsync({ projectId, phaseNumber: activePhase });
      toast({ title: `Fase ${activePhase} aprovada!` });
    } catch (err: any) {
      toast({ title: "Erro ao aprovar", description: err.message, variant: "destructive" });
    }
  };

  const handleCreateDocument = useCallback(async (content: string) => {
    if (!projectId) return;
    try {
      await saveOutput.mutateAsync({
        projectId,
        phaseNumber: activePhase,
        versionType: "ai",
        content,
      });
      toast({ title: "Documento criado a partir da conversa" });
    } catch (err: any) {
      toast({ title: "Erro ao criar documento", description: err.message, variant: "destructive" });
    }
  }, [projectId, activePhase, saveOutput]);

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

  return (
    <div className="space-y-3 h-[calc(100vh-6rem)]">
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
            onSelectPhase={(n) => { setActivePhase(n); setChatMessages([]); }}
          />
        </CardContent>
      </Card>

      {/* Toolbar */}
      {currentPhaseData && (
        <Card>
          <CardContent className="p-2 flex items-center gap-2 flex-wrap">
            {/* Agent select */}
            <Select value={currentPhaseData.agent_id || "none"} onValueChange={handleAgentChange}>
              <SelectTrigger className="h-8 text-xs w-[200px]">
                <SelectValue placeholder="Selecionar agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum agente</SelectItem>
                {agents?.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Execute */}
            <Button size="sm" className="h-8 text-xs" onClick={handleExecute} disabled={isRunning || !currentPhaseData.agent_id}>
              {isRunning ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1" />}
              Executar
            </Button>

            {/* Last execution badge */}
            {lastExecution && (
              <Badge variant="outline" className="text-[10px] h-6">
                {lastExecution.status === "running" && "Em execução"}
                {lastExecution.status === "completed" && "Concluída"}
                {lastExecution.status === "failed" && "Falhou"}
              </Badge>
            )}

            <div className="flex-1" />

            {/* Data Room Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <FolderOpen className="h-3 w-3 mr-1" />
                  Data Room
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[450px] p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Data Room</SheetTitle>
                </SheetHeader>
                <DataRoomPanel projectId={projectId!} phaseNumber={activePhase} />
              </SheetContent>
            </Sheet>

            {/* Approve */}
            <Button
              size="sm"
              className="h-8 text-xs"
              variant={canApprove ? "default" : "outline"}
              onClick={handleApprove}
              disabled={!canApprove || approvePhase.isPending}
            >
              {approvePhase.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : currentPhaseData.status === "approved" ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : (
                <ShieldCheck className="h-3 w-3 mr-1" />
              )}
              {currentPhaseData.status === "approved" ? "Aprovada" : "Aprovar"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main workspace: Chat + Editor */}
      {currentPhaseData && (
        <Card className="overflow-hidden" style={{ height: "calc(100% - 180px)" }}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={50} minSize={30}>
              <AgentChatPanel
                projectId={projectId!}
                phaseNumber={activePhase}
                phaseName={currentPhaseData.phase_name}
                agent={linkedAgent}
                messages={chatMessages}
                onMessagesChange={setChatMessages}
                onCreateDocument={handleCreateDocument}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={25}>
              <EditorPanel projectId={projectId!} phaseNumber={activePhase} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </Card>
      )}
    </div>
  );
}
