import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bot, FileText, Clock, Pencil } from "lucide-react";
import { Agent } from "@/hooks/useAgents";
import { Button } from "@/components/ui/button";

const statusConfig = {
  active: { label: "Active", className: "border-success/30 text-success" },
  inactive: { label: "Inactive", className: "border-muted-foreground/30 text-muted-foreground" },
  draft: { label: "Draft", className: "border-warning/30 text-warning" },
};

interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
}

export function AgentCard({ agent, onEdit }: AgentCardProps) {
  const status = statusConfig[agent.status];
  const modelName = (agent.model_config as any)?.model || "N/A";
  const shortModel = modelName.split("/").pop() || modelName;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow group"
      onClick={() => onEdit(agent)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5 group-hover:bg-primary/15 transition-colors">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{agent.name}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                {agent.persona || "Sem persona"}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] ${status.className}`}>
            {status.label}
          </Badge>
        </div>
        <Separator />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1 truncate">
            <FileText className="h-3 w-3 shrink-0" />
            {shortModel}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            T: {agent.temperature}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
