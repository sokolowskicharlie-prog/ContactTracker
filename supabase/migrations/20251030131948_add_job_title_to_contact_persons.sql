/*
  # Add job title field to contact persons

  1. Changes
    - Add `job_title` column to `contact_persons` table
      - Type: text
      - Nullable: true (optional field)
      - Description: Job title or position of the contact person

  2. Notes
    - This field allows tracking the position/role of contact persons
    - Helps identify key decision makers and organizational structure
    - Field is optional and can be left blank
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_persons' AND column_name = 'job_title'
  ) THEN
    ALTER TABLE contact_persons ADD COLUMN job_title text;
  END IF;
END $$;