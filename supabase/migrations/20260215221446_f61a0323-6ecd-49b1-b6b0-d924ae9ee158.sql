
-- Add eligibility fields to leads
ALTER TABLE public.leads ADD COLUMN has_lucro_fiscal boolean NOT NULL DEFAULT false;
ALTER TABLE public.leads ADD COLUMN has_regularidade_fiscal boolean NOT NULL DEFAULT false;

-- Add Frascati fields to projects
ALTER TABLE public.projects ADD COLUMN frascati_novidade boolean NOT NULL DEFAULT false;
ALTER TABLE public.projects ADD COLUMN frascati_criatividade boolean NOT NULL DEFAULT false;
ALTER TABLE public.projects ADD COLUMN frascati_incerteza boolean NOT NULL DEFAULT false;
ALTER TABLE public.projects ADD COLUMN frascati_sistematicidade boolean NOT NULL DEFAULT false;
ALTER TABLE public.projects ADD COLUMN frascati_transferibilidade boolean NOT NULL DEFAULT false;
