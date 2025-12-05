/*
  # Add start_time field to daily_goals table

  1. Changes
    - Add `start_time` column to `daily_goals` table to specify when the goal period begins
    - Set default value to '09:00' for existing records
    - This allows users to define a time range (start_time to target_time) for their goals
  
  2. Notes
    - Existing goals will have start_time set to '09:00' by default
    - New goals can specify both start and end times for the goal period
*/

-- Add start_time column to daily_goals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_goals' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE daily_goals ADD COLUMN start_time time NOT NULL DEFAULT '09:00';
  END IF;
END $$;