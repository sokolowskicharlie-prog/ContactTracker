/*
  # Add Custom Priority Labels to User Preferences

  1. Changes
    - Add `custom_priority_labels` JSONB column to `user_preferences` table
      - JSONB type to store custom label mappings (0-5)
      - NULL allowed (defaults to standard labels if not set)
      - Default value is NULL

  2. Notes
    - Users can customize labels for priority ranks 0-5
    - Priority 0: Default "Client"
    - Priority 1: Default "Highest"
    - Priority 2: Default "High"
    - Priority 3: Default "Medium"
    - Priority 4: Default "Low"
    - Priority 5: Default "Lowest"
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'custom_priority_labels'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN custom_priority_labels JSONB;
  END IF;
END $$;