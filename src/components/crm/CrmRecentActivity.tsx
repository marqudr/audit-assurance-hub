import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { History, CalendarDays, Trash2 } from "lucide-react";
import { format, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Project } from "@/hooks/useProjects";
import { useAppointmentsByDate, useCreateAppointment, useDeleteAppointment } from "@/hooks/useAppointments";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface CrmRecentActivityProps {
  projects: Project[];
  onCardClick: (project: Project) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07–20

export function CrmRecentActivity({ projects, onCardClick }: CrmRecentActivityProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: appointments = [] } = useAppointmentsByDate(dateStr);
  const createAppointment = useCreateAppointment();
  const deleteAppointment = useDeleteAppointment();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");

  const recentInteractions = useMemo(
    () =>
      [...projects]
        .filter((p) => p.last_contacted_date)
        .sort((a, b) => new Date(b.last_contacted_date!).getTime() - new Date(a.last_contacted_date!).getTime())
        .slice(0, 5),
    [projects]
  );

  const todayProjectAgenda = useMemo(
    () => projects.filter((p) => p.next_activity_date && isToday(parseISO(p.next_activity_date))),
    [projects]
  );

  // Group appointments by hour
  const appointmentsByHour = useMemo(() => {
    const map: Record<number, typeof appointments> = {};
    for (const appt of appointments) {
      if (appt.appointment_time) {
        const hour = parseInt(appt.appointment_time.slice(0, 2), 10);
        if (!map[hour]) map[hour] = [];
        map[hour].push(appt);
      }
    }
    return map;
  }, [appointments]);

  const handleDoubleClick = (hour: number) => {
    setNewTime(`${String(hour).padStart(2, "0")}:00`);
    setNewTitle("");
    setDialogOpen(true);
  };

  const handleAddAppointment = async () => {
    const title = newTitle.trim();
    if (!title) return;
    try {
      await createAppointment.mutateAsync({
        title,
        appointment_date: dateStr,
        appointment_time: newTime || undefined,
      });
      setDialogOpen(false);
      setNewTitle("");
      setNewTime("");
      toast.success("Compromisso adicionado");
    } catch {
      toast.error("Erro ao adicionar compromisso");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAppointment.mutateAsync(id);
      toast.success("Compromisso removido");
    } catch {
      toast.error("Erro ao remover compromisso");
    }
  };

  return (
    <div className="space-y-4">
      {/* Últimas Interações */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
          <History className="h-3.5 w-3.5" />
          Últimas Interações
        </p>
        {recentInteractions.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Nenhuma interação registrada</p>
        ) : (
          <div className="space-y-1">
            {recentInteractions.map((project) => (
              <button
                key={project.id}
                onClick={() => onCardClick(project)}
                className="flex flex-col w-full text-left text-xs hover:bg-muted/50 rounded px-2 py-1.5 gap-0.5"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium truncate">{project.name}</span>
                  <span className="text-muted-foreground shrink-0">
                    {format(parseISO(project.last_contacted_date!), "dd/MM", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {project.last_activity_type && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {project.last_activity_type}
                    </Badge>
                  )}
                  {project.company_name && (
                    <span className="text-muted-foreground truncate">{project.company_name}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Agenda por Hora */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Agenda
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-muted-foreground">
                {format(selectedDate, "dd MMM yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Project agenda items for selected day */}
        {isToday(selectedDate) && todayProjectAgenda.length > 0 && (
          <div className="space-y-1 mb-2">
            {todayProjectAgenda.map((project) => (
              <button
                key={project.id}
                onClick={() => onCardClick(project)}
                className="flex items-center justify-between w-full text-xs hover:bg-muted/50 rounded px-2 py-1.5"
              >
                <span className="font-medium truncate">{project.name}</span>
                {project.next_action && (
                  <Badge variant="secondary" className="text-[10px] px-1.5">
                    {project.next_action}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Hourly grid */}
        <div className="border rounded-md overflow-hidden">
          {HOURS.map((hour) => {
            const hourAppts = appointmentsByHour[hour] || [];
            return (
              <div
                key={hour}
                className="flex border-b last:border-b-0 min-h-[28px] hover:bg-muted/30 cursor-pointer"
                onDoubleClick={() => handleDoubleClick(hour)}
              >
                <div className="w-12 shrink-0 text-[10px] text-muted-foreground font-mono py-1 px-1.5 border-r bg-muted/20 flex items-start">
                  {String(hour).padStart(2, "0")}:00
                </div>
                <div className="flex-1 py-0.5 px-1.5 space-y-0.5">
                  {hourAppts.map((appt) => (
                    <div
                      key={appt.id}
                      className="flex items-center justify-between text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5 group"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {appt.appointment_time && (
                          <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                            {appt.appointment_time.slice(0, 5)}
                          </span>
                        )}
                        <span className="font-medium truncate">{appt.title}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 opacity-0 group-hover:opacity-100 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(appt.id);
                        }}
                      >
                        <Trash2 className="h-2.5 w-2.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 text-center">
          Duplo-clique em um horário para adicionar
        </p>
      </div>

      {/* Dialog para novo compromisso */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Novo Compromisso</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Título do compromisso"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="text-sm"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAddAppointment()}
            />
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="text-sm w-28"
              />
              <span className="text-xs text-muted-foreground">
                {format(selectedDate, "dd/MM/yyyy")}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={handleAddAppointment} disabled={!newTitle.trim() || createAppointment.isPending}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
