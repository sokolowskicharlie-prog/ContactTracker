/*
  # Add map zoom lock preference

  1. Changes
    - Add `map_zoom_locked` column to `user_preferences` table
      - Stores whether the user wants to disable zoom functionality
      - Default value: false (zoom enabled)
  
  2. Purpose
    - Allow users to lock zoom to prevent accidental zooming
    - Prevents scrollwheel zoom and zoom button clicks when locked
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'map_zoom_locked'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN map_zoom_locked boolean DEFAULT false;
  END IF;
END $$;