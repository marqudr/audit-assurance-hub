import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AuditFilters {
  tableName?: string;
  operation?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}

export function useAuditLogs(filters: AuditFilters = {}) {
  const { tableName, operation, userId, page = 0, pageSize = 25 } = filters;

  return useQuery({
    queryKey: ["audit-logs", tableName, operation, userId, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (tableName) query = query.eq("table_name", tableName);
      if (operation) query = query.eq("operation", operation);
      if (userId) query = query.eq("user_id", userId);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
  });
}
