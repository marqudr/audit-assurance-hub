
-- 1. Expand profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'staff',
  ADD COLUMN IF NOT EXISTS company_id uuid NULL,
  ADD COLUMN IF NOT EXISTS manager_id uuid NULL,
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.leads(id) ON DELETE SET NULL;

-- 2. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id text NOT NULL,
  operation text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  user_id uuid,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (table_name, record_id, operation, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id::text, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, operation, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id::text, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, operation, old_data, user_id)
    VALUES (TG_TABLE_NAME, OLD.id::text, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 4. Apply audit triggers
CREATE TRIGGER audit_leads AFTER INSERT OR UPDATE OR DELETE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_projects AFTER INSERT OR UPDATE OR DELETE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_project_phases AFTER INSERT OR UPDATE OR DELETE ON public.project_phases FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_phase_outputs AFTER INSERT OR UPDATE OR DELETE ON public.phase_outputs FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_project_attachments AFTER INSERT OR UPDATE OR DELETE ON public.project_attachments FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- 5. Helper SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.get_user_type(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT COALESCE((SELECT user_type FROM public.profiles WHERE user_id = _user_id AND is_deleted = false LIMIT 1), 'staff') $$;

CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT company_id FROM public.profiles WHERE user_id = _user_id AND is_deleted = false LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.get_managed_user_ids(_manager_id uuid)
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT COALESCE(array_agg(user_id), ARRAY[]::uuid[]) FROM public.profiles WHERE manager_id = _manager_id AND is_deleted = false $$;

-- 6. Update RLS on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "View profiles policy" ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'gestor') AND user_id = ANY(public.get_managed_user_ids(auth.uid())))
  OR (public.get_user_type(auth.uid()) = 'client' AND company_id IS NOT NULL AND company_id = public.get_user_company_id(auth.uid()))
);

-- 7. Update RLS on leads
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
CREATE POLICY "View leads policy" ON public.leads FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'gestor') AND user_id = ANY(public.get_managed_user_ids(auth.uid())))
  OR (public.get_user_type(auth.uid()) = 'client' AND id = public.get_user_company_id(auth.uid()))
);

DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
CREATE POLICY "Update leads policy" ON public.leads FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'gestor') AND user_id = ANY(public.get_managed_user_ids(auth.uid())))
);

DROP POLICY IF EXISTS "Users can delete own leads" ON public.leads;
CREATE POLICY "Delete leads policy" ON public.leads FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 8. Update RLS on projects
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
CREATE POLICY "View projects policy" ON public.projects FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'gestor') AND user_id = ANY(public.get_managed_user_ids(auth.uid())))
  OR (public.get_user_type(auth.uid()) = 'client' AND lead_id = public.get_user_company_id(auth.uid()))
);

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Update projects policy" ON public.projects FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'gestor') AND user_id = ANY(public.get_managed_user_ids(auth.uid())))
);

DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Delete projects policy" ON public.projects FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 9. Update handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, user_type, company_id, manager_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'staff'),
    (NEW.raw_user_meta_data->>'company_id')::uuid,
    (NEW.raw_user_meta_data->>'manager_id')::uuid
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
