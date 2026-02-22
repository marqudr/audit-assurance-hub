-- Criação da tabela de Benefícios Fiscais da Lei do Bem do Projeto
CREATE TABLE IF NOT EXISTS public.project_tax_benefits (
    project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
    salaries NUMERIC NOT NULL DEFAULT 0,
    equipments NUMERIC NOT NULL DEFAULT 0,
    materials NUMERIC NOT NULL DEFAULT 0,
    services NUMERIC NOT NULL DEFAULT 0,
    depreciation NUMERIC NOT NULL DEFAULT 0,
    irpj_rate NUMERIC NOT NULL DEFAULT 15,
    csll_rate NUMERIC NOT NULL DEFAULT 9,
    ipi_rate NUMERIC NOT NULL DEFAULT 0,
    ipi_reduction NUMERIC NOT NULL DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS
ALTER TABLE public.project_tax_benefits ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Usuários autenticados podem ver os benefícios fiscais"
    ON public.project_tax_benefits
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Apenas admin ou dono do projeto pode inserir benefícios"
    ON public.project_tax_benefits
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.has_role(auth.uid(), 'admin')
        OR
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_tax_benefits.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Apenas admin ou dono do projeto pode excluir benefícios"
    ON public.project_tax_benefits
    FOR DELETE
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'admin')
        OR
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_tax_benefits.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Apenas admin ou dono do projeto pode atualizar benefícios"
    ON public.project_tax_benefits
    FOR UPDATE
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'admin')
        OR
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_tax_benefits.project_id
            AND projects.user_id = auth.uid()
        )
    );
