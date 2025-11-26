/*
  # Add Manual Count to Daily Goals

  1. Changes
    - Add `manual_count` column to `daily_goals` table
      - Allows users to manually track their progress
      - Defaults to 0
      - Must be non-negative
    
  2. Notes
    - Manual count will be added to automatic count from communications history
    - Users can increment/decrement this value manually
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_goals' AND column_name = 'manual_count'
  ) THEN
    ALTER TABLE daily_goals ADD COLUMN manual_count integer DEFAULT 0 NOT NULL CHECK (manual_count >= 0);
  END IF;
END $$;