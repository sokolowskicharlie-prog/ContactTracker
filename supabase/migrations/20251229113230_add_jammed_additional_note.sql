/*
  # Add Additional Note Field for Jammed Contacts

  1. Changes
    - Add `jammed_additional_note` column to store extra notes about why contact is jammed
    - This is separate from `jammed_note` which stores the jammed reason selection
  
  2. Details
    - New column is nullable text type
    - Allows users to add additional context beyond the predefined jammed reason
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'jammed_additional_note'
  ) THEN
    ALTER TABLE contacts ADD COLUMN jammed_additional_note text;
  END IF;
END $$;