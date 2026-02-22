-- Migration: Adicionar campos de inovação em projetos da Lei do Bem

ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS classification TEXT,
  ADD COLUMN IF NOT EXISTS objective TEXT,
  ADD COLUMN IF NOT EXISTS innovation TEXT,
  ADD COLUMN IF NOT EXISTS technical_challenges TEXT,
  ADD COLUMN IF NOT EXISTS tech_lead TEXT,
  ADD COLUMN IF NOT EXISTS base_year INTEGER;
