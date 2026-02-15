
-- 1. project_phases table
CREATE TABLE public.project_phases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_number integer NOT NULL CHECK (phase_number BETWEEN 1 AND 7),
  phase_name text NOT NULL,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'review', 'approved')),
  approved_by uuid,
  approved_at timestamptz,
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, phase_number)
);

ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project phases" ON public.project_phases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_phases.project_id AND (projects.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)))
  );

CREATE POLICY "Users can insert own project phases" ON public.project_phases
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_phases.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can update own project phases" ON public.project_phases
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_phases.project_id AND (projects.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)))
  );

CREATE POLICY "Users can delete own project phases" ON public.project_phases
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_phases.project_id AND projects.user_id = auth.uid())
  );

CREATE TRIGGER update_project_phases_updated_at
  BEFORE UPDATE ON public.project_phases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. phase_outputs table
CREATE TABLE public.phase_outputs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_number integer NOT NULL CHECK (phase_number BETWEEN 1 AND 7),
  version_type text NOT NULL CHECK (version_type IN ('ai', 'human')),
  content text NOT NULL DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.phase_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own phase outputs" ON public.phase_outputs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = phase_outputs.project_id AND (projects.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)))
  );

CREATE POLICY "Users can insert own phase outputs" ON public.phase_outputs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = phase_outputs.project_id AND (projects.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)))
  );

CREATE POLICY "Users can update own phase outputs" ON public.phase_outputs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = phase_outputs.project_id AND (projects.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)))
  );

CREATE POLICY "Users can delete own phase outputs" ON public.phase_outputs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = phase_outputs.project_id AND projects.user_id = auth.uid())
  );

-- 3. phase_executions table
CREATE TABLE public.phase_executions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_number integer NOT NULL CHECK (phase_number BETWEEN 1 AND 7),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.phase_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own phase executions" ON public.phase_executions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = phase_executions.project_id AND (projects.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)))
  );

CREATE POLICY "Users can insert own phase executions" ON public.phase_executions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = phase_executions.project_id AND (projects.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)))
  );

CREATE POLICY "Users can update own phase executions" ON public.phase_executions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = phase_executions.project_id AND (projects.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)))
  );

-- 4. Alter project_attachments
ALTER TABLE public.project_attachments
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
