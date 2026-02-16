import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminUser {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  user_type: string;
  company_id: string | null;
  manager_id: string | null;
  is_deleted: boolean;
  created_at: string;
  email: string;
  user_roles: { role: string }[];
}

export function useUsers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-list-users");
      if (error) throw error;
      return data as AdminUser[];
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

  const updateUserProfile = useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: { display_name?: string; user_type?: string; avatar_url?: string | null };
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const toggleUserActive = useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      const { data, error } = await supabase.functions.invoke("admin-toggle-user", {
        body: { user_id: userId, active },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  return {
    users: query.data || [],
    isLoading: query.isLoading,
    inviteUser,
    updateUserRole,
    updateUserProfile,
    toggleUserActive,
  };
}
