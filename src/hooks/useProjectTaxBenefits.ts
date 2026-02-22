/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectTaxBenefits {
    project_id: string;
    salaries: number;
    equipments: number;
    materials: number;
    services: number;
    depreciation: number;
    irpj_rate: number;
    csll_rate: number;
    ipi_rate: number;
    ipi_reduction: number;
    created_at?: string;
    updated_at?: string;
}

export function useProjectTaxBenefits(projectId: string | undefined) {
    return useQuery({
        queryKey: ["project_tax_benefits", projectId],
        queryFn: async () => {
            if (!projectId) return null;
            // @ts-ignore - bypass temporário para não explodir o supabase schema
            const { data, error } = await (supabase as any)
                .from("project_tax_benefits")
                .select("*")
                .eq("project_id", projectId)
                .maybeSingle();

            if (error) throw error;
            return (data || null) as ProjectTaxBenefits | null;
        },
        enabled: !!projectId,
    });
}

export function useSaveTaxBenefits() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (benefits: ProjectTaxBenefits) => {
            // Verifica se já existe para fazer upsert na mão, ou usa o upsert se houver PK
            // @ts-ignore - bypass temporário para não explodir o supabase schema
            const { data, error } = await (supabase as any)
                .from("project_tax_benefits")
                .upsert({
                    ...benefits,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'project_id' })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["project_tax_benefits", variables.project_id] });
        },
    });
}
