/*
  # Add Dead Status to Contacts

  1. Changes
    - Add `is_dead` boolean field to track if a contact is marked as dead
    - Add `dead_date` timestamp field to track when the contact was marked as dead
    - Add `dead_note` text field to store the reason for marking as dead
    - Add `dead_additional_note` text field to store additional notes about the dead status

  2. Notes
    - Fields are optional (nullable) to maintain backward compatibility
    - Similar structure to existing status fields (is_jammed, has_traction, is_client)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'is_dead'
  ) THEN
    ALTER TABLE contacts ADD COLUMN is_dead boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'dead_date'
  ) THEN
    ALTER TABLE contacts ADD COLUMN dead_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'dead_note'
  ) THEN
    ALTER TABLE contacts ADD COLUMN dead_note text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'dead_additional_note'
  ) THEN
    ALTER TABLE contacts ADD COLUMN dead_additional_note text;
  END IF;
END $$;
