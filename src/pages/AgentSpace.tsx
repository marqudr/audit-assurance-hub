import { useState } from "react";
import { Bot, Loader2, MessageSquare } from "lucide-react";
import { useActiveAgents } from "@/hooks/useActiveAgents";
import { ChatPlayground } from "@/components/agent-studio/ChatPlayground";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Agent } from "@/hooks/useAgents";

export default function AgentSpace() {
  const { data: agents, isLoading } = useActiveAgents();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const buildSystemPrompt = (agent: Agent) =>
    [agent.persona && `Persona: ${agent.persona}`, agent.instructions]
      .filter(Boolean)
      .join("\n\n") || "You are a helpful AI assistant.";

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Agent list sidebar */}
      <div className="w-64 border-r bg-card shrink-0 flex flex-col">
        <div className="px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Agentes Disponíveis</h2>
          <p className="text-xs text-muted-foreground">
            Selecione um agente para conversar
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {agents && agents.length > 0 ? (
              agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent",
                    selectedAgent?.id === agent.id && "bg-accent"
                  )}
                >
                  <div className="rounded-full h-8 w-8 bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{agent.name}</p>
                    {agent.persona && (
                      <p className="text-xs text-muted-foreground truncate">
                        {agent.persona.slice(0, 60)}
                      </p>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Nenhum agente ativo disponível.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1">
        {selectedAgent ? (
          <ChatPlayground
            systemPrompt={buildSystemPrompt(selectedAgent)}
            model={(selectedAgent.model_config as any)?.model || "google/gemini-3-flash-preview"}
            temperature={selectedAgent.temperature}
            agentName={selectedAgent.name}
            agentId={selectedAgent.id}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-3">
            <MessageSquare className="h-12 w-12 opacity-20" />
            <p className="text-sm">Selecione um agente para iniciar uma conversa</p>
          </div>
        )}
      </div>
    </div>
  );
}
