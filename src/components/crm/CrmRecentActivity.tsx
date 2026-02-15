import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { History, CalendarDays, Plus, Trash2 } from "lucide-react";
import { format, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import type { Lead } from "@/hooks/useLeads";
import { useTodayAppointments, useCreateAppointment, useDeleteAppointment } from "@/hooks/useAppointments";

interface CrmRecentActivityProps {
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
}

export function CrmRecentActivity({ leads, onCardClick }: CrmRecentActivityProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");

  const { data: appointments = [] } = useTodayAppointments();
  const createAppointment = useCreateAppointment();
  const deleteAppointment = useDeleteAppointment();

  const recentInteractions = useMemo(
    () =>
      [...leads]
        .filter((l) => l.last_contacted_date)
        .sort((a, b) => new Date(b.last_contacted_date!).getTime() - new Date(a.last_contacted_date!).getTime())
        .slice(0, 5),
    [leads]
  );

  const todayLeadAgenda = useMemo(
    () => leads.filter((l) => l.next_activity_date && isToday(parseISO(l.next_activity_date))),
    [leads]
  );

  const handleAddAppointment = async () => {
    const title = newTitle.trim();
    if (!title) return;
    try {
      await createAppointment.mutateAsync({
        title,
        appointment_date: new Date().toISOString().split("T")[0],
        appointment_time: newTime || undefined,
      });
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

      {/* Agenda de Hoje */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          Agenda de Hoje
        </p>

        {/* Lead-based agenda */}
        {todayLeadAgenda.length > 0 && (
          <div className="space-y-1 mb-2">
            {todayLeadAgenda.map((lead) => (
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

        {/* Custom appointments */}
        {appointments.length > 0 && (
          <div className="space-y-1 mb-2">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center justify-between text-xs px-2 py-1.5 rounded hover:bg-muted/50 group"
              >
                <div className="flex items-center gap-2 truncate">
                  {appt.appointment_time && (
                    <span className="text-muted-foreground font-mono shrink-0">
                      {appt.appointment_time.slice(0, 5)}
                    </span>
                  )}
                  <span className="font-medium truncate">{appt.title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={() => handleDelete(appt.id)}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {todayLeadAgenda.length === 0 && appointments.length === 0 && (
          <p className="text-xs text-muted-foreground italic mb-2">Nenhuma atividade agendada para hoje</p>
        )}

        {/* Add appointment form */}
        <div className="flex gap-1.5 items-center mt-2">
          <Input
            placeholder="Novo compromisso..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="h-7 text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleAddAppointment()}
          />
          <Input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="h-7 text-xs w-20 shrink-0"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleAddAppointment}
            disabled={!newTitle.trim() || createAppointment.isPending}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
