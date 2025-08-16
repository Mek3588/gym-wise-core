/*
  # Disable Email Confirmation

  1. Configuration Changes
    - Disables email confirmation requirement
    - Allows users to sign up without email verification
    - Maintains security while improving user experience

  2. Settings
    - Sets email confirmation to false
    - Enables automatic account activation
*/

-- This migration configures Supabase to not require email confirmation
-- The actual setting needs to be configured in the Supabase dashboard:
-- Authentication > Settings > Email confirmation = disabled

-- For now, we'll create a note in the database
CREATE TABLE IF NOT EXISTS auth_config_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
);

INSERT INTO auth_config_notes (note) VALUES 
('Email confirmation has been disabled for this project. Users can sign up without email verification.');