import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Loader2, Play, ShieldCheck, CheckCircle2, FolderOpen, TrendingUp, Target, MoreVertical, Users, Clock, Calculator, DollarSign, PiggyBank, Percent, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
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
import { ProjectCollaboratorsModal } from "@/components/operations/ProjectCollaboratorsModal";
import { ProjectTimeTrackingModal } from "@/components/operations/ProjectTimeTrackingModal";
import { ProjectBenefitCalculatorModal } from "@/components/operations/ProjectBenefitCalculatorModal";
import { toast } from "@/hooks/use-toast";
import { useProjectCollaborators } from "@/hooks/useProjectCollaborators";
import { useProjectTimeTracking } from "@/hooks/useProjectTimeTracking";
import { useProjectTaxBenefits } from "@/hooks/useProjectTaxBenefits";

interface ProjectWorkflowTabProps {
  projectId: string;
}

export function ProjectWorkflowTab({ projectId }: ProjectWorkflowTabProps) {
  const { user } = useAuth();
  const { hasRole: isAdmin } = useIsAdmin();
  const { data: project, isLoading: loadingProject } = useProject(projectId);
  const { data: phases, isLoading: loadingPhases } = useProjectPhases(projectId);
  const { data: agents } = useActiveAgents();
  const [activePhase, setActivePhase] = useState(1);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  const [isTimeTrackingOpen, setIsTimeTrackingOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  const { data: collaborators } = useProjectCollaborators(projectId);
  const { data: timeTrackings } = useProjectTimeTracking(projectId);
  const { data: taxBenefits } = useProjectTaxBenefits(projectId);

  const activeCollaboratorsCount = collaborators?.length || 0;
  const totalAllocatedHours = timeTrackings?.reduce((acc, t) => acc + t.hours, 0) || 0;

  let totalRhCost = 0;
  if (collaborators && timeTrackings) {
    timeTrackings.forEach(t => {
      const collab = collaborators.find(c => c.id === t.collaborator_id);
      if (collab) {
        const custoHora = (collab.monthly_salary + collab.monthly_charges) / 220;
        totalRhCost += custoHora * t.hours;
      }
    });
  }

  // Lei do Bem Stats
  let investmentPD = 0;
  let ecoFiscalTotal = 0;
  let roiPercent = 0;

  if (taxBenefits) {
    investmentPD = taxBenefits.salaries + taxBenefits.equipments + taxBenefits.materials + taxBenefits.services + taxBenefits.depreciation;
    const irpjEc = investmentPD * (taxBenefits.irpj_rate / 100);
    const csllEc = investmentPD * (taxBenefits.csll_rate / 100);
    const deprEc = taxBenefits.depreciation * 0.15;
    const ipiEc = taxBenefits.equipments * (taxBenefits.ipi_rate / 100) * (taxBenefits.ipi_reduction / 100);
    ecoFiscalTotal = irpjEc + csllEc + deprEc + ipiEc;
    roiPercent = investmentPD > 0 ? (ecoFiscalTotal / investmentPD) * 100 : 0;
  }

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
          model: (linkedAgent.model_config as Record<string, unknown>)?.model || "google/gemini-3-flash-preview",
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
    } catch (err: unknown) {
      if (executionId) {
        await updateExecution.mutateAsync({ id: executionId, status: "failed", projectId: projectId!, phaseNumber: activePhase }).catch(() => { });
      }
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido na execução";
      toast({ title: "Erro na execução", description: errorMessage, variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  };

  const handleApprove = async () => {
    if (!projectId) return;
    try {
      await approvePhase.mutateAsync({ projectId, phaseNumber: activePhase });
      toast({ title: `Fase ${activePhase} aprovada!` });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido ao aprovar fase";
      toast({ title: "Erro ao aprovar", description: errorMessage, variant: "destructive" });
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar documento";
      toast({ title: "Erro ao criar documento", description: errorMessage, variant: "destructive" });
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
    <div className="space-y-3 h-[calc(100vh-14rem)]">
      {/* Actions and KPI Wrapper */}
      <div className="flex justify-between items-center mb-1 pr-1">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          Dashboard Operacional
        </h2>
        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              Ações do Projeto
              <MoreVertical className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Ferramentas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsCollaboratorsOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Gerenciar Colaboradores
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsTimeTrackingOpen(true)}>
              <Clock className="h-4 w-4 mr-2" />
              Apontamento de Horas
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsCalculatorOpen(true)}>
              <Calculator className="h-4 w-4 mr-2 text-green-600" />
              <span className="text-green-600 font-medium">Calcular Benefício</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>


      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-2">
        <Card className="bg-background">
          <CardContent className="p-3 flex flex-col gap-1 text-center items-center justify-center">
            <Users className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="text-xl font-bold">{activeCollaboratorsCount}</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Colab. Ativos</span>
          </CardContent>
        </Card>

        <Card className="bg-background">
          <CardContent className="p-3 flex flex-col gap-1 text-center items-center justify-center">
            <Clock className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="text-xl font-bold">{totalAllocatedHours.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}h</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Horas Alocadas</span>
          </CardContent>
        </Card>

        <Card className="bg-background">
          <CardContent className="p-3 flex flex-col gap-1 text-center items-center justify-center">
            <DollarSign className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="text-xl font-bold text-red-600/90">
              R$ {totalRhCost.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Custo de RH</span>
          </CardContent>
        </Card>

        <Card className="bg-background">
          <CardContent className="p-3 flex flex-col gap-1 text-center items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary mb-1" />
            <span className="text-xl font-bold text-primary">
              R$ {investmentPD.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider text-nowrap">Inv. em P&D</span>
          </CardContent>
        </Card>

        <Card className="bg-background border-green-200 dark:border-green-900/50">
          <CardContent className="p-3 flex flex-col gap-1 text-center items-center justify-center">
            <PiggyBank className="h-4 w-4 text-green-600 mb-1" />
            <span className="text-xl font-bold text-green-600">
              R$ {ecoFiscalTotal.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider text-nowrap">Economia Fiscal</span>
          </CardContent>
        </Card>

        <Card className="bg-background">
          <CardContent className="p-3 flex flex-col gap-1 text-center items-center justify-center">
            <Percent className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="text-xl font-bold text-green-600">
              {roiPercent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">ROI</span>
          </CardContent>
        </Card>
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

      {/* Collaborators Modal */}
      {project && (
        <ProjectCollaboratorsModal
          projectId={project.id}
          open={isCollaboratorsOpen}
          onOpenChange={setIsCollaboratorsOpen}
        />
      )}

      {/* Time Tracking Modal */}
      {project && (
        <ProjectTimeTrackingModal
          projectId={project.id}
          open={isTimeTrackingOpen}
          onOpenChange={setIsTimeTrackingOpen}
        />
      )}

      {/* Tax Benefits Calculator */}
      {project && (
        <ProjectBenefitCalculatorModal
          projectId={project.id}
          open={isCalculatorOpen}
          onOpenChange={setIsCalculatorOpen}
        />
      )}
    </div>
  );
}
