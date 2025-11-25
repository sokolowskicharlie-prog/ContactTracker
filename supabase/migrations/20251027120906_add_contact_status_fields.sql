/*
  # Add Contact Status Fields

  1. Changes
    - Add `is_jammed` boolean field to contacts (hidden contacts)
    - Add `has_traction` boolean field to contacts (starred contacts)
    - Add `is_client` boolean field to contacts (contacts marked as clients)
  
  2. Details
    - All fields default to false
    - These fields allow contacts to be categorized and filtered
    - Jammed contacts can be hidden from the main view
    - Traction contacts are highlighted as important
    - Client contacts are marked with a checkmark
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'is_jammed'
  ) THEN
    ALTER TABLE contacts ADD COLUMN is_jammed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'has_traction'
  ) THEN
    ALTER TABLE contacts ADD COLUMN has_traction boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'is_client'
  ) THEN
    ALTER TABLE contacts ADD COLUMN is_client boolean DEFAULT false;
  END IF;
END $$;