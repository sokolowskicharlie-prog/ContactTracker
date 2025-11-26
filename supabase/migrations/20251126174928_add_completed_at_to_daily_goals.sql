/*
  # Add Completed At to Daily Goals

  1. Changes
    - Add `completed_at` column to `daily_goals` table
      - Tracks when a goal was marked as complete
      - Optional timestamp field
      - Used for showing goal completion history
    
  2. Notes
    - This allows goals to be marked as complete while preserving the record
    - Goals with completed_at set will show in history
    - is_active = false can now mean either deleted OR completed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_goals' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE daily_goals ADD COLUMN completed_at timestamptz;
  END IF;
END $$;