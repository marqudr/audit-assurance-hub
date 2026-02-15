import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bot, Loader2 } from "lucide-react";
import { useAgents, Agent } from "@/hooks/useAgents";
import { AgentCard } from "@/components/agent-studio/AgentCard";

const AgentStudio = () => {
  const { data: agents, isLoading } = useAgents();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agent Studio</h1>
          <p className="text-sm text-muted-foreground">
            Configure e treine seus agentes de IA
          </p>
        </div>
        <Button size="sm" onClick={() => navigate("/agent-studio/new")}>
          <Bot className="mr-2 h-4 w-4" />
          Novo Agente
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : agents && agents.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={(a) => navigate(`/agent-studio/${a.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-3">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-muted-foreground">Nenhum agente criado ainda.</p>
          <Button size="sm" variant="outline" onClick={() => navigate("/agent-studio/new")}>
            Criar primeiro agente
          </Button>
        </div>
      )}
    </div>
  );
};

export default AgentStudio;
