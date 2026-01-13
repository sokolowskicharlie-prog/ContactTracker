/*
  # Add Excluded Countries to User Preferences

  1. Changes to Tables
    - `user_preferences` table:
      - Add `excluded_countries` (text array) - Countries to exclude from auto-generated call schedules
  
  2. Important Notes
    - Defaults to empty array (no countries excluded)
    - Users can select specific countries to exclude when generating call schedules
    - This helps users focus on specific regions or markets
*/

-- Add excluded_countries column to user_preferences table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'excluded_countries'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN excluded_countries text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;
