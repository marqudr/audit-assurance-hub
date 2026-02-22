-- supabase/migrations/20260222000001_add_attachment_metadata.sql

ALTER TABLE public.project_attachments
ADD COLUMN custom_name varchar(255),
ADD COLUMN description text;
