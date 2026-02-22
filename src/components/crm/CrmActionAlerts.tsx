import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, PhoneOff, CheckCircle2 } from "lucide-react";
import { differenceInDays } from "date-fns";
import type { Project } from "@/hooks/useProjects";

interface CrmActionAlertsProps {
  projects: Project[];
  onCardClick: (project: Project) => void;
  inline?: boolean;
}

const ACTIVE_STATUSES = ["qualificacao", "diagnostico", "proposta", "fechamento"];

export function CrmActionAlerts({ projects, onCardClick, inline }: CrmActionAlertsProps) {
  const activeProjects = useMemo(
    () => projects.filter((p) => ACTIVE_STATUSES.includes(p.status)),
    [projects]
  );

  const noContact = useMemo(
    () => activeProjects.filter((p) => p.status === "qualificacao" && !p.last_contacted_date),
    [activeProjects]
  );

  const overdue = useMemo(() => {
    const now = new Date();
    return activeProjects.filter((p) => {
      const d1 = p.next_activity_date ? new Date(p.next_activity_date) : null;
      const d2 = p.next_action_date ? new Date(p.next_action_date) : null;
      return (d1 && d1 < now) || (d2 && d2 < now);
    });
  }, [activeProjects]);

  const stalled = useMemo(() => {
    const now = new Date();
    return activeProjects
      .map((p) => {
        const days = p.last_contacted_date
          ? differenceInDays(now, new Date(p.last_contacted_date))
          : 999;
        return { project: p, days };
      })
      .filter(({ days }) => days >= 3)
      .sort((a, b) => b.days - a.days);
  }, [activeProjects]);

  const stalled7 = stalled.filter((s) => s.days >= 7).length;
  const stalled5 = stalled.filter((s) => s.days >= 5 && s.days < 7).length;
  const stalled3 = stalled.filter((s) => s.days >= 3 && s.days < 5).length;

  const alertsGrid = (
    <div className={inline ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 sm:grid-cols-3 gap-3"}>
      {/* Sem Contato */}
      <AlertCard
        icon={<PhoneOff className="h-5 w-5" />}
        title="Sem Contato"
        count={noContact.length}
        description="Projetos novos sem nenhum contato"
        bgClass="bg-red-50 dark:bg-red-950/30"
        borderClass="border-red-200 dark:border-red-800"
        iconColor="text-red-600 dark:text-red-400"
        countColor="text-red-700 dark:text-red-300"
        items={noContact}
        onItemClick={onCardClick}
        maxItems={inline ? 10 : 5}
      />

      {/* Atrasados */}
      <AlertCard
        icon={<Clock className="h-5 w-5" />}
        title="Atrasados"
        count={overdue.length}
        description="Tarefas ou ações vencidas"
        bgClass="bg-amber-50 dark:bg-amber-950/30"
        borderClass="border-amber-200 dark:border-amber-800"
        iconColor="text-amber-600 dark:text-amber-400"
        countColor="text-amber-700 dark:text-amber-300"
        items={overdue}
        onItemClick={onCardClick}
        maxItems={inline ? 10 : 5}
      />

      {/* Parados */}
      <div className={`rounded-lg border p-3 flex flex-col gap-2 ${stalled.length > 0
          ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800"
          : "bg-muted/30 border-border opacity-60"
        }`}>
        <div className="flex items-center gap-2">
          <div className={`rounded-md p-1.5 ${stalled.length > 0 ? "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400" : "bg-muted text-muted-foreground"}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className={`text-2xl font-bold leading-none ${stalled.length > 0 ? "text-orange-700 dark:text-orange-300" : "text-muted-foreground"}`}>
              {stalled.length}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Parados</p>
          </div>
          {stalled.length === 0 && <CheckCircle2 className="h-4 w-4 text-green-500" />}
        </div>

        {stalled.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {stalled7 > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-destructive/20 text-destructive">7d+: {stalled7}</span>
            )}
            {stalled5 > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200">5d: {stalled5}</span>
            )}
            {stalled3 > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">3d: {stalled3}</span>
            )}
          </div>
        )}

        {stalled.length > 0 && (
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {stalled.slice(0, inline ? 10 : 5).map(({ project, days }) => (
              <button
                key={project.id}
                onClick={() => onCardClick(project)}
                className="block w-full text-left text-xs truncate rounded px-2 py-1 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-muted-foreground"
              >
                {project.name} <span className="text-[10px] opacity-70">({days}d)</span>
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
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
  bgClass,
  borderClass,
  iconColor,
  countColor,
  items,
  onItemClick,
  maxItems = 5,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  description: string;
  bgClass: string;
  borderClass: string;
  iconColor: string;
  countColor: string;
  items: Project[];
  onItemClick: (project: Project) => void;
  maxItems?: number;
}) {
  const isEmpty = count === 0;

  return (
    <div className={`rounded-lg border p-3 flex flex-col gap-2 ${isEmpty ? "bg-muted/30 border-border opacity-60" : `${bgClass} ${borderClass}`
      }`}>
      <div className="flex items-center gap-2">
        <div className={`rounded-md p-1.5 ${isEmpty ? "bg-muted text-muted-foreground" : `${bgClass} ${iconColor}`
          }`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className={`text-2xl font-bold leading-none ${isEmpty ? "text-muted-foreground" : countColor}`}>
            {count}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
        </div>
        {isEmpty && <CheckCircle2 className="h-4 w-4 text-green-500" />}
      </div>

      {!isEmpty && (
        <p className="text-[10px] text-muted-foreground">{description}</p>
      )}

      {items.length > 0 && (
        <div className="space-y-0.5 max-h-40 overflow-y-auto">
          {items.slice(0, maxItems).map((project) => (
            <button
              key={project.id}
              onClick={() => onItemClick(project)}
              className={`block w-full text-left text-xs truncate rounded px-2 py-1 hover:bg-white/60 dark:hover:bg-white/10 text-muted-foreground`}
            >
              {project.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
