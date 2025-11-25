/*
  # Add Post Code Field to Contacts

  1. Changes
    - Add `post_code` text field to contacts table
  
  2. Details
    - The post_code field will store the postal/zip code for each contact
    - This field is optional and can be null
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'post_code'
  ) THEN
    ALTER TABLE contacts ADD COLUMN post_code text;
  END IF;
END $$;