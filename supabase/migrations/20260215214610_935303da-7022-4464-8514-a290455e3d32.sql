
-- 1. Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status public.lead_status NOT NULL DEFAULT 'prospeccao',
  deal_value NUMERIC,
  probability INTEGER,
  expected_close_date DATE,
  estimated_benefit_min NUMERIC,
  estimated_benefit_max NUMERIC,
  engineering_headcount INTEGER,
  rd_annual_budget NUMERIC,
  icp_score INTEGER,
  has_budget BOOLEAN NOT NULL DEFAULT false,
  has_authority BOOLEAN NOT NULL DEFAULT false,
  has_need BOOLEAN NOT NULL DEFAULT false,
  has_timeline BOOLEAN NOT NULL DEFAULT false,
  pain_points TEXT,
  context TEXT,
  objection TEXT,
  qualification_method TEXT,
  next_action TEXT,
  next_action_date TIMESTAMP WITH TIME ZONE,
  last_contacted_date TIMESTAMP WITH TIME ZONE,
  last_activity_type TEXT,
  next_activity_date TIMESTAMP WITH TIME ZONE,
  content_consumed TEXT,
  estimated_ltv NUMERIC,
  source_medium TEXT,
  first_touch_channel TEXT,
  last_touch_channel TEXT,
  estimated_cac NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create project_attachments table
CREATE TABLE public.project_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  storage_path TEXT NOT NULL,
  phase public.lead_status,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Add project_id to lead_checklist_items
ALTER TABLE public.lead_checklist_items
  ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

-- 4. Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false);

-- 5. Updated_at trigger for projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. RLS for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (user_id = auth.uid());

-- 7. RLS for project_attachments
ALTER TABLE public.project_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project attachments"
  ON public.project_attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_attachments.project_id
      AND (projects.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "Users can insert own project attachments"
  ON public.project_attachments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_attachments.project_id
      AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own project attachments"
  ON public.project_attachments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_attachments.project_id
      AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own project attachments"
  ON public.project_attachments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_attachments.project_id
      AND projects.user_id = auth.uid()
  ));

-- 8. Storage RLS policies for project-files bucket
CREATE POLICY "Users can view own project files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own project files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own project files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 9. Migrate existing leads data into projects
INSERT INTO public.projects (
  lead_id, user_id, name, status, deal_value, probability, expected_close_date,
  estimated_benefit_min, estimated_benefit_max, engineering_headcount, rd_annual_budget,
  icp_score, has_budget, has_authority, has_need, has_timeline,
  pain_points, context, objection, qualification_method,
  next_action, next_action_date, last_contacted_date, last_activity_type,
  next_activity_date, content_consumed, estimated_ltv,
  source_medium, first_touch_channel, last_touch_channel, estimated_cac,
  created_at, updated_at
)
SELECT
  id, user_id, company_name, status, deal_value, probability, expected_close_date,
  estimated_benefit_min, estimated_benefit_max, engineering_headcount, rd_annual_budget,
  icp_score, has_budget, has_authority, has_need, has_timeline,
  pain_points, context, objection, qualification_method,
  next_action, next_action_date, last_contacted_date, last_activity_type,
  next_activity_date, content_consumed, estimated_ltv,
  source_medium, first_touch_channel, last_touch_channel, estimated_cac,
  created_at, updated_at
FROM public.leads;

-- 10. Migrate checklist items to reference projects
UPDATE public.lead_checklist_items cli
SET project_id = p.id
FROM public.projects p
WHERE p.lead_id = cli.lead_id;

-- 11. Indexes
CREATE INDEX idx_projects_lead_id ON public.projects(lead_id);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_project_attachments_project_id ON public.project_attachments(project_id);
CREATE INDEX idx_checklist_project_id ON public.lead_checklist_items(project_id);
