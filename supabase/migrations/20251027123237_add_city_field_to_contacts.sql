/*
  # Add City Field to Contacts

  1. Changes
    - Add `city` text field to contacts table
  
  2. Details
    - The city field will store the city name for each contact
    - This field is optional and can be null
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'city'
  ) THEN
    ALTER TABLE contacts ADD COLUMN city text;
  END IF;
END $$;