-- Criação da tabela de Apontamento de Horas
CREATE TABLE IF NOT EXISTS public.project_collaborator_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    collaborator_id UUID NOT NULL REFERENCES public.project_collaborators(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    hours NUMERIC NOT NULL CHECK (hours > 0),
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Ativar RLS
ALTER TABLE public.project_collaborator_hours ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Usuários autenticados podem ver os apontamentos de horas"
    ON public.project_collaborator_hours
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Apenas admin ou dono do projeto pode inserir apontamentos"
    ON public.project_collaborator_hours
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.has_role(auth.uid(), 'admin')
        OR
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_collaborator_hours.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Apenas admin ou dono do projeto pode excluir apontamentos"
    ON public.project_collaborator_hours
    FOR DELETE
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'admin')
        OR
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_collaborator_hours.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Apenas admin ou dono do projeto pode atualizar apontamentos"
    ON public.project_collaborator_hours
    FOR UPDATE
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'admin')
        OR
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_collaborator_hours.project_id
            AND projects.user_id = auth.uid()
        )
    );
