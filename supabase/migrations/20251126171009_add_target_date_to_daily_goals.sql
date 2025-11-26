/*
  # Add Target Date to Daily Goals

  1. Changes
    - Add `target_date` column to `daily_goals` table (date field)
    - Defaults to current date
    - Allows users to set goals for future dates
    - Add index for efficient querying by date

  2. Notes
    - This allows users to plan goals ahead of time
    - Goals can be set for tomorrow or any future date
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_goals' AND column_name = 'target_date'
  ) THEN
    ALTER TABLE daily_goals ADD COLUMN target_date date DEFAULT CURRENT_DATE NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_daily_goals_date ON daily_goals(user_id, target_date, is_active) WHERE is_active = true;