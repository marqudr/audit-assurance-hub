-- supabase/migrations/20260222000002_add_project_collaborators.sql

CREATE TABLE IF NOT EXISTS public.project_collaborators (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid,
  name text NOT NULL,
  cpf text NOT NULL,
  role text NOT NULL,
  education text,
  monthly_salary numeric(15, 2) NOT NULL DEFAULT 0,
  monthly_charges numeric(15, 2) NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT project_collaborators_pkey PRIMARY KEY (id),
  CONSTRAINT project_collaborators_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT project_collaborators_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colaboradores são visíveis para todos os usuários autenticados"
  ON public.project_collaborators
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas admin ou dono do projeto pode inserir colaboradores"
  ON public.project_collaborators
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_collaborators.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Apenas admin ou dono do projeto pode atualizar colaboradores"
  ON public.project_collaborators
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_collaborators.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Apenas admin ou dono do projeto pode deletar colaboradores"
  ON public.project_collaborators
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_collaborators.project_id
      AND projects.user_id = auth.uid()
    )
  );
