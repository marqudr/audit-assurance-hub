import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyUser {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  user_type: string;
  company_id: string | null;
  is_deleted: boolean;
  created_at: string;
  email?: string;
  role?: string;
}

export function useCompanyUsers(companyId: string | undefined, includeInactive = false) {
  return useQuery({
    queryKey: ["company-users", companyId, includeInactive],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .eq("company_id", companyId!)
        .eq("user_type", "client");
      if (!includeInactive) {
        query = query.eq("is_deleted", false);
      }
      const { data: profiles, error } = await query.order("created_at", { ascending: true });
      if (error) throw error;

      // Get roles for these users
      const userIds = (profiles || []).map((p) => p.user_id);
      let rolesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);
        rolesMap = Object.fromEntries((roles || []).map((r) => [r.user_id, r.role]));
      }

      return (profiles || []).map((p) => ({
        ...p,
        role: rolesMap[p.user_id] || "user",
      })) as CompanyUser[];
    },
    enabled: !!companyId,
  });
}
