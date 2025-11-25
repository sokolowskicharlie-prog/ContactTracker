/*
  # Add company size field to contacts

  1. Changes
    - Add `company_size` column to `contacts` table
      - Type: text
      - Nullable: true (optional field)
      - Valid values: 'Micro (1-10)', 'Small (11-50)', 'Medium (51-200)', 'Large (201-500)', 'Enterprise (500+)'

  2. Notes
    - This field allows tracking the size of the contact's company
    - Helps with segmentation and prioritization of contacts
    - Field is optional and can be left blank
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'company_size'
  ) THEN
    ALTER TABLE contacts ADD COLUMN company_size text;
  END IF;
END $$;
