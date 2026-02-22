/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ProjectCollaborator {
    id: string;
    project_id: string;
    user_id: string | null;
    name: string;
    cpf: string;
    role: string;
    education: string | null;
    monthly_salary: number;
    monthly_charges: number;
    created_at: string;
}

export function useProjectCollaborators(projectId: string | undefined) {
    return useQuery({
        queryKey: ["project_collaborators", projectId],
        queryFn: async () => {
            if (!projectId) return [];
            // @ts-ignore - bypass temporário para não explodir o supabase schema
            const { data, error } = await (supabase as any)
                .from("project_collaborators")
                .select("*")
                .eq("project_id", projectId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data || []) as ProjectCollaborator[];
        },
        enabled: !!projectId,
    });
}

export function useAddCollaborator() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (collaborator: Omit<ProjectCollaborator, "id" | "created_at" | "user_id">) => {
            // @ts-ignore - bypass temporário para não explodir o supabase schema
            const { data, error } = await (supabase as any)
                .from("project_collaborators")
                .insert({
                    ...collaborator,
                    user_id: user?.id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["project_collaborators", variables.project_id] });
        },
    });
}

export function useDeleteCollaborator() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
            // @ts-ignore - bypass temporário para não explodir o supabase schema
            const { error } = await (supabase as any).from("project_collaborators").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["project_collaborators", variables.projectId] });
        },
    });
}
