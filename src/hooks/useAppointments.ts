import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Appointment {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  appointment_date: string;
  appointment_time: string | null;
  lead_id: string | null;
  created_at: string;
}

export function useTodayAppointments() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["appointments", "today", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("appointment_date", today)
        .order("appointment_time", { ascending: true });
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!user,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (appt: {
      title: string;
      description?: string;
      appointment_date: string;
      appointment_time?: string;
      lead_id?: string;
    }) => {
      const { data, error } = await supabase
        .from("appointments")
        .insert({ ...appt, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
