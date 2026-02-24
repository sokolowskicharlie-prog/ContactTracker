/*
  # Add Timezone Preferences

  1. Changes
    - Add `timezone_settings` column to `user_preferences` table
      - Stores customization for each timezone (visibility, custom name)
      - Structure: { "timezone_name": { "visible": boolean, "customName": string } }
    
  2. Notes
    - Allows users to hide/show specific timezones
    - Allows users to rename timezone labels
    - Defaults to null (all timezones visible with default names)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'timezone_settings'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN timezone_settings jsonb DEFAULT NULL;
  END IF;
END $$;