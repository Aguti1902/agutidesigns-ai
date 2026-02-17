-- Add booking_enabled flag to agents
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT FALSE;
