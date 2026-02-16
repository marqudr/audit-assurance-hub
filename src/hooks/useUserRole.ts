import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "admin" | "closer" | "consultor" | "cfo" | "user" | "gestor";

export function useUserRoles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data?.map((r) => r.role) || []) as AppRole[];
    },
    enabled: !!user,
  });
}

export function useHasRole(role: AppRole) {
  const { data: roles, isLoading } = useUserRoles();
  return {
    hasRole: roles?.includes(role) ?? false,
    isLoading,
  };
}

export function useIsAdmin() {
  return useHasRole("admin");
}
