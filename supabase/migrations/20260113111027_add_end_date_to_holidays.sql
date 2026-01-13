/*
  # Add end_date to holidays table for date ranges

  1. Changes
    - Add `end_date` (date, nullable) column to holidays table
    - This allows holidays to span multiple days (e.g., vacations)
    - If end_date is null, the holiday is a single day
    - If end_date is set, the holiday spans from date to end_date (inclusive)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'holidays' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE holidays ADD COLUMN end_date date;
  END IF;
END $$;
