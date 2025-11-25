/*
  # Add mobile column to contact_persons table

  1. Changes
    - Add `mobile` column to `contact_persons` table to store mobile phone numbers
    - This column was referenced in the application code but was missing from the schema
  
  2. Notes
    - Uses IF NOT EXISTS check to prevent errors if column already exists
    - Column is nullable as mobile numbers are optional
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_persons' AND column_name = 'mobile'
  ) THEN
    ALTER TABLE contact_persons ADD COLUMN mobile text;
  END IF;
END $$;