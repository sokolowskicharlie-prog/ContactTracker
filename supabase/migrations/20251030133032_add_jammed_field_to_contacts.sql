/*
  # Add jammed field to contacts

  1. Changes
    - Add `is_jammed` boolean column to `contacts` table
    - Default value is false
    - This field indicates if a contact is currently jammed (stuck/blocked)
  
  2. Notes
    - Non-breaking change - adds optional field with sensible default
    - Allows filtering contacts by jammed status
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'is_jammed'
  ) THEN
    ALTER TABLE contacts ADD COLUMN is_jammed boolean DEFAULT false;
  END IF;
END $$;