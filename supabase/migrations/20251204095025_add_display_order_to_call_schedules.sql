/*
  # Add Display Order to Call Schedules

  1. Changes
    - Add `display_order` column to call_schedules table
    - This allows users to manually reorder their call schedule
    - Default value is set based on scheduled_time to maintain existing order

  2. Notes
    - Existing schedules will be ordered by scheduled_time
    - Future schedules can be reordered manually by users
*/

-- Add display_order column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_schedules' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE call_schedules ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;

-- Set initial display_order based on scheduled_time for existing records
UPDATE call_schedules
SET display_order = sub.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY goal_id ORDER BY scheduled_time) as row_num
  FROM call_schedules
) sub
WHERE call_schedules.id = sub.id;