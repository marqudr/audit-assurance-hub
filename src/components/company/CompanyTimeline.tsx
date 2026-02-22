import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Phone, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import type { Project } from "@/hooks/useProjects";

interface CompanyTimelineProps {
  projects: Project[];
}

interface TimelineEvent {
  date: string;
  type: "contact" | "activity" | "next_action" | "created" | "status_change";
  label: string;
  projectName: string;
  detail?: string;
}

const statusLabels: Record<string, string> = {
  qualificacao: "Qualificação",
  diagnostico: "Diagnóstico",
  proposta: "Proposta",
  fechamento: "Fechamento",
  ganho: "Ganho",
  perdido: "Perdido",
};

export function CompanyTimeline({ projects }: CompanyTimelineProps) {
  const events: TimelineEvent[] = [];

  projects.forEach((p) => {
    events.push({
      date: p.created_at,
      type: "created",
      label: "Projeto criado",
      projectName: p.name,
    });

    if (p.last_contacted_date) {
      events.push({
        date: p.last_contacted_date,
        type: "contact",
        label: "Último contato",
        projectName: p.name,
        detail: p.last_activity_type || undefined,
      });
    }

    if (p.next_action_date && p.next_action) {
      events.push({
        date: p.next_action_date,
        type: "next_action",
        label: "Próximo passo",
        projectName: p.name,
        detail: p.next_action,
      });
    }

    if (p.next_activity_date) {
      events.push({
        date: p.next_activity_date,
        type: "activity",
        label: "Próxima atividade",
        projectName: p.name,
      });
    }
  });

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground italic mt-4">Nenhuma interação registrada.</p>;
  }

  const iconMap = {
    contact: <Phone className="h-3.5 w-3.5" />,
    activity: <CalendarDays className="h-3.5 w-3.5" />,
    next_action: <ArrowRight className="h-3.5 w-3.5" />,
    created: <CalendarDays className="h-3.5 w-3.5" />,
    status_change: <ArrowRight className="h-3.5 w-3.5" />,
  };

  return (
    <div className="space-y-2 mt-4">
      {events.map((event, i) => (
        <Card key={i}>
          <CardContent className="p-3 flex items-start gap-3">
            <div className="rounded-full bg-muted p-1.5 mt-0.5 shrink-0">
              {iconMap[event.type]}
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{event.label}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{event.projectName}</Badge>
              </div>
              {event.detail && <p className="text-xs text-muted-foreground">{event.detail}</p>}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {format(new Date(event.date), "dd/MM/yyyy")}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
