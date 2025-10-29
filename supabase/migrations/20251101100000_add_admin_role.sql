/*
# [Operation Name]
Assign Admin Role to User

## Query Description: [This script assigns the 'admin' role to a specific user identified by their email address. It first finds the user's unique ID from the `auth.users` table and then inserts a new entry into the `public.user_roles` table. This operation is safe and will not affect existing data, but it grants significant privileges to the specified user. Ensure the email address is correct before running.]

## Metadata:
- Schema-Category: ["Data"]
- Impact-Level: ["Medium"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Tables affected: `public.user_roles` (INSERT)
- Tables read: `auth.users` (SELECT)

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: Grants 'admin' role, elevating user privileges.

## Performance Impact:
- Indexes: Uses existing primary keys.
- Triggers: None
- Estimated Impact: Low. A single insert operation.
*/

-- This script assigns the 'admin' role to the user with the specified email.
-- It's designed to be run after the user has been created through the standard sign-up process.
DO $$
DECLARE
    user_id_to_set UUID;
BEGIN
    -- Find the user's ID based on their email address.
    SELECT id INTO user_id_to_set FROM auth.users WHERE email = 'akashakash200243@gmail.com';

    -- If the user exists, insert the admin role into the user_roles table.
    -- The ON CONFLICT clause prevents errors if the role assignment already exists.
    IF user_id_to_set IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (user_id_to_set, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        RAISE NOTICE 'Admin role assigned to user %', 'akashakash200243@gmail.com';
    ELSE
        RAISE NOTICE 'User with email % not found. Please ensure the user has signed up first.', 'akashakash200243@gmail.com';
    END IF;
END $$;
