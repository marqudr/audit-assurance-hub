
-- RLS policies for client portal access

-- Clients can view projects of their company
CREATE POLICY "Clients can view company projects"
ON public.projects FOR SELECT TO authenticated
USING (
  get_user_type(auth.uid()) = 'client'
  AND lead_id = get_user_company_id(auth.uid())
);

-- Clients can insert projects for their company (new project request)
CREATE POLICY "Clients can insert company projects"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (
  get_user_type(auth.uid()) = 'client'
  AND lead_id = get_user_company_id(auth.uid())
);

-- Clients can view company project phases
CREATE POLICY "Clients can view company project phases"
ON public.project_phases FOR SELECT TO authenticated
USING (
  get_user_type(auth.uid()) = 'client'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_phases.project_id
    AND projects.lead_id = get_user_company_id(auth.uid())
  )
);

-- Clients can view approved final outputs only (no WIP/AI drafts)
CREATE POLICY "Clients can view approved final outputs"
ON public.phase_outputs FOR SELECT TO authenticated
USING (
  get_user_type(auth.uid()) = 'client'
  AND version_type = 'human'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = phase_outputs.project_id
    AND projects.lead_id = get_user_company_id(auth.uid())
  )
  AND EXISTS (
    SELECT 1 FROM project_phases
    WHERE project_phases.project_id = phase_outputs.project_id
    AND project_phases.phase_number = phase_outputs.phase_number
    AND project_phases.status = 'approved'
  )
);

-- Clients can view company project attachments
CREATE POLICY "Clients can view company project attachments"
ON public.project_attachments FOR SELECT TO authenticated
USING (
  get_user_type(auth.uid()) = 'client'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_attachments.project_id
    AND projects.lead_id = get_user_company_id(auth.uid())
  )
);

-- Clients can insert attachments to company projects
CREATE POLICY "Clients can insert attachments to company projects"
ON public.project_attachments FOR INSERT TO authenticated
WITH CHECK (
  get_user_type(auth.uid()) = 'client'
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_attachments.project_id
    AND projects.lead_id = get_user_company_id(auth.uid())
  )
);

-- Clients can view leads (their own company)
CREATE POLICY "Clients can view own company lead"
ON public.leads FOR SELECT TO authenticated
USING (
  get_user_type(auth.uid()) = 'client'
  AND id = get_user_company_id(auth.uid())
);

-- Storage: Clients can upload project files
CREATE POLICY "Clients can upload project files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-files'
  AND get_user_type(auth.uid()) = 'client'
);

-- Storage: Clients can view project files
CREATE POLICY "Clients can view company project files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'project-files'
  AND get_user_type(auth.uid()) = 'client'
);
