import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ClientMetrics {
  totalSavings: number;
  activeProjects: number;
  completedProjects: number;
  nextDeadline: string | null;
  nextDeadlineProject: string | null;
}

export interface ClientAlert {
  type: "deadline" | "pending_docs" | "opportunity";
  title: string;
  description: string;
  projectId?: string;
}

export function useClientProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, leads:company_id(id, company_name)")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useClientProjects() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useClientMetrics() {
  const { data: projects } = useClientProjects();

  const metrics: ClientMetrics = {
    totalSavings: 0,
    activeProjects: 0,
    completedProjects: 0,
    nextDeadline: null,
    nextDeadlineProject: null,
  };

  if (!projects) return metrics;

  const now = new Date();
  let closestDate: Date | null = null;

  for (const p of projects) {
    if (p.status === "ganho") {
      metrics.totalSavings += Number(p.estimated_benefit_min ?? 0);
      metrics.completedProjects++;
    } else if (p.status !== "perdido") {
      metrics.activeProjects++;
    }

    if (p.next_action_date) {
      const d = new Date(p.next_action_date);
      if (d >= now && (!closestDate || d < closestDate)) {
        closestDate = d;
        metrics.nextDeadline = p.next_action_date;
        metrics.nextDeadlineProject = p.name;
      }
    }
  }

  return metrics;
}

export function useClientAlerts() {
  const { data: projects } = useClientProjects();
  const alerts: ClientAlert[] = [];

  if (!projects) return alerts;

  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  for (const p of projects) {
    if (p.next_action_date) {
      const d = new Date(p.next_action_date);
      if (d >= now && d <= sevenDays) {
        alerts.push({
          type: "deadline",
          title: "Prazo próximo",
          description: `${p.name} — ${d.toLocaleDateString("pt-BR")}`,
          projectId: p.id,
        });
      }
    }

    if (p.status === "novo") {
      alerts.push({
        type: "opportunity",
        title: "Novo projeto",
        description: `${p.name} — aguardando início`,
        projectId: p.id,
      });
    }
  }

  return alerts;
}

export function getClientFriendlyStatus(phaseStatus: string): string {
  switch (phaseStatus) {
    case "not_started":
    case "in_progress":
      return "Em análise técnica";
    case "review":
      return "Em revisão";
    case "approved":
      return "Concluído";
    default:
      return "Em andamento";
  }
}

export function getCurrentPhase(phases: { phase_number: number; status: string }[]): number {
  if (!phases || phases.length === 0) return 0;
  const active = phases.find((p) => p.status === "in_progress" || p.status === "review");
  if (active) return active.phase_number;
  const lastApproved = [...phases].reverse().find((p) => p.status === "approved");
  if (lastApproved) return Math.min(lastApproved.phase_number + 1, 7);
  return 1;
}
