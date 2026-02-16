import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { PhoneOff, Clock, AlertTriangle, CalendarDays } from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProjects } from "@/hooks/useProjects";
import { useTodayAppointments } from "@/hooks/useAppointments";

const ACTIVE_STATUSES = ["prospeccao", "qualificacao", "diagnostico", "proposta", "fechamento"];

interface NotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsSheet({ open, onOpenChange }: NotificationsSheetProps) {
  const { data: projects = [] } = useProjects();
  const { data: appointments = [] } = useTodayAppointments();

  const activeProjects = useMemo(
    () => projects.filter((p) => ACTIVE_STATUSES.includes(p.status)),
    [projects]
  );

  const noContact = useMemo(
    () => activeProjects.filter((p) => p.status === "prospeccao" && !p.last_contacted_date),
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
      .filter((p) => {
        const days = p.last_contacted_date
          ? differenceInDays(now, new Date(p.last_contacted_date))
          : 999;
        return days >= 3;
      });
  }, [activeProjects]);

  const totalAlerts = noContact.length + overdue.length + stalled.length + appointments.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-80 sm:w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Notificações
            {totalAlerts > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                {totalAlerts}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-4">
          {/* Alertas */}
          {noContact.length > 0 && (
            <AlertSection
              icon={<PhoneOff className="h-3.5 w-3.5" />}
              title="Sem Contato"
              count={noContact.length}
              items={noContact.map((p) => p.name)}
            />
          )}

          {overdue.length > 0 && (
            <AlertSection
              icon={<Clock className="h-3.5 w-3.5" />}
              title="Atrasados"
              count={overdue.length}
              items={overdue.map((p) => p.name)}
            />
          )}

          {stalled.length > 0 && (
            <AlertSection
              icon={<AlertTriangle className="h-3.5 w-3.5" />}
              title="Parados (3d+)"
              count={stalled.length}
              items={stalled.map((p) => p.name)}
            />
          )}

          {/* Compromissos do dia */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Compromissos de Hoje
            </p>
            {appointments.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum compromisso</p>
            ) : (
              <div className="space-y-1">
                {appointments.map((appt) => (
                  <div key={appt.id} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded bg-muted/50">
                    {appt.appointment_time && (
                      <span className="text-muted-foreground font-mono shrink-0">
                        {appt.appointment_time.slice(0, 5)}
                      </span>
                    )}
                    <span className="font-medium truncate">{appt.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalAlerts === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Tudo em dia! 🎉
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AlertSection({
  icon,
  title,
  count,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  items: string[];
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs font-medium text-destructive">
        {icon}
        {title}: <span className="font-bold">{count}</span>
      </div>
      <div className="space-y-0.5 max-h-32 overflow-y-auto">
        {items.slice(0, 8).map((name, i) => (
          <p key={i} className="text-xs text-muted-foreground truncate px-2">
            {name}
          </p>
        ))}
        {items.length > 8 && (
          <p className="text-[10px] text-muted-foreground px-2">+{items.length - 8} mais</p>
        )}
      </div>
    </div>
  );
}
