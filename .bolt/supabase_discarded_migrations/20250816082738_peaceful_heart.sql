/*
  # Create Default User Accounts

  1. New Features
    - Creates default admin, trainer, and member accounts
    - Sets up proper profiles for each user type
    - Disables email confirmation for easier testing

  2. Security
    - Uses secure password hashing
    - Maintains RLS policies
    - Creates users through auth.users table

  3. Default Accounts
    - Admin: admin@fittracker.com / admin123
    - Trainer: trainer@fittracker.com / trainer123  
    - Member: member@fittracker.com / member123
*/

-- Create default admin user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@fittracker.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Admin", "last_name": "User", "role": "admin"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Create default trainer user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'trainer@fittracker.com',
  crypt('trainer123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Trainer", "last_name": "User", "role": "trainer"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Create default member user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'member@fittracker.com',
  crypt('member123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Member", "last_name": "User", "role": "member"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Update profiles for default users (will be created by trigger)
DO $$
DECLARE
  admin_user_id uuid;
  trainer_user_id uuid;
  member_user_id uuid;
BEGIN
  -- Get user IDs
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@fittracker.com';
  SELECT id INTO trainer_user_id FROM auth.users WHERE email = 'trainer@fittracker.com';
  SELECT id INTO member_user_id FROM auth.users WHERE email = 'member@fittracker.com';

  -- Update admin profile
  IF admin_user_id IS NOT NULL THEN
    UPDATE profiles SET 
      role = 'admin',
      phone = '+1-555-0001'
    WHERE id = admin_user_id;
  END IF;

  -- Update trainer profile
  IF trainer_user_id IS NOT NULL THEN
    UPDATE profiles SET 
      role = 'trainer',
      phone = '+1-555-0002'
    WHERE id = trainer_user_id;
  END IF;

  -- Update member profile
  IF member_user_id IS NOT NULL THEN
    UPDATE profiles SET 
      role = 'member',
      phone = '+1-555-0003'
    WHERE id = member_user_id;
  END IF;
END $$;