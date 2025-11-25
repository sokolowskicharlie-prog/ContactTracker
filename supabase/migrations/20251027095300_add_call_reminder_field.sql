/*
  # Add Call Reminder Field

  1. Changes to Tables
    - `contacts` table:
      - Add `reminder_days` (integer, optional) - Number of days between calls for reminder

  2. Important Notes
    - This field allows users to set custom reminder intervals for each contact
    - If null, no reminder is set for that contact
    - Used to calculate when next call is due based on last call date
*/

-- Add reminder_days column to contacts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'reminder_days'
  ) THEN
    ALTER TABLE contacts ADD COLUMN reminder_days integer;
  END IF;
END $$;