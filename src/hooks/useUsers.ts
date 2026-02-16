import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUsers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Fetch profiles and roles separately (no FK relationship between them)
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      // Group roles by user_id
      const rolesByUser: Record<string, string[]> = {};
      for (const r of rolesRes.data || []) {
        if (!rolesByUser[r.user_id]) rolesByUser[r.user_id] = [];
        rolesByUser[r.user_id].push(r.role);
      }

      return (profilesRes.data || []).map((p) => ({
        ...p,
        user_roles: (rolesByUser[p.user_id] || []).map((role) => ({ role })),
      }));
    },
  });

  const inviteUser = useMutation({
    mutationFn: async (payload: {
      email: string;
      role: string;
      user_type: string;
      company_id?: string | null;
      manager_id?: string | null;
    }) => {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: payload,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, oldRole, newRole }: { userId: string; oldRole: string; newRole: string }) => {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", oldRole as any);
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  return { users: query.data || [], isLoading: query.isLoading, inviteUser, updateUserRole };
}
