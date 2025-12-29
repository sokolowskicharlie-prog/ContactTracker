/*
  # Add panel spacing preference

  1. Changes
    - Add `panel_spacing` column to `user_preferences` table
      - Stores the spacing in pixels between panels (Notes, Goals, Priority)
      - Default value is 8 pixels
      - Allows users to customize visual spacing between panels
  
  2. Notes
    - Uses numeric type for pixel values
    - Default value maintains current behavior
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'panel_spacing'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN panel_spacing integer DEFAULT 8;
  END IF;
END $$;