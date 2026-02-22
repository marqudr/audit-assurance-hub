/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ProjectCollaboratorHour {
    id: string;
    project_id: string;
    collaborator_id: string;
    month: number;
    year: number;
    hours: number;
    description: string;
    created_at: string;
    created_by: string;
}

export function useProjectTimeTracking(projectId: string | undefined) {
    return useQuery({
        queryKey: ["project_collaborator_hours", projectId],
        queryFn: async () => {
            if (!projectId) return [];
            // @ts-ignore - bypass temporário para não explodir o supabase schema
            const { data, error } = await (supabase as any)
                .from("project_collaborator_hours")
                .select("*")
                .eq("project_id", projectId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data || []) as ProjectCollaboratorHour[];
        },
        enabled: !!projectId,
    });
}

export function useAddTimeTracking() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (tracking: Omit<ProjectCollaboratorHour, "id" | "created_at" | "created_by">) => {
            // @ts-ignore - bypass temporário para não explodir o supabase schema
            const { data, error } = await (supabase as any)
                .from("project_collaborator_hours")
                .insert({
                    ...tracking,
                    created_by: user?.id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["project_collaborator_hours", variables.project_id] });
        },
    });
}

export function useDeleteTimeTracking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
            // @ts-ignore - bypass temporário para não explodir o supabase schema
            const { error } = await (supabase as any).from("project_collaborator_hours").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["project_collaborator_hours", variables.projectId] });
        },
    });
}
