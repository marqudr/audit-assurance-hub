
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create agents table
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  persona TEXT DEFAULT '',
  instructions TEXT DEFAULT '',
  temperature NUMERIC NOT NULL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 1),
  model_config JSONB NOT NULL DEFAULT '{"model": "google/gemini-3-flash-preview"}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'inactive', 'draft')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Helper function: is_agent_owner
CREATE OR REPLACE FUNCTION public.is_agent_owner(_agent_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agents WHERE id = _agent_id AND user_id = auth.uid()
  )
$$;

CREATE POLICY "Users can view own agents" ON public.agents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own agents" ON public.agents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agents" ON public.agents FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own agents" ON public.agents FOR DELETE USING (user_id = auth.uid());

-- Create agent_rag_files table
CREATE TABLE public.agent_rag_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_rag_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agent files" ON public.agent_rag_files FOR SELECT USING (public.is_agent_owner(agent_id));
CREATE POLICY "Users can insert own agent files" ON public.agent_rag_files FOR INSERT WITH CHECK (public.is_agent_owner(agent_id));
CREATE POLICY "Users can delete own agent files" ON public.agent_rag_files FOR DELETE USING (public.is_agent_owner(agent_id));

-- Create storage bucket for RAG files (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('rag-files', 'rag-files', false);

-- Storage policies: users can manage files in their own folder (user_id/)
CREATE POLICY "Users can upload RAG files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'rag-files' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view own RAG files" ON storage.objects FOR SELECT USING (
  bucket_id = 'rag-files' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete own RAG files" ON storage.objects FOR DELETE USING (
  bucket_id = 'rag-files' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Trigger for updated_at on profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
