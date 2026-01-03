/*
  # Add Custom Fuel Type Names to User Preferences

  1. Changes
    - Add `vlsfo_name` column to store custom name for VLSFO (defaults to 'VLSFO')
    - Add `lsmgo_name` column to store custom name for LSMGO (defaults to 'LSMGO')
    - Allows users to rename the default fuel types to match their terminology

  2. Notes
    - Uses IF NOT EXISTS to safely add columns
    - Preserves existing user preferences
    - Default values ensure backward compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'vlsfo_name'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN vlsfo_name text DEFAULT 'VLSFO' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'lsmgo_name'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN lsmgo_name text DEFAULT 'LSMGO' NOT NULL;
  END IF;
END $$;