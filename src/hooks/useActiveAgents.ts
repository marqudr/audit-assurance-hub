import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Agent } from "./useAgents";

/** Fetches all active agents visible to the current user (via RLS). */
export function useActiveAgents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["active-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data as Agent[];
    },
    enabled: !!user,
  });
}
