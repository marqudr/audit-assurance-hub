import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, PhoneOff, CheckCircle2 } from "lucide-react";
import { differenceInDays } from "date-fns";
import type { Lead } from "@/hooks/useLeads";

interface CrmActionAlertsProps {
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
  inline?: boolean;
}

const ACTIVE_STATUSES = ["prospeccao", "qualificacao", "diagnostico", "proposta", "fechamento"];

export function CrmActionAlerts({ leads, onCardClick, inline }: CrmActionAlertsProps) {
  const activeLeads = useMemo(
    () => leads.filter((l) => ACTIVE_STATUSES.includes(l.status)),
    [leads]
  );

  const noContact = useMemo(
    () => activeLeads.filter((l) => l.status === "prospeccao" && !l.last_contacted_date),
    [activeLeads]
  );

  const overdue = useMemo(() => {
    const now = new Date();
    return activeLeads.filter((l) => {
      const d1 = l.next_activity_date ? new Date(l.next_activity_date) : null;
      const d2 = l.next_action_date ? new Date(l.next_action_date) : null;
      return (d1 && d1 < now) || (d2 && d2 < now);
    });
  }, [activeLeads]);

  const stalled = useMemo(() => {
    const now = new Date();
    return activeLeads
      .map((l) => {
        const days = l.last_contacted_date
          ? differenceInDays(now, new Date(l.last_contacted_date))
          : 999;
        return { lead: l, days };
      })
      .filter(({ days }) => days >= 3)
      .sort((a, b) => b.days - a.days);
  }, [activeLeads]);

  const stalled7 = stalled.filter((s) => s.days >= 7).length;
  const stalled5 = stalled.filter((s) => s.days >= 5 && s.days < 7).length;
  const stalled3 = stalled.filter((s) => s.days >= 3 && s.days < 5).length;

  const hasAlerts = noContact.length > 0 || overdue.length > 0 || stalled.length > 0;

  const alertsGrid = (
    <div className={inline ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 sm:grid-cols-3 gap-3"}>
      {/* No contact */}
      <AlertCard
        icon={<PhoneOff className="h-4 w-4" />}
        title="Sem Contato"
        count={noContact.length}
        description="Leads novos sem nenhum contato"
        colorClass={noContact.length > 0 ? "text-destructive" : "text-muted-foreground"}
        items={noContact}
        onItemClick={onCardClick}
        expanded={inline}
        maxItems={inline ? 10 : 5}
      />
      {/* Overdue */}
      <AlertCard
        icon={<Clock className="h-4 w-4" />}
        title="Atrasados"
        count={overdue.length}
        description="Tarefas ou ações vencidas"
        colorClass={overdue.length > 0 ? "text-destructive" : "text-muted-foreground"}
        items={overdue}
        onItemClick={onCardClick}
        expanded={inline}
        maxItems={inline ? 10 : 5}
      />
      {/* Stalled */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-medium">
          <AlertTriangle className="h-4 w-4" />
          Parados ({stalled.length})
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {stalled7 > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-medium">7d+: {stalled7}</span>
          )}
          {stalled5 > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200 font-medium">5d: {stalled5}</span>
          )}
          {stalled3 > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 font-medium">3d: {stalled3}</span>
          )}
          {stalled.length === 0 && <span className="text-muted-foreground">Nenhum</span>}
        </div>
        {stalled.length > 0 && (
          <div className="space-y-0.5 mt-1 max-h-40 overflow-y-auto">
            {stalled.slice(0, inline ? 10 : 5).map(({ lead, days }) => (
              <button
                key={lead.id}
                onClick={() => onCardClick(lead)}
                className="block w-full text-left text-xs truncate hover:underline text-muted-foreground"
              >
                {lead.company_name} ({days}d)
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (inline) {
    return alertsGrid;
  }

  return (
    <Card className={hasAlerts ? "border-destructive/30 bg-destructive/5" : "border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800"}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          {hasAlerts ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
          O que eu faço agora?
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alertsGrid}
      </CardContent>
    </Card>
  );
}

function AlertCard({
  icon,
  title,
  count,
  description,
  colorClass,
  items,
  onItemClick,
  expanded,
  maxItems = 5,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  description: string;
  colorClass: string;
  items: Lead[];
  onItemClick: (lead: Lead) => void;
  expanded?: boolean;
  maxItems?: number;
}) {
  return (
    <div className="space-y-1">
      <div className={`flex items-center gap-2 text-xs font-medium ${colorClass}`}>
        {icon}
        {title}: <span className="text-base font-bold">{count}</span>
      </div>
      <p className="text-[10px] text-muted-foreground">{description}</p>
      {items.length > 0 && (
        <div className={`space-y-0.5 ${expanded ? "max-h-60" : "max-h-20"} overflow-y-auto`}>
          {items.slice(0, maxItems).map((lead) => (
            <button
              key={lead.id}
              onClick={() => onItemClick(lead)}
              className="block w-full text-left text-xs truncate hover:underline text-muted-foreground"
            >
              {lead.company_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
