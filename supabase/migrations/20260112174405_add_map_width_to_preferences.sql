/*
  # Add map width preference

  1. Changes
    - Add `map_width` column to `user_preferences` table
      - Stores the user's preferred map container width percentage (30-90)
      - Default value: 60 (60% width)
  
  2. Purpose
    - Allow users to customize and persist their map view size preference
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'map_width'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN map_width integer DEFAULT 60;
  END IF;
END $$;