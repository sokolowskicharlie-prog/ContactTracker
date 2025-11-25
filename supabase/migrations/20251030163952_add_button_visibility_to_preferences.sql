/*
  # Add Button Visibility to User Preferences

  1. Changes
    - Add `button_visibility` column to `user_preferences` table to store which buttons are visible
    - JSONB column allows flexible storage of button visibility settings

  2. Notes
    - Stores user preferences for which buttons should be displayed
    - Defaults to all buttons visible
    - Works alongside button_order to control both visibility and order
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'button_visibility'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN button_visibility jsonb DEFAULT '{
      "copy-emails": true,
      "export": true,
      "history": true,
      "delete-all": true,
      "settings": true,
      "import": true,
      "add-contact": true
    }'::jsonb;
  END IF;
END $$;
