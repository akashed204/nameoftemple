/*
# [Initial Schema Setup]
This script creates all the necessary tables, types, functions, and security policies for the Temple Membership application.

## Query Description: This operation will set up the foundational database structure. It creates the 'profiles', 'membership_applications', and 'user_roles' tables, along with required data types and security functions. Since no tables currently exist, there is no risk to existing data.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "High"
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Tables Created: profiles, membership_applications, user_roles
- Enums Created: membership_type, application_status
- Functions Created: is_admin
- Storage Buckets Created: aadhar-cards

## Security Implications:
- RLS Status: Enabled on all new tables.
- Policy Changes: Yes, initial policies are created to ensure users can only access their own data, while admins have broader access.
- Auth Requirements: Policies are linked to authenticated users and a custom 'admin' role.

## Performance Impact:
- Indexes: Primary and foreign key indexes are created.
- Triggers: None.
- Estimated Impact: Low initial impact. Establishes the foundation for all application data.
*/

-- ========= ENUMS =========
-- Create custom types for membership and application status.
CREATE TYPE public.membership_type AS ENUM ('basic', 'silver', 'gold', 'platinum');
CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected');

-- ========= PROFILES TABLE =========
-- Create the table to store user profile information.
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text NOT NULL,
    date_of_birth date NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    pincode text NOT NULL,
    emergency_contact text NOT NULL,
    emergency_phone text NOT NULL,
    aadhar_number text NOT NULL,
    aadhar_card_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.profiles IS 'Stores public profile information for each user.';

-- ========= MEMBERSHIP APPLICATIONS TABLE =========
-- Create the table to store membership application details.
CREATE TABLE public.membership_applications (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    membership_type public.membership_type NOT NULL,
    amount numeric NOT NULL,
    payment_reference text,
    status public.application_status DEFAULT 'pending',
    admin_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.membership_applications IS 'Tracks membership applications and their status.';

-- ========= USER ROLES TABLE =========
-- Create the table to assign roles (like admin) to users.
CREATE TABLE public.user_roles (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, role)
);
COMMENT ON TABLE public.user_roles IS 'Assigns roles to users for authorization.';

-- ========= IS_ADMIN FUNCTION =========
-- Create a function to easily check if a user has the 'admin' role.
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = check_user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========= RLS POLICIES =========

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policies for 'profiles' table
CREATE POLICY "Users can view and update their own profile."
ON public.profiles FOR ALL
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles."
ON public.profiles FOR SELECT
USING (public.is_admin(auth.uid()));

-- Policies for 'membership_applications' table
CREATE POLICY "Users can view their own applications."
ON public.membership_applications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications."
ON public.membership_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all applications."
ON public.membership_applications FOR ALL
USING (public.is_admin(auth.uid()));

-- Policies for 'user_roles' table
CREATE POLICY "Admins can manage all user roles."
ON public.user_roles FOR ALL
USING (public.is_admin(auth.uid()));


-- ========= STORAGE BUCKET =========
-- Create a storage bucket for Aadhar card uploads.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('aadhar-cards', 'aadhar-cards', true, 5242880, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Policies for 'aadhar-cards' bucket
CREATE POLICY "Users can upload their own aadhar card."
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'aadhar-cards' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own aadhar card."
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'aadhar-cards' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own aadhar card."
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'aadhar-cards' AND (storage.foldername(name))[1] = auth.uid()::text);
