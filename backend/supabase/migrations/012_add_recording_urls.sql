-- Add recording URL columns to calls table
ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_url_lead TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_url_seller TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_url_video TEXT;

-- Create storage bucket for call recordings (if using Supabase Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('call-recordings', 'call-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read their org's recordings
CREATE POLICY "Users can read own org recordings"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'call-recordings'
    AND auth.role() = 'authenticated'
);

-- Allow service role to insert recordings
CREATE POLICY "Service role can insert recordings"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'call-recordings'
);

-- Allow authenticated users to upload recordings
CREATE POLICY "Authenticated users can upload recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'call-recordings'
);

-- Allow authenticated users to update (upsert) recordings
CREATE POLICY "Authenticated users can update recordings"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'call-recordings'
);
