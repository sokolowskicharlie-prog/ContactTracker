/*
  # Add priority rank to call schedules

  1. Changes
    - Add `priority_rank` column to `call_schedules` table to display contact priority numbers
    - This allows the schedule to show priority rankings (e.g., "P1", "P2") next to contact names

  2. Details
    - Column type: integer (nullable, matching contacts table)
    - Allows displaying priority context in the auto-generated schedule
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_schedules' AND column_name = 'priority_rank'
  ) THEN
    ALTER TABLE call_schedules ADD COLUMN priority_rank integer;
  END IF;
END $$;