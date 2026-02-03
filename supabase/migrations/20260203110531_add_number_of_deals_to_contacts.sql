/*
  # Add number of deals field to contacts

  1. Changes
    - Add `number_of_deals` column to `contacts` table
      - Type: integer
      - Default: 0
      - Not null
    - This field tracks the total number of deals associated with each contact

  2. Notes
    - Existing contacts will default to 0 deals
    - Field can be manually updated via the contact modal
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'number_of_deals'
  ) THEN
    ALTER TABLE contacts ADD COLUMN number_of_deals integer NOT NULL DEFAULT 0;
  END IF;
END $$;