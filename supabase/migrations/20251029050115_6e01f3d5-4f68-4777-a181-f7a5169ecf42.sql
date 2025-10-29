-- Create storage bucket for Aadhar cards
INSERT INTO storage.buckets (id, name, public)
VALUES ('aadhar-cards', 'aadhar-cards', false);

-- Add aadhar_card_url column to profiles
ALTER TABLE public.profiles 
ADD COLUMN aadhar_card_url text;

-- RLS policies for aadhar-cards bucket
CREATE POLICY "Users can upload their own Aadhar card"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'aadhar-cards' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own Aadhar card"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'aadhar-cards' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own Aadhar card"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'aadhar-cards' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own Aadhar card"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'aadhar-cards' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Admin can view all Aadhar cards
CREATE POLICY "Admins can view all Aadhar cards"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'aadhar-cards' AND
  is_admin(auth.uid())
);
