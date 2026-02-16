import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUsers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, user_roles(role)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
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
      // Delete old role
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", oldRole as any);
      // Insert new role
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  return { users: query.data || [], isLoading: query.isLoading, inviteUser, updateUserRole };
}
