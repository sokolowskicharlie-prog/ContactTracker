/*
  # Add Excluded Search Terms to User Preferences

  1. Changes
    - Add `excluded_search_terms` column to `user_preferences` table
      - Stores an array of terms to exclude from bulk search results
      - Default: empty array
  
  2. Notes
    - Terms will be stored in lowercase for case-insensitive matching
    - Users can add/remove terms through the bulk search settings
    - Terms are automatically applied to all bulk searches
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'excluded_search_terms'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN excluded_search_terms text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;
