
-- 1. Add new enum values
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'prospeccao';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'qualificacao';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'diagnostico';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'fechamento';

-- 2. Add columns to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS probability integer DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deal_value numeric DEFAULT NULL;

-- 3. Create lead_checklist_items table
CREATE TABLE IF NOT EXISTS public.lead_checklist_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  phase public.lead_status NOT NULL,
  item_key text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lead_id, phase, item_key)
);

-- 4. Enable RLS
ALTER TABLE public.lead_checklist_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies
CREATE POLICY "Users can view own lead checklist items"
  ON public.lead_checklist_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_checklist_items.lead_id AND leads.user_id = auth.uid()));

CREATE POLICY "Users can insert own lead checklist items"
  ON public.lead_checklist_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_checklist_items.lead_id AND leads.user_id = auth.uid()));

CREATE POLICY "Users can update own lead checklist items"
  ON public.lead_checklist_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_checklist_items.lead_id AND leads.user_id = auth.uid()));

CREATE POLICY "Users can delete own lead checklist items"
  ON public.lead_checklist_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_checklist_items.lead_id AND leads.user_id = auth.uid()));
