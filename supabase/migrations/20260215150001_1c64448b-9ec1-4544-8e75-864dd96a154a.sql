
-- Atribuição e Origem
ALTER TABLE public.leads ADD COLUMN source_medium text;
ALTER TABLE public.leads ADD COLUMN first_touch_channel text;
ALTER TABLE public.leads ADD COLUMN last_touch_channel text;
ALTER TABLE public.leads ADD COLUMN estimated_cac numeric;

-- Qualificação e Fit
ALTER TABLE public.leads ADD COLUMN icp_score integer;
ALTER TABLE public.leads ADD COLUMN qualification_method text;
ALTER TABLE public.leads ADD COLUMN has_budget boolean NOT NULL DEFAULT false;
ALTER TABLE public.leads ADD COLUMN has_authority boolean NOT NULL DEFAULT false;
ALTER TABLE public.leads ADD COLUMN has_need boolean NOT NULL DEFAULT false;
ALTER TABLE public.leads ADD COLUMN has_timeline boolean NOT NULL DEFAULT false;
ALTER TABLE public.leads ADD COLUMN pain_points text;

-- Velocidade e Saúde
ALTER TABLE public.leads ADD COLUMN next_action text;
ALTER TABLE public.leads ADD COLUMN next_action_date timestamptz;
ALTER TABLE public.leads ADD COLUMN content_consumed text;

-- Projeção de Receita
ALTER TABLE public.leads ADD COLUMN estimated_ltv numeric;
ALTER TABLE public.leads ADD COLUMN expected_close_date date;
