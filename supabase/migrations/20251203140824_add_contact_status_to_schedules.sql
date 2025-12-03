/*
  # Add contact status to call schedules

  1. Changes
    - Add `contact_status` column to `call_schedules` table to store contact status (jammed, traction, client, none)
    - Update existing schedules to set status to 'none' by default

  2. Notes
    - The priority_label column is kept for backwards compatibility but will no longer be displayed
    - Status values: 'jammed', 'traction', 'client', 'none'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_schedules' AND column_name = 'contact_status'
  ) THEN
    ALTER TABLE call_schedules ADD COLUMN contact_status text DEFAULT 'none';
  END IF;
END $$;