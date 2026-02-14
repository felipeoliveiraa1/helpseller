-- Add external_id column to calls table to track Google Meet IDs
ALTER TABLE public.calls 
ADD COLUMN IF NOT EXISTS external_id text;

-- Optional: Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calls_external_id ON public.calls(external_id);
