/*
  # Add Additional Note Fields for Traction and Client

  1. Changes
    - Add `traction_additional_note` column to store extra notes about traction
    - Add `client_additional_note` column to store extra notes about client status
    - These are separate from the main traction/client note fields
  
  2. Details
    - Both columns are nullable text type
    - Allows users to add additional context beyond the primary notes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'traction_additional_note'
  ) THEN
    ALTER TABLE contacts ADD COLUMN traction_additional_note text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'client_additional_note'
  ) THEN
    ALTER TABLE contacts ADD COLUMN client_additional_note text;
  END IF;
END $$;