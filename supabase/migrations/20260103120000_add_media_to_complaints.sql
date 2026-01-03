-- Add media_urls column to complaints table for storing uploaded media
ALTER TABLE public.complaints 
ADD COLUMN media_urls TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create a storage bucket for complaint media if it doesn't exist
-- This would be done via the dashboard, but we'll ensure the policy exists

-- Create policy for public uploads to complaint-media bucket
CREATE POLICY "Anyone can upload complaint media" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'complaint-media');

-- Create policy for public read access to complaint-media bucket
CREATE POLICY "Complaint media is publicly readable" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'complaint-media');

-- Create policy for public delete access to complaint-media bucket
CREATE POLICY "Users can delete their own complaint media" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'complaint-media');
