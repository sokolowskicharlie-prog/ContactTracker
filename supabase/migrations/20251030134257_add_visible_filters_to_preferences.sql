/*
  # Add Visible Filters to User Preferences

  1. Changes
    - Add `visible_filters` column to `user_preferences` table to store which filters are visible
    - JSONB column allows flexible storage of filter visibility settings

  2. Notes
    - Stores user preferences for which contact filters should be displayed
    - Defaults to all filters visible
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'visible_filters'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN visible_filters jsonb DEFAULT '{
      "name": true,
      "company": true,
      "companySize": true,
      "email": true,
      "phone": true,
      "city": true,
      "postCode": true,
      "website": true,
      "address": true,
      "country": true,
      "timezone": true
    }'::jsonb;
  END IF;
END $$;