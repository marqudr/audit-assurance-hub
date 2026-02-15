import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Bot, Play, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useActiveAgents } from "@/hooks/useActiveAgents";
import { useUpdatePhaseAgent, useApprovePhase, type ProjectPhase } from "@/hooks/useProjectPhases";
import { usePhaseExecutions, useCreateExecution, useUpdateExecution } from "@/hooks/usePhaseExecutions";
import { useSavePhaseOutput } from "@/hooks/usePhaseOutputs";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useUserRole";
import { toast } from "@/hooks/use-toast";

interface AgentSidebarProps {
  projectId: string;
  phase: ProjectPhase;
  projectUserId: string;
  onStreamingContent: (content: string) => void;
}

export function AgentSidebar({ projectId, phase, projectUserId, onStreamingContent }: AgentSidebarProps) {
  const { user } = useAuth();
  const { hasRole: isAdmin } = useIsAdmin();
  const { data: agents } = useActiveAgents();
  const { data: executions } = usePhaseExecutions(projectId, phase.phase_number);
  const updateAgent = useUpdatePhaseAgent();
  const approvePhase = useApprovePhase();
  const createExecution = useCreateExecution();
  const updateExecution = useUpdateExecution();
  const saveOutput = useSavePhaseOutput();
  const [isRunning, setIsRunning] = useState(false);

  const lastExecution = executions?.[0];
  const canApprove = (isAdmin || user?.id === projectUserId) && (phase.status === "in_progress" || phase.status === "review");
  const linkedAgent = agents?.find((a) => a.id === phase.agent_id);

  const handleAgentChange = (agentId: string) => {
    updateAgent.mutate({ projectId, phaseNumber: phase.phase_number, agentId: agentId === "none" ? null : agentId });
  };

  const handleExecute = async () => {
    if (!phase.agent_id || !linkedAgent) {
      toast({ title: "Vincule um agente antes de executar", variant: "destructive" });
      return;
    }

    setIsRunning(true);
    onStreamingContent("");
    let executionId: string | null = null;

    try {
      const execution = await createExecution.mutateAsync({
        projectId,
        phaseNumber: phase.phase_number,
        agentId: phase.agent_id,
      });
      executionId = execution.id;

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Você está executando a fase "${phase.phase_name}" (fase ${phase.phase_number}/7) do pipeline operacional. Gere o conteúdo técnico correspondente a esta fase.`,
            },
          ],
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
              onStreamingContent(fullContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save AI output
      if (fullContent) {
        await saveOutput.mutateAsync({
          projectId,
          phaseNumber: phase.phase_number,
          versionType: "ai",
          content: fullContent,
        });
      }

      await updateExecution.mutateAsync({
        id: executionId,
        status: "completed",
        projectId,
        phaseNumber: phase.phase_number,
      });

      toast({ title: "Agente concluiu a execução" });
    } catch (err: any) {
      if (executionId) {
        await updateExecution.mutateAsync({
          id: executionId,
          status: "failed",
          projectId,
          phaseNumber: phase.phase_number,
        }).catch(() => {});
      }
      toast({ title: "Erro na execução", description: err.message, variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  };

  const handleApprove = async () => {
    try {
      await approvePhase.mutateAsync({ projectId, phaseNumber: phase.phase_number });
      toast({ title: `Fase ${phase.phase_number} aprovada!` });
    } catch (err: any) {
      toast({ title: "Erro ao aprovar", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {/* Agent binding */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-2">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Agente da Fase</p>
            <p className="text-[10px] text-muted-foreground">Fase {phase.phase_number}: {phase.phase_name}</p>
          </div>
        </div>

        <Select value={phase.agent_id || "none"} onValueChange={handleAgentChange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Selecionar agente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            {agents?.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Execute */}
      <Button
        size="sm"
        className="w-full text-xs"
        onClick={handleExecute}
        disabled={isRunning || !phase.agent_id}
      >
        {isRunning ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1" />}
        Executar Agente
      </Button>

      {/* Last execution status */}
      {lastExecution && (
        <div className="text-[10px] text-muted-foreground">
          Última execução:{" "}
          <Badge variant="outline" className="text-[10px] h-4">
            {lastExecution.status === "running" && "Em execução"}
            {lastExecution.status === "completed" && "Concluída"}
            {lastExecution.status === "failed" && "Falhou"}
          </Badge>
        </div>
      )}

      <div className="flex-1" />

      <Separator />

      {/* Approve */}
      <Button
        size="sm"
        className="w-full text-xs"
        variant={canApprove ? "default" : "outline"}
        onClick={handleApprove}
        disabled={!canApprove || approvePhase.isPending}
      >
        {approvePhase.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
        ) : phase.status === "approved" ? (
          <CheckCircle2 className="h-3 w-3 mr-1" />
        ) : (
          <ShieldCheck className="h-3 w-3 mr-1" />
        )}
        {phase.status === "approved" ? "Fase Aprovada" : "Aprovar Fase"}
      </Button>

      {phase.status === "approved" && phase.approved_at && (
        <p className="text-[10px] text-muted-foreground text-center">
          Aprovado em {new Date(phase.approved_at).toLocaleDateString("pt-BR")}
        </p>
      )}
    </div>
  );
}
