/*
  # Add Priority Rank to Contacts

  1. Changes
    - Add `priority_rank` column to `contacts` table
      - Integer type (1-5, where 1 is highest priority)
      - NULL allowed (not all contacts need a priority)
      - Default value is NULL

  2. Notes
    - Priority ranks: 1 (Highest), 2 (High), 3 (Medium), 4 (Low), 5 (Lowest)
    - NULL means no priority assigned
    - This allows users to organize their contacts by importance
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'priority_rank'
  ) THEN
    ALTER TABLE contacts ADD COLUMN priority_rank INTEGER;
  END IF;
END $$;