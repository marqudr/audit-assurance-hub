
-- Criar enum para status do lead
CREATE TYPE public.lead_status AS ENUM ('novo', 'qualificado', 'proposta', 'ganho');

-- Criar tabela leads
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  cnae TEXT,
  sector TEXT,
  revenue_range TEXT,
  status public.lead_status NOT NULL DEFAULT 'novo',
  engineering_headcount INTEGER,
  rd_annual_budget NUMERIC,
  estimated_benefit_min NUMERIC,
  estimated_benefit_max NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Política: usuário vê apenas seus leads
CREATE POLICY "Users can view own leads"
ON public.leads FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Política: usuário cria seus leads
CREATE POLICY "Users can insert own leads"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política: usuário atualiza seus leads
CREATE POLICY "Users can update own leads"
ON public.leads FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Política: usuário deleta seus leads
CREATE POLICY "Users can delete own leads"
ON public.leads FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
