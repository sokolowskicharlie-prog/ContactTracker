/*
  # Add email_type columns to contacts and contact_persons tables

  1. Changes
    - Add `email_type` column to `contacts` table
    - Add `email_type` column to `contact_persons` table
    - Set default value to 'general'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'email_type'
  ) THEN
    ALTER TABLE contacts ADD COLUMN email_type text DEFAULT 'general';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_persons' AND column_name = 'email_type'
  ) THEN
    ALTER TABLE contact_persons ADD COLUMN email_type text DEFAULT 'general';
  END IF;
END $$;