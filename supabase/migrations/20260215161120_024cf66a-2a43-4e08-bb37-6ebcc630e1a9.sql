
-- Add interaction history fields to leads table
ALTER TABLE public.leads
  ADD COLUMN last_contacted_date timestamptz,
  ADD COLUMN last_activity_type text,
  ADD COLUMN next_activity_date timestamptz;

-- Add comment for documentation
COMMENT ON COLUMN public.leads.last_contacted_date IS 'Date of the last contact with the lead';
COMMENT ON COLUMN public.leads.last_activity_type IS 'Type of last activity: email, reuniao, ligacao';
COMMENT ON COLUMN public.leads.next_activity_date IS 'Date of the next planned activity';
