-- Add aadhar_number column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN aadhar_number text NOT NULL DEFAULT '';
