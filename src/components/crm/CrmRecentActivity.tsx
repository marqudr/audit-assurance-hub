import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, CalendarDays } from "lucide-react";
import { format, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Lead } from "@/hooks/useLeads";

interface CrmRecentActivityProps {
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
}

export function CrmRecentActivity({ leads, onCardClick }: CrmRecentActivityProps) {
  const recentInteractions = useMemo(
    () =>
      [...leads]
        .filter((l) => l.last_contacted_date)
        .sort((a, b) => new Date(b.last_contacted_date!).getTime() - new Date(a.last_contacted_date!).getTime())
        .slice(0, 5),
    [leads]
  );

  const todayAgenda = useMemo(
    () =>
      leads.filter((l) => l.next_activity_date && isToday(parseISO(l.next_activity_date))),
    [leads]
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <History className="h-4 w-4" />
          Histórico & Próximos Passos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent interactions */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Últimas Interações</p>
            {recentInteractions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhuma interação registrada</p>
            ) : (
              <div className="space-y-2">
                {recentInteractions.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => onCardClick(lead)}
                    className="flex flex-col w-full text-left text-xs hover:bg-muted/50 rounded px-2 py-1.5 gap-0.5"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium truncate">{lead.company_name}</span>
                      <span className="text-muted-foreground shrink-0">
                        {format(parseISO(lead.last_contacted_date!), "dd/MM", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {lead.last_activity_type && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {lead.last_activity_type}
                        </Badge>
                      )}
                      {lead.content_consumed && (
                        <span className="text-muted-foreground truncate">{lead.content_consumed}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Today's agenda */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Agenda de Hoje</p>
            </div>
            {todayAgenda.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhuma atividade agendada para hoje</p>
            ) : (
              <div className="space-y-1.5">
                {todayAgenda.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => onCardClick(lead)}
                    className="flex items-center justify-between w-full text-xs hover:bg-muted/50 rounded px-2 py-1.5"
                  >
                    <span className="font-medium truncate">{lead.company_name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {lead.next_action && (
                        <Badge variant="secondary" className="text-[10px] px-1.5">
                          {lead.next_action}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
