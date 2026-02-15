ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'perdido';
ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'prospeccao';