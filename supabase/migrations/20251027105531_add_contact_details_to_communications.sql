/*
  # Add Contact Details to Communication Logs

  1. Changes to calls table
    - Add `spoke_with` (text, optional) - Name of person spoken with
    - Add `phone_number` (text, optional) - Phone number used for the call

  2. Changes to emails table
    - Add `emailed_to` (text, optional) - Name of person emailed
    - Add `email_address` (text, optional) - Email address used

  3. Important Notes
    - These fields help track which specific person at a company was contacted
    - Useful for referencing contact persons or tracking communication channels
    - Optional fields to maintain backward compatibility
*/

-- Add fields to calls table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calls' AND column_name = 'spoke_with'
  ) THEN
    ALTER TABLE calls ADD COLUMN spoke_with text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calls' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE calls ADD COLUMN phone_number text;
  END IF;
END $$;

-- Add fields to emails table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'emails' AND column_name = 'emailed_to'
  ) THEN
    ALTER TABLE emails ADD COLUMN emailed_to text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'emails' AND column_name = 'email_address'
  ) THEN
    ALTER TABLE emails ADD COLUMN email_address text;
  END IF;
END $$;