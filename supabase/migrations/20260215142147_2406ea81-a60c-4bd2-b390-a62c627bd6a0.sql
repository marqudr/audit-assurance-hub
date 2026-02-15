
-- Adicionar campos de endereço à tabela leads
ALTER TABLE public.leads
  ADD COLUMN address_street TEXT,
  ADD COLUMN address_number TEXT,
  ADD COLUMN address_complement TEXT,
  ADD COLUMN address_neighborhood TEXT,
  ADD COLUMN address_city TEXT,
  ADD COLUMN address_state TEXT,
  ADD COLUMN address_zip TEXT;

-- Criar tabela de contatos do lead
CREATE TABLE public.lead_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_contacts ENABLE ROW LEVEL SECURITY;

-- RLS: acesso via dono do lead
CREATE POLICY "Users can view own lead contacts"
ON public.lead_contacts FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_contacts.lead_id AND (leads.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "Users can insert own lead contacts"
ON public.lead_contacts FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_contacts.lead_id AND leads.user_id = auth.uid()));

CREATE POLICY "Users can update own lead contacts"
ON public.lead_contacts FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_contacts.lead_id AND leads.user_id = auth.uid()));

CREATE POLICY "Users can delete own lead contacts"
ON public.lead_contacts FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_contacts.lead_id AND leads.user_id = auth.uid()));
